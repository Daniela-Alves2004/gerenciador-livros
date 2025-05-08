# Aplicação de Busca de Livros na API do Google Books

Uma aplicação web desenvolvida em React para buscar, informações sobre livros utilizando a API do Google Books.

## Descrição do Projeto

Meu Acervo é uma aplicação front-end que permite aos usuários:
- Buscar livros por título, autor ou assunto
- Visualizar detalhes completos de cada livro

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

## API JSON Utilizada

Este projeto utiliza a **API Google Books** para busca e exibição de informações sobre livros.

### Endpoints Implementados
- **Pesquisa de Livros**: `GET /volumes?q={query}&maxResults={maxResults}`
  - Busca livros com base em uma consulta de texto, limitando os resultados
  - Implementado na função `searchBooks()` no arquivo `requestApi.js`

- **Detalhes do Livro**: `GET /volumes/{bookId}`
  - Obtém informações detalhadas sobre um livro específico
  - Implementado na função `getBookDetails()` no arquivo `requestApi.js`

## Tecnologias Utilizadas

- **React.js**: Biblioteca JavaScript para construção de interfaces de usuário
- **Material-UI (MUI)**: Framework de componentes React para design consistente
- **CSS**: Estilização de componentes
- **Fetch API**: Para requisições HTTP

## Funcionalidades Desenvolvidas

1. **Sistema de Busca**: Interface para pesquisar livros por título, autor ou assunto
2. **Visualização de Resultados**: Exibição de livros em cards com informações essenciais
3. **Detalhamento de Livros**: Modal com informações completas sobre o livro selecionado
4. **UI Responsiva**: Interface adaptável a diferentes tamanhos de tela
5. **Tema Personalizado**: Implementação de tema visual consistente com MUI

## Como Executar o Projeto

1. Clone o repositório
2. Instale as dependências:
```
npm install
```
3. Execute o projeto em modo desenvolvimento:
```
npm start
```

## Estrutura do Projeto

- `src/components`: Componentes React da aplicação
- `src/contexts`: Contextos React para gerenciamento de estado
- `src/services`: Serviços para comunicação com APIs externas
- `src/styles`: Estilos e tema da aplicação
- `public`: Arquivos estáticos

## Aluno

Daniela Dos Santos Alves 2465728