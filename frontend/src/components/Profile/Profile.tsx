import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
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
import { useAuthStore } from '../../store/authStore';

function Profile() {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!currentUser) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          Личный кабинет
        </Typography>
        <Typography>Загрузка данных...</Typography>
      </Box>
    );
  }

  const roleLabels = {
    citizen: 'Гражданин',
    inspector: 'Дорожный инспектор',
    contractor: 'Подрядчик',
    admin: 'Администратор'
  };

  const userData = {
    organization: '(Mock) ГУП "Городские дороги"',
  };

  const userStats = [
    { label: '(Mock) Отправлено проблем', value: 47, icon: <WarningIcon />, color: '#1976d2' },
    { label: '(Mock) Проблем в работе', value: 8, icon: <BuildIcon />, color: '#ed6c02' },
    { label: '(Mock) Решено проблем', value: 32, icon: <CheckCircleIcon />, color: '#2e7d32' }
  ];

  const recentActivities = [
    { action: '(Mock) Добавлена новая проблема', date: '2024-01-16 14:30', address: 'ул. Ленина, 15' },
    { action: '(Mock) Проблема взята в работу', date: '2024-01-15 11:20', address: 'пр. Мира, 28' },
    { action: '(Mock) Проблема решена', date: '2024-01-14 09:15', address: 'ул. Центральная, 5' },
    { action: '(Mock) Добавлена новая проблема', date: '2024-01-13 16:45', address: 'ш. Московское, 45 км' },
    { action: 'Зарегистрирован в системе', date: new Date(currentUser.created_at).toLocaleDateString('ru-RU'), address: '' }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Личный кабинет
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}
              >
                <PersonIcon sx={{ fontSize: 50 }} />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {currentUser.name}
              </Typography>
              <Chip 
                label={roleLabels[currentUser.role] || currentUser.role}
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
                  secondary={currentUser.email}
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
                  secondary={new Date(currentUser.created_at).toLocaleDateString('ru-RU')}
                />
              </ListItem>
            </List>
          </Paper>

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

        <Grid size={{ xs: 12, sm: 8 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Активность
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
                          {activity.address && (
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {activity.address}
                              </Typography>
                              <br />
                            </>
                          )}
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

          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              О системе
            </Typography>
            <Typography variant="body2" color="text.secondary" component="p" sx={{ mb: 2 }}>
              RoadGuard AI - это интеллектуальная система для мониторинга дорожного покрытия. 
              Здесь вы можете сообщать о проблемах на дорогах и отслеживать их статус.
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