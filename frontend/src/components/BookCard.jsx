import React from 'react';
import {
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Typography,
    Button,
    Box
} from '@mui/material';

import InfoIcon from '@mui/icons-material/Info';
import { useBookContext } from '../contexts/BookContext';
import { ActionTypes } from '../contexts/BookContext';

const BookCard = ({ book = true }) => {
    const { state, dispatch } = useBookContext();
    const handleShowDetails = () => {
        dispatch({
            type: ActionTypes.SELECT_BOOK,
            payload: book
        });
    };
    const truncate = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
    return (
        <Card sx={{
            height: 380, 
            width: 250,
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s',
            bgcolor: 'primary.main',
            color: 'background.default',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }
        }}>
            <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', bgcolor: 'background.paper' }}>
                <CardMedia
                    component="img"
                    height="200"
                    image={book.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover'}
                    alt={`Capa do livro ${book.title}`}
                    sx={{ objectFit: 'contain', pt: 2, maxWidth: '100%' }}
                />
            </Box>
            <CardContent sx={{ flexGrow: 1, height: 120, overflow: 'hidden' }}>
                <Typography gutterBottom variant="h6" component="div" sx={{ 
                    fontWeight: 'bold', 
                    lineHeight: 1.2, 
                    color: 'background.default',
                    height: '2.4em',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                }}>
                    {truncate(book.title, 50)}
                </Typography>
                <Typography variant="body2" sx={{ 
                    color: 'background.default', 
                    opacity: 0.8,
                    height: '1.5em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }} gutterBottom>
                    {book.authors ? book.authors.join(', ') : 'Autor desconhecido'}
                </Typography>
                {book.publishedDate && (
                    <Typography variant="body2" sx={{ color: 'background.default', opacity: 0.8 }}>
                        {book.publishedDate.substring(0, 4)}
                    </Typography>
                )}
            </CardContent>

            <CardActions sx={{ justifyContent: 'center', px: 2, pb: 2, mt: 'auto' }}>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<InfoIcon />}
                    onClick={handleShowDetails}
                    disabled={state.isLoading}
                    sx={{
                        color: 'primary.main',
                        bgcolor: 'background.default',
                        '&:hover': {
                            bgcolor: 'text.primary',
                            color: 'background.default'
                        }
                    }}
                >
                    Ver detalhes
                </Button>
            </CardActions>
        </Card>
    );
};

export default BookCard;