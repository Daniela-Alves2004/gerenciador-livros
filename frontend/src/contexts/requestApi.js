const API_BASE_URL = 'https://www.googleapis.com/books/v1';
const BACKEND_API_URL = 'http://localhost:3001/api';

const getAuthToken = () => localStorage.getItem('token');

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const loginUser = async (email, password) => {
  try {
    // Verificar se o backend está online
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Formatação da mensagem de erro baseada na resposta do backend
        let errorMessage = 'Falha no login';
        
        if (data.message) {
          errorMessage = data.message;
        }
        
        if (data.errors) {
          // Se houver detalhes de erro específicos para campos
          if (typeof data.errors === 'object' && data.errors.field) {
            errorMessage += `: ${data.errors.details || `Erro no campo ${data.errors.field}`}`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Extrair dados da resposta REST padronizada
      const userData = data.data || data;
      
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData.user));
      localStorage.removeItem('demo_mode'); // Garantir que o modo demo esteja desligado
      
      return userData.user;
    } catch (fetchError) {
      if (fetchError.message && !fetchError.message.includes('fetch failed')) {
        // Se for um erro de validação ou autenticação, propaga o erro
        throw fetchError;
      }
      
      // Se ocorrer erro de conexão, usamos modo de demonstração
      console.warn('Servidor backend não disponível. Usando modo de demonstração.', fetchError);
      
      // Criando usuário demo para fins de teste
      const demoUser = {
        id: 'demo-user-123',
        name: email.split('@')[0] || 'Usuário Demo',
        email: email
      };
      
      const demoToken = 'demo-token-123456789';
      
      localStorage.setItem('token', demoToken);
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('demo_mode', 'true');
      
      return demoUser;
    }
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
};

