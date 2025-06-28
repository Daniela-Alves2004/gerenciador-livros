/**
 * Middleware para validação de dados específicos
 */

// Expressão regular para validação de email
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Validação de email
const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (email && !EMAIL_REGEX.test(email)) {
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

// Validação de senha
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

  next();
};

// Validação de nome
const validateName = (req, res, next) => {
  const { name } = req.body;

  if (name && name.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Nome muito curto',
      errors: {
        field: 'name',
        details: 'O nome deve ter pelo menos 3 caracteres'
      }
    });
  }

  next();
};

// Validação do ID do livro
const validateBookId = (req, res, next) => {
  const { bookId } = req.params;
  
  if (!bookId || bookId.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'ID do livro inválido',
      errors: {
        field: 'bookId',
        details: 'É necessário fornecer um ID de livro válido'
      }
    });
  }
  
  next();
};

// Validação do status do livro
const validateBookStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['read', 'wantToRead'];
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status de livro inválido',
      errors: {
        field: 'status',
        details: `O status deve ser um dos seguintes: ${validStatuses.join(', ')}`
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
  validateBookStatus
};
