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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha no login');
      }

      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data.user;
    } catch (fetchError) {
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
    throw new Error('Erro ao fazer login. Verifique suas credenciais ou tente novamente mais tarde.');
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha no cadastro');
      }

      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data.user;
    } catch (fetchError) {
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
    throw new Error('Erro ao fazer cadastro. Por favor, tente novamente mais tarde.');
  }
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const fetchUserCollection = async (userId) => {  try {
    const response = await fetch(`${BACKEND_API_URL}/books/collection/${userId}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Falha ao buscar coleção');
    }    
    const data = await response.json();
    
    // Mesclando os livros da categoria "interested" com "wantToRead"
    const mergedWantToRead = [
      ...(data.wantToRead || []), 
      ...(data.interested || [])
    ];
    
    return {
      read: data.read || [],
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

    if (!response.ok) {
      throw new Error('Falha ao adicionar livro');
    }

    return await response.json();
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

    if (!response.ok) {
      throw new Error('Falha ao remover livro');
    }

    return await response.json();
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

    if (!response.ok) {
      throw new Error('Falha ao atualizar status do livro');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};

export const searchBooks = async (query, maxResults = 15) => {
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
      previewLink: item.volumeInfo.previewLink || ''
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