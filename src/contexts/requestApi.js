const API_BASE_URL = 'https://www.googleapis.com/books/v1';

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
    console.error('Error fetching books:', error);
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