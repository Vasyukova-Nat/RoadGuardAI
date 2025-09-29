import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Build as BuildIcon
} from '@mui/icons-material';

function Profile() {
  // Демо-данные пользователя
  const userData = {
    name: 'Иван Петров',
    email: 'ivan.petrov@company.ru',
    role: 'Дорожный инспектор',
    organization: 'ГУП "Городские дороги"',
    avatar: '/static/images/avatar/1.jpg',
    registrationDate: '2023-05-15'
  };

  // Статистика пользователя
  const userStats = [
    { label: 'Отправлено проблем', value: 47, icon: <WarningIcon />, color: '#1976d2' },
    { label: 'Проблем в работе', value: 8, icon: <BuildIcon />, color: '#ed6c02' },
    { label: 'Решено проблем', value: 32, icon: <CheckCircleIcon />, color: '#2e7d32' }
  ];

  // Последние активности
  const recentActivities = [
    { action: 'Добавлена новая проблема', date: '2024-01-16 14:30', address: 'ул. Ленина, 15' },
    { action: 'Проблема взята в работу', date: '2024-01-15 11:20', address: 'пр. Мира, 28' },
    { action: 'Проблема решена', date: '2024-01-14 09:15', address: 'ул. Центральная, 5' },
    { action: 'Добавлена новая проблема', date: '2024-01-13 16:45', address: 'ш. Московское, 45 км' }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Личный кабинет
      </Typography>

      <Grid container spacing={3}>
        {/* Левая колонка - информация о пользователе */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}
              >
                <PersonIcon sx={{ fontSize: 50 }} />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {userData.name}
              </Typography>
              <Chip 
                label={userData.role} 
                color="primary" 
                variant="outlined"
                sx={{ mb: 1 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Email" 
                  secondary={userData.email}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Организация" 
                  secondary={userData.organization}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Дата регистрации" 
                  secondary={userData.registrationDate}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Статистика */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Моя статистика
            </Typography>
            {userStats.map((stat, index) => (
              <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ color: stat.color, mr: 2 }}>
                  {stat.icon}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="h6" sx={{ color: stat.color }}>
                    {stat.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Правая колонка - последние активности */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Последние активности
            </Typography>
            
            <List>
              {recentActivities.map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      <WarningIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.action}
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {activity.address}
                          </Typography>
                          <br />
                          {activity.date}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>

          {/* Дополнительная информация */}
          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              О системе
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              RoadGuard AI - это интеллектуальная система для мониторинга дорожного покрытия. 
              Вы можете добавлять новые проблемы, отслеживать их статус и просматривать статистику.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Версия системы: 1.0.0
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile;