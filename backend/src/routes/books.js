const express = require('express');
const { Op } = require('sequelize');
const Book = require('../models/Book');
const User = require('../models/User');
const { verifyToken } = require('../config/auth');
const { setupLogger } = require('../config/logger');
const NodeCache = require('node-cache');
const router = express.Router();

const logger = setupLogger();

// Cache service integrated directly into the routes file
const nodeCache = new NodeCache({ 
  stdTTL: parseInt(process.env.CACHE_TTL) || 300,
  checkperiod: 60
});

const cacheService = {
  generateKey: (prefix, ...parts) => `${prefix}:${parts.join(':')}`,
  
  async set(key, value, ttl = null) {
    try {
      const serializedValue = JSON.stringify(value);
      const expiration = ttl || 300;
      nodeCache.set(key, serializedValue, expiration);
      logger.debug(`Cache SET: ${key}`);
    } catch (error) {
      logger.error(`Erro ao definir cache para chave ${key}:`, error.message);
    }
  },
  
  async get(key) {
    try {
      const value = nodeCache.get(key);
      logger.debug(`Cache GET: ${key} - ${value ? 'HIT' : 'MISS'}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Erro ao obter cache para chave ${key}:`, error.message);
      return null;
    }
  },
  
  async del(key) {
    try {
      const result = nodeCache.del(key);
      logger.debug(`Cache DEL: ${key}`);
      return result;
    } catch (error) {
      logger.error(`Erro ao deletar cache para chave ${key}:`, error.message);
      return false;
    }
  },
  
  async delPattern(pattern) {
    try {
      const keys = nodeCache.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern.replace('*', '')));
      const result = nodeCache.del(matchingKeys);
      logger.debug(`Cache DEL pattern: ${pattern}, keys: ${matchingKeys.length}`);
      return result;
    } catch (error) {
      logger.error(`Erro ao deletar cache por padrão ${pattern}:`, error.message);
      return false;
    }
  }
};

// Middleware functions moved from middleware and utils folders as per project requirements

// Authentication middleware
const invalidatedTokens = new Set();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`Tentativa de acesso sem token: ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido',
        errors: {
          auth: true,
          details: 'É necessário fornecer um token de autenticação no formato "Bearer TOKEN"'
        }
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      logger.warn(`Token não encontrado: ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido',
        errors: {
          auth: true,
          details: 'Token não encontrado no cabeçalho de autorização'
        }
      });
    }

    if (invalidatedTokens.has(token)) {
      logger.warn(`Tentativa de uso de token invalidado: ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        message: 'Token invalidado',
        errors: {
          auth: true,
          details: 'Este token foi invalidado por logout ou troca de senha'
        }
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      logger.warn(`Token inválido ou expirado: ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado',
        errors: {
          auth: true,
          details: 'O token fornecido é inválido ou expirou'
        }
      });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      logger.warn(`Usuário não encontrado para token: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
        errors: {
          auth: true, 
          details: 'O usuário associado ao token não foi encontrado'
        }
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.error(`Erro na autenticação: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Falha na autenticação',
      errors: {
        server: true,
        details: 'Ocorreu um erro interno ao processar a autenticação'
      }
    });
  }
};

// Validation functions
const validateFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      logger.warn(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não preenchidos',
        errors: {
          validation: true,
          fields: missingFields,
          details: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}`
        }
      });
    }

    next();
  };
};

const validateBookStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['wishlist', 'reading', 'finished'];
  
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status inválido',
      errors: {
        validation: true,
        field: 'status',
        details: `Status deve ser um dos seguintes: ${validStatuses.join(', ')}`
      }
    });
  }
  
  next();
};

// Sanitization functions
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

const sanitizeParams = (req, res, next) => {
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Cache middleware functions
function cacheBookCollection(ttl = 300) {
  return async (req, res, next) => {
    try {
      const cacheKey = cacheService.generateKey('book_collection', req.params.userId);
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Cache HIT para chave: ${cacheKey}`);
        res.set('X-Cache', 'HIT');
        return res.status(200).json(cachedData);
      }

      logger.debug(`Cache MISS para chave: ${cacheKey}`);
      res.set('X-Cache', 'MISS');

      const originalJson = res.json;
      res.json = function(body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, ttl);
        }
        return originalJson.call(this, body);
      };
    } catch (error) {
      logger.error(`Erro no cache middleware: ${error.message}`);
    }
    next();
  };
}

function invalidateUserCache(req, res, next) {
  const originalJson = res.json;
  res.json = function(body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const patterns = [
        cacheService.generateKey('book_collection', req.user.id) + '*'
      ];
      patterns.forEach(pattern => cacheService.delPattern(pattern));
      logger.debug(`Cache invalidado para usuário: ${req.user.id}`);
    }
    return originalJson.call(this, body);
  };
  next();
}

// Routes

router.use(authMiddleware);
router.use(sanitizeBody);
router.use(sanitizeParams);
router.use(sanitizeQuery);

