const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { connectDB } = require('./config/database');
const restResponse = require('./middleware/restResponse');
const { setupLogger } = require('./config/logger');
const { preventSQLInjection } = require('./middleware/validateData');
const cacheService = require('./services/cacheService');
require('dotenv').config();

const logger = setupLogger();

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');

const app = express();

app.locals.cacheService = cacheService;

connectDB();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições deste IP, tente novamente após 15 minutos'
});

app.use(compression({
  level: 6,
  threshold: 1024, 
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(helmet()); 
app.use(express.json({ limit: '10kb' })); 
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(hpp()); 
app.use('/api/', limiter); 

app.use(preventSQLInjection);

app.use(morgan('combined')); 
app.use(restResponse);

const serveCompressedStatic = require('./middleware/staticCompression');
const frontendBuildPath = path.join(__dirname, '../../frontend/build');

if (fs.existsSync(frontendBuildPath)) {
  logger.info('Diretório de build do frontend encontrado. Configurando servir arquivos estáticos.');
  
  app.use(serveCompressedStatic({ 
    root: frontendBuildPath,
    extensions: ['.html', '.js', '.css', '.svg', '.json']
  }));
  
  app.use(express.static(frontendBuildPath));
}

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

app.get('/api/health', (req, res) => {
  res.ok({ status: 'online', timestamp: new Date() }, 'API está funcionando corretamente');
});

app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    res.ok(stats, 'Estatísticas do cache obtidas com sucesso');
  } catch (error) {
    logger.error(`Erro ao obter estatísticas do cache: ${error.message}`);
    res.serverError(error, 'Erro ao obter estatísticas do cache');
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.delete('/api/cache/flush', async (req, res) => {
    try {
      await cacheService.flush();
      res.ok(null, 'Cache limpo com sucesso');
    } catch (error) {
      logger.error(`Erro ao limpar cache: ${error.message}`);
      res.serverError(error, 'Erro ao limpar cache');
    }
  });
}

app.use((req, res) => {
  logger.warn(`Rota não encontrada: ${req.originalUrl}`);
  res.notFound('Rota não encontrada');
});

app.use((err, req, res, next) => {
  if (err.name === 'SequelizeDatabaseError') {
    logger.error(`Erro de banco de dados SQLite: ${err.message}`, { 
      stack: err.stack,
      sql: err.sql || 'SQL não disponível'
    });
    return res.serverError(null, 'Erro ao processar a operação no banco de dados');
  }
  
  if (err.name === 'SequelizeValidationError') {
    const validationErrors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    
    logger.warn('Erro de validação:', { errors: validationErrors });
    return res.badRequest({ errors: validationErrors }, 'Erro de validação');
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'campo';
    logger.warn(`Violação de unicidade: ${field}`);
    return res.conflict(`O valor fornecido para ${field} já está em uso`);
  }
  
  logger.error(`Erro: ${err.message}, Stack: ${err.stack}`);
  res.serverError(err, 'Erro interno do servidor');
});


const PORT = process.env.PORT || 3001;

process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido, encerrando servidor...');
  await cacheService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recebido, encerrando servidor...');
  await cacheService.close();
  process.exit(0);
});

if (process.env.NODE_ENV === 'production') {
  try {
    const privateKey = fs.readFileSync(path.join(__dirname, '../ssl/private-key.pem'), 'utf8');
    const certificate = fs.readFileSync(path.join(__dirname, '../ssl/certificate.pem'), 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(PORT, () => {
      logger.info(`Servidor HTTPS rodando na porta ${PORT}`);
    });
  } catch (error) {
    logger.error(`Erro ao iniciar servidor HTTPS: ${error.message}`);
    app.listen(PORT, () => {
      logger.warn(`Servidor HTTP rodando na porta ${PORT} (fallback)`);
    });
  }
} else {
  app.listen(PORT, () => {
    logger.info(`Servidor HTTP rodando na porta ${PORT} (desenvolvimento)`);
  });
}

module.exports = app;
