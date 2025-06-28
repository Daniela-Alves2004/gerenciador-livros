const express = require('express');
const Book = require('../models/Book');
const authMiddleware = require('../middleware/authMiddleware');
const validateFields = require('../middleware/validateFields');
const { validateBookId, validateBookStatus } = require('../middleware/validateData');
const router = express.Router();

// Aplicar o middleware de autenticação a todas as rotas
router.use(authMiddleware);

// Buscar coleção de livros do usuário
router.get('/collection/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificação de parâmetro userId
    if (!userId || userId.trim() === '') {
      return res.badRequest({
        field: 'userId',
        details: 'ID de usuário inválido'
      }, 'ID de usuário inválido');
    }
    
    // Verificar se o usuário que fez a requisição é o mesmo da coleção
    if (req.user.id.toString() !== userId) {
      return res.forbidden('Você não tem permissão para acessar a coleção de outro usuário');
    }
    
    // Buscar livros do usuário agrupados por status
    const books = await Book.find({ userId });
    
    // Agrupar livros por status
    const collection = books.reduce((acc, book) => {
      if (!acc[book.status]) {
        acc[book.status] = [];
      }
      acc[book.status].push(book);
      return acc;
    }, { read: [], wantToRead: [] });
    
    return res.ok(collection, 'Coleção de livros recuperada com sucesso');
  } catch (error) {
    console.error('Erro ao buscar coleção:', error);
    return res.serverError(error, 'Erro ao buscar coleção de livros');
  }
});

// Adicionar livro à coleção
router.post('/', validateFields(['id', 'title', 'userId']), async (req, res) => {
  try {
    const bookData = req.body;
    
    // Validações adicionais dos dados
    if (!bookData.authors || bookData.authors.length === 0) {
      bookData.authors = ['Autor desconhecido'];
    }
    
    // Verificar se o userId da requisição corresponde ao usuário autenticado
    if (req.user.id.toString() !== bookData.userId) {
      return res.forbidden('Você não tem permissão para adicionar livros para outro usuário');
    }
      // Verificar se o livro já existe na coleção do usuário
    const existingBook = await Book.findOne({ id: bookData.id, userId: bookData.userId });
    
    if (existingBook) {
      return res.badRequest({
        field: 'id',
        details: 'Este livro já está na sua coleção',
        bookId: existingBook.id,
        status: existingBook.status
      }, 'Livro já existe na coleção');
    }
    
    // Criar novo livro
    const book = new Book(bookData);
    await book.save();
    
    return res.created(book, 'Livro adicionado com sucesso à coleção');
  } catch (error) {
    console.error('Erro ao adicionar livro:', error);
    
    // Verificar se é um erro de validação do Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).reduce((acc, err) => {
        acc[err.path] = err.message;
        return acc;
      }, {});
      
      return res.badRequest(errors, 'Dados do livro inválidos');
    }
    
    return res.serverError(error, 'Erro ao adicionar livro');
  }
});

// Remover livro da coleção
router.delete('/:bookId', validateBookId, validateFields(['userId']), async (req, res) => {
  try {
    const { bookId } = req.params;
    const { userId } = req.body;
    
    // Verificar se o userId da requisição corresponde ao usuário autenticado
    if (req.user.id.toString() !== userId) {
      return res.forbidden('Você não tem permissão para remover livros de outro usuário');
    }
    
    // Buscar e remover o livro
    const book = await Book.findOneAndDelete({ id: bookId, userId });
    
    if (!book) {
      return res.notFound('Livro não encontrado na sua coleção');
    }
    
    return res.ok({ 
      id: book.id, 
      title: book.title,
      status: book.status 
    }, 'Livro removido com sucesso');
  } catch (error) {
    console.error('Erro ao remover livro:', error);
    return res.serverError(error, 'Erro ao remover livro da coleção');
  }
});

// Buscar um livro específico da coleção
router.get('/:bookId', validateBookId, async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;
    
    // Buscar o livro
    const book = await Book.findOne({ id: bookId, userId });
    
    if (!book) {
      return res.notFound('Livro não encontrado na sua coleção');
    }
    
    return res.ok(book, 'Livro encontrado');
  } catch (error) {
    console.error('Erro ao buscar livro:', error);
    return res.serverError(error, 'Erro ao buscar detalhes do livro');
  }
});

// Atualizar status do livro
router.put('/:bookId/status', validateBookId, validateFields(['userId', 'status']), validateBookStatus, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { userId, status } = req.body;
    
    // Verificar se o userId da requisição corresponde ao usuário autenticado
    if (req.user.id.toString() !== userId) {
      return res.forbidden('Você não tem permissão para atualizar livros de outro usuário');
    }
    
    // Buscar e atualizar o livro
    const book = await Book.findOneAndUpdate(
      { id: bookId, userId },
      { status },
      { new: true }
    );
    
    if (!book) {
      return res.notFound('Livro não encontrado na sua coleção');
    }
    
    return res.ok(book, `Status do livro atualizado para "${status}"`);
  } catch (error) {
    console.error('Erro ao atualizar status do livro:', error);
    return res.serverError(error, 'Erro ao atualizar status do livro');
  }
});

module.exports = router;
