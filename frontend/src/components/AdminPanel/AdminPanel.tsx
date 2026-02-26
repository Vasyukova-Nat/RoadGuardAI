import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Select, MenuItem, Box, Alert 
} from '@mui/material';
import { adminAPI, User } from '../../services/types';
import { useAuthStore } from '../../store/authStore';

const AdminPanel: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/');
    }

    loadUsers();
  }, [currentUser, navigate]);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await adminAPI.updateUserRole({ user_id: userId, new_role: newRole });
      setMessage('Роль успешно изменена');
      loadUsers();
    } catch (error) {
      console.error('Ошибка изменения роли:', error);
      setMessage('Ошибка при изменении роли');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Управление пользователями</Typography>
      
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Имя</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Текущая роль</TableCell>
              <TableCell>Новая роль</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    size="small"
                  >
                    <MenuItem value="citizen">Гражданин</MenuItem>
                    <MenuItem value="inspector">Инспектор</MenuItem>
                    <MenuItem value="contractor">Подрядчик</MenuItem>
                    <MenuItem value="admin">Админ</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminPanel;