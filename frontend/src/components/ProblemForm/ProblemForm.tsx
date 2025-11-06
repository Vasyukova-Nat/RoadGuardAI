import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { problemsAPI, ProblemType, CreateProblemRequest } from '../../services/types';
import { useAuthStore } from '../../store/authStore';

const ProblemForm: React.FC = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [problemType, setProblemType] = useState<ProblemType>('pothole');
  const [address, setAddress] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto(URL.createObjectURL(file));
    }
  };

  const handleProblemTypeChange = (event: SelectChangeEvent): void => {
    setProblemType(event.target.value as ProblemType);
  };

  const handleAddressChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setAddress(event.target.value);
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setDescription(event.target.value);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!address.trim()) return;
    
    setLoading(true);
    try {
      const problemData: CreateProblemRequest = {
        address: address.trim(),
        description: description.trim() || null,
        type: problemType
      };

      await problemsAPI.createProblem(problemData);
      
      setMessage({ text: 'Проблема успешно отправлена!', type: 'success' });
      
      // Очищаем форму
      setPhoto(null);
      setProblemType('pothole');
      setAddress('');
      setDescription('');
      
    } catch (error: any) {
      console.error('Error creating problem:', error);
      if (error.response?.status === 401) {
        setMessage({ text: 'Вы не авторизованы. Войдите в систему.', type: 'error' });
      } else {
        setMessage({ text: 'Ошибка при отправке проблемы', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, margin: '0 auto' }}>
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Сообщить о проблеме 
        </Typography>

        <Box sx={{ mb: 2 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="photo-upload"
            type="file"
            onChange={handlePhotoUpload}
          />
          <label htmlFor="photo-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              fullWidth
            >
              Загрузить фото дороги
            </Button>
          </label>
          {photo && (
            <Box sx={{ mt: 2 }}>
              <img 
                src={photo} 
                alt="Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 300,
                  borderRadius: '8px'
                }} 
              />
            </Box>
          )}
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Тип проблемы</InputLabel>
          <Select
            value={problemType}
            label="Тип проблемы"
            onChange={handleProblemTypeChange}
          >
            <MenuItem value="pothole">Яма</MenuItem>
            <MenuItem value="crack">Трещина</MenuItem>
            <MenuItem value="manhole">Отсутствует люк</MenuItem>
            <MenuItem value="other">Другое</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Адрес или описание места" 
          value={address}
          onChange={handleAddressChange}
          sx={{ mb: 2 }}
          placeholder="Например: ул. Ленина, 15, перед пешеходным переходом"
          required
        />

        <TextField
          fullWidth
          label="Описание проблемы"
          value={description}
          onChange={handleDescriptionChange}
          multiline
          rows={3}
          sx={{ mb: 2 }}
          placeholder="Опишите проблему подробнее..."
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!address.trim() || loading}
          fullWidth
          size="large"
        >
          {loading ? 'Отправка...' : 'Отправить проблему'}
        </Button>
      </Paper>
    </Box>
  );
};

export default ProblemForm;