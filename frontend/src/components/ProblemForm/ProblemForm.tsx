import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
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
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { problemsAPI, ProblemType, CreateProblemRequest, DefectDetection, ImageAnalysisResponse } from '../../services/types';
import { useAuthStore } from '../../store/authStore';

const ProblemForm: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [problemType, setProblemType] = useState<ProblemType>('pothole');
  const [address, setAddress] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResponse | null>(null);
  const [useAiSuggestion, setUseAiSuggestion] = useState<boolean>(false);
  const [detectedDefects, setDetectedDefects] = useState<DefectDetection[]>([]);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setAnalysisResult(null); // сбрасываем предыдущий анализ
    setUseAiSuggestion(false);
    setDetectedDefects([]);
    
    setPhotoFile(file);
    const photoUrl = URL.createObjectURL(file);
    setPhoto(photoUrl);
    
    await analyzeImageWithAI(file);
  };

  const analyzeImageWithAI = async (file: File): Promise<void> => {
    setAnalyzing(true);
    try {
      console.log('Токен из localStorage:', localStorage.getItem('token'));
      
      const response = await problemsAPI.analyzeImage(file);
      setAnalysisResult(response.data);
      setDetectedDefects(response.data.defects);
      
      if (response.data.dominant_type) {
        setProblemType(response.data.dominant_type);
        setUseAiSuggestion(true);
      }
    } catch (error: any) {
      console.error('Ошибка анализа изображения:', error);
      
      setMessage({ 
        text: 'Нейросеть временно недоступна. Выберите тип проблемы вручную.', 
        type: 'error' 
      });
      setUseAiSuggestion(false);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!photo || !canvasRef.current || !imageRef.current || detectedDefects.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (!ctx) return;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      setCanvasSize({ width: img.width, height: img.height });
      
      ctx.clearRect(0, 0, canvas.width, canvas.height); // очищаем canvas
      
      detectedDefects.forEach((defect, index) => { // Рисуем bounding boxes
        const [x1, y1, x2, y2] = defect.bbox;
        const confidence = defect.confidence;
        
        const colors: Record<ProblemType, string> = {
          'long_crack': '#FF6B6B',
          'transverse_crack': '#4ECDC4',
          'alligator_crack': '#45B7D1',
          'pothole': '#96CEB4',
          'manhole': '#FFEAA7',
          'other': '#DDA0DD'
        };
        
        const color = colors[defect.type] || '#FF6B6B';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);  // прямоугольник
        
        const label = `${defect.type.replace('_', ' ')} ${(confidence * 100).toFixed(1)}%`;
        ctx.fillStyle = color;
        ctx.font = '16px Arial';
        ctx.fillText(label, x1, y1 - 5);
      });
    };
  }, [photo, detectedDefects]);

  const handleAcceptAiSuggestion = (): void => { // согласие с результатами нейросети
    if (analysisResult?.dominant_type) {
      setProblemType(analysisResult.dominant_type);
      setUseAiSuggestion(true);
    }
  };

  const handleRejectAiSuggestion = (): void => { // несогласие с результатами нейросети
    setUseAiSuggestion(false);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!address.trim()) {
      setMessage({ text: 'Пожалуйста, укажите адрес', type: 'error' });
      return;
    }
    
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
      setPhotoFile(null);
      setProblemType('pothole');
      setAddress('');
      setDescription('');
      setAnalysisResult(null);
      setUseAiSuggestion(false);
      setDetectedDefects([]);
      
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

  const getTypeLabel = (type: ProblemType): string => {
    const labels: Record<ProblemType, string> = {
      'long_crack': 'Продольная трещина',
      'transverse_crack': 'Поперечная трещина',
      'alligator_crack': 'Трещина "аллигатор"',
      'pothole': 'Выбоина/яма',
      'manhole': 'Отсутствует люк',
      'other': 'Другое'
    };
    return labels[type];
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon /> Сообщить о проблеме с ИИ
        </Typography>

        <Box sx={{ mb: 3 }}>
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
              disabled={analyzing}
            >
              {analyzing ? 'Анализируем изображение...' : 'Загрузить фото дороги'}
            </Button>
          </label>
          
          {analyzing && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Нейросеть анализирует изображение...</Typography>
            </Box>
          )}
          
          {/* Отображение фото с результатами анализа */}
          {photo && (
            <Box sx={{ mt: 3, position: 'relative' }}>
              <Typography variant="subtitle1" gutterBottom>
                Результаты анализа:
              </Typography>
              
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  ref={imageRef}
                  src={photo} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: 400,
                    borderRadius: '8px',
                    display: 'block'
                  }} 
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                />
              </Box>

              {analysisResult && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Нейросеть обнаружила:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {analysisResult.detected_types.map((type, index) => (
                            <Chip 
                              key={index}
                              label={`${getTypeLabel(type)} (${analysisResult.defects.filter(d => d.type === type).length})`}
                              color={type === analysisResult.dominant_type ? "primary" : "default"}
                              size="small"
                            />
                          ))}
                        </Box>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2">
                          Основной тип проблемы: <strong>{analysisResult.dominant_type ? getTypeLabel(analysisResult.dominant_type) : 'Не определено'}</strong>
                        </Typography>
                        {analysisResult.confidence && (
                          <Typography variant="body2" color="text.secondary">
                            Уверенность: {(analysisResult.confidence * 100).toFixed(1)}%
                          </Typography>
                        )}
                      </Box>
                      
                      <Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                          <Button
                            variant="contained"
                            startIcon={<CheckIcon />}
                            onClick={handleAcceptAiSuggestion}
                            disabled={!analysisResult.dominant_type}
                            color="success"
                          >
                            Использовать результат ИИ
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={handleRejectAiSuggestion}
                            color="inherit"
                          >
                            Выбрать вручную
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Тип проблемы</InputLabel>
          <Select
            value={problemType}
            label="Тип проблемы"
            onChange={(e) => {
              setProblemType(e.target.value as ProblemType);
              setUseAiSuggestion(false); // При ручном выборе снимаем флаг ИИ
            }}
            disabled={analyzing}
          >
            <MenuItem value="long_crack">Продольная трещина</MenuItem>
            <MenuItem value="transverse_crack">Поперечная трещина</MenuItem>
            <MenuItem value="alligator_crack">Трещина "аллигатор"</MenuItem>
            <MenuItem value="pothole">Выбоина/яма</MenuItem>
            <MenuItem value="manhole">Отсутствует люк</MenuItem>
            <MenuItem value="other">Другое</MenuItem>
          </Select>
          
          {useAiSuggestion && analysisResult?.dominant_type && (
            <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AutoAwesomeIcon fontSize="small" /> Выбрано нейросетью
            </Typography>
          )}
        </FormControl>

        <TextField
          fullWidth
          label="Адрес или описание места" 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="Например: ул. Ленина, 15, перед пешеходным переходом"
          required
          disabled={analyzing}
        />

        <TextField
          fullWidth
          label="Дополнительное описание проблемы"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          sx={{ mb: 3 }}
          placeholder="Опишите проблему подробнее..."
          disabled={analyzing}
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!address.trim() || loading || analyzing}
          fullWidth
          size="large"
          startIcon={useAiSuggestion ? <AutoAwesomeIcon /> : undefined}
        >
          {loading ? 'Отправка...' : `Отправить проблему ${useAiSuggestion ? '(выбран рез-т ИИ)' : ''}`}
        </Button>
      </Paper>
    </Box>
  );
};

export default ProblemForm;