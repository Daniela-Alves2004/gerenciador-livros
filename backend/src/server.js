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
const { connectDB, closeDB, healthCheck, getPoolStats } = require('./config/database');
require('dotenv').config();

const authRoutes = require('./routes/auth');
// const bookRoutes = require('./routes/books'); // Removido pois não existe ou não é necessário

console.log('Iniciando servidor...');
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.ok = (data, message = 'Operação realizada com sucesso') => {
    res.status(200).json({
      success: true,
      message,
      data
    });
  };

  res.created = (data, message = 'Recurso criado com sucesso') => {
    res.status(201).json({
      success: true,
      message,
      data
    });
  };

  res.badRequest = (errors, message = 'Dados inválidos') => {
    res.status(400).json({
      success: false,
      message,
      errors
    });
  };

  res.unauthorized = (message = 'Não autorizado') => {
    res.status(401).json({
      success: false,
      message,
      errors: {
        auth: true,
        details: message
      }
    });
  };

  res.forbidden = (message = 'Acesso negado') => {
    res.status(403).json({
      success: false,
      message,
      errors: {
        auth: true,
        details: message
      }
    });
  };

  res.notFound = (message = 'Recurso não encontrado') => {
    res.status(404).json({
      success: false,
      message,
      errors: {
        notFound: true,
        details: message
      }
    });
  };

  res.serverError = (message = 'Erro interno do servidor') => {
    res.status(500).json({
      success: false,
      message,
      errors: {
        server: true,
        details: message
      }
    });
  };

  next();
});

const sanitizeMiddleware = require('./middleware/sanitizer');
app.use(sanitizeMiddleware);
console.log('Antes do connectDB');

connectDB();
console.log('Depois do connectDB');
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

app.use(morgan('combined'));

app.use('/api/auth', authRoutes);
// app.use('/api/books', bookRoutes); // Removido pois não existe ou não é necessário

app.get('/api/health', (req, res) => {
  res.ok({ status: 'online', timestamp: new Date() }, 'API está funcionando corretamente');
});

app.get('/api/database/stats', async (req, res) => {
  try {
    const poolStats = getPoolStats();
    const isHealthy = await healthCheck();
    
    res.status(200).json({
      success: true,
      message: 'Estatísticas do banco de dados obtidas com sucesso',
      data: {
        pool: poolStats,
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Erro ao obter estatísticas do banco: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do banco',
      errors: {
        server: true,
        details: error.message
      }
    });
  }
});

app.use((req, res) => {
  console.warn(`Rota não encontrada: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    errors: {
      notFound: true,
      details: `A rota ${req.originalUrl} não foi encontrada`
    }
  });
});

app.use((err, req, res, next) => {
  if (err.name === 'SequelizeDatabaseError') {
    console.error(`Erro de banco de dados SQLite: ${err.message}`, { 
      stack: err.stack,
      sql: err.sql || 'SQL não disponível'
    });
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar a operação no banco de dados',
      errors: {
        server: true,
        details: 'Erro interno do banco de dados'
      }
    });
  }
  
  if (err.name === 'SequelizeValidationError') {
    const validationErrors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    
    console.warn('Erro de validação:', { errors: validationErrors });
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: {
        validation: true,
        fields: validationErrors
      }
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'campo';
    console.warn(`Violação de unicidade: ${field}`);
    return res.status(409).json({
      success: false,
      message: `O valor fornecido para ${field} já está em uso`,
      errors: {
        validation: true,
        field,
        details: 'Valor duplicado'
      }
    });
  }
  
  console.error(`Erro: ${err.message}, Stack: ${err.stack}`);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    errors: {
      server: true,
      details: err.message
    }
  });
});

const PORT = process.env.PORT || 3001;

process.on('SIGTERM', async () => {
  console.info('SIGTERM recebido, encerrando servidor...');
  await closeDB();
});

process.on('SIGINT', async () => {
  console.info('SIGINT recebido, encerrando servidor...');
  await closeDB();
});

if (process.env.NODE_ENV === 'production') {
  try {
    const privateKey = fs.readFileSync(path.join(__dirname, '../ssl/private-key.pem'), 'utf8');
    const certificate = fs.readFileSync(path.join(__dirname, '../ssl/certificate.pem'), 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(PORT, () => {
      console.info(`Servidor HTTPS rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error(`Erro ao iniciar servidor HTTPS: ${error.message}`);
    app.listen(PORT, () => {
      console.warn(`Servidor HTTP rodando na porta ${PORT} (fallback)`);
    });
  }
} else {
  app.listen(PORT, () => {
    console.info(`Servidor HTTP rodando na porta ${PORT}`);
  });
}

module.exports = app;
