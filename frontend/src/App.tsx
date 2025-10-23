import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header/Header';
import ProblemForm from './components/ProblemForm/ProblemForm';
import ProblemList from './components/ProblemList/ProblemList';
import Dashboard from './components/Dashboard/Dashboard';
import Profile from './components/Profile/Profile'; 
import { useState, useEffect } from 'react';
import { authAPI, User } from './services/api';
import LoginForm from './components/LoginForm/LoginForm';
import RegisterForm from './components/RegisterForm/RegisterForm';
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        setCurrentUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const handleLogin = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    localStorage.setItem('token', response.data.access_token);
    const userResponse = await authAPI.getMe();
    setCurrentUser(userResponse.data);
    setAuthMode(null);
  };

  const handleRegister = async (email: string, name: string, password: string) => {
    await authAPI.register({ email, name, password });
    await handleLogin(email, password);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!currentUser && authMode === 'login') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginForm 
          onSwitchToRegister={() => setAuthMode('register')}
          onLogin={handleLogin}
        />
      </ThemeProvider>
    );
  }

  if (!currentUser && authMode === 'register') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RegisterForm 
          onSwitchToLogin={() => setAuthMode('login')}
          onRegister={handleRegister}
        />
      </ThemeProvider>
    );
  }

  if (!currentUser) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginForm 
          onSwitchToRegister={() => setAuthMode('register')}
          onLogin={handleLogin}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Header 
            currentUser={currentUser} 
            onLogout={handleLogout}
            onLogin={() => setAuthMode('login')}
          />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/report" element={<ProblemForm />} />
              <Route path="/problems" element={<ProblemList />} />
              <Route path="/profile" element={<Profile currentUser={currentUser} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;