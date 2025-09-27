import { useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import RoadIcon from '@mui/icons-material/DriveEta';

function Header() {
  const location = useLocation();  // Хук для получения текущего пути
  const navigate = useNavigate();  // Хук для навигации

  const isActive = (path) => location.pathname === path; // проверка активной страницы

  return (
    <AppBar position="static">
      <Toolbar>
        <RoadIcon sx={{ mr: 2 }} />
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }}
        onClick={() => navigate('/')}  // Клик по лого ведет на /
        >
          RoadGuard AI
        </Typography>

        <Button 
          color="inherit" 
          onClick={() => navigate('/')}
          variant={isActive('/') || isActive('/dashboard') ? 'outlined' : 'text'}
        >
          Главная
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
          onClick={() => navigate('/problems')}
          variant={isActive('/problems') ? 'outlined' : 'text'}
        >
          Список проблем
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Header;