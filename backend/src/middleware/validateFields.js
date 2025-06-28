/**
 * Middleware para validação de campos obrigatórios
 * @param {Array} requiredFields - Array com os nomes dos campos obrigatórios
 * @returns {Function} Middleware do Express
 */
const validateFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    // Verificar quais campos estão faltando
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missingFields.push(field);
      }
    }
    
    // Se houver campos faltando, retornar erro 400
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não preenchidos',
        errors: {
          missingFields,
          details: missingFields.map(field => `O campo "${field}" é obrigatório`)
        }
      });
    }
    
    // Se todos os campos estiverem preenchidos, continuar
    next();
  };
};

module.exports = validateFields;
