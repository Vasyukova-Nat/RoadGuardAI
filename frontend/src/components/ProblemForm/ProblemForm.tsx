import { useState, ChangeEvent } from 'react';
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
import { ProblemType } from '../../types';

const ProblemForm: React.FC = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [problemType, setProblemType] = useState<ProblemType>('pothole');
  const [address, setAddress] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

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

  const handleSubmit = (): void => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setPhoto(null);
      setProblemType('pothole');
      setAddress('');
    }, 3000);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, margin: '0 auto' }}>
      {submitted && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Проблема успешно отправлена на модерацию!
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
            <MenuItem value="pothole">🚧 Яма</MenuItem>
            <MenuItem value="crack">📏 Трещина</MenuItem>
            <MenuItem value="manhole">⚠️ Отсутствует люк</MenuItem>
            <MenuItem value="other">❓ Другое</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Адрес или описание места"
          value={address}
          onChange={handleAddressChange}
          sx={{ mb: 2 }}
          placeholder="Например: ул. Ленина, 15, перед пешеходным переходом"
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!photo || !address}
          fullWidth
          size="large"
        >
          Отправить
        </Button>
      </Paper>
    </Box>
  );
}

export default ProblemForm;