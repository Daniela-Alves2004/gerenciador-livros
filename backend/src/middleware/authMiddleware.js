const { verifyToken } = require('../config/auth');
const User = require('../models/User');
const { setupLogger } = require('../config/logger');

const logger = setupLogger();

const invalidatedTokens = new Set();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`Tentativa de acesso sem token: ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido',
        errors: {
          auth: true,
          details: 'É necessário fornecer um token de autenticação no formato "Bearer TOKEN"'
        }
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      logger.warn(`Token não encontrado: ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido',
        errors: {
          auth: true,
          details: 'Token não encontrado no cabeçalho de autorização'
        }
      });
    }

    if (invalidatedTokens.has(token)) {
      logger.warn(`Tentativa de uso de token invalidado: ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        message: 'Token invalidado',
        errors: {
          auth: true,
          details: 'Este token foi invalidado por logout ou troca de senha'
        }
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      logger.warn(`Token inválido ou expirado: ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado',
        errors: {
          auth: true,
          details: 'O token fornecido é inválido ou expirou'
        }
      });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      logger.warn(`Usuário não encontrado para token: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
        errors: {
          auth: true, 
          details: 'O usuário associado ao token não foi encontrado'
        }
      });
    }

    if (!user.active) {
      logger.warn(`Tentativa de acesso com conta inativa: ${user.id}`);
      return res.status(401).json({
        success: false,
        message: 'Conta inativa',
        errors: {
          auth: true,
          details: 'Esta conta foi desativada'
        }
      });
    }

    if (decoded.iat && user.changedPasswordAfter(decoded.iat)) {
      logger.warn(`Token emitido antes da troca de senha: ${user.id}`);
      return res.status(401).json({
        success: false,
        message: 'Senha alterada após emissão do token',
        errors: {
          auth: true,
          details: 'Por favor, faça login novamente'
        }
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.error(`Erro na autenticação: ${error.message}`, { stack: error.stack });
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

const invalidateToken = (token) => {
  if (!token) return false;
  
  invalidatedTokens.add(token);
  
  if (invalidatedTokens.size > 1000) {
    const tokensToRemove = Array.from(invalidatedTokens).slice(0, 200);
    tokensToRemove.forEach(t => invalidatedTokens.delete(t));
  }
  
  return true;
};

module.exports = { 
  authMiddleware,
  invalidateToken
};
