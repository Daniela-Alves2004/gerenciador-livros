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
  define: {
    timestamps: true, 
    underscored: true, 
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Conexão com SQLite estabelecida com sucesso');
    
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      logger.info('Modelos sincronizados com o banco de dados');
    }
  } catch (error) {
    logger.error(`Erro ao conectar ao SQLite: ${error.message}`, { stack: error.stack });
    process.exit(1); 
  }
};

module.exports = {
  sequelize,
  connectDB
};
