import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import BookSearch from './BookSearch';
import BookDetail from './BookDetail';
import Login from './Login';
import theme from '../contexts/theme';
import Header from './Header';
import { BookProvider, useBookContext } from '../contexts/BookContext';
import { Alert, Snackbar } from '@mui/material';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('search');
  const { state } = useBookContext();
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });

  useEffect(() => {
    if (!state.isAuthenticated && activeTab === 'login') {
      setNotification({
        open: true,
        message: 'Faça login para acessar esta página',
        type: 'warning'
      });
    }
  }, [activeTab, state.isAuthenticated]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>  
      <Header activeTab={activeTab} onTabChange={handleTabChange} />
      <Container component="main" sx={{ mt: 3, mb: 3, flex: 1 }}>
        {activeTab === 'search' && <BookSearch />}
        {activeTab === 'login' && !state.isAuthenticated && <Login />}
      </Container>
      
      <BookDetail />
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BookProvider>
        <AppContent />
      </BookProvider>
    </ThemeProvider>
  );
};

export default App;