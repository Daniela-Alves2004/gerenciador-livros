import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Container,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useBookContext } from '../contexts/BookContext';
import { loginUser, registerUser } from '../contexts/requestApi';
import { ActionTypes } from '../contexts/BookContext';

const Login = () => {
  const { state, dispatch } = useBookContext();
  const [isLogin, setIsLogin] = useState(true);  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => {
    return email.includes('@');
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError('Email inválido. Deve conter @');
    } else {
      setEmailError('');
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    if (!value && !isLogin) {
      setNameError('Nome é obrigatório');
    } else {
      setNameError('');
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (!value) {
      setPasswordError('Senha é obrigatória');
    } else {
      setPasswordError('');
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    setNameError('');
    
    // Validações dos campos
    let hasError = false;

    if (!email) {
      setEmailError('Email é obrigatório');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Email inválido. Deve conter @');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Senha é obrigatória');
      hasError = true;
    }

    if (!isLogin && !name) {
      setNameError('Nome é obrigatório');
      hasError = true;
    }

    if (hasError) return;

    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (isLogin) {
        const userData = await loginUser(email, password);
        dispatch({ type: ActionTypes.SET_USER, payload: userData });
      } else {
        const userData = await registerUser(name, email, password);
        dispatch({ type: ActionTypes.SET_USER, payload: userData });
      }
      
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });    } catch (error) {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      
      // Tratamento de erros mais detalhado baseado na resposta da API
      const errorMessage = error.message || 'Ocorreu um erro. Por favor, tente novamente.';
      
      // Verificar se o erro está relacionado a um campo específico
      if (errorMessage.toLowerCase().includes('email')) {
        setEmailError(errorMessage);
      } else if (errorMessage.toLowerCase().includes('senha') || errorMessage.toLowerCase().includes('password')) {
        setPasswordError(errorMessage);
      } else if (!isLogin && errorMessage.toLowerCase().includes('nome')) {
        setNameError(errorMessage);
      } else {
        setError(errorMessage);
      }
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmailError('');
    setPasswordError('');
    setNameError('');
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ 
        p: 4, 
        mt: 4, 
        bgcolor: 'background.paper', 
        borderRadius: 2 
      }}>
        <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          {isLogin ? 'Entrar' : 'Criar Conta'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>          {!isLogin && (            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Nome Completo"
              name="name"
              autoComplete="name"
              value={name}
              onChange={handleNameChange}
              error={!!nameError}
              helperText={nameError}
              autoFocus={!isLogin}
              variant="outlined"              
              sx={{ 
                mb: nameError ? 0 : 2,
                '& .MuiInputLabel-root': { color: nameError ? 'error.main' : 'secondary.main' },
                '& .MuiInputBase-input': { color: 'secondary.main' },
                '& .MuiOutlinedInput-root': { 
                  '& fieldset': { borderColor: nameError ? 'error.main' : 'secondary.main' },
                  '&:hover fieldset': { borderColor: nameError ? 'error.main' : 'secondary.main' },
                  '&.Mui-focused fieldset': { borderColor: nameError ? 'error.main' : 'secondary.main' }
                }
              }}
              InputLabelProps={{
                style: { color: nameError ? '#f44336' : '#76366e' }
              }}
              placeholder="Digite seu nome completo"
            />
          )}
            <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={handleEmailChange}
            error={!!emailError}
            helperText={emailError}
            autoFocus={isLogin}
            variant="outlined"            
            sx={{ 
              mb: emailError ? 0 : 2,
              '& .MuiInputLabel-root': { color: emailError ? 'error.main' : 'secondary.main' },
              '& .MuiInputBase-input': { color: 'secondary.main' },
              '& .MuiOutlinedInput-root': { 
                '& fieldset': { borderColor: emailError ? 'error.main' : 'secondary.main' },
                '&:hover fieldset': { borderColor: emailError ? 'error.main' : 'secondary.main' },
                '&.Mui-focused fieldset': { borderColor: emailError ? 'error.main' : 'secondary.main' }
              }
            }}
            InputLabelProps={{
              style: { color: emailError ? '#f44336' : '#76366e' }
            }}
            placeholder="exemplo@email.com"
          />
            <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={password}
            onChange={handlePasswordChange}
            error={!!passwordError}
            helperText={passwordError}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            variant="outlined"            
            sx={{ 
              mb: passwordError ? 0 : 2,
              '& .MuiInputLabel-root': { color: passwordError ? 'error.main' : 'secondary.main' },
              '& .MuiInputBase-input': { color: 'secondary.main' },
              '& .MuiOutlinedInput-root': { 
                '& fieldset': { borderColor: passwordError ? 'error.main' : 'secondary.main' },
                '&:hover fieldset': { borderColor: passwordError ? 'error.main' : 'secondary.main' },
                '&.Mui-focused fieldset': { borderColor: passwordError ? 'error.main' : 'secondary.main' }
              }
            }}
            InputLabelProps={{
              style: { color: passwordError ? '#f44336' : '#76366e' }
            }}
            placeholder="Digite sua senha"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ 
              mt: 2, 
              mb: 2,
              py: 1.5
            }}
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button 
              onClick={switchMode} 
              color="primary"
              sx={{ textTransform: 'none' }}
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entrar'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
