const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');
const restResponse = require('./middleware/restResponse');
require('dotenv').config();

// Importar rotas
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');

// Inicializar aplicação Express
const app = express();

// Conectar ao banco de dados
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev')); // Logging de requisições
app.use(restResponse); // Respostas REST padronizadas

// Registrar rotas
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

// Rota de teste para verificar se a API está funcionando
app.get('/api/health', (req, res) => {
  res.ok({ status: 'online', timestamp: new Date() }, 'API está funcionando corretamente');
});

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.notFound('Rota não encontrada');
});

// Tratamento global de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.serverError(err, 'Erro interno do servidor');
});

// Definir porta e iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
