const express = require('express');
const User = require('../models/User');
const { generateToken, generatePasswordResetToken } = require('../config/auth');
const validateFields = require('../middleware/validateFields');
const { validateEmail, validatePassword, validateName } = require('../middleware/validateData');
const { sanitizeBody, validate, validateUser } = require('../middleware/sanitizeData');
const { authMiddleware, invalidateToken } = require('../middleware/authMiddleware');
const { setupLogger } = require('../config/logger');
const router = express.Router();

const logger = setupLogger();

router.use(sanitizeBody);

router.post('/login', 
  validateFields(['email', 'password']), 
  validateEmail,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.scope('withPassword').findOne({ 
        where: { email: email.toLowerCase() } 
      });
      
      if (!user) {
        logger.warn(`Tentativa de login com email inexistente: ${email}`);
        return res.unauthorized('Credenciais inválidas');
      }

      if (user.isLocked()) {
        logger.warn(`Tentativa de login em conta bloqueada: ${email}`);
        return res.unauthorized('Conta temporariamente bloqueada devido a múltiplas tentativas de login. Tente novamente mais tarde.');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        await user.registerFailedLogin();
        
        logger.warn(`Login falho - senha incorreta: ${email} (Tentativas: ${user.loginAttempts})`);
        
        if (user.loginAttempts >= 5) {
          return res.unauthorized('Conta temporariamente bloqueada devido a múltiplas tentativas de login. Tente novamente mais tarde.');
        }
        
        return res.unauthorized('Credenciais inválidas');
      }

      await user.resetLoginAttempts();

      const token = generateToken(user.id);

      logger.info(`Login bem-sucedido: ${email} (ID: ${user.id})`);

      res.ok({
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token
      }, 'Login realizado com sucesso');
    } catch (error) {
      logger.error(`Erro no login: ${error.message}`, { stack: error.stack });
      res.serverError(error, 'Erro ao processar login');
    }
  }
);

router.post('/register', 
  validate(validateUser),
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        logger.warn(`Tentativa de registro com email existente: ${email}`);
        return res.conflict('Este email já está em uso');
      }

      const user = await User.create({
        name,
        email,
        password
      });

      const token = generateToken(user.id);

      logger.info(`Novo usuário registrado: ${email} (ID: ${user.id})`);

      res.created({
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token
      }, 'Usuário registrado com sucesso');
    } catch (error) {
      logger.error(`Erro no registro: ${error.message}`, { stack: error.stack });
      res.serverError(error, 'Erro ao registrar usuário');
    }
  }
);

router.post('/logout', authMiddleware, (req, res) => {
  try {
    if (invalidateToken(req.token)) {
      logger.info(`Logout bem-sucedido: ${req.user.id}`);
      return res.ok(null, 'Logout realizado com sucesso');
    }
    
    logger.warn(`Falha ao invalidar token no logout: ${req.user.id}`);
    res.badRequest('Não foi possível realizar o logout');
  } catch (error) {
    logger.error(`Erro no logout: ${error.message}`, { stack: error.stack });
    res.serverError(error, 'Erro ao processar logout');
  }
});

router.post('/forgot-password',
  validateFields(['email']),
  validateEmail,
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        logger.warn(`Solicitação de redefinição para email inexistente: ${email}`);
        return res.ok(null, 'Se o email estiver registrado, enviaremos instruções para redefinir sua senha');
      }

      const { resetToken, hashedToken } = generatePasswordResetToken();

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 3600000); 
      await user.save();

      logger.info(`Solicitação de redefinição de senha: ${email}`);
      
      res.ok({
        message: 'Link de redefinição de senha enviado para o email',
        token: resetToken 
      }, 'Se o email estiver registrado, enviaremos instruções para redefinir sua senha');
    } catch (error) {
      logger.error(`Erro na solicitação de redefinição de senha: ${error.message}`, { stack: error.stack });
      res.serverError(error, 'Erro ao solicitar redefinição de senha');
    }
  }
);

router.get('/me', authMiddleware, (req, res) => {
  try {
    res.ok({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt
      }
    }, 'Informações do usuário obtidas com sucesso');
  } catch (error) {
    logger.error(`Erro ao obter informações do usuário: ${error.message}`, { stack: error.stack });
    res.serverError(error, 'Erro ao obter informações do usuário');
  }
});

module.exports = router;