// Get user's book collection controller
router.get('/collection/:userId', cacheBookCollection(300), async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId.toString().trim() === '') {
      logger.warn('Tentativa de acesso com ID de usuário inválido');
      return res.status(400).json({
        success: false,
        message: 'ID de usuário inválido',
        errors: {
          validation: true,
          field: 'userId',
          details: 'ID de usuário inválido'
        }
      });
    }
    
    if (req.user.id.toString() !== userId.toString()) {
      logger.warn(`Tentativa de acesso não autorizado à coleção: ${userId} por ${req.user.id}`);
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar a coleção de outro usuário',
        errors: {
          auth: true,
          details: 'Acesso negado'
        }
      });
    }
    
    const books = await Book.findAll({
      where: { userId: userId },
      order: [['createdAt', 'DESC']]
    });
    
    const collection = {
      wishlist: books.filter(book => book.status === 'wishlist'),
      reading: books.filter(book => book.status === 'reading'),
      finished: books.filter(book => book.status === 'finished')
    };
    
    logger.info(`Coleção de livros acessada: ${userId}`);
    res.status(200).json({
      success: true,
      message: 'Coleção de livros recuperada com sucesso',
      data: collection
    });
  } catch (error) {
    logger.error(`Erro ao buscar coleção de livros: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      errors: {
        server: true,
        details: 'Ocorreu um erro interno ao buscar a coleção'
      }
    });
  }
});

// Search books controller
router.get('/search', async (req, res) => {
  try {
    const { q, author, year, status } = req.query;
    
    if (!q && !author && !year && !status) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros de busca necessários',
        errors: {
          validation: true,
          details: 'Forneça pelo menos um parâmetro de busca (q, author, year, ou status)'
        }
      });
    }

    const whereCondition = { userId: req.user.id };
    
    if (q) {
      whereCondition[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { authors: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } }
      ];
    }
    
    if (author) {
      whereCondition.authors = { [Op.like]: `%${author}%` };
    }
    
    if (year) {
      whereCondition.publishedDate = { [Op.like]: `%${year}%` };
    }
    
    if (status) {
      whereCondition.status = status;
    }

    const books = await Book.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']]
    });

    logger.info(`Busca realizada: ${JSON.stringify(req.query)} - ${books.length} resultados`);
    res.status(200).json({
      success: true,
      message: 'Busca realizada com sucesso',
      data: books
    });
  } catch (error) {
    logger.error(`Erro na busca de livros: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      errors: {
        server: true,
        details: 'Ocorreu um erro interno ao realizar a busca'
      }
    });
  }
});

// Add book to collection controller
router.post('/add', 
  validateFields(['title', 'authors']),
  validateBookStatus,
  invalidateUserCache,
  async (req, res) => {
    try {
      const bookData = {
        ...req.body,
        userId: req.user.id,
        status: req.body.status || 'wishlist'
      };

      // Verificar se o livro já existe na coleção do usuário
      const existingBook = await Book.findOne({
        where: {
          userId: req.user.id,
          title: bookData.title,
          authors: bookData.authors
        }
      });

      if (existingBook) {
        logger.warn(`Tentativa de adicionar livro duplicado: ${bookData.title}`);
        return res.status(409).json({
          success: false,
          message: 'Livro já existe na sua coleção',
          errors: {
            validation: true,
            details: 'Este livro já foi adicionado à sua coleção'
          }
        });
      }

      const book = await Book.create(bookData);
      
      logger.info(`Livro adicionado à coleção: ${book.title} por usuário ${req.user.id}`);
      res.status(201).json({
        success: true,
        message: 'Livro adicionado com sucesso',
        data: book
      });
    } catch (error) {
      logger.error(`Erro ao adicionar livro: ${error.message}`, { stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        errors: {
          server: true,
          details: 'Ocorreu um erro interno ao adicionar o livro'
        }
      });
    }
  }
);

// Update book status controller
router.put('/:id/status', 
  validateFields(['status']),
  validateBookStatus,
  invalidateUserCache,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const book = await Book.findOne({
        where: {
          id: id,
          userId: req.user.id
        }
      });

      if (!book) {
        logger.warn(`Tentativa de atualizar livro inexistente ou não autorizado: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Livro não encontrado',
          errors: {
            validation: true,
            details: 'Livro não encontrado na sua coleção'
          }
        });
      }

      book.status = status;
      await book.save();

      logger.info(`Status do livro atualizado: ${book.title} para ${status} por usuário ${req.user.id}`);
      res.status(200).json({
        success: true,
        message: 'Status do livro atualizado com sucesso',
        data: book
      });
    } catch (error) {
      logger.error(`Erro ao atualizar status do livro: ${error.message}`, { stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        errors: {
          server: true,
          details: 'Ocorreu um erro interno ao atualizar o status'
        }
      });
    }
  }
);

// Remove book from collection controller
router.delete('/:id', invalidateUserCache, async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findOne({
      where: {
        id: id,
        userId: req.user.id
      }
    });

    if (!book) {
      logger.warn(`Tentativa de remover livro inexistente ou não autorizado: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado',
        errors: {
          validation: true,
          details: 'Livro não encontrado na sua coleção'
        }
      });
    }

    await book.destroy();

    logger.info(`Livro removido da coleção: ${book.title} por usuário ${req.user.id}`);
    res.status(200).json({
      success: true,
      message: 'Livro removido com sucesso',
      data: null
    });
  } catch (error) {
    logger.error(`Erro ao remover livro: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      errors: {
        server: true,
        details: 'Ocorreu um erro interno ao remover o livro'
      }
    });
  }
});

module.exports = router;
