# Projeto Full-Stack - Programação Web

Uma aplicação web full-stack desenvolvida para a disciplina de Programação Web Fullstack, implementando um sistema de gerenciamento de livros com arquitetura em 3 camadas.

## Descrição do Projeto

O projeto implementa uma aplicação web para gerenciamento de coleção de livros com os seguintes requisitos funcionais:

1. **Login**: Sistema de autenticação de usuários
2. **Busca**: Busca de livros na coleção pessoal do usuário
3. **Inserção**: Adição de novos livros à coleção

Apenas usuários com sessão ativa (logados) podem realizar operações de busca e inserção de livros.

## Arquitetura do Sistema

O sistema foi implementado seguindo uma arquitetura de 3 camadas:

### Front-end
- **Tecnologia**: React.js
- **Comunicação**: Requisições HTTP (SPA - Single Page Application)
- **Padrão**: Segue a mesma estrutura do PROJETO 1

### Back-end HTTP
- **Tecnologia**: Express.js
- **Padrão**: API RESTful
- **Acesso**: Direto ao banco de dados
- **Estrutura de pastas obrigatória**:
  - `src/routes`: Arquivos de rotas com controladores integrados
  - `src/models`: Classes de acesso ao banco de dados
  - `src/config`: Arquivos de configuração (banco, cache, etc.)

### Banco de Dados
- **Tecnologia**: SQLite com Sequelize ORM
- **Pool de conexões**: Configurado para otimização de performance

## Funcionalidades Implementadas

### Requisitos Funcionais
- ✅ **Login**: Autenticação e autorização de usuários
- ✅ **Busca**: Pesquisa de livros na coleção pessoal
- ✅ **Inserção**: Adição de livros à coleção

### Validação e Segurança
- ✅ **Verificação de campos no servidor**
- ✅ **Mensagens de validação do servidor**
- ✅ **Padrão REST implementado**
- ✅ **Medidas de segurança contra**:
  - Falhas de criptografia (senhas criptografadas com bcrypt)
  - Injeção (sanitização de parâmetros, prevenção SQL/NoSQL inject e XSS)
  - Falhas de autenticação (tokens JWT, invalidação correta)
  - Registro e monitoramento (logs de autenticação, buscas e postagens)

### Otimizações Implementadas
- ✅ **Front-end**:
  - Compressão de arquivos estáticos
  - Build otimizado para produção
- ✅ **Back-end**:
  - Compressão de respostas do servidor
  - Estratégia de cache implementada
  - Pool de conexões configurado

## Estrutura do Projeto

```
projeto-full-stack/
├── backend/
│   ├── src/
│   │   ├── routes/     # Rotas com controladores integrados
│   │   ├── models/     # Modelos do banco de dados
│   │   └── config/     # Configurações
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   └── contexts/   # Context API e requisições
│   └── package.json
└── README.md
```

## Tecnologias Utilizadas

### Backend
- Express.js (servidor HTTP)
- Sequelize (ORM)
- SQLite (banco de dados)
- bcryptjs (criptografia de senhas)
- jsonwebtoken (autenticação JWT)
- helmet (segurança)
- compression (compressão)
- express-rate-limit (rate limiting)
- morgan (logs)
- winston (sistema de logs)
- node-cache (cache em memória)

### Frontend
- React.js (biblioteca de UI)
- Material-UI (componentes de UI)
- Context API (gerenciamento de estado)

## Como Executar

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Backend
```bash
cd backend
npm install
npm run init-db  # Inicializar banco de dados
npm start        # Produção
npm run dev      # Desenvolvimento
```

### Frontend
```bash
cd frontend
npm install
npm start        # Desenvolvimento
npm run build    # Build para produção
```

### Scripts de Inicialização
O projeto inclui scripts batch para facilitar a execução:
- `start_backend.bat` - Inicia o servidor backend
- `start_frontend.bat` - Inicia o servidor frontend
- `start_prod.bat` - Inicia ambos em modo produção

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/logout` - Logout de usuário
- `GET /api/auth/verify` - Verificação de token

### Livros
- `GET /api/books/collection/:userId` - Buscar coleção do usuário
- `GET /api/books/search` - Buscar livros na coleção
- `POST /api/books/add` - Adicionar livro à coleção
- `PUT /api/books/:id/status` - Atualizar status do livro
- `DELETE /api/books/:id` - Remover livro da coleção

## Recursos de Segurança

1. **Criptografia**: Senhas armazenadas com hash bcrypt
2. **Sanitização**: Prevenção contra XSS e injeção SQL
3. **Rate Limiting**: Proteção contra ataques automatizados
4. **Logs de Segurança**: Monitoramento de tentativas de login e operações
5. **Validação**: Validação rigorosa de entrada no servidor

## Otimizações de Performance

1. **Cache**: Sistema de cache em memória para consultas frequentes
2. **Compressão**: Respostas comprimidas do servidor
3. **Pool de Conexões**: Gerenciamento otimizado de conexões do banco
4. **Build Otimizado**: Frontend otimizado para produção

## Logs e Monitoramento

O sistema implementa logs abrangentes para:
- Tentativas de autenticação (sucesso e falha)
- Operações de busca
- Inserção e modificação de dados
- Erros do sistema
- Tentativas de acesso não autorizadas
