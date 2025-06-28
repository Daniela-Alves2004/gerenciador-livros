const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const setupLogger = () => {
  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(
      info => `${info.timestamp} ${info.level}: ${info.message}`
    )
  );

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format,
    defaultMeta: { service: 'meu-acervo-api' },
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'app.log'),
        level: 'info',
        maxsize: 5242880, 
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, 
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'access.log'),
        level: 'http',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
    exitOnError: false,
  });

  logger.exceptions.handle(
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.rejections.handle(
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, 
      maxFiles: 5,
    })
  );

  return logger;
};

module.exports = { setupLogger };
