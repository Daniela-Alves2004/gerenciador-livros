const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  authors: {
    type: [String],
    default: ['Autor desconhecido']
  },
  description: {
    type: String,
    default: 'Nenhuma descrição disponível'
  },
  publishedDate: {
    type: String
  },
  imageLinks: {
    type: Object,
    default: {
      thumbnail: 'https://via.placeholder.com/128x192?text=No+Cover'
    }
  },
  categories: {
    type: [String],
    default: []
  },
  pageCount: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    default: 'Sem idioma definido'
  },
  averageRating: {
    type: Number,
    default: 0
  },
  ratingsCount: {
    type: Number,
    default: 0
  },
  previewLink: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['read', 'wantToRead'],
    default: 'wantToRead'
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices compostos para evitar duplicação de livros por usuário
bookSchema.index({ id: 1, userId: 1 }, { unique: true });

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
