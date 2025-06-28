const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const generateToken = (userId, options = {}) => {
  const jwtOptions = {
    expiresIn: options.expiresIn || process.env.JWT_EXPIRATION || '1d'
  };

  return jwt.sign(
    { 
      id: userId,
      iat: Math.floor(Date.now() / 1000) 
    }, 
    process.env.JWT_SECRET,
    jwtOptions
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};


const generatePasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  return {
    resetToken,
    hashedToken
  };
};

module.exports = {
  generateToken,
  verifyToken,
  generatePasswordResetToken
};