export const registerUser = async (name, email, password) => {
  try {
    // Verificar se o backend está online
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Formatação da mensagem de erro baseada na resposta do backend
        let errorMessage = 'Falha no cadastro';
        
        if (data.message) {
          errorMessage = data.message;
        }
        
        if (data.errors) {
          // Se houver detalhes de erro específicos para campos
          if (typeof data.errors === 'object' && data.errors.field) {
            errorMessage += `: ${data.errors.details || `Erro no campo ${data.errors.field}`}`;
          } else if (typeof data.errors === 'object') {
            // Se houver múltiplos erros de validação
            const errorFields = Object.keys(data.errors).join(', ');
            errorMessage += `: Problemas nos campos: ${errorFields}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Extrair dados da resposta REST padronizada
      const userData = data.data || data;
      
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData.user));
      localStorage.removeItem('demo_mode'); // Garantir que o modo demo esteja desligado
      
      return userData.user;
    } catch (fetchError) {
      if (fetchError.message && !fetchError.message.includes('fetch failed')) {
        // Se for um erro de validação ou autenticação, propaga o erro
        throw fetchError;
      }
      
      // Se ocorrer erro de conexão, usamos modo de demonstração
      console.warn('Servidor backend não disponível. Usando modo de demonstração.', fetchError);
      
      // Criando usuário demo para fins de teste
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        name: name || email.split('@')[0] || 'Usuário Demo',
        email: email
      };
      
      const demoToken = 'demo-token-' + Date.now();
      
      localStorage.setItem('token', demoToken);
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('demo_mode', 'true');
      
      return demoUser;
    }
  } catch (error) {
    console.error('Erro no cadastro:', error);
    throw error;
  }
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const fetchUserCollection = async (userId) => {
  try {
    // Verificar se o token existe
    const token = getAuthToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Por favor, faça login.');
    }

    const response = await fetch(`${BACKEND_API_URL}/books/collection/${userId}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Extrair a mensagem de erro específica da resposta da API
      const errorMessage = data.message || 'Falha ao buscar coleção';
      throw new Error(errorMessage);
    }
    
    // Processar os dados retornados
    const responseData = data.data || data;
    
    // Mesclando os livros da categoria "interested" com "wantToRead"
    const mergedWantToRead = [
      ...(responseData.wantToRead || []), 
      ...(responseData.interested || [])
    ];
    
    return {
      read: responseData.read || [],
      wantToRead: mergedWantToRead
    };
  } catch (error) {
    console.error('Erro ao buscar coleção:', error);
    throw error;
  }
};

export const addBook = async (bookData) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/books`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookData)
    });

    const data = await response.json();

    if (!response.ok) {
      // Extrair a mensagem de erro específica da resposta da API
      const errorMessage = data.message || 'Falha ao adicionar livro';
      const errorDetails = data.errors ? `: ${JSON.stringify(data.errors)}` : '';
      throw new Error(`${errorMessage}${errorDetails}`);
    }

    return data.data || data;
  } catch (error) {
    console.error('Erro ao adicionar livro:', error);
    throw error;
  }
};

export const removeBook = async (bookId, userId) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/books/${bookId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId })
    });

    const data = await response.json();

    if (!response.ok) {
      // Extrair a mensagem de erro específica da resposta da API
      const errorMessage = data.message || 'Falha ao remover livro';
      throw new Error(errorMessage);
    }

    return data.data || data;
  } catch (error) {
    console.error('Erro ao remover livro:', error);
    throw error;
  }
};

export const updateBookStatus = async (bookId, userId, status) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/books/${bookId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, status })
    });

    const data = await response.json();

    if (!response.ok) {
      // Extrair a mensagem de erro específica da resposta da API
      const errorMessage = data.message || 'Falha ao atualizar status do livro';
      throw new Error(errorMessage);
    }

    return data.data || data;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};

export const searchBooks = async (query, maxResults = 24) => {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
    );

    if (!response.ok) {
      throw new Error('A conexão falhou ou a resposta não foi válida.');
    }

    const data = await response.json();
    
    if (!data.items) {
      return [];
    }

    return data.items.map(item => ({
      id: item.id,
      title: item.volumeInfo.title || 'Título desconhecido',
      authors: item.volumeInfo.authors || ['Autor desconhecido'],
      description: item.volumeInfo.description || 'Nenhuma descrição disponível',
      publishedDate: item.volumeInfo.publishedDate || 'Data desconhecida',
      imageLinks: item.volumeInfo.imageLinks || { 
        thumbnail: 'https://via.placeholder.com/128x192?text=No+Cover' 
      },
      categories: item.volumeInfo.categories || [],
      pageCount: item.volumeInfo.pageCount || 0,
      language: item.volumeInfo.language || 'Sem idioma definido',
      averageRating: item.volumeInfo.averageRating || 0,
      ratingsCount: item.volumeInfo.ratingsCount || 0,
      previewLink: item.volumeInfo.previewLink || '',
      publisher: item.volumeInfo.publisher || 'Editora desconhecida'
    }));
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
};

export const getBookDetails = async (bookId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/volumes/${bookId}`);
    
    if (!response.ok) {
      throw new Error('A conexão falhou ou a resposta não foi válida.');
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      title: data.volumeInfo.title || 'Título desconhecido',
      authors: data.volumeInfo.authors || ['Autor desconhecido'],
      description: data.volumeInfo.description || 'Nenhuma descrição disponível',
      publishedDate: data.volumeInfo.publishedDate || 'Data desconhecida',
      imageLinks: data.volumeInfo.imageLinks || {
        thumbnail: 'https://via.placeholder.com/128x192?text=No+Cover'
      },
      categories: data.volumeInfo.categories || [],
      pageCount: data.volumeInfo.pageCount || 0,
      language: data.volumeInfo.language || 'Sem idioma definido',
      averageRating: data.volumeInfo.averageRating || 0,
      ratingsCount: data.volumeInfo.ratingsCount || 0,
      previewLink: data.volumeInfo.previewLink || '',
      publisher: data.volumeInfo.publisher || 'Editora desconhecida',
      industryIdentifiers: data.volumeInfo.industryIdentifiers || []
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do livro:', error);
    throw error;
  }
};