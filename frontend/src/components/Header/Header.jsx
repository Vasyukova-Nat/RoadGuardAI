import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
// import RoadIcon from '@mui/icons-material/Road';

function Header({ currentPage, setCurrentPage }) {
  return (
    <AppBar position="static">
      <Toolbar>
        {/* <RoadIcon sx={{ mr: 2 }} /> */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          RoadGuard AI
        </Typography>
        
        <Button 
          color="inherit" 
          onClick={() => setCurrentPage('dashboard')}
          variant={currentPage === 'dashboard' ? 'outlined' : 'text'}
        >
          Главная
        </Button>
        
        <Button 
          color="inherit" 
          onClick={() => setCurrentPage('form')}
          variant={currentPage === 'form' ? 'outlined' : 'text'}
        >
          Добавить проблему
        </Button>
        
        <Button 
          color="inherit" 
          onClick={() => setCurrentPage('list')}
          variant={currentPage === 'list' ? 'outlined' : 'text'}
        >
          Список проблем
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Header;