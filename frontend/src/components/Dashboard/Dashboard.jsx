import { Box, Paper, Typography, Grid, Card, CardContent } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function Dashboard() {
  const stats = [
    { label: 'Новых проблем', value: 15, color: '#f44336', icon: <WarningIcon /> },
    { label: 'В работе', value: 8, color: '#ff9800', icon: <BuildIcon /> },
    { label: 'Исправлено', value: 23, color: '#4caf50', icon: <CheckCircleIcon /> },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Панель управления RoadGuard AI
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ color: stat.color, fontSize: 40, mb: 1 }}>
                  {stat.icon}
                </Box>
                <Typography variant="h4" component="div" sx={{ color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Добро пожаловать в RoadGuard AI!
        </Typography>
        <Typography paragraph>
          Это интеллектуальная система для мониторинга дорожного покрытия. 
          Здесь вы можете:
        </Typography>
        <ul>
          <li>Сообщать о новых проблемах на дорогах</li>
          <li>Просматривать список всех заявок</li>
          <li>Отслеживать статус ремонтных работ</li>
        </ul>
        <Typography>
          Для начала работы выберите раздел в меню выше.
        </Typography>
      </Paper>
    </Box>
  );
}

export default Dashboard;