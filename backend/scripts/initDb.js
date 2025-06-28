const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const Book = require('../src/models/Book');
const bcrypt = require('bcryptjs');
const { setupLogger } = require('../src/config/logger');

const logger = setupLogger();

async function initializeDatabase() {
  try {
    logger.info('Iniciando a sincronização do banco de dados...');
    
    await sequelize.sync({ force: true });
    logger.info('Banco de dados sincronizado com sucesso');

    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123';
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = await User.create({
      name: 'Administrador',
      email: 'admin@exemplo.com',
      password: hashedPassword,
      active: true
    });

    logger.info(`Usuário administrador criado com sucesso: ID ${admin.id}`);

    const books = [
      {
        title: 'O Senhor dos Anéis',
        author: 'J.R.R. Tolkien',
        description: 'Uma trilogia épica de fantasia que narra a jornada para destruir o Um Anel.',
        publishedDate: '1954',
        isbn: '9788533613379',
        coverImage: 'https://m.media-amazon.com/images/I/71ZLavBjpRL._SY466_.jpg',
        categories: JSON.stringify(['Fantasia', 'Aventura']),
        pageCount: 1200,
        language: 'pt-BR',
        status: 'finished',
        userId: admin.id
      },
      {
        title: 'Harry Potter e a Pedra Filosofal',
        author: 'J.K. Rowling',
        description: 'O primeiro livro da série que apresenta o jovem bruxo Harry Potter.',
        publishedDate: '1997',
        isbn: '9788532511010',
        coverImage: 'https://m.media-amazon.com/images/I/81ibfYk4qmL._SY466_.jpg',
        categories: JSON.stringify(['Fantasia', 'Juvenil']),
        pageCount: 264,
        language: 'pt-BR',
        status: 'reading',
        userId: admin.id
      },
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        description: 'Um guia para escrever código limpo e manutenível.',
        publishedDate: '2008',
        isbn: '9780132350884',
        coverImage: 'https://m.media-amazon.com/images/I/51E2055ZGUL._SY466_.jpg',
        categories: JSON.stringify(['Programação', 'Desenvolvimento de Software']),
        pageCount: 464,
        language: 'en',
        status: 'wishlist',
        userId: admin.id
      }
    ];

    for (const book of books) {
      await Book.create(book);
    }

    logger.info(`${books.length} livros de exemplo criados com sucesso`);
    logger.info('Inicialização do banco de dados concluída com sucesso');

  } catch (error) {
    logger.error(`Erro ao inicializar banco de dados: ${error.message}`, { stack: error.stack });
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

initializeDatabase();
