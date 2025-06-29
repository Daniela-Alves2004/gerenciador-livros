import React from 'react';
import { 
  Grid, 
  Typography, 
  Box, 
  Paper, 
  CircularProgress, 
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Card,
  Pagination,
  Stack
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useBookContext } from '../contexts/BookContext';
import { ActionTypes } from '../contexts/BookContext';
import { removeBook, updateBookStatus } from '../contexts/requestApi';
import BookCardRefactored from './BookCardRefactored';

const BookCollection = ({ status }) => {
  const { state, dispatch } = useBookContext();
  const [selectedBook, setSelectedBook] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [itemsPerPage] = React.useState(8);

  const books = state.collection[status] || [];
    const statusTitle = {
    read: 'Livros Lidos',
    wantToRead: 'Livros para Ler'
  };

  const handleMenuOpen = (event, bookId) => {
    setAnchorEl(event.currentTarget);
    setSelectedBook(bookId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBook(null);
  };

  const handleRemoveBook = async () => {
    handleMenuClose();
    if (!selectedBook || !state.user?.id) return;
    
    setLoading(true);
    setError('');
    
    try {
      await removeBook(selectedBook, state.user.id);
      
      dispatch({
        type: ActionTypes.REMOVE_BOOK_FROM_COLLECTION,
        payload: {
          bookId: selectedBook,
          status
        }
      });
    } catch (error) {
      setError('Falha ao remover o livro. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveBook = async (newStatus) => {
    handleMenuClose();
    if (!selectedBook || !state.user?.id) return;
    if (newStatus === status) return;
    
    setLoading(true);
    setError('');
    
    try {
      await updateBookStatus(selectedBook, state.user.id, newStatus);
      
      dispatch({
        type: ActionTypes.MOVE_BOOK,
        payload: {
          bookId: selectedBook,
          fromStatus: status,
          toStatus: newStatus
        }
      });
    } catch (error) {
      setError(`Falha ao mover o livro para ${newStatus}. Tente novamente.`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      dispatch({
        type: ActionTypes.SELECT_BOOK,
        payload: book
      });
    }
    handleMenuClose();
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
          {statusTitle[status] || 'Minha Coleção'}
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {books.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Total: {books.length} livros
              </Typography>
              <Typography variant="body2">
                Mostrando {Math.min((page - 1) * itemsPerPage + 1, books.length)} - {Math.min(page * itemsPerPage, books.length)} de {books.length}
              </Typography>
            </Box>
          )}
          
          <Grid container spacing={3}>
            {books.length > 0 ? (
              books
                .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                .map(book => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                    <Card 
                      elevation={3}
                      sx={{ 
                        position: 'relative',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover .menu-button': {
                          opacity: 1,
                          visibility: 'visible'
                        }
                      }}
                    >
                  <IconButton
                    className="menu-button"
                    aria-label="more"
                    aria-controls="book-menu"
                    aria-haspopup="true"
                    onClick={(e) => handleMenuOpen(e, book.id)}
                    sx={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      bgcolor: 'rgba(255,255,255,0.7)',
                      opacity: 0,
                      visibility: 'hidden',
                      transition: 'opacity 0.3s ease, visibility 0.3s ease',
                      zIndex: 2,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                      }
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  
                  <BookCardRefactored book={book} onClick={() => handleViewDetails(book.id)} />
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                Nenhum livro encontrado nesta categoria.
              </Alert>            </Grid>
          )}
        </Grid>
        
        {books.length > itemsPerPage && (
          <Stack spacing={2} sx={{ mt: 4, display: 'flex', alignItems: 'center' }}>
            <Pagination 
              count={Math.ceil(books.length / itemsPerPage)}
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
      
      <Menu
        id="book-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            bgcolor: 'secondary.dark',
            color: 'background.default',
            minWidth: '220px',
            borderRadius: '8px',
            overflow: 'hidden'
          }
        }}
        MenuListProps={{
          sx: { py: 0 }
        }}
      >
        <MenuItem 
          onClick={() => handleViewDetails(selectedBook)}
          sx={{ 
            py: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            '&:hover': { bgcolor: 'secondary.main' }
          }}
        >
          Ver Detalhes
        </MenuItem>
        
        {status !== 'read' && (
          <MenuItem 
            onClick={() => handleMoveBook('read')}
            sx={{ 
              py: 1.5,
              '&:hover': { bgcolor: 'secondary.main' }
            }}
          >
            Marcar como Lido
          </MenuItem>
        )}
          {status !== 'wantToRead' && (
          <MenuItem 
            onClick={() => handleMoveBook('wantToRead')}
            sx={{ 
              py: 1.5,
              '&:hover': { bgcolor: 'secondary.main' }
            }}
          >
            Marcar como Quero Ler
          </MenuItem>
        )}
        
        <MenuItem 
          onClick={handleRemoveBook}
          sx={{ 
            py: 1.5,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            '&:hover': { bgcolor: 'secondary.main' }
          }}
        >
          Remover da Coleção
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default BookCollection;
