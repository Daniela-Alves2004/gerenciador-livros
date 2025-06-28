const cacheService = require('../services/cacheService');
const { setupLogger } = require('../config/logger');

const logger = setupLogger();

function cacheMiddleware(options = {}) {
  const {
    keyGenerator = (req) => `${req.method}:${req.originalUrl}:${req.user?.id || 'anonymous'}`,
    ttl = parseInt(process.env.CACHE_TTL) || 300,
    condition = () => true,
    skipCache = false
  } = options;

  return async (req, res, next) => {
    if (skipCache || !condition(req)) {
      return next();
    }

    const cacheKey = typeof keyGenerator === 'function' 
      ? keyGenerator(req) 
      : keyGenerator;

    try {
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Cache HIT para chave: ${cacheKey}`);
        
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey
        });

        return res.status(cachedData.statusCode || 200).json(cachedData.data);
      }

      logger.debug(`Cache MISS para chave: ${cacheKey}`);

      const originalSend = res.send;
      const originalJson = res.json;
      
      res.send = function(body) {
        cacheResponse.call(this, body, cacheKey, ttl, res.statusCode);
        return originalSend.call(this, body);
      };

      res.json = function(body) {
        cacheResponse.call(this, body, cacheKey, ttl, res.statusCode);
        return originalJson.call(this, body);
      };

      res.set({
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey
      });

    } catch (error) {
      logger.error(`Erro no middleware de cache: ${error.message}`);
    }

    next();
  };
}

async function cacheResponse(body, cacheKey, ttl, statusCode) {
  try {
    if (statusCode >= 200 && statusCode < 300) {
      const dataToCache = {
        data: typeof body === 'string' ? JSON.parse(body) : body,
        statusCode,
        timestamp: new Date().toISOString()
      };

      await cacheService.set(cacheKey, dataToCache, ttl);
      logger.debug(`Resposta cacheada para chave: ${cacheKey}`);
    }
  } catch (error) {
    logger.error(`Erro ao cachear resposta: ${error.message}`);
  }
}

function cacheBookCollection(ttl = 300) {
  return cacheMiddleware({
    keyGenerator: (req) => cacheService.generateKey('book_collection', req.params.userId),
    ttl,
    condition: (req) => req.method === 'GET'
  });
}

function cacheBook(ttl = 600) {
  return cacheMiddleware({
    keyGenerator: (req) => cacheService.generateKey('book', req.params.id),
    ttl,
    condition: (req) => req.method === 'GET'
  });
}

function invalidateUserCache(req, res, next) {
  const patterns = [
    cacheService.generateKey('book_collection', req.user.id) + '*',
    cacheService.generateKey('book', '*')
  ];

  const originalSend = res.send;
  const originalJson = res.json;
  
  const invalidateCache = async function() {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      for (const pattern of patterns) {
        await cacheService.delPattern(pattern);
      }
      logger.debug(`Cache invalidado para padrões: ${patterns.join(', ')}`);
    }
  };

  res.send = function(body) {
    invalidateCache();
    return originalSend.call(this, body);
  };

  res.json = function(body) {
    invalidateCache();
    return originalJson.call(this, body);
  };

  next();
}

function invalidateBookCache(req, res, next) {
  const bookId = req.params.id;
  const patterns = [
    cacheService.generateKey('book', bookId),
    cacheService.generateKey('book_collection', req.user.id) + '*'
  ];

  const originalSend = res.send;
  const originalJson = res.json;
  
  const invalidateCache = async function() {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      for (const pattern of patterns) {
        await cacheService.delPattern(pattern);
      }
      logger.debug(`Cache de livro invalidado para padrões: ${patterns.join(', ')}`);
    }
  };

  res.send = function(body) {
    invalidateCache();
    return originalSend.call(this, body);
  };

  res.json = function(body) {
    invalidateCache();
    return originalJson.call(this, body);
  };

  next();
}

module.exports = {
  cacheMiddleware,
  cacheBookCollection,
  cacheBook,
  invalidateUserCache,
  invalidateBookCache
};
