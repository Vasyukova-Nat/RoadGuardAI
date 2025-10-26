import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import RoadIcon from '@mui/icons-material/DriveEta';
import PersonIcon from '@mui/icons-material/Person';
import { User } from '../../services/types';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box } from '@mui/material';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onLogin: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onLogin }) => {
  const location = useLocation();  // Хук для получения текущего пути
  const navigate = useNavigate();  // Хук для навигации
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false); 

  const isActive = (path: string): boolean => location.pathname === path; // проверка активной страницы

    const handleLogoutClick = () => {
    setLogoutDialogOpen(true); 
  };

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    onLogout(); 
  };

  const handleCancelLogout = () => {
    setLogoutDialogOpen(false); 
  };

  return (
    <>
    <AppBar position="static">
      <Toolbar>
        <Box 
          sx={{display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1}}
          onClick={() => navigate('/')} // Клик по лого ведет на /
        >
          <RoadIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div">
            RoadGuard AI
          </Typography>
        </Box>
        
        {currentUser ? (
          <>
            <Button 
              color="inherit" 
              onClick={() => navigate('/')}
              variant={isActive('/') || isActive('/dashboard') ? 'outlined' : 'text'}
            >
              Главная
            </Button>
            
            <Button 
              color="inherit" 
              onClick={() => navigate('/problems')}
              variant={isActive('/problems') ? 'outlined' : 'text'}
            >
              Список проблем
            </Button>

            <Button 
              color="inherit" 
              onClick={() => navigate('/report')}
              variant={isActive('/report') ? 'outlined' : 'text'}
            >
              Добавить проблему
            </Button>
            
            <Button 
              color="inherit" 
              onClick={() => navigate('/profile')}
              variant={isActive('/profile') ? 'outlined' : 'text'}
              startIcon={<PersonIcon />}
            >
              {currentUser.name}
            </Button>
            
            <Button 
              color="inherit" 
              onClick={handleLogoutClick}
            >
              Выйти
            </Button>
          </>
        ) : (
          <>
            <Button 
              color="inherit" 
              onClick={() => navigate('/')}
              variant={isActive('/') || isActive('/dashboard') ? 'outlined' : 'text'}
            >
              Главная
            </Button>
            
            <Button 
              color="inherit" 
              onClick={() => navigate('/problems')}
              variant={isActive('/problems') ? 'outlined' : 'text'}
            >
              Список проблем
            </Button>

            <Button 
              color="inherit" 
              onClick={() => navigate('/login')}
            >
              Войти
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>

    <Dialog
        open={logoutDialogOpen}
        onClose={handleCancelLogout}
        aria-labelledby="logout-dialog-title"
      >
        <DialogTitle id="logout-dialog-title">
          Подтверждение выхода
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            Вы действительно хотите выйти из системы?
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLogout} color="primary">
            Отмена
          </Button>
          <Button onClick={handleConfirmLogout} color="error" variant="contained" autoFocus>
            Выйти
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Header;