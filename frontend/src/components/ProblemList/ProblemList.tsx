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
  Alert,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton
} from '@mui/material';
import { problemsAPI, Problem, ProblemType, ProblemStatus } from '../../services/types';
import { useAuthStore } from '../../store/authStore';
import ProblemFilters, { FilterParams } from './ProblemFilters';
import { useSearchParams } from 'react-router-dom';
import { Pagination, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Dialog, DialogContent } from '@mui/material';
import ProblemForm from '../ProblemForm/ProblemForm';

function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useAuthStore((state) => state.currentUser);

  const [searchParams, setSearchParams] = useSearchParams();
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Инициализация фильтров из URL
  const [filters, setFilters] = useState<FilterParams>({
    status: searchParams.get('status') || 'all',
    type: searchParams.get('type') || 'all',
    is_from_inspector: searchParams.get('inspector') === 'true' ? true : 
                      searchParams.get('inspector') === 'false' ? false : null,
    search: searchParams.get('search') || '',
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 10
  });

  // Сохраняем фильтры в URL при изменении
  useEffect(() => {
    const params: Record<string, string> = {};
    
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.type !== 'all') params.type = filters.type;
    if (filters.is_from_inspector !== null) {
      params.inspector = filters.is_from_inspector.toString();
    }
    if (filters.search) params.search = filters.search;
    if (filters.sort_by !== 'created_at') params.sort_by = filters.sort_by;
    if (filters.sort_order !== 'desc') params.sort_order = filters.sort_order;
    if (filters.page !== 1) params.page = filters.page.toString();
    if (filters.limit !== 10) params.limit = filters.limit.toString();
    
    setSearchParams(params);
  }, [filters, setSearchParams]);

  useEffect(() => {
    loadProblems();
  }, [filters]); 
  // Завис-ть от filters дает автом-ское обновл-е страницы при фильтрах

  const canDeleteProblem = currentUser?.role === 'admin'; // Только админ может удалять проблемы
  const canChangeStatus = currentUser?.role === 'admin' || currentUser?.role === 'contractor'; // Менять статус могут подрядчики и админы

  const isFromInspector = (problem: Problem) => {
    return problem.is_from_inspector;
  };

  const loadProblems = async (): Promise<void> => {
    setLoading(true);
    try {
      const params: any = {
        page: filters.page,
        limit: filters.limit,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      };
      
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.is_from_inspector !== null) {
        params.is_from_inspector = filters.is_from_inspector;
      }
      if (filters.search) params.search = filters.search;
      
      const response = await problemsAPI.getProblems(params);
      
      setProblems(response.data.items);
      setTotalItems(response.data.total);
      setTotalPages(response.data.total_pages);
      setError(null);
    } catch (error) {
      console.error('Error loading problems:', error);
      setError('Ошибка при загрузке проблем');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      is_from_inspector: null,
      search: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      page: 1,
      limit: 10
    });
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setFilters(prev => ({ ...prev, page: value }));
  };

  const handleLimitChange = (event: SelectChangeEvent) => {
    setFilters(prev => ({ 
      ...prev, 
      limit: Number(event.target.value),
      page: 1 
    }));
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

  const handleEditClick = (problem: Problem) => {
    setEditingProblem(problem);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingProblem(null);
  };

  const handleEditSuccess = () => {
    handleEditClose();
    loadProblems(); // перезагружаем список
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
      case 'long_crack': return 'Продольная трещина';
      case 'transverse_crack': return 'Поперечная трещина';
      case 'alligator_crack': return 'Аллигаторная трещина';
      case 'pothole': return 'Яма';
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

        <ProblemFilters
          filters={filters}
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          onClearFilters={clearFilters}
        />
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
      
      <ProblemFilters
        filters={filters}
        onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
        onClearFilters={clearFilters}
      />

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
                {canDeleteProblem && <TableCell><strong>Изменить</strong></TableCell>}
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

                  {canChangeStatus && (
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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

                  {canDeleteProblem && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          color="primary" 
                          size="small"
                          onClick={() => handleEditClick(problem)}
                          title="Редактировать"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => handleDelete(problem.id)}
                          title="Удалить"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
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

      {totalPages > 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Всего проблем: {totalItems}
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={filters.limit.toString()}
                onChange={handleLimitChange}
              >
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
            
            <Pagination
              count={totalPages}
              page={filters.page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Stack>
        </Box>
      )}

      <Dialog 
        open={editDialogOpen} 
        onClose={handleEditClose}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {editingProblem && (
            <ProblemForm 
              initialData={editingProblem}
              onSuccess={handleEditSuccess}
              onCancel={handleEditClose}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default ProblemList;