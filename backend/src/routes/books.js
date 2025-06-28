const express = require('express');
const { Op } = require('sequelize');
const Book = require('../models/Book');
const { authMiddleware } = require('../middleware/authMiddleware');
const validateFields = require('../middleware/validateFields');
const { validateBookId, validateBookStatus } = require('../middleware/validateData');
const { sanitizeBody, sanitizeParams, sanitizeQuery, validate, validateBook } = require('../middleware/sanitizeData');
const { cacheBookCollection, cacheBook, invalidateUserCache, invalidateBookCache } = require('../middleware/cacheMiddleware');
const { setupLogger } = require('../config/logger');
const router = express.Router();

const logger = setupLogger();

router.use(authMiddleware);
router.use(sanitizeBody);
router.use(sanitizeParams);
router.use(sanitizeQuery);

router.get('/collection/:userId', cacheBookCollection(300), async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId.toString().trim() === '') {
      logger.warn('Tentativa de acesso com ID de usuário inválido');
      return res.badRequest({
        field: 'userId',
        details: 'ID de usuário inválido'
      }, 'ID de usuário inválido');
    }
    
    if (req.user.id.toString() !== userId.toString()) {
      logger.warn(`Tentativa de acesso não autorizado à coleção: ${userId} por ${req.user.id}`);
      return res.forbidden('Você não tem permissão para acessar a coleção de outro usuário');
    }
    
    const books = await Book.findAll({
      where: { userId: userId },
      order: [['createdAt', 'DESC']]
    });
    
    const collection = {
      wishlist: books.filter(book => book.status === 'wishlist'),
      reading: books.filter(book => book.status === 'reading'),
      finished: books.filter(book => book.status === 'finished')
    };
    
    logger.info(`Coleção de livros acessada: ${userId}`);
    res.ok(collection, 'Coleção de livros recuperada com sucesso');
  } catch (error) {
    logger.error(`Erro ao buscar coleção de livros: ${error.message}`, { stack: error.stack });
    res.serverError(error, 'Erro ao buscar coleção de livros');
  }
});

router.get('/:id', 
  cacheBook(600),
  validateBookId,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const book = await Book.findByPk(id);
      
      if (!book) {
        logger.warn(`Tentativa de buscar livro inexistente: ${id}`);
        return res.notFound('Livro não encontrado');
      }
      
      if (book.userId !== req.user.id) {
        logger.warn(`Tentativa de acessar livro de outro usuário: ${id} por ${req.user.id}`);
        return res.forbidden('Você não tem permissão para acessar este livro');
      }
      
      logger.info(`Livro acessado: ${id} por ${req.user.id}`);
      res.ok(book, 'Livro encontrado com sucesso');
    } catch (error) {
      logger.error(`Erro ao buscar livro: ${error.message}`, { stack: error.stack });
      res.serverError(error, 'Erro ao buscar livro');
    }
  }
);

router.post('/', 
  invalidateUserCache,
  validateFields(['title', 'author', 'status']),
  validate(validateBook),
  validateBookStatus,
  async (req, res) => {
    try {
      const { title, author, isbn, coverImage, description, year, status } = req.body;
      
      const existingBook = await Book.findOne({ 
        where: { 
          [Op.and]: [
            { title },
            { author },
            { userId: req.user.id }
          ]
        }
      });
      
      if (existingBook) {
        logger.info(`Tentativa de adicionar livro duplicado: ${title} por ${req.user.id}`);
        return res.conflict('Este livro já existe em sua coleção');
      }
      
      const newBook = await Book.create({
        title,
        author,
        isbn,
        coverImage,
        description,
        year,
        status,
        userId: req.user.id
      });
      
      logger.info(`Livro adicionado: ${title} por ${req.user.id}`);
      res.created(newBook, 'Livro adicionado com sucesso');
    } catch (error) {
      logger.error(`Erro ao adicionar livro: ${error.message}`, { stack: error.stack });
      res.serverError(error, 'Erro ao adicionar livro');
    }
  }
);

router.put('/:id',
  invalidateBookCache,
  validateBookId,
  validate(validateBook),
  validateBookStatus,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const book = await Book.findByPk(id);
      
      if (!book) {
        logger.warn(`Tentativa de atualizar livro inexistente: ${id}`);
        return res.notFound('Livro não encontrado');
      }
      
      if (book.userId !== req.user.id) {
        logger.warn(`Tentativa de atualizar livro de outro usuário: ${id} por ${req.user.id}`);
        return res.forbidden('Você não tem permissão para editar este livro');
      }
      
      await book.update(req.body);
      
      logger.info(`Livro atualizado: ${id} por ${req.user.id}`);
      res.ok(book, 'Livro atualizado com sucesso');
    } catch (error) {
      logger.error(`Erro ao atualizar livro: ${error.message}`, { stack: error.stack });
      res.serverError(error, 'Erro ao atualizar livro');
    }
  }
);

router.delete('/:id',
  invalidateBookCache,
  validateBookId,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const book = await Book.findByPk(id);
      
      if (!book) {
        logger.warn(`Tentativa de remover livro inexistente: ${id}`);
        return res.notFound('Livro não encontrado');
      }
      
      if (book.userId !== req.user.id) {
        logger.warn(`Tentativa de remover livro de outro usuário: ${id} por ${req.user.id}`);
        return res.forbidden('Você não tem permissão para remover este livro');
      }
      
      await book.destroy();
      
      logger.info(`Livro removido: ${id} por ${req.user.id}`);
      res.ok(null, 'Livro removido com sucesso');
    } catch (error) {
      logger.error(`Erro ao remover livro: ${error.message}`, { stack: error.stack });
      res.serverError(error, 'Erro ao remover livro');
    }
  }
);

module.exports = router;
