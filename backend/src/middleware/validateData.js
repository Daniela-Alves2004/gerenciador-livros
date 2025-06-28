const { setupLogger } = require('../config/logger');

const logger = setupLogger();

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const SQL_KEYWORDS = [
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 
  'ALTER', 'CREATE', 'EXEC', 'UNION', 'TRUNCATE', 
  'SCRIPT', 'DECLARE', '--', ';--', '/*', '*/', 
  'WAITFOR', 'DELAY', 'SHUTDOWN'
];

const SQL_PATTERNS = [
  /(\%27)|(\')/i, 
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, 
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i, 
  /exec(\s|\+)+(s|x)p\w+/i, 
  /UNION(?:\s+ALL)?\s+SELECT/i 
];

const containsSQLInjection = (value) => {
  if (typeof value !== 'string') return false;
  
  const upperValue = value.toUpperCase();
  for (const keyword of SQL_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(upperValue)) {
      return true;
    }
  }
  
  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  
  return false;
};

const preventSQLInjection = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        const value = req.body[key];
        if (typeof value === 'string' && containsSQLInjection(value)) {
          logger.warn(`Possível SQL Injection detectado: ${key}=${value}`, {
            ip: req.ip,
            method: req.method,
            url: req.originalUrl
          });
          return res.status(400).json({
            success: false,
            message: 'Entrada inválida detectada',
            errors: {
              field: key,
              details: 'Caracteres ou sequências não permitidos detectados'
            }
          });
        }
      }
    }
  }
  
  if (req.query) {
    for (const key in req.query) {
      if (Object.prototype.hasOwnProperty.call(req.query, key)) {
        const value = req.query[key];
        if (typeof value === 'string' && containsSQLInjection(value)) {
          logger.warn(`Possível SQL Injection detectado em query: ${key}=${value}`, {
            ip: req.ip,
            method: req.method,
            url: req.originalUrl
          });
          return res.status(400).json({
            success: false,
            message: 'Entrada inválida detectada',
            errors: {
              field: key,
              details: 'Caracteres ou sequências não permitidos detectados'
            }
          });
        }
      }
    }
  }
  
  if (req.params) {
    for (const key in req.params) {
      if (Object.prototype.hasOwnProperty.call(req.params, key)) {
        const value = req.params[key];
        if (typeof value === 'string' && containsSQLInjection(value)) {
          logger.warn(`Possível SQL Injection detectado em params: ${key}=${value}`, {
            ip: req.ip,
            method: req.method,
            url: req.originalUrl
          });
          return res.status(400).json({
            success: false,
            message: 'Entrada inválida detectada',
            errors: {
              field: key,
              details: 'Caracteres ou sequências não permitidos detectados'
            }
          });
        }
      }
    }
  }
  
  next();
};

const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (email && !EMAIL_REGEX.test(email)) {
    logger.warn(`Email inválido: ${email}`);
    return res.status(400).json({
      success: false,
      message: 'Formato de email inválido',
      errors: {
        field: 'email',
        details: 'O email fornecido não está em um formato válido'
      }
    });
  }

  next();
};

const validatePassword = (req, res, next) => {
  const { password } = req.body;

  if (password && password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Senha muito curta',
      errors: {
        field: 'password',
        details: 'A senha deve ter pelo menos 6 caracteres'
      }
    });
  }

  if (password && !(/[A-Za-z]/.test(password) && /[0-9]/.test(password))) {
    return res.status(400).json({
      success: false,
      message: 'Senha não atende aos requisitos mínimos',
      errors: {
        field: 'password',
        details: 'A senha deve conter pelo menos uma letra e um número'
      }
    });
  }

  next();
};

const validateName = (req, res, next) => {
  const { name } = req.body;

  if (name && name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Nome muito curto',
      errors: {
        field: 'name',
        details: 'O nome deve ter pelo menos 2 caracteres'
      }
    });
  }

  next();
};

const validateBookId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !/^[0-9]+$/.test(id)) {
    logger.warn(`ID de livro inválido: ${id}`);
    return res.status(400).json({
      success: false,
      message: 'ID de livro inválido',
      errors: {
        field: 'id',
        details: 'O ID fornecido não é válido'
      }
    });
  }

  next();
};

const validateBookStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatus = ['wishlist', 'reading', 'finished'];

  if (status && !validStatus.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status inválido',
      errors: {
        field: 'status',
        details: `O status deve ser um dos seguintes: ${validStatus.join(', ')}`
      }
    });
  }

  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateBookId,
  validateBookStatus,
  preventSQLInjection
};
