const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

class Book extends Model {}

Book.init({
  googleBookId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID do livro na API do Google Books'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O título é obrigatório' }
    }
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O autor é obrigatório' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: 'Nenhuma descrição disponível'
  },
  publishedDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isbn: {
    type: DataTypes.STRING,
    allowNull: true
  },
  coverImage: {
    type: DataTypes.STRING,
    defaultValue: 'https://via.placeholder.com/128x192?text=No+Cover'
  },
  categories: {
    type: DataTypes.STRING, 
    allowNull: true,
    get() {
      const value = this.getDataValue('categories');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('categories', value ? JSON.stringify(value) : null);
    }
  },
  pageCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: true,
      min: 0
    }
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'wishlist',
    validate: {
      isIn: {
        args: [['wishlist', 'reading', 'finished']],
        msg: 'Status deve ser wishlist, reading ou finished'
      }
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 5
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  finishDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Book',
  tableName: 'books',
  timestamps: true, 
  paranoid: true, 
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    }
  ]
});

Book.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Book, { foreignKey: 'userId' });

module.exports = Book;
