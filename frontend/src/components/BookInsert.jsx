import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography,
  Paper,
  Grid,
  Alert,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useBookContext } from '../contexts/BookContext';
import { addBook } from '../contexts/requestApi';
import { ActionTypes } from '../contexts/BookContext';

const BookInsert = () => {
  const { state, dispatch } = useBookContext();  const initialFormState = {
    title: '',
    author: '',
    description: '',
    publishedDate: '',
    isbn: '',
    pageCount: '',
    categories: '',
    coverUrl: '',
    language: '',
    status: 'wantToRead' 
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.title || !formData.author) {
      setError('Título e autor são obrigatórios.');
      return;
    }
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const bookData = {
        ...formData,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : 0,
        authors: [formData.author], 
        userId: state.user?.id
      };
      
      const result = await addBook(bookData);
      
      dispatch({ 
        type: ActionTypes.ADD_BOOK_TO_COLLECTION, 
        payload: {
          book: result,
          status: formData.status
        }
      });
      
      setSuccess('Livro adicionado com sucesso!');
      setFormData(initialFormState);
      
    } catch (error) {
      setError(error.message || 'Erro ao adicionar o livro. Por favor, tente novamente.');
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };
  
  const handleClear = () => {
    setFormData(initialFormState);
    setError('');
    setSuccess('');
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
          Adicionar Livro à Coleção
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          Adicione manualmente um livro à sua coleção pessoal
        </Typography>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Título"
                name="title"
                value={formData.title}
                onChange={handleChange}
                margin="normal"
                variant="outlined"                placeholder="Digite o título do livro"
                sx={{ 
                  '& .MuiInputLabel-root': { color: 'secondary.main' },
                  '& .MuiInputBase-input': { color: 'secondary.main' },
                  '& .MuiOutlinedInput-root': { 
                    '& fieldset': { borderColor: 'secondary.main' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                  }
                }}
                InputLabelProps={{
                  style: { color: '#76366e' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Autor"
                name="author"
                value={formData.author}
                onChange={handleChange}
                margin="normal"
                variant="outlined"                placeholder="Digite o nome do autor"
                sx={{ 
                  '& .MuiInputLabel-root': { color: 'secondary.main' },
                  '& .MuiInputBase-input': { color: 'secondary.main' },
                  '& .MuiOutlinedInput-root': { 
                    '& fieldset': { borderColor: 'secondary.main' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                  }
                }}
                InputLabelProps={{
                  style: { color: '#76366e' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>              <TextField
                fullWidth
                label="ISBN"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                placeholder="Ex: 9780123456789"
                sx={{ 
                  '& .MuiInputLabel-root': { color: 'secondary.main' },
                  '& .MuiInputBase-input': { color: 'secondary.main' },
                  '& .MuiOutlinedInput-root': { 
                    '& fieldset': { borderColor: 'secondary.main' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                  }
                }}
                InputLabelProps={{
                  style: { color: '#76366e' },
                  shrink: true
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>              <TextField
                fullWidth
                label="Data de Publicação"
                name="publishedDate"
                type="date"
                value={formData.publishedDate}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={{ 
                  '& .MuiInputLabel-root': { color: 'secondary.main' },
                  '& .MuiInputBase-input': { color: 'secondary.main' },
                  '& .MuiOutlinedInput-root': { 
                    '& fieldset': { borderColor: 'secondary.main' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                  }
                }}
                InputLabelProps={{
                  style: { color: '#76366e' },
                  shrink: true
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>              <TextField
                fullWidth
                label="Número de Páginas"
                name="pageCount"
                type="number"
                value={formData.pageCount}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={{ 
                  '& .MuiInputLabel-root': { color: 'secondary.main' },
                  '& .MuiInputBase-input': { color: 'secondary.main' },
                  '& .MuiOutlinedInput-root': { 
                    '& fieldset': { borderColor: 'secondary.main' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                  }
                }}
                InputProps={{ 
                  inputProps: { min: 0 },
                  sx: { color: 'secondary.main' }
                }}
                InputLabelProps={{
                  style: { color: '#76366e' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>              <TextField
                fullWidth
                label="Categorias"
                name="categories"
                value={formData.categories}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                placeholder="Ex: Ficção, Fantasia"
                sx={{ 
                  '& .MuiInputLabel-root': { color: 'secondary.main' },
                  '& .MuiInputBase-input': { color: 'secondary.main' },
                  '& .MuiOutlinedInput-root': { 
                    '& fieldset': { borderColor: 'secondary.main' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                  }
                }}
                InputLabelProps={{
                  style: { color: '#76366e' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>              <TextField
                fullWidth
                label="Idioma"
                name="language"
                value={formData.language}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                placeholder="Ex: Português, Inglês"
                sx={{ 
                  '& .MuiInputLabel-root': { color: 'secondary.main' },
                  '& .MuiInputBase-input': { color: 'secondary.main' },
                  '& .MuiOutlinedInput-root': { 
                    '& fieldset': { borderColor: 'secondary.main' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                  }
                }}
                InputLabelProps={{
                  style: { color: '#76366e' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                sx={{ 
                  '& .MuiInputLabel-root': { color: 'secondary.main' },
                  '& .MuiInputBase-input': { color: 'secondary.main' },
                  '& .MuiOutlinedInput-root': { 
                    '& fieldset': { borderColor: 'secondary.main' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                  },
                  '& .MuiSelect-select': { color: 'secondary.main' }
                }}
                InputLabelProps={{
                  style: { color: '#76366e' }
                }}
              >                <MenuItem value="read">Lido</MenuItem>
                <MenuItem value="wantToRead">Quero Ler</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>              <TextField
                fullWidth
                label="URL da Capa"
                name="coverUrl"
                value={formData.coverUrl}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                placeholder="https://exemplo.com/imagem.jpg"
                sx={{ 
                  '& .MuiInputLabel-root': { color: 'secondary.main' },
                  '& .MuiInputBase-input': { color: 'secondary.main' },
                  '& .MuiOutlinedInput-root': { 
                    '& fieldset': { borderColor: 'secondary.main' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                  }
                }}
                InputLabelProps={{
                  style: { color: '#76366e' }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>              <TextField
                fullWidth
                label="Descrição"
                name="description"
                value={formData.description}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                multiline
                rows={4}
                sx={{ 
                  '& .MuiInputLabel-root': { color: 'secondary.main' },
                  '& .MuiInputBase-input': { color: 'secondary.main' },
                  '& .MuiOutlinedInput-root': { 
                    '& fieldset': { borderColor: 'secondary.main' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                  }
                }}
                InputLabelProps={{
                  style: { color: '#76366e' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleClear}
                startIcon={<ClearIcon />}
              >
                Limpar
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                disabled={state.isLoading}
              >
                {state.isLoading ? 'Adicionando...' : 'Adicionar Livro'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default BookInsert;
