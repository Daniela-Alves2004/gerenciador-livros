import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import theme from '../styles/theme';
import Header from './Header';

const App = () => {
  const [activeTab, setActiveTab] = useState('search');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>  
        <Header activeTab={activeTab} onTabChange={handleTabChange} />
        <Container component="main" sx={{ mt: 3, mb: 3, flex: 1 }}>
          {activeTab === 'search' && <div>container de busca</div>}
          {activeTab === 'read' && <div>container de lidos</div>}
          {activeTab === 'wantToRead' && <div>container de quero ler</div>}
          {activeTab === 'interested' && <div>container de tenho interresse</div>}
        </Container>
        <div>detalhes</div>
      </Box>
    </ThemeProvider>
  );
};

export default App;