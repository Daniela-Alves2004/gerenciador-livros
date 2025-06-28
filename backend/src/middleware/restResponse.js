/**
 * Middleware para formatar respostas REST de maneira padronizada
 */

// Adiciona métodos de resposta REST padronizados ao objeto res
const restResponse = (req, res, next) => {
  // Resposta de sucesso (200 OK)
  res.ok = (data = null, message = 'Operação realizada com sucesso') => {
    return res.status(200).json({
      success: true,
      message,
      data
    });
  };

  // Resposta de criação (201 Created)
  res.created = (data = null, message = 'Recurso criado com sucesso') => {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  };

  // Resposta de erro de validação (400 Bad Request)
  res.badRequest = (errors = null, message = 'Requisição inválida') => {
    return res.status(400).json({
      success: false,
      message,
      errors
    });
  };

  // Resposta de erro de autenticação (401 Unauthorized)
  res.unauthorized = (message = 'Autenticação necessária') => {
    return res.status(401).json({
      success: false,
      message
    });
  };

  // Resposta de erro de permissão (403 Forbidden)
  res.forbidden = (message = 'Acesso negado') => {
    return res.status(403).json({
      success: false,
      message
    });
  };

  // Resposta de recurso não encontrado (404 Not Found)
  res.notFound = (message = 'Recurso não encontrado') => {
    return res.status(404).json({
      success: false,
      message
    });
  };

  // Resposta de erro interno (500 Internal Server Error)
  res.serverError = (error = null, message = 'Erro interno do servidor') => {
    console.error(error);
    return res.status(500).json({
      success: false,
      message
    });
  };

  next();
};

module.exports = restResponse;
