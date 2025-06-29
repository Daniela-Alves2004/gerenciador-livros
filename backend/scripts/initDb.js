const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');

async function initializeDatabase() {
  try {
    await sequelize.sync({ force: true });
    console.log('Banco de dados sincronizado com sucesso');

    await User.create({
      name: 'Administrador',
      email: 'admin@exemplo.com',
      password: 'Admin123',
      active: true
    });

    console.log('Usuário administrador criado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error.message);
  } 
}
initializeDatabase();
