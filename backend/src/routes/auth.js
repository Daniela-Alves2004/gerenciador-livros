const express = require('express');
const User = require('../models/User');
const { generateToken } = require('../config/auth');
const validateFields = require('../middleware/validateFields');
const { validateEmail, validatePassword, validateName } = require('../middleware/validateData');
const router = express.Router();

// Rota de login
router.post('/login', 
  validateFields(['email', 'password']), 
  validateEmail,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Buscar usuário pelo email
      const user = await User.findOne({ email });
      if (!user) {
        return res.unauthorized('Credenciais inválidas');
      }

      // Verificar se a senha está correta
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.unauthorized('Credenciais inválidas');
      }

      // Gerar token JWT
      const token = generateToken(user._id);

      // Retornar informações do usuário e token
      return res.ok({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }, 'Login realizado com sucesso');
    } catch (error) {
      console.error('Erro no login:', error);
      return res.serverError(error, 'Erro ao processar login');
    }
  });

// Rota de registro
router.post('/register', 
  validateFields(['name', 'email', 'password']), 
  validateName,
  validateEmail, 
  validatePassword,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Verificar se o email já está em uso
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.badRequest({
          field: 'email',
          details: 'Este email já está em uso'
        }, 'Email indisponível');
      }

      // Criar novo usuário
      const user = new User({ name, email, password });
      await user.save();

      // Gerar token JWT
      const token = generateToken(user._id);

      // Retornar informações do usuário e token
      return res.created({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }, 'Conta criada com sucesso');
    } catch (error) {
      console.error('Erro no registro:', error);
      
      // Verificar se é um erro de validação do Mongoose
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).reduce((acc, err) => {
          acc[err.path] = err.message;
          return acc;
        }, {});
        
        return res.badRequest(errors, 'Dados de registro inválidos');
      }
      
      return res.serverError(error, 'Erro ao processar registro');
    }
  });

module.exports = router;
