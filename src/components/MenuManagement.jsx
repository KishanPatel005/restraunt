import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MenuManagement = ({ restaurant }) => {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (restaurant?._id) {
      fetchMenu();
    }
  }, [restaurant?._id]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/menu/restaurant/${restaurant._id}`);
      if (response.ok) {
        const menuData = await response.json();
        setMenu(menuData);
      } else if (response.status === 404) {
        setMenu(null); // No menu exists
      } else {
        setError('Failed to fetch menu');
      }
    } catch (err) {
      setError('Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenu = () => {
    navigate('/restaurant-admin/menu/add');
  };

  const handleUpdateMenu = () => {
    navigate('/restaurant-admin/menu/update');
  };

  const handleViewMenu = () => {
    if (menu?.pdfFile) {
      window.open(`http://localhost:5000${menu.pdfFile}`, '_blank');
    }
  };

  const handleDeleteMenu = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/menu/${menu._id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Menu deleted successfully');
        setMenu(null);
        setDeleteDialogOpen(false);
      } else {
        toast.error('Failed to delete menu');
      }
    } catch (err) {
      toast.error('Failed to delete menu');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Menu Management
        </Typography>
        {menu ? (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleUpdateMenu}
          >
            Update Menu
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddMenu}
          >
            Add Menu
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {menu ? (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <PdfIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">
                  Restaurant Menu
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uploaded on {new Date(menu.created_at).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last updated on {new Date(menu.updated_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body1" paragraph>
              Your restaurant menu has been successfully processed and is ready for customers to view.
            </Typography>

            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<ViewIcon />}
                onClick={handleViewMenu}
              >
                View PDF Menu
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={handleUpdateMenu}
              >
                Update Menu
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Menu
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PdfIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Menu Uploaded
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload a PDF menu to get started. Our system will automatically process it and make it available for your customers.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddMenu}
            size="large"
          >
            Upload Menu PDF
          </Button>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Menu</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this menu? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteMenu} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuManagement;
