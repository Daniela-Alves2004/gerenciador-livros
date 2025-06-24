import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Grid, 
  Typography, 
  CircularProgress,
  Alert,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { useBookContext } from '../contexts/BookContext';
import { searchBooks } from '../contexts/requestApi';
import { ActionTypes } from '../contexts/BookContext';
import BookCard from './BookCard';

const BookSearch = () => {
  const { state, dispatch } = useBookContext();
  const [query, setQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query || query.trim() === '') {
      setErrorMessage('Por favor, digite algo para buscar.');
      return;
    }
    
    setErrorMessage('');
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const results = await searchBooks(query);
      dispatch({ type: ActionTypes.SET_SEARCH_RESULTS, payload: results });
    } catch (error) {
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: 'Erro ao buscar livros. Por favor, tente novamente.' 
      });
      setErrorMessage('Erro ao buscar livros. Por favor, tente novamente.');
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    dispatch({ type: ActionTypes.SET_SEARCH_RESULTS, payload: [] });
  };

  return (
    <Box sx={{ 
      backgroundColor: 'background.default', 
      padding: 3,
      borderRadius: 2
    }}>
      <Paper elevation={3} sx={{ 
        p: 3, 
        mb: 4, 
        bgcolor: 'primary.main', 
        color: 'background.default' 
      }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
          Buscar Livros
        </Typography>
        
        <form onSubmit={handleSearch}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Digite o Título, autor ou assunto"
              placeholder="Ex: Harry Potter, J.K. Rowling"
              color='background.default'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              error={!!errorMessage}
              helperText={errorMessage}
              InputProps={{
                endAdornment: query ? (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: {
                  bgcolor: 'background.paper', 
                  color: 'background.default',
                  borderRadius: 1,
                }
              }}
              
            />
            <Button 
              type="submit" 
              variant="contained" 
              size="large"
              startIcon={<SearchIcon />}
              disabled={state.isLoading}
              sx={{ 
                minWidth: 120,
                bgcolor: 'secondary.main', 
                '&:hover': {
                  bgcolor: 'accent.main', 
                }
              }}
            >
              {state.isLoading ? <CircularProgress size={24} color="inherit" /> : 'Buscar'}
            </Button>
          </Box>
        </form>
      </Paper>

      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}

      {state.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {state.searchResults.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Resultados da busca
              </Typography>
              <Grid container spacing={3}>
                {state.searchResults.map((book) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                    <BookCard book={book} />
                  </Grid>
                ))}
              </Grid>
            </>
          )}
          
          {query && !state.isLoading && state.searchResults.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1">
                Nenhum livro encontrado para "{query}".
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default BookSearch;