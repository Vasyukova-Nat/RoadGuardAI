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
  Box
} from '@mui/material';

// Демо-данные
const mockProblems = [
  { id: 1, address: 'ул. Ленина, 15', type: 'Яма', status: 'новая', date: '2024-01-15' },
  { id: 2, address: 'пр. Мира, 28', type: 'Трещина', status: 'в работе', date: '2024-01-14' },
  { id: 3, address: 'ул. Центральная, 5', type: 'Яма', status: 'исправлено', date: '2024-01-10' },
  { id: 4, address: 'ш. Московское, 45 км', type: 'Отсутствует люк', status: 'новая', date: '2024-01-16' }
];

function ProblemList() {
  const getStatusColor = (status) => {
    switch (status) {
      case 'новая': return 'error';      
      case 'в работе': return 'warning'; 
      case 'исправлено': return 'success'; 
      default: return 'default';
    }
  };

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
                <TableCell><strong>Адрес</strong></TableCell>
                <TableCell><strong>Тип проблемы</strong></TableCell>
                <TableCell><strong>Статус</strong></TableCell>
                <TableCell><strong>Дата</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockProblems.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell>#{problem.id}</TableCell>
                  <TableCell>{problem.address}</TableCell>
                  <TableCell>{problem.type}</TableCell>
                  <TableCell>
                    <Chip 
                      label={problem.status} 
                      color={getStatusColor(problem.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{problem.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Всего проблем: {mockProblems.length}
        </Typography>
      </Box>
    </Box>
  );
}

export default ProblemList;