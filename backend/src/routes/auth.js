const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');
const { generateToken, generatePasswordResetToken, verifyToken } = require('../config/auth');
const { setupLogger } = require('../config/logger');
const router = express.Router();

const logger = setupLogger();

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

    if (!user.active) {
      logger.warn(`Tentativa de acesso com conta inativa: ${user.id}`);
      return res.status(401).json({
        success: false,
        message: 'Conta inativa',
        errors: {
          auth: true,
          details: 'Esta conta foi desativada'
        }
      });
    }

    if (decoded.iat && user.changedPasswordAfter(decoded.iat)) {
      logger.warn(`Token emitido antes da troca de senha: ${user.id}`);
      return res.status(401).json({
        success: false,
        message: 'Senha alterada após emissão do token',
        errors: {
          auth: true,
          details: 'Por favor, faça login novamente'
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

const invalidateToken = (token) => {
  if (!token) return false;
  
  invalidatedTokens.add(token);
  
  if (invalidatedTokens.size > 1000) {
    const tokensToRemove = Array.from(invalidatedTokens).slice(0, 200);
    tokensToRemove.forEach(t => invalidatedTokens.delete(t));
  }
  
  return true;
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

const validateEmail = (req, res, next) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Email inválido',
      errors: {
        validation: true,
        field: 'email',
        details: 'Email é obrigatório e deve ser uma string'
      }
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de email inválido',
      errors: {
        validation: true,
        field: 'email',
        details: 'Por favor, forneça um email válido'
      }
    });
  }

  next();
};

const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Senha inválida',
      errors: {
        validation: true,
        field: 'password',
        details: 'Senha é obrigatória e deve ser uma string'
      }
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Senha muito curta',
      errors: {
        validation: true,
        field: 'password',
        details: 'A senha deve ter pelo menos 8 caracteres'
      }
    });
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Senha não atende aos critérios de segurança',
      errors: {
        validation: true,
        field: 'password',
        details: 'A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
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

// Routes

router.use(sanitizeBody);

// Login controller
router.post('/login', 
  validateFields(['email', 'password']), 
  validateEmail,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.scope('withPassword').findOne({ 
        where: { email: email.toLowerCase() } 
      });
      
      if (!user) {
        logger.warn(`Tentativa de login com email inexistente: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
          errors: {
            auth: true,
            details: 'Email ou senha incorretos'
          }
        });
      }

      if (user.isLocked()) {
        logger.warn(`Tentativa de login em conta bloqueada: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Conta temporariamente bloqueada devido a múltiplas tentativas de login. Tente novamente mais tarde.',
          errors: {
            auth: true,
            details: 'Conta bloqueada temporariamente'
          }
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        await user.registerFailedLogin();
        
        logger.warn(`Login falho - senha incorreta: ${email} (Tentativas: ${user.loginAttempts})`);
        
        if (user.loginAttempts >= 5) {
          return res.status(401).json({
            success: false,
            message: 'Conta temporariamente bloqueada devido a múltiplas tentativas de login. Tente novamente mais tarde.',
            errors: {
              auth: true,
              details: 'Conta bloqueada temporariamente'
            }
          });
        }
        
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
          errors: {
            auth: true,
            details: 'Email ou senha incorretos'
          }
        });
      }

      await user.resetLoginAttempts();

      const token = generateToken(user.id);
      logger.info(`Login realizado com sucesso: ${email}`);
      
      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          token
        }
      });
    } catch (error) {
      logger.error(`Erro no login: ${error.message}`, { stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        errors: {
          server: true,
          details: 'Ocorreu um erro interno ao processar o login'
        }
      });
    }
  }
);

// Register controller
router.post('/register', 
  validateFields(['email', 'password', 'name']),
  validateEmail,
  validatePassword,
  async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Nome inválido',
          errors: {
            validation: true,
            field: 'name',
            details: 'Nome deve ter pelo menos 2 caracteres'
          }
        });
      }

      const existingUser = await User.findOne({ 
        where: { email: email.toLowerCase() } 
      });
      
      if (existingUser) {
        logger.warn(`Tentativa de registro com email já existente: ${email}`);
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso',
          errors: {
            validation: true,
            field: 'email',
            details: 'Este email já está registrado no sistema'
          }
        });
      }

      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase(),
        password
      });

      const token = generateToken(user.id);
      logger.info(`Usuário registrado com sucesso: ${email}`);
      
      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          token
        }
      });
    } catch (error) {
      logger.error(`Erro no registro: ${error.message}`, { stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        errors: {
          server: true,
          details: 'Ocorreu um erro interno ao registrar o usuário'
        }
      });
    }
  }
);

// Logout controller
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.token;
    
    if (invalidateToken(token)) {
      logger.info(`Logout realizado com sucesso: ${req.user.email}`);
      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso',
        data: null
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erro ao realizar logout',
        errors: {
          auth: true,
          details: 'Não foi possível invalidar o token'
        }
      });
    }
  } catch (error) {
    logger.error(`Erro no logout: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      errors: {
        server: true,
        details: 'Ocorreu um erro interno ao processar o logout'
      }
    });
  }
});

// Verify token controller
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email
        }
      }
    });
  } catch (error) {
    logger.error(`Erro na verificação de token: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      errors: {
        server: true,
        details: 'Ocorreu um erro interno ao verificar o token'
      }
    });
  }
});

module.exports = router;
