import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header/Header';
import ProblemForm from './components/ProblemForm/ProblemForm';
import ProblemList from './components/ProblemList/ProblemList';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router> 
        <div className="App">
          <Header />
          <main>
            <Routes>  
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/report" element={<ProblemForm />} />
              <Route path="/problems" element={<ProblemList />} />
              <Route path="*" element={<Navigate to="/" replace />} /> {/* Перенаправление на главную если маршрут не найден */}
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;