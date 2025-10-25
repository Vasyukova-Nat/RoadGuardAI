import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { problemsAPI, Problem, ProblemType, ProblemStatus } from '../../services/types';

function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await problemsAPI.getProblems();
      setProblems(response.data);
      setError(null);
    } catch (error) {
      console.error('Error loading problems:', error);
      setError('Ошибка при загрузке проблем');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Удалить эту проблему?')) return;
    
    try {
      await problemsAPI.deleteProblem(id);
      setProblems(problems.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting problem:', error);
      alert('Ошибка при удалении проблемы');
    }
  };

  const getStatusColor = (status: ProblemStatus) => { 
    switch (status) {
      case 'new': return 'error';      
      case 'in_progress': return 'warning'; 
      case 'resolved': return 'success'; 
      default: return 'default';
    }
  };

  const getStatusText = (status: ProblemStatus) => { 
    switch (status) {
      case 'new': return 'Новая';
      case 'in_progress': return 'В работе';
      case 'resolved': return 'Решена';
      default: return status;
    }
  };

    const getTypeText = (type: ProblemType) => {
      switch (type) {
        case 'pothole': return 'Яма';
        case 'crack': return 'Трещина';
        case 'manhole': return 'Люк';
        case 'other': return 'Другое';
        default: return type;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Загрузка проблем...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadProblems}>
          Попробовать снова
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Список дорожных проблем
      </Typography>
      
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Тип</strong></TableCell>
                <TableCell><strong>Адрес</strong></TableCell>
                <TableCell><strong>Описание</strong></TableCell>
                <TableCell><strong>Статус</strong></TableCell>
                <TableCell><strong>Дата создания</strong></TableCell>
                <TableCell><strong>Действие</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {problems.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell>#{problem.id}</TableCell>
                  <TableCell>{getTypeText(problem.type)}</TableCell>
                  <TableCell>{problem.address}</TableCell>
                  <TableCell>{problem.description || '-'}</TableCell>
                  <TableCell> 
                    <Chip 
                      label={getStatusText(problem.status)}  
                      color={getStatusColor(problem.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(problem.created_at)}</TableCell>
                  <TableCell>
                    <Button 
                      color="error" 
                      size="small"
                      onClick={() => handleDelete(problem.id)}
                    >
                      Удалить
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Всего проблем: {problems.length}
        </Typography>
      </Box>
    </Box>
  );
}

export default ProblemList;