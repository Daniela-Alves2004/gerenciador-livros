# Aplicação de Busca de Livros na API do Google Books

Uma aplicação web desenvolvida em React para buscar, informações sobre livros utilizando a API do Google Books.

## Descrição do Projeto

Meu Acervo é uma aplicação full-stack que permite aos usuários:
- Buscar livros por título, autor ou assunto
- Visualizar detalhes completos de cada livro
- Criar uma conta e fazer login
- Adicionar livros à sua coleção pessoal
- Organizar os livros em categorias (Lidos, Quero Ler)

Link do site: https://gerenciador-livros-six.vercel.app
### Demonstração
Abaixo estão algumas telas da aplicação:

Tela de Busca de Livros
![Captura de tela 2025-05-08 203726](https://github.com/user-attachments/assets/0a849ccf-2123-4870-b5f6-f47c226250e6)

Tela de resultado da busca
![Captura de tela 2025-05-08 203744](https://github.com/user-attachments/assets/5863ae5e-20e7-4561-b5d0-664ebe37d856)

Detalhes do Livro
![Captura de tela 2025-05-08 203805](https://github.com/user-attachments/assets/ae701108-7b43-4175-a2f9-8168dcc8e238)

## Hooks e Funcionalidades React.js Implementadas

### Hooks Utilizados
- **useContext e createContext**: Implementados no `BookContext.jsx` para gerenciar o estado global da aplicação e compartilhar dados entre componentes.
- **useReducer**: Utilizado no `BookContext.jsx` para gerenciar estados complexos através de actions, similar a um estado Redux.
- **useState**: Implementado em vários componentes como `BookSearch.jsx` para gerenciar estados locais.
- **useEffect**: Utilizado no componente `BookDetail.jsx` para carregar dados quando o livro selecionado muda.
- **useTheme e useMediaQuery (MUI)**: Implementados para criar um design responsivo.

### Padrões e Funcionalidades React
- **Context API**: Implementada através do `BookContext` para gerenciar o estado global da aplicação.
- **Componentes Funcionais**: Todos os componentes seguem o padrão de componentes funcionais com hooks.
- **Renderização Condicional**: Utilizada em diversos componentes para mostrar/esconder elementos com base em condições.
- **Props**: Transferência de dados entre componentes parent-child.
- **Componentes de Alta Ordem (HOC)**: Implementados com o ThemeProvider do Material UI.
- **Lifting State Up**: Implementado através do Context para compartilhar estados entre componentes irmãos.

## APIs Utilizadas

### API Externa: Google Books
Este projeto utiliza a **API Google Books** para busca e exibição de informações sobre livros.

#### Endpoints da API Google Books
- **Pesquisa de Livros**: `GET /volumes?q={query}&maxResults={maxResults}`
  - Busca livros com base em uma consulta de texto, limitando os resultados
  - Implementado na função `searchBooks()` no arquivo `requestApi.js`

- **Detalhes do Livro**: `GET /volumes/{bookId}`
  - Obtém informações detalhadas sobre um livro específico
  - Implementado na função `getBookDetails()` no arquivo `requestApi.js`

### API Interna: Backend Express.js
O projeto também inclui uma API RESTful própria desenvolvida com Express.js.

#### Endpoints da API Interna
##### Autenticação
- **Registro de usuário**: `POST /api/auth/register`
  - Registra um novo usuário no sistema
  - Retorna token JWT e dados do usuário

- **Login**: `POST /api/auth/login`
  - Autentica um usuário existente
  - Retorna token JWT e dados do usuário

##### Gerenciamento de Livros
- **Buscar coleção**: `GET /api/books/collection/:userId`
  - Retorna a coleção de livros do usuário agrupada por status

- **Adicionar livro**: `POST /api/books`
  - Adiciona um novo livro à coleção do usuário

- **Remover livro**: `DELETE /api/books/:bookId`
  - Remove um livro da coleção do usuário

- **Atualizar status**: `PUT /api/books/:bookId/status`
  - Atualiza o status de um livro na coleção (ex: de "Quero Ler" para "Lido")

## Tecnologias Utilizadas

### Frontend
- **React.js**: Biblioteca JavaScript para construção de interfaces de usuário
- **Material-UI (MUI)**: Framework de componentes React para design consistente
- **CSS**: Estilização de componentes
- **Fetch API**: Para requisições HTTP

### Backend
- **Node.js**: Ambiente de execução JavaScript server-side
- **Express.js**: Framework web para desenvolvimento de APIs
- **MongoDB**: Banco de dados NoSQL para armazenamento de dados
- **Mongoose**: ODM para MongoDB e validação de dados
- **JWT**: Para autenticação baseada em tokens
- **bcryptjs**: Para criptografia segura de senhas

## Funcionalidades Desenvolvidas

1. **Sistema de Busca**: Interface para pesquisar livros por título, autor ou assunto
2. **Visualização de Resultados**: Exibição de livros em cards com informações essenciais
3. **Paginação de Resultados**: Sistema de paginação para navegação eficiente em grandes conjuntos de resultados
4. **Detalhamento de Livros**: Modal com informações completas sobre o livro selecionado
5. **UI Responsiva**: Interface adaptável a diferentes tamanhos de tela
6. **Tema Personalizado**: Implementação de tema visual consistente com MUI
7. **Tratamento Avançado de Erros**: Feedback específico para diferentes tipos de erros durante operações
8. **Validação de Campos**: Verificação em tempo real de campos de formulário

## Como Executar o Projeto

### Configuração do Backend
1. Navegue até a pasta do backend:
```
cd backend
```
2. Instale as dependências:
```
npm install
```
3. Configure o arquivo .env na raiz da pasta backend:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/meuacervo
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRATION=7d
```
4. Inicie o servidor:
```
npm run dev
```

### Configuração do Frontend
1. Navegue até a pasta do frontend:
```
cd frontend
```
2. Instale as dependências:
```
npm install
```
3. Inicie o aplicativo:
```
npm start
```
4. O navegador abrirá automaticamente em `http://localhost:3000`

## Estrutura do Projeto

### Frontend
- `frontend/src/components`: Componentes React da aplicação
- `frontend/src/contexts`: Contextos React para gerenciamento de estado
- `frontend/src/styles`: Estilos e tema da aplicação
- `frontend/public`: Arquivos estáticos

### Backend
- `backend/src/config`: Configurações (banco de dados, autenticação)
- `backend/src/middleware`: Middlewares do Express
- `backend/src/models`: Modelos de dados do Mongoose
- `backend/src/routes`: Rotas da API
- `backend/src/server.js`: Arquivo principal do servidor

## Aluno

Daniela Dos Santos Alves 2465728
