import React, { useEffect, useState } from 'react';
import {
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  InputAdornment,
  IconButton,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export interface FilterParams {
  status: string;
  type: string;
  is_from_inspector: boolean | null;
  search: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface ProblemFiltersProps {
  filters: FilterParams;
  onFilterChange: (newFilters: Partial<FilterParams>) => void;
  onClearFilters: () => void;
}

const ProblemFilters: React.FC<ProblemFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const handleStatusChange = (event: SelectChangeEvent) => {
    onFilterChange({ status: event.target.value, page: 1 });
  };

  const handleTypeChange = (event: SelectChangeEvent) => {
    onFilterChange({ type: event.target.value, page: 1 });
  };

  const handleInspectorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ 
      is_from_inspector: event.target.checked ? true : null,
      page: 1 
    });
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    const [sort_by, sort_order] = event.target.value.split(':');
    onFilterChange({ 
      sort_by, 
      sort_order: sort_order as 'asc' | 'desc',
      page: 1 
    });
  };

  const [searchInput, setSearchInput] = useState(filters.search);

  // для поля ввода (только обновляет локальное состояние)
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const handleSearchClick = () => { // для кнопки поиска
      onFilterChange({ search: searchInput, page: 1 });
  };

  const clearSearch = () => {
      setSearchInput('');
      onFilterChange({ search: '', page: 1 });
  };

  // Синхронизируем локальное состояние с пропсом при изменении извне
  useEffect(() => {
      setSearchInput(filters.search);
  }, [filters.search]);

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, md: 4 }}>
            <TextField
                fullWidth
                size="small"
                placeholder="Поиск по адресу или описанию..."
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                    handleSearchClick();
                    }
                }}
                InputProps={{
                    startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                    ),
                    endAdornment: (
                    <InputAdornment position="end">
                        {searchInput && (
                        <IconButton size="small" onClick={clearSearch} sx={{ mr: 0.5 }}>
                            <ClearIcon />
                        </IconButton>
                        )}
                        <Button 
                        variant="contained" 
                        size="small"
                        onClick={handleSearchClick}
                        sx={{ minWidth: '80px' }}
                        >
                        Поиск
                        </Button>
                    </InputAdornment>
                    )
                }}
                />
        </Grid>

        <Grid size={{ xs: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Статус</InputLabel>
            <Select
              value={filters.status}
              label="Статус"
              onChange={handleStatusChange}
            >
              <MenuItem value="all">Все статусы</MenuItem>
              <MenuItem value="new">Новые</MenuItem>
              <MenuItem value="in_progress">В работе</MenuItem>
              <MenuItem value="resolved">Решенные</MenuItem>
              <MenuItem value="closed">Закрытые</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Тип</InputLabel>
            <Select
              value={filters.type}
              label="Тип"
              onChange={handleTypeChange}
            >
              <MenuItem value="all">Все типы</MenuItem>
              <MenuItem value="long_crack">Продольная трещина</MenuItem>
              <MenuItem value="transverse_crack">Поперечная трещина</MenuItem>
              <MenuItem value="alligator_crack">Трещина "аллигатор"</MenuItem>
              <MenuItem value="pothole">Выбоина/яма</MenuItem>
              <MenuItem value="manhole">Отсутствует люк</MenuItem>
              <MenuItem value="other">Другое</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 6, md: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.is_from_inspector === true}
                onChange={handleInspectorChange}
              />
            }
            label="Только от инспекторов"
          />
        </Grid>

        <Grid size={{ xs: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Сортировка</InputLabel>
            <Select
              value={`${filters.sort_by}:${filters.sort_order}`}
              label="Сортировка"
              onChange={handleSortChange}
            >
              <MenuItem value="created_at:desc">Сначала новые</MenuItem>
              <MenuItem value="created_at:asc">Сначала старые</MenuItem>
              <MenuItem value="type:asc">По типу (А-Я)</MenuItem>
              <MenuItem value="type:desc">По типу (Я-А)</MenuItem>
              <MenuItem value="status:asc">По статусу</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={onClearFilters}
            fullWidth
          >
            Сбросить фильтры
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProblemFilters;