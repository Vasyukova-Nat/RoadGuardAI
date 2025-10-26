import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header/Header';
import ProblemForm from './components/ProblemForm/ProblemForm';
import ProblemList from './components/ProblemList/ProblemList';
import Dashboard from './components/Dashboard/Dashboard';
import Profile from './components/Profile/Profile'; 
import { authAPI, User } from './services/types';
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

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AuthRedirect: React.FC<{ user: User | null }> = ({ user }) => { // редирект авторизованных пользователей
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return null;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
  };

  const handleRegister = async (email: string, name: string, password: string, role: string) => {
    await authAPI.register({ email, name, password, role });
    await handleLogin(email, password);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Header 
            currentUser={currentUser} 
            onLogout={handleLogout}
            onLogin={() => window.location.href = '/login'}
          />
          <main>
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/problems" element={<ProblemList currentUser={currentUser} />} />
              
              {/* Маршруты аутентификации */}
              <Route 
                path="/login" 
                element={
                  <>
                    <AuthRedirect user={currentUser} />
                    {!currentUser && (
                      <LoginForm 
                        onSwitchToRegister={() => window.location.href = '/register'}
                        onLogin={handleLogin}
                      />
                    )}
                  </>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <>
                    <AuthRedirect user={currentUser} />
                    {!currentUser && (
                      <RegisterForm 
                        onSwitchToLogin={() => window.location.href = '/login'}
                        onRegister={handleRegister}
                      />
                    )}
                  </>
                } 
              />
              
              {/* Защищенные маршруты */}
              <Route 
                path="/report" 
                element={
                  <ProtectedRoute user={currentUser}>
                    <ProblemForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute user={currentUser}>
                    <Profile currentUser={currentUser} />
                  </ProtectedRoute>
                } 
              />
              
              {/* Резервный маршрут */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;