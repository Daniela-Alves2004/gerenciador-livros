import React from 'react';
import { AppBar, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

const Header = () => {
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
      </Toolbar>
    </AppBar>
  );
};

export default Header;