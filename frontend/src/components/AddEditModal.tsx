import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import Edit from '@mui/icons-material/Edit';
import { ListItem } from '../types';

interface AddEditPayload {
  description: string;
  itemId?: number;
  locationId?: number | null;
}

interface AddEditModalProps {
  Action: 'add' | 'edit';
  Item?: ListItem | null;
  LocationId?: number | null;
  SaveChanges: (payload: AddEditPayload) => void;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({ Action, Item, LocationId, SaveChanges }) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(Item?.name ?? '');

  useEffect(() => {
    setDescription(Item?.name ?? '');
  }, [Item]);

  const handleClose = () => setOpen(false);

  const saveChanges = () => {
    if (Action === 'add') {
      SaveChanges({ description });
    } else if (Item) {
      SaveChanges({ description, itemId: Item.id, locationId: LocationId });
      handleClose();
    }
  };

  return (
    <div>
      {Action === 'add' ? (
        <AddCircleOutline onClick={() => setOpen(true)} />
      ) : (
        <Edit onClick={() => setOpen(true)} />
      )}
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add or Edit</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="description"
            label="Description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={saveChanges} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AddEditModal;
