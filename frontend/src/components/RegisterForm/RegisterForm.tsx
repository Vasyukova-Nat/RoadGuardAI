import React, { useState } from 'react';
import { Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem} from '@mui/material';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegister: (email: string, name: string, password: string, role: string) => Promise<void>;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onRegister }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (password.length < 5) {
      setError('Пароль должен быть не менее 5 символов');
      setLoading(false);
      return;
  }
    
  try {
    await onRegister(email, name, password, role);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Ошибка регистрации. Попробуйте другой email или проверьте данные.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 400, margin: '0 auto' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom align="center">
          Регистрация
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Роль</InputLabel>
            <Select
              value={role}
              label="Роль"
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="citizen">Гражданин</MenuItem>
              <MenuItem value="inspector">Дорожный инспектор</MenuItem>
              <MenuItem value="contractor">Подрядчик</MenuItem>
              <MenuItem value="admin">Администратор</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Пароль (минимум 5 символов)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </form>
        
        <Button
          fullWidth
          sx={{ mt: 2 }}
          onClick={onSwitchToLogin}
        >
          Уже есть аккаунт? Войти
        </Button>
      </Paper>
    </Box>
  );
};

export default RegisterForm;