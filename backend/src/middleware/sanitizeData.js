const { check, validationResult } = require('express-validator');
const { setupLogger } = require('../config/logger');

const logger = setupLogger();

const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const result = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        // Sanitizar strings
        result[key] = value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;')
          .replace(/`/g, '&#x60;')
          .trim();
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
};

const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

const sanitizeParams = (req, res, next) => {
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    logger.warn('Erros de validação:', { 
      path: req.path, 
      errors: errors.array() 
    });

    return res.status(400).json({
      success: false,
      message: 'Erros de validação',
      errors: errors.array()
    });
  };
};

const validateBook = [
  check('title')
    .trim()
    .escape()
    .notEmpty().withMessage('O título é obrigatório')
    .isLength({ max: 255 }).withMessage('O título não pode ter mais de 255 caracteres'),
  
  check('author')
    .trim()
    .escape()
    .notEmpty().withMessage('O autor é obrigatório')
    .isLength({ max: 255 }).withMessage('O nome do autor não pode ter mais de 255 caracteres'),
  
  check('isbn')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 20 }).withMessage('O ISBN não pode ter mais de 20 caracteres'),
  
  check('description')
    .optional()
    .trim()
    .escape(),
  
  check('year')
    .optional()
    .isInt({ min: 0 }).withMessage('O ano deve ser um número inteiro positivo'),
  
  check('coverImage')
    .optional()
    .trim()
    .isURL().withMessage('O URL da capa deve ser uma URL válida'),
];

const validateUser = [
  check('name')
    .trim()
    .escape()
    .notEmpty().withMessage('O nome é obrigatório')
    .isLength({ max: 255 }).withMessage('O nome não pode ter mais de 255 caracteres'),
  
  check('email')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Email inválido')
    .notEmpty().withMessage('O email é obrigatório'),
  
  check('password')
    .trim()
    .notEmpty().withMessage('A senha é obrigatória')
    .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres')
    .matches(/[a-zA-Z]/).withMessage('A senha deve conter pelo menos uma letra')
    .matches(/\d/).withMessage('A senha deve conter pelo menos um número'),
];

module.exports = {
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  validate,
  validateBook,
  validateUser,
};
