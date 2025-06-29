
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../db/database.sqlite'),
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('Banco de dados conectado e sincronizado');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error.message);
  }
};

const closeDB = async () => {
  try {
    await sequelize.close();
    console.log('Conexão com o banco de dados encerrada');
  } catch (error) {
    console.error('Erro ao encerrar conexão com o banco:', error.message);
  }
};

module.exports = {
  sequelize,
  connectDB,
  closeDB
};
