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
import { problemsAPI, Problem, ProblemType, ProblemStatus, User } from '../../services/types';

interface ProblemListProps {
  currentUser: User | null;
}

function ProblemList({ currentUser }: ProblemListProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProblems();
  }, []);

  const canDeleteProblem = currentUser?.role === 'admin'; // Только админ может удалять проблемы
  const canChangeStatus = currentUser?.role === 'admin' || currentUser?.role === 'contractor'; // Менять статус могут подрядчики и админы

  const isFromInspector = (problem: Problem) => {
    return problem.is_from_inspector;
  };

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
      case 'closed': return 'Закрыта';
      default: return status;
    }
  };

  const handleStatusChange = async (problemId: number, newStatus: ProblemStatus) => {
    try {
      await problemsAPI.updateProblemStatus(problemId, newStatus);
      await loadProblems(); 
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка при изменении статуса');
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
                <TableCell><strong>От инспектора?</strong></TableCell>
                <TableCell><strong>Тип</strong></TableCell>
                <TableCell><strong>Адрес</strong></TableCell>
                {currentUser?.role === 'admin' && <TableCell><strong>ID отправителя</strong></TableCell>}
                <TableCell><strong>Описание</strong></TableCell>
                <TableCell><strong>Статус</strong></TableCell>
                <TableCell><strong>Дата создания</strong></TableCell>
                {canChangeStatus && <TableCell><strong>Действие</strong></TableCell>}
                {canDeleteProblem && <TableCell><strong>Удалить</strong></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {problems.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell>#{problem.id}</TableCell>
                  <TableCell>
                    {isFromInspector(problem) ? (
                      <Chip 
                        label="+" 
                        color="success" 
                        size="small" 
                      />
                    ) : (
                      <Chip 
                        label="-" 
                        color="default" 
                        size="small" 
                      />
                    )}
                  </TableCell>
                  <TableCell>{getTypeText(problem.type)}</TableCell>
                  <TableCell>{problem.address}</TableCell>
                  {currentUser?.role === 'admin' && (
                    <TableCell>{problem.reporter_id}</TableCell>
                  )}
                  <TableCell>{problem.description || '-'}</TableCell>
                  <TableCell> 
                    <Chip 
                      label={getStatusText(problem.status)}  
                      color={getStatusColor(problem.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(problem.created_at)}</TableCell>

                  {/* Изменение статуса для подрядчиков и админов */}
                  {canChangeStatus && (
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {/* Для новых проблем - можно взять в работу либо закрыть */}
                        {problem.status === 'new' && (
                          <>
                            <Button 
                              color="warning" 
                              size="small"
                              variant="outlined"
                              onClick={() => handleStatusChange(problem.id, 'in_progress')}
                            >
                              В работу
                            </Button>
                            <Button 
                                color="primary" 
                                size="small"
                                variant="outlined"
                                onClick={() => handleStatusChange(problem.id, 'closed')}
                              >
                                Закрыть
                            </Button>
                          </>
                        )}
                        
                        {/* Для проблем в работе - можно закрыть, отметить решенной или вернуть в новые */}
                        {problem.status === 'in_progress' && (
                          <>
                            <Button 
                              color="success" 
                              size="small"
                              variant="outlined"
                              onClick={() => handleStatusChange(problem.id, 'resolved')}
                            >
                              Решена
                            </Button>
                            <Button 
                              color="primary" 
                              size="small"
                              variant="outlined"
                              onClick={() => handleStatusChange(problem.id, 'closed')}
                            >
                              Закрыть
                            </Button>
                            <Button 
                              color="secondary" 
                              size="small"
                              variant="outlined"
                              onClick={() => handleStatusChange(problem.id, 'new')}
                            >
                              Вернуть в новые
                            </Button>
                          </>
                        )}
                        
                        {/* Для решенных проблем - можно закрыть или вернуть в работу */}
                        {problem.status === 'resolved' && (
                          <>
                            <Button 
                              color="primary" 
                              size="small"
                              variant="outlined"
                              onClick={() => handleStatusChange(problem.id, 'closed')}
                            >
                              Закрыть
                            </Button>
                            <Button 
                              color="warning" 
                              size="small"
                              variant="outlined"
                              onClick={() => handleStatusChange(problem.id, 'in_progress')}
                            >
                              Вернуть в работу
                            </Button>
                          </>
                        )}
                        
                        {/* Для закрытых проблем - можно вернуть в работу */}
                        {problem.status === 'closed' && (
                          <Button 
                            color="warning" 
                            size="small"
                            variant="outlined"
                            onClick={() => handleStatusChange(problem.id, 'in_progress')}
                          >
                            Вернуть в работу
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  )}

                  {/* Для админов */}
                  {canDeleteProblem && (
                    <TableCell>
                      <Button 
                        color="error" 
                        size="small"
                        onClick={() => handleDelete(problem.id)}
                      >
                        Удалить
                      </Button>
                    </TableCell>
                  )}
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