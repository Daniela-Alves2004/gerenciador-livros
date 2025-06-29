import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  useMediaQuery, 
  Button, 
  Box,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SearchIcon from '@mui/icons-material/Search';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useBookContext } from '../contexts/BookContext';
import { ActionTypes } from '../contexts/BookContext';
import { logoutUser } from '../contexts/requestApi';

const Header = ({ activeTab, onTabChange }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { state, dispatch } = useBookContext();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logoutUser();
    dispatch({ type: ActionTypes.LOGOUT });
  };

  const handleLogin = () => {
    onTabChange(null, 'login');
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        bgcolor: 'primary.main', 
        color: 'background.default' 
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant={isSmallScreen ? "h6" : "h5"} 
            component="div" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mr: 3,
              fontWeight: 'bold'
            }}
          >
            <AutoStoriesIcon sx={{ mr: 1 }} />
            {!isSmallScreen && 'Meu Acervo'}
          </Typography>

          {!isSmallScreen && (
            <Tabs 
              value={activeTab} 
              onChange={onTabChange}
              textColor="inherit"
              indicatorColor="secondary"
            >
              <Tab 
                label="Buscar" 
                icon={<SearchIcon />} 
                iconPosition="start"
                value="search" 
              />
              {state.isAuthenticated && (
                <>
                  <Tab 
                    label="Lidos" 
                    value="read" 
                  />
                  <Tab 
                    label="Quero Ler" 
                    value="wantToRead" 
                  />
                </>
              )}
            </Tabs>
          )}
        </Box>

        <Box>
          {state.isAuthenticated ? (
            <>
              <IconButton
                onClick={handleUserMenuOpen}
                color="inherit"
                aria-label="Perfil do usuário"
              >
                {state.user?.avatar ? (
                  <Avatar 
                    alt={state.user?.name} 
                    src={state.user?.avatar}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <AccountCircleIcon />
                )}
              </IconButton>              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    minWidth: '180px',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }
                }}
              ><MenuItem disabled sx={{ bgcolor: 'primary.main', py: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'secondary.dark' }}>
                    {state.user?.name}
                  </Typography>
                </MenuItem>
                <MenuItem 
                  onClick={handleLogout}
                  sx={{ 
                    bgcolor: 'secondary.dark', 
                    color: 'background.default',
                    '&:hover': {
                      bgcolor: 'secondary.main',
                      opacity: 0.9
                    }
                  }}
                >
                  <LogoutIcon sx={{ mr: 1 }} />
                  Sair
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button 
              color="inherit"
              startIcon={<LoginIcon />}
              onClick={handleLogin}
            >
              {isSmallScreen ? '' : 'Entrar'}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;