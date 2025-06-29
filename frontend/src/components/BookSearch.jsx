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
  IconButton,
  Menu,
  MenuItem,
  Card,
  Snackbar,
  Pagination,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';

import { useBookContext } from '../contexts/BookContext';
import { searchBooks, addBook } from '../contexts/requestApi';
import { ActionTypes } from '../contexts/BookContext';
import BookCardRefactored from './BookCardRefactored';

const BookSearch = () => {
  const { state, dispatch } = useBookContext();
  const [query, setQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query || query.trim() === '') {
      setErrorMessage('Por favor, digite algo para buscar.');
      return;
    }
    
    if (query.trim().length < 3) {
      setErrorMessage('Por favor, digite pelo menos 3 caracteres para buscar.');
      return;
    }
    
    setErrorMessage('');
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const results = await searchBooks(query);
      dispatch({ type: ActionTypes.SET_SEARCH_RESULTS, payload: results });
      setPage(1); 
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
    setPage(1);
    dispatch({ type: ActionTypes.SET_SEARCH_RESULTS, payload: [] });
  };
  
  const handleMenuOpen = (event, book) => {
    if (!state.isAuthenticated) {
      setNotification({
        open: true,
        message: 'Faça login para adicionar livros à sua coleção',
        severity: 'warning'
      });
      return;
    }
    
    setAnchorEl(event.currentTarget);
    setSelectedBook(book);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBook(null);
  };
  
  const handleAddToCollection = async (status) => {
    handleMenuClose();
    
    if (!selectedBook || !state.user) return;
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const bookData = {
        ...selectedBook,
        userId: state.user.id,
        status
      };
      
      const result = await addBook(bookData);
      
      dispatch({
        type: ActionTypes.ADD_BOOK_TO_COLLECTION,
        payload: {
          book: result,
          status
        }
      });
      
      setNotification({
        open: true,
        message: `Livro adicionado com sucesso à coleção "${status}"`,
        severity: 'success'
      });
      
    } catch (error) {
      setNotification({
        open: true,
        message: 'Erro ao adicionar livro à coleção',
        severity: 'error'
      });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({...notification, open: false});
  };
  
  const handleViewDetails = (book) => {
    dispatch({
      type: ActionTypes.SELECT_BOOK,
      payload: book
    });
    handleMenuClose();
  };

  return (
    <Box sx={{ 
      backgroundColor: 'background.default', 
      padding: 3,
      borderRadius: 2
    }}>
      {!state.isAuthenticated ? (
        <Paper elevation={3} sx={{ 
          p: 3, 
          bgcolor: 'primary.main', 
          color: 'background.default',
          textAlign: 'center' 
        }}>
          <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
            Área Restrita
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Faça login para acessar a busca de livros.
          </Typography>
        </Paper>
      ) : (
        <>
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
                      color: 'secondary.main',
                      borderRadius: 1,
                    }
                  }}
                  sx={{
                    '& .MuiInputLabel-root': { color: 'secondary.main' },
                    '& .MuiInputBase-input::placeholder': { color: 'secondary.main', opacity: 0.8 },
                    '& .MuiInputBase-input': { color: 'secondary.main' }
                  }}
                  InputLabelProps={{
                    style: { color: '#76366e' }
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Resultados da busca
                    </Typography>
                    <Typography variant="body2">
                      Mostrando {Math.min((page - 1) * itemsPerPage + 1, state.searchResults.length)} - {Math.min(page * itemsPerPage, state.searchResults.length)} de {state.searchResults.length} resultados
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3}>
                    {state.searchResults
                      .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                      .map((book) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                          <Card 
                            elevation={3}
                            sx={{ 
                              position: 'relative',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            <BookCardRefactored book={book} onClick={() => handleViewDetails(book)} />
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                  
                  {state.searchResults.length > itemsPerPage && (
                    <Stack spacing={2} sx={{ mt: 4, display: 'flex', alignItems: 'center' }}>
                      <Pagination 
                        count={Math.ceil(state.searchResults.length / itemsPerPage)}
                        page={page}
                        onChange={(event, newPage) => setPage(newPage)}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                      />
                    </Stack>
                  )}
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
        </>
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BookSearch;