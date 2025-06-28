const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { setupLogger } = require('./logger');
require('dotenv').config();

const logger = setupLogger();

const dbPath = path.join(__dirname, '../../db/database.sqlite');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg) => logger.debug(msg),
  
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 5,       
    min: parseInt(process.env.DB_POOL_MIN) || 0,       
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,  
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000,        
    evict: parseInt(process.env.DB_POOL_EVICT) || 1000,      
    handleDisconnects: true,                            
  },

  retry: {
    max: parseInt(process.env.DB_RETRY_MAX) || 3,       
    timeout: parseInt(process.env.DB_RETRY_TIMEOUT) || 5000, 
  },

  dialectOptions: {
    timeout: parseInt(process.env.DB_TIMEOUT) || 20000,       
    
    pragmas: {
      journal_mode: process.env.DB_JOURNAL_MODE || 'WAL',     
      synchronous: process.env.DB_SYNCHRONOUS || 'NORMAL',    
      cache_size: parseInt(process.env.DB_CACHE_SIZE) || -64000,  
      temp_store: process.env.DB_TEMP_STORE || 'MEMORY',     
      foreign_keys: process.env.DB_FOREIGN_KEYS !== 'false',  
    }
  },

  define: {
    timestamps: true, 
    underscored: true,
    freezeTableName: true,                            
    charset: 'utf8',
    collate: 'utf8_general_ci',
  },

  transactionType: 'IMMEDIATE',                       
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,

  benchmark: process.env.NODE_ENV === 'development',    
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Conexão com SQLite estabelecida com sucesso');
    
    await configureSQLitePragmas();
    
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      logger.info('Modelos sincronizados com o banco de dados');
    }

    setupConnectionListeners();
    
    await healthCheck();
    
  } catch (error) {
    logger.error(`Erro ao conectar ao SQLite: ${error.message}`, { stack: error.stack });
    process.exit(1); 
  }
};

const configureSQLitePragmas = async () => {
  try {
    const pragmas = [
      `PRAGMA journal_mode = ${process.env.DB_JOURNAL_MODE || 'WAL'}`,
      `PRAGMA synchronous = ${process.env.DB_SYNCHRONOUS || 'NORMAL'}`,
      `PRAGMA cache_size = ${parseInt(process.env.DB_CACHE_SIZE) || -64000}`,
      `PRAGMA temp_store = ${process.env.DB_TEMP_STORE || 'MEMORY'}`,
      `PRAGMA foreign_keys = ${process.env.DB_FOREIGN_KEYS !== 'false' ? 'ON' : 'OFF'}`,
      `PRAGMA busy_timeout = ${parseInt(process.env.DB_BUSY_TIMEOUT) || 30000}`,
      `PRAGMA wal_autocheckpoint = ${parseInt(process.env.DB_WAL_AUTOCHECKPOINT) || 1000}`,
    ];

    for (const pragma of pragmas) {
      await sequelize.query(pragma);
      logger.debug(`Pragma executado: ${pragma}`);
    }
    
    logger.info('Pragmas do SQLite configurados com sucesso');
  } catch (error) {
    logger.warn(`Erro ao configurar pragmas do SQLite: ${error.message}`);
  }
};

const setupConnectionListeners = () => {
  sequelize.connectionManager.on('connect', () => {
    logger.debug('Nova conexão estabelecida com o banco de dados');
  });

  sequelize.connectionManager.on('disconnect', () => {
    logger.warn('Conexão com o banco de dados foi encerrada');
  });

  if (sequelize.connectionManager.pool) {
    sequelize.connectionManager.pool.on('createSuccess', () => {
      logger.debug('Nova conexão criada no pool');
    });

    sequelize.connectionManager.pool.on('createError', (error) => {
      logger.error(`Erro ao criar conexão no pool: ${error.message}`);
    });

    sequelize.connectionManager.pool.on('destroySuccess', () => {
      logger.debug('Conexão removida do pool');
    });
  }
};

const healthCheck = async () => {
  try {
    const startTime = Date.now();
    await sequelize.query('SELECT 1 as health_check');
    const duration = Date.now() - startTime;
    
    logger.info(`Verificação de saúde do banco concluída em ${duration}ms`);
    
    if (sequelize.connectionManager.pool) {
      const poolStats = {
        size: sequelize.connectionManager.pool.size,
        available: sequelize.connectionManager.pool.available,
        using: sequelize.connectionManager.pool.using,
        waiting: sequelize.connectionManager.pool.waiting
      };
      logger.debug('Estatísticas do pool de conexões:', poolStats);
    }
    
    return true;
  } catch (error) {
    logger.error(`Falha na verificação de saúde do banco: ${error.message}`);
    return false;
  }
};

const closeDB = async () => {
  try {
    await sequelize.close();
    logger.info('Conexão com o banco de dados encerrada com sucesso');
  } catch (error) {
    logger.error(`Erro ao encerrar conexão com o banco: ${error.message}`);
  }
};

const getPoolStats = () => {
  if (!sequelize.connectionManager.pool) {
    return { error: 'Pool de conexões não disponível' };
  }

  return {
    size: sequelize.connectionManager.pool.size,
    available: sequelize.connectionManager.pool.available,
    using: sequelize.connectionManager.pool.using,
    waiting: sequelize.connectionManager.pool.waiting,
    maxSize: sequelize.connectionManager.pool.options.max,
    minSize: sequelize.connectionManager.pool.options.min,
  };
};

module.exports = {
  sequelize,
  connectDB,
  closeDB,
  healthCheck,
  getPoolStats
};
