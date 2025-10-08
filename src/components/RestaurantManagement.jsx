import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';

const RestaurantManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    summary: '',
    phone: '',
    whatsapp: '',
    restaurant_admin_email: '',
    restaurant_admin_password: '',
    logo: null
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/restaurants`);
      const data = await response.json();
      setRestaurants(data);
    } catch (err) {
      setError('Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = () => {
    setEditingRestaurant(null);
    setFormData({
      name: '',
      address: '',
      summary: '',
      phone: '',
      whatsapp: '',
      restaurant_admin_email: '',
      restaurant_admin_password: '',
      logo: null
    });
    setDialogOpen(true);
  };

  const handleEditRestaurant = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      address: restaurant.address,
      summary: restaurant.summary,
      phone: restaurant.phone,
      whatsapp: restaurant.whatsapp,
      restaurant_admin_email: '',
      restaurant_admin_password: '',
      logo: null
    });
    setDialogOpen(true);
  };

  const handleDeleteRestaurant = async (id) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/restaurants/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          toast.success('Restaurant deleted successfully');
          fetchRestaurants();
        } else {
          toast.error('Failed to delete restaurant');
        }
      } catch (err) {
        toast.error('Failed to delete restaurant');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/restaurants/${id}/toggle-status`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        toast.success(`Restaurant ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchRestaurants();
      } else {
        toast.error('Failed to update restaurant status');
      }
    } catch (err) {
      toast.error('Failed to update restaurant status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('address', formData.address);
    formDataToSend.append('summary', formData.summary);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('whatsapp', formData.whatsapp);
    formDataToSend.append('restaurant_admin_email', formData.restaurant_admin_email);
    formDataToSend.append('restaurant_admin_password', formData.restaurant_admin_password);
    
    if (formData.logo) {
      formDataToSend.append('logo', formData.logo);
    }

    try {
      const url = editingRestaurant 
        ? `${import.meta.env.VITE_API_URL}/restaurants/${editingRestaurant._id}`
        : `${import.meta.env.VITE_API_URL}/restaurants`;
      
      const method = editingRestaurant ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formDataToSend
      });

      if (response.ok) {
        toast.success(`Restaurant ${editingRestaurant ? 'updated' : 'created'} successfully`);
        setDialogOpen(false);
        fetchRestaurants();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save restaurant');
      }
    } catch (err) {
      toast.error('Failed to save restaurant');
    }
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      logo: e.target.files[0]
    });
  };

  const columns = [
    { 
      field: 'serial', 
      headerName: 'S.No', 
      width: 80,
      renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1
    },
    { 
      field: 'logo', 
      headerName: 'Logo', 
      width: 100,
      renderCell: (params) => {
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const logoUrl = params.value ? `${baseUrl}${params.value}` : null;
        console.log('Logo URL:', logoUrl); // Debug log
        
        return logoUrl ? (
          <img 
            src={logoUrl} 
            alt="Restaurant Logo" 
            style={{ 
              width: 50, 
              height: 50, 
              objectFit: 'cover', 
              borderRadius: 4,
              border: '1px solid #ddd'
            }}
            onError={(e) => {
              console.log('Image load error:', e.target.src);
              e.target.style.display = 'none';
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', logoUrl);
            }}
          />
        ) : (
          <Box 
            sx={{ 
              width: 50, 
              height: 50, 
              backgroundColor: 'grey.200', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: 1,
              border: '1px solid #ddd'
            }}
          >
            <Typography variant="caption" color="text.secondary">
              No Logo
            </Typography>
          </Box>
        );
      }
    },
    { field: 'name', headerName: 'Restaurant Name', width: 180 },
    { field: 'address', headerName: 'Address', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 120 },
    { field: 'whatsapp', headerName: 'WhatsApp', width: 120 },
    { field: 'summary', headerName: 'Summary', width: 150 },
    { 
      field: 'isActive', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Switch
              checked={params.value}
              onChange={() => handleToggleStatus(params.row._id, params.value)}
            />
          }
          label={params.value ? 'Active' : 'Inactive'}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleEditRestaurant(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDeleteRestaurant(params.row._id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

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
          Restaurant Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddRestaurant}
        >
          Add Restaurant
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={restaurants}
          columns={columns}
          getRowId={(row) => row._id}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Restaurant Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                fullWidth
                required
                multiline
                rows={2}
              />
              <TextField
                label="Summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                fullWidth
                required
                multiline
                rows={3}
              />
              <TextField
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
                required
                type="tel"
              />
              <TextField
                label="WhatsApp Number"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                fullWidth
                required
                type="tel"
              />
              <TextField
                label="Restaurant Admin Email"
                value={formData.restaurant_admin_email}
                onChange={(e) => setFormData({ ...formData, restaurant_admin_email: e.target.value })}
                fullWidth
                required
                type="email"
              />
              <TextField
                label="Restaurant Admin Password"
                value={formData.restaurant_admin_password}
                onChange={(e) => setFormData({ ...formData, restaurant_admin_password: e.target.value })}
                fullWidth
                required
                type="password"
              />
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="logo-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="logo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                  >
                    Upload Logo
                  </Button>
                </label>
                {formData.logo && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected: {formData.logo.name}
                  </Typography>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {editingRestaurant ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RestaurantManagement;
