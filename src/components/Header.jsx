import React from 'react';
import { AppBar, Toolbar, Typography, Tabs, Tab, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

const Header = ({ activeTab, onTabChange }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar 
      position="static" 
      sx={{ 
        bgcolor: 'primary.main', 
        color: 'background.default' 
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <AutoStoriesIcon sx={{ mr: 1 }} />
          {!isSmallScreen && 'Meu Acervo'}
        </Typography>
        <Tabs 
          value={activeTab} 
          onChange={onTabChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant={isSmallScreen ? "fullWidth" : "standard"}
          aria-label="navigation tabs"
        >
          <Tab 
            icon={<SearchIcon />} 
            iconPosition={isSmallScreen ? "top" : "start"}
            label={isSmallScreen ? "Buscar" : "Buscar Livros"} 
            value="search" 
          />
          <Tab 
            icon={<AutoStoriesIcon />} 
            iconPosition={isSmallScreen ? "top" : "start"}
            label={isSmallScreen ? "Lidos" : "Livros Lidos"} 
            value="read" 
          />
          <Tab 
            icon={<BookmarkAddIcon />} 
            iconPosition={isSmallScreen ? "top" : "start"}
            label={isSmallScreen ? "Quero Ler" : "Quero Ler"} 
            value="wantToRead" 
          />
          <Tab 
            icon={<BookmarkBorderIcon />} 
            iconPosition={isSmallScreen ? "top" : "start"}
            label={isSmallScreen ? "Interesse" : "Tenho Interesse"} 
            value="interested" 
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

export default Header;