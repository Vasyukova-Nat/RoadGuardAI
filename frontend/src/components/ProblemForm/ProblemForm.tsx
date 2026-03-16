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
  Divider,
  Switch,
  Autocomplete
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import api, { problemsAPI, ProblemType, DefectDetection, ImageAnalysisResponse, Problem } from '../../services/types';
import { useAuthStore } from '../../store/authStore';
import SEO from '../SEO/SEO';

interface ProblemFormProps {
  initialData?: Problem | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const ProblemForm: React.FC<ProblemFormProps> = ({ 
  initialData = null,
  onSuccess,
  onCancel,
  isEditing = false 
}) => {
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

  useEffect(() => {
    if (initialData) {
      setProblemType(initialData.type);
      setAddress(initialData.address);
      setDescription(initialData.description || '');
    }
  }, [initialData]);

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
    
    const drawBoundingBoxes = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      setCanvasSize({ width: img.width, height: img.height });
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 0, 0); // рисуем оригинальное изображение на canvas
      
      detectedDefects.forEach((defect, index) => {
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
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1); // прямоуг-к
        
        //подложка для текста
        const label = `${defect.type.replace('_', ' ')} ${(confidence * 100).toFixed(1)}%`;
        const textWidth = ctx.measureText(label).width;
        
        ctx.fillStyle = color;
        ctx.fillRect(x1, y1 - 20, textWidth + 10, 20);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(label, x1 + 5, y1 - 5);
      });
    };
    
    if (img.complete) { // если изображение уже загружено, рисуем сразу
      drawBoundingBoxes();
    } else {
      img.onload = drawBoundingBoxes; // ждем загрузки изображения
    }
    
    return () => {
      img.onload = null;
    };
  }, [photo, detectedDefects]);

  const handleSubmit = async (): Promise<void> => {
    if (!address.trim()) {
      setMessage({ text: 'Укажите адрес', type: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      if (isEditing && initialData) {
        // Редактирование без фото
        await problemsAPI.updateProblem(initialData.id, {
          address: address.trim(),
          description: description.trim() || null,
          type: problemType
        });
        setMessage({ text: 'Проблема обновлена!', type: 'success' });
      } else {
        // Создание с фото
        await problemsAPI.createProblemWithImage({
          address: address.trim(),
          description: description.trim() || null,
          type: problemType,
          photo: photoFile || undefined
        });
        setMessage({ text: 'Проблема отправлена!', type: 'success' });
        
        // очистка формы
        setPhoto(null);
        setPhotoFile(null);
        setAddress('');
        setDescription('');
        setAnalysisResult(null);
        setUseAiSuggestion(false);
      }
      
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      setMessage({ 
        text: error.response?.status === 401 ? 'Требуется авторизация' : 'Ошибка отправки', 
        type: 'error' 
      });
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

  interface AddressSuggestion {
    address: string;
    display: string;
    subtitle?: string;
    lat?: number;
    lon?: number;
  }
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]); // Для Яндекс.Карт
  const [searchLoading, setSearchLoading] = useState(false);
  let searchTimeout: NodeJS.Timeout;

  const searchAddress = (query: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    
    searchTimeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await api.get(`/api/address-suggest?query=${query}`);
        setAddressSuggestions(response.data);
      } catch (error) {
        console.error('Ошибка поиска адреса:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  return (
    <> 
      <SEO 
        title={isEditing ? "Редактирование проблемы" : "Сообщить о проблеме"} 
        description={isEditing ? "Редактирование информации о проблеме" : "Сообщить о яме или трещине на дороге"}
      />
      <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}
        
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEditing ? `Редактировать проблему #${initialData?.id}` : 'Сообщить о проблеме'}
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
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <canvas
                    ref={canvasRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 2  // Canvas поверх изображения
                    }}
                  />

                  <img 
                    ref={imageRef}
                    src={photo} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 400,
                      borderRadius: '8px',
                      display: 'block',
                      position: 'relative',
                      zIndex: 1
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
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                color: !useAiSuggestion ? 'primary.main' : 'text.secondary'
                              }}>
                                <TouchAppIcon />
                                <Typography variant="body2" fontWeight={!useAiSuggestion ? 'bold' : 'normal'}>
                                  Указать тип проблемы вручную
                                </Typography>
                              </Box>
                              
                              <Switch
                                checked={useAiSuggestion}
                                onChange={(e) => {
                                  if (e.target.checked && analysisResult?.dominant_type) {
                                    setProblemType(analysisResult.dominant_type);
                                  }
                                  setUseAiSuggestion(e.target.checked);
                                }}
                                disabled={!analysisResult?.dominant_type}
                                color="primary"
                              />
                              
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                color: useAiSuggestion ? 'primary.main' : 'text.secondary'
                              }}>
                                <AutoAwesomeIcon />
                                <Typography variant="body2" fontWeight={useAiSuggestion ? 'bold' : 'normal'}>
                                  Использовать результат ИИ
                                </Typography>
                              </Box>
                            </Box>
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
                <AutoAwesomeIcon fontSize="small" /> Распознано нейросетью
              </Typography>
            )}
          </FormControl>

          <Autocomplete
            freeSolo
            options={addressSuggestions}
            loading={searchLoading}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return option.display || option.address || '';
            }}
            onInputChange={(_, value) => searchAddress(value)}
            onChange={(_, value) => {
              if (value && typeof value !== 'string') {
                setAddress(value.address);  // Вставляем полный адрес
              }
            }}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body1">{option.display}</Typography>
                  {option.subtitle && (
                    <Typography variant="caption" color="text.secondary">
                      {option.subtitle}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label="Адрес или описание места"
                placeholder="Например: Авиамоторная улица, 12 (или улица Лапина, 1)"
                required
                disabled={analyzing}
                sx={{ mb: 2 }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
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

          {isEditing && onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{ mr: 2 }}
            >
              Отмена
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!address.trim() || loading}
            type="submit"
          >
            {loading ? <CircularProgress size={24} /> : (isEditing ? 'Сохранить' : 'Отправить')}
          </Button>
        </Paper>
    </Box>
    </>
  );
};

export default ProblemForm;