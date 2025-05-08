import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogActions,
  Typography,
  Button,
  Divider,
  Box,
  Grid,
  Chip,
  Rating,
  IconButton,
  CircularProgress,
  Link
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useBookContext } from '../contexts/BookContext';
import { getBookDetails } from '../services/requestApi';
import { ActionTypes } from '../contexts/BookContext';


const BookDetail = () => {
  const { state, dispatch } = useBookContext();
  const [loading, setLoading] = useState(false);
  const [bookDetails, setBookDetails] = useState(null);
  const { selectedBook } = state;
  
  useEffect(() => {
    const fetchDetails = async () => {
      if (selectedBook) {
        setLoading(true);
        try {
          const details = await getBookDetails(selectedBook.id);
          setBookDetails(details);
        } catch (error) {
          console.error('Erro ao buscar detalhes do livro:', error);
          setBookDetails(selectedBook);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDetails();
  }, [selectedBook]);

  const handleClose = () => {
    dispatch({ type: ActionTypes.CLEAR_SELECTED_BOOK });
    setBookDetails(null);
  };
  

  const formatPublishedDate = (date) => {
    if (!date) return 'Data desconhecida';
    
    if (date.length === 4) return date;
    
    try {
      const [year, month, day] = date.split('-');
      return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
    } catch (error) {
      return date;
    }
  };
  
 

  if (!selectedBook) {
    return null;
  }

  const book = bookDetails || selectedBook;

  return (
    <Dialog
      open={!!selectedBook}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby="book-detail-title"
    >
      <DialogTitle id="book-detail-title" sx={{ m: 0, p: 2 }}>
        <Typography variant="h5" component="div" sx={{ pr: 6, color: "#09060d" }}>
          {book.title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: "#09060d",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4} md={3}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'flex-start'
                }}
              >
                <img
                  src={book.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover'}
                  alt={`Capa de ${book.title}`}
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto', 
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    borderRadius: 4 
                  }}
                />
              </Box>
              
              {book.averageRating > 0 && (
                <Box 
                  sx={{ 
                    mt: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}
                >
                  <Rating
                    value={book.averageRating}
                    precision={0.5}
                    readOnly
                    size="small"
                  />
                  <Typography variant="body2" sx={{ mt: 0.5, color: "#09060d" }}>
                    {book.averageRating} ({book.ratingsCount} avaliações)
                  </Typography>
                </Box>
              )}
              
             
              
              {book.previewLink && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<OpenInNewIcon />}
                    component={Link}
                    href={book.previewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      bgcolor: "secondary.main",
                      color: "background.default",
                      '&:hover': {
                        bgcolor: "secondary.dark",
                      },
                    }}

                  >
                    Ver no Google Books
                  </Button>
                </Box>
              )}
            </Grid>
            
        
            <Grid item xs={12} sm={8} md={9}>
              <Typography variant="h6" gutterBottom sx={{ color: "#09060d" }}>
                {book.authors ? book.authors.join(', ') : 'Autor Desconhecido'}
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {book.publisher && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', color: "#09060d" }}>
                      <strong>Editora:&nbsp;</strong> {book.publisher}
                    </Typography>
                  </Grid>
                )}
                
                {book.publishedDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', color: "#09060d" }}>
                      <strong>Publicado em:&nbsp;</strong> {formatPublishedDate(book.publishedDate)}
                    </Typography>
                  </Grid>
                )}
                
                {book.pageCount > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', color: "#09060d" }}>
                      <strong>Páginas:&nbsp;</strong> {book.pageCount}
                    </Typography>
                  </Grid>
                )}
                
                {book.language && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', color: "#09060d" }}>
                      <strong>Idioma:&nbsp;</strong> {book.language.toUpperCase()}
                    </Typography>
                  </Grid>
                )}
                
                {book.industryIdentifiers && book.industryIdentifiers.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', color: "#09060d" }}>
                      <strong>ISBN:&nbsp;</strong> 
                      {book.industryIdentifiers
                        .filter(id => id.type.includes('ISBN'))
                        .map(id => id.identifier)
                        .join(', ')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              {book.categories && book.categories.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: "#09060d" }}>
                    Categorias:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {book.categories.map((category, index) => (
                      <Chip 
                        key={index} 
                        label={category} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5,  color: "background.default", borderColor: "secondary.main" }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom sx={{ color: "#09060d" }}>
                Descrição:
              </Typography>
              <Typography 
                variant="body2" 
                component="div"
                dangerouslySetInnerHTML={{ __html: book.description || 'Sem descrição disponível.' }} 
                sx={{ 
                  lineHeight: 1.6, 
                  '& a': { color: 'primary.main' },
                  color: "#09060d"
                }}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{bgcolor: "secondary.main", color: "background.default"}} >Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookDetail;