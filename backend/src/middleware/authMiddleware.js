const { verifyToken } = require('../config/auth');
const User = require('../models/User');

/**
 * Middleware para autenticação de usuários
 * Implementa padrão REST para respostas de autenticação
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Verificar se o token está presente no header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido',
        errors: {
          auth: true,
          details: 'É necessário fornecer um token de autenticação no formato "Bearer TOKEN"'
        }
      });
    }

    // Extrair token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido',
        errors: {
          auth: true,
          details: 'Token não encontrado no cabeçalho de autorização'
        }
      });
    }

    // Verificar token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado',
        errors: {
          auth: true,
          details: 'O token fornecido é inválido ou expirou'
        }
      });
    }

    // Verificar se o usuário existe
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
        errors: {
          auth: true, 
          details: 'O usuário associado ao token não foi encontrado'
        }
      });
    }

    // Adicionar usuário ao objeto de requisição
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Falha na autenticação',
      errors: {
        server: true,
        details: 'Ocorreu um erro interno ao processar a autenticação'
      }
    });
  }
};

module.exports = authMiddleware;
