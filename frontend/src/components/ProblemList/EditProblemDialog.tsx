import { Dialog, DialogContent } from '@mui/material';
import ProblemForm from '../ProblemForm/ProblemForm';

interface Props {
  open: boolean;
  problem: any;
  onClose: () => void;
  onSuccess: () => void;
}

const EditProblemDialog: React.FC<Props> = ({ open, problem, onClose, onSuccess }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        <ProblemForm 
          initialData={problem}
          onSuccess={onSuccess}
          onCancel={onClose}
          isEditing={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditProblemDialog;