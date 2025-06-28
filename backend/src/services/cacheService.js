const NodeCache = require('node-cache');
const { createClient } = require('redis');
const { setupLogger } = require('../config/logger');

const logger = setupLogger();

class CacheService {
  constructor() {
    this.nodeCache = new NodeCache({ 
      stdTTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutos por padrão
      checkperiod: 60 // Verifica itens expirados a cada minuto
    });
    
    this.redisClient = null;
    this.useRedis = false;
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redisClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        }
      });

      this.redisClient.on('error', (err) => {
        logger.warn('Redis error:', err.message);
        this.useRedis = false;
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis conectado com sucesso');
        this.useRedis = true;
      });

      this.redisClient.on('ready', () => {
        logger.info('Redis pronto para uso');
        this.useRedis = true;
      });

      this.redisClient.on('end', () => {
        logger.warn('Conexão Redis encerrada');
        this.useRedis = false;
      });

      // Tenta conectar ao Redis
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_REDIS === 'true') {
        await this.redisClient.connect();
      }
    } catch (error) {
      logger.warn(`Falha ao conectar ao Redis: ${error.message}. Usando cache em memória.`);
      this.useRedis = false;
    }
  }

  /**
   * Gera uma chave de cache padronizada
   */
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Define um valor no cache
   */
  async set(key, value, ttl = null) {
    try {
      const serializedValue = JSON.stringify(value);
      const expiration = ttl || (parseInt(process.env.CACHE_TTL) || 300);

      if (this.useRedis && this.redisClient?.isReady) {
        await this.redisClient.setEx(key, expiration, serializedValue);
        logger.debug(`Cache Redis SET: ${key}`);
      } else {
        this.nodeCache.set(key, serializedValue, expiration);
        logger.debug(`Cache NodeCache SET: ${key}`);
      }
    } catch (error) {
      logger.error(`Erro ao definir cache para chave ${key}:`, error.message);
    }
  }

  /**
   * Obtém um valor do cache
   */
  async get(key) {
    try {
      let value = null;

      if (this.useRedis && this.redisClient?.isReady) {
        value = await this.redisClient.get(key);
        logger.debug(`Cache Redis GET: ${key} - ${value ? 'HIT' : 'MISS'}`);
      } else {
        value = this.nodeCache.get(key);
        logger.debug(`Cache NodeCache GET: ${key} - ${value ? 'HIT' : 'MISS'}`);
      }

      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Erro ao obter cache para chave ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Remove um valor específico do cache
   */
  async del(key) {
    try {
      if (this.useRedis && this.redisClient?.isReady) {
        await this.redisClient.del(key);
        logger.debug(`Cache Redis DEL: ${key}`);
      } else {
        this.nodeCache.del(key);
        logger.debug(`Cache NodeCache DEL: ${key}`);
      }
    } catch (error) {
      logger.error(`Erro ao deletar cache para chave ${key}:`, error.message);
    }
  }

  /**
   * Remove todas as chaves que correspondem a um padrão
   */
  async delPattern(pattern) {
    try {
      if (this.useRedis && this.redisClient?.isReady) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          logger.debug(`Cache Redis DEL PATTERN: ${pattern} - ${keys.length} chaves removidas`);
        }
      } else {
        // Para NodeCache, vamos iterar sobre todas as chaves
        const allKeys = this.nodeCache.keys();
        const keysToDelete = allKeys.filter(key => {
          // Converte padrão Redis para regex simples
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(key);
        });
        
        keysToDelete.forEach(key => this.nodeCache.del(key));
        logger.debug(`Cache NodeCache DEL PATTERN: ${pattern} - ${keysToDelete.length} chaves removidas`);
      }
    } catch (error) {
      logger.error(`Erro ao deletar padrão de cache ${pattern}:`, error.message);
    }
  }

  /**
   * Limpa todo o cache
   */
  async flush() {
    try {
      if (this.useRedis && this.redisClient?.isReady) {
        await this.redisClient.flushDb();
        logger.info('Cache Redis limpo completamente');
      } else {
        this.nodeCache.flushAll();
        logger.info('Cache NodeCache limpo completamente');
      }
    } catch (error) {
      logger.error('Erro ao limpar cache:', error.message);
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async getStats() {
    try {
      if (this.useRedis && this.redisClient?.isReady) {
        const info = await this.redisClient.info('memory');
        return {
          provider: 'Redis',
          connected: true,
          info: info
        };
      } else {
        const stats = this.nodeCache.getStats();
        return {
          provider: 'NodeCache',
          connected: true,
          keys: stats.keys,
          hits: stats.hits,
          misses: stats.misses,
          ksize: stats.ksize,
          vsize: stats.vsize
        };
      }
    } catch (error) {
      logger.error('Erro ao obter estatísticas do cache:', error.message);
      return {
        provider: this.useRedis ? 'Redis' : 'NodeCache',
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Middleware para invalidar cache automaticamente
   */
  createInvalidationMiddleware(patterns) {
    return async (req, res, next) => {
      const originalSend = res.send;
      
      res.send = async function(data) {
        // Se a resposta foi bem-sucedida, invalida o cache
        if (res.statusCode >= 200 && res.statusCode < 300) {
          for (const pattern of patterns) {
            await req.app.locals.cacheService.delPattern(pattern);
          }
        }
        return originalSend.call(this, data);
      };
      
      next();
    };
  }

  /**
   * Encerra conexões do cache
   */
  async close() {
    try {
      if (this.redisClient?.isReady) {
        await this.redisClient.quit();
        logger.info('Conexão Redis encerrada');
      }
      this.nodeCache.close();
      logger.info('Cache NodeCache encerrado');
    } catch (error) {
      logger.error('Erro ao encerrar cache:', error.message);
    }
  }
}

module.exports = new CacheService();
