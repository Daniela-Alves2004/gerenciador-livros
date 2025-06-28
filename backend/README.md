# Backend do Meu Acervo

API REST desenvolvida em Express.js para o sistema de gerenciamento de coleção de livros "Meu Acervo".

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução JavaScript server-side
- **Express.js**: Framework web para desenvolvimento de APIs
- **MongoDB**: Banco de dados NoSQL para armazenamento de dados
- **Mongoose**: ODM (Object Data Modeling) para MongoDB
- **JWT**: Para autenticação baseada em tokens
- **bcryptjs**: Para criptografia de senhas

## Características Implementadas

### Validação de Campos no Servidor
- Verificação de campos obrigatórios em todas as requisições
- Validação de formatos específicos (email, senha, etc.)
- Tratamento de erros de validação com mensagens claras para o cliente
- Middleware de validação centralizado para reuso de código

### Respostas de Validação do Servidor
- Respostas padronizadas com mensagens de erro descritivas
- Códigos HTTP apropriados para cada tipo de erro
- Formato de resposta consistente para facilitar o tratamento pelo frontend
- Informações detalhadas sobre campos inválidos

## Implementação do Padrão REST

A API segue rigorosamente o padrão REST:

- **Recursos Nomeados por Substantivos**: `/auth`, `/books`
- **Operações Representadas por Verbos HTTP**:
  - `GET`: Para buscar recursos
  - `POST`: Para criar recursos
  - `PUT`: Para atualizar recursos
  - `DELETE`: Para remover recursos
- **Respostas Padronizadas**:
  - Formato JSON consistente: `{ success, message, data/errors }`
  - Códigos de status HTTP apropriados
  - Formato de erro padronizado
- **Separação de Responsabilidades**:
  - Rotas para definir endpoints
  - Middlewares para validação e autenticação
  - Controladores para lógica de negócios
  - Modelos para definição de dados

## Estrutura do Projeto

```
src/
  ├── config/             # Configurações (banco de dados, autenticação)
  ├── middleware/         # Middlewares do Express (autenticação, validação)
  │   ├── authMiddleware.js     # Autenticação com JWT
  │   ├── restResponse.js       # Formatação de respostas REST
  │   ├── validateData.js       # Validação de formatos específicos
  │   └── validateFields.js     # Validação de campos obrigatórios
  ├── models/             # Modelos de dados do Mongoose
  │   ├── Book.js               # Modelo de livros
  │   └── User.js               # Modelo de usuários
  ├── routes/             # Rotas da API
  │   ├── auth.js               # Rotas de autenticação
  │   └── books.js              # Rotas de gerenciamento de livros
  └── server.js           # Ponto de entrada da aplicação
```

## Endpoints

### Autenticação

- `POST /api/auth/register` - Registrar um novo usuário
  - **Validações**: nome (min. 3 caracteres), email (formato válido), senha (min. 6 caracteres)
  - **Resposta de sucesso**: 201 Created, token JWT e dados do usuário
  - **Respostas de erro**: 400 Bad Request (dados inválidos), 500 Internal Server Error

- `POST /api/auth/login` - Login de usuário
  - **Validações**: email (formato válido), senha (obrigatória)
  - **Resposta de sucesso**: 200 OK, token JWT e dados do usuário
  - **Respostas de erro**: 400 Bad Request (dados faltando), 401 Unauthorized (credenciais inválidas)

### Livros

- `GET /api/books/collection/:userId` - Obter coleção de livros do usuário
  - **Validações**: userId (via parâmetros), autenticação
  - **Resposta de sucesso**: 200 OK, livros agrupados por status
  - **Respostas de erro**: 401 Unauthorized, 403 Forbidden, 404 Not Found

- `GET /api/books/:bookId` - Obter um livro específico da coleção
  - **Validações**: bookId (via parâmetros), autenticação
  - **Resposta de sucesso**: 200 OK, dados do livro
  - **Respostas de erro**: 401 Unauthorized, 404 Not Found

- `POST /api/books` - Adicionar novo livro à coleção
  - **Validações**: id, title, userId (obrigatórios), autenticação
  - **Resposta de sucesso**: 201 Created, dados do livro criado
  - **Respostas de erro**: 400 Bad Request, 403 Forbidden, 409 Conflict (livro já existe)

- `DELETE /api/books/:bookId` - Remover livro da coleção
  - **Validações**: bookId (via parâmetros), userId (corpo), autenticação
  - **Resposta de sucesso**: 200 OK, confirmação de remoção
  - **Respostas de erro**: 401 Unauthorized, 403 Forbidden, 404 Not Found

- `PUT /api/books/:bookId/status` - Atualizar status do livro
  - **Validações**: bookId (via parâmetros), status (valores permitidos: 'read', 'wantToRead'), autenticação
  - **Resposta de sucesso**: 200 OK, dados do livro atualizado
  - **Respostas de erro**: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

## Formato de Respostas REST

### Respostas de Sucesso

```json
{
  "success": true,
  "message": "Descrição do sucesso",
  "data": {
    // Dados retornados pela API
  }
}
```

### Respostas de Erro

```json
{
  "success": false,
  "message": "Descrição do erro",
  "errors": {
    // Detalhes específicos do erro
    "field": "campo_com_erro",
    "details": "Descrição detalhada do erro"
  }
}
```

## Como Executar

1. Instale as dependências:
```
npm install
```

2. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/meuacervo
JWT_SECRET=sua_chave_secreta
JWT_EXPIRATION=7d
```

3. Inicie o servidor:
```
npm run dev
```

O servidor será iniciado na porta 3001 por padrão, ou na porta definida na variável de ambiente PORT.

## Requisitos

- Node.js 14.x ou superior
- MongoDB 4.x ou superior

## Testes

Para testar a API, você pode usar o Postman, Insomnia ou qualquer outro cliente HTTP. Um conjunto de exemplos de requisições está disponível na pasta `/docs/postman` para importação.
