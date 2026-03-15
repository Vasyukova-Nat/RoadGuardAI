import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  open: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

const ImageViewDialog: React.FC<Props> = ({ open, imageUrl, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between' }}>
        Фото проблемы
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {imageUrl && (
          <Box sx={{ textAlign: 'center' }}>
            <img 
              src={imageUrl} 
              alt="Проблема" 
              style={{ maxWidth: '100%', maxHeight: '70vh' }} 
              loading="lazy"
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewDialog;