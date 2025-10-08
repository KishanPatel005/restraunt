import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  Visibility as ViewIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  TableRestaurant as TableIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TableManagement = ({ restaurant }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    tableName: ''
  });
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedQrData, setSelectedQrData] = useState(null);
  const [qrCodes, setQrCodes] = useState({});
  const [fullScreenQrOpen, setFullScreenQrOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (restaurant?._id) {
      fetchTables();
    }
  }, [restaurant?._id]);

  const generateQRCode = async (qrLink) => {
    try {
      const qrDataURL = await QRCode.toDataURL(qrLink, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tables/restaurant/${restaurant._id}`);
      const data = await response.json();
      setTables(data);
      
      // Generate QR codes for all tables
      const qrCodePromises = data.map(async (table) => {
        const qrDataURL = await generateQRCode(table.qrLink);
        return { tableId: table._id, qrDataURL };
      });
      
      const qrResults = await Promise.all(qrCodePromises);
      const qrCodeMap = {};
      qrResults.forEach(({ tableId, qrDataURL }) => {
        if (qrDataURL) {
          qrCodeMap[tableId] = qrDataURL;
        }
      });
      
      setQrCodes(qrCodeMap);
    } catch (err) {
      setError('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    setEditingTable(null);
    
    // Get next table number
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tables/restaurant/${restaurant._id}/next-number`);
      const data = await response.json();
      setFormData({ tableName: data.nextTableName });
    } catch (err) {
      setFormData({ tableName: 'Table 1' });
    }
    
    setDialogOpen(true);
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setFormData({ tableName: table.tableName });
    setDialogOpen(true);
  };

  const handleDeleteTable = async (id) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tables/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          toast.success('Table deleted successfully');
          fetchTables();
        } else {
          toast.error('Failed to delete table');
        }
      } catch (err) {
        toast.error('Failed to delete table');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tables/${id}/toggle-status`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        toast.success(`Table ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchTables();
      } else {
        toast.error('Failed to update table status');
      }
    } catch (err) {
      toast.error('Failed to update table status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingTable 
        ? `${import.meta.env.VITE_API_URL}/tables/${editingTable._id}`
        : `${import.meta.env.VITE_API_URL}/tables`;
      
      const method = editingTable ? 'PUT' : 'POST';
      
      const body = editingTable 
        ? { tableName: formData.tableName }
        : { restaurantId: restaurant._id, tableName: formData.tableName };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(`Table ${editingTable ? 'updated' : 'created'} successfully`);
        setDialogOpen(false);
        fetchTables();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save table');
        if (errorData.message && errorData.message.includes('already exists')) {
          // Don't close dialog if there's a duplicate name error
          return;
        }
      }
    } catch (err) {
      toast.error('Failed to save table');
    }
  };

  const handleViewQr = (table) => {
    setSelectedQrData(table);
    setQrDialogOpen(true);
  };

  const handleOpenQrLink = (qrLink) => {
    window.open(qrLink, '_blank');
  };

  const handleQrCodeClick = (table) => {
    setSelectedTable(table);
    setFullScreenQrOpen(true);
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
          Table Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTable}
        >
          Add New Table
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tables Grid View */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {tables.map((table, index) => (
          <Grid item xs={12} sm={6} md={4} key={table._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: table.isActive ? '2px solid #4caf50' : '2px solid #e0e0e0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pb: 1 }}>
                {/* Table Icon */}
                <Box sx={{ mb: 2 }}>
                  <TableIcon 
                    sx={{ 
                      fontSize: 60, 
                      color: table.isActive ? 'primary.main' : 'grey.400',
                      mb: 1
                    }} 
                  />
                </Box>

                {/* Table Name */}
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {table.tableName}
                </Typography>

                {/* QR Code Section */}
                <Box 
                  sx={{ 
                    mb: 2, 
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                  onClick={() => handleQrCodeClick(table)}
                >
                  {qrCodes[table._id] ? (
                    <img 
                      src={qrCodes[table._id]} 
                      alt={`QR Code for ${table.tableName}`}
                      style={{ 
                        width: '80px', 
                        height: '80px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0'
                      }}
                    />
                  ) : (
                    <QrCodeIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  )}
                  <Typography variant="caption" display="block" color="text.secondary">
                    Click to view full screen
                  </Typography>
                </Box>

                {/* Status Chip */}
                <Chip
                  label={table.isActive ? 'Active' : 'Inactive'}
                  color={table.isActive ? 'success' : 'default'}
                  size="small"
                  sx={{ mb: 2 }}
                />

                {/* QR Link Preview */}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block',
                    wordBreak: 'break-all',
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    maxHeight: '40px',
                    overflow: 'hidden'
                  }}
                >
                  {table.qrLink}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                <Tooltip title="View QR Code">
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenQrLink(table.qrLink)}
                    color="primary"
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Edit Table">
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditTable(table)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title={table.isActive ? 'Deactivate' : 'Activate'}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleToggleStatus(table._id, table.isActive)}
                    color={table.isActive ? 'warning' : 'success'}
                  >
                    {table.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete Table">
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteTable(table._id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {tables.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No tables found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click "Add New Table" to create your first table
          </Typography>
        </Box>
      )}

      {/* Add/Edit Table Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTable ? 'Edit Table' : 'Add New Table'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Table Name"
              value={formData.tableName}
              onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
              fullWidth
              required
              margin="normal"
              helperText={!editingTable ? "Auto-generated if left empty" : ""}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {editingTable ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog 
        open={qrDialogOpen} 
        onClose={() => setQrDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          QR Code - {selectedQrData?.tableName}
        </DialogTitle>
        <DialogContent>
          {selectedQrData && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <img 
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${selectedQrData.qrCode}`}
                alt="QR Code"
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: 8
                }}
              />
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {selectedQrData.qrLink}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => handleOpenQrLink(selectedQrData.qrLink)}
                startIcon={<ViewIcon />}
              >
                Open QR Link
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Screen QR Code Modal */}
      <Dialog 
        open={fullScreenQrOpen} 
        onClose={() => setFullScreenQrOpen(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
          {selectedTable?.tableName} - QR Code
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {selectedTable && qrCodes[selectedTable._id] && (
            <Box>
              <img 
                src={qrCodes[selectedTable._id]} 
                alt={`QR Code for ${selectedTable.tableName}`}
                style={{ 
                  width: '300px', 
                  height: '300px',
                  borderRadius: '16px',
                  border: '4px solid #fff',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              />
              <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
                Scan to view menu
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: '400px', wordBreak: 'break-all' }}>
                {selectedTable.qrLink}
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => handleOpenQrLink(selectedTable.qrLink)}
                startIcon={<QrCodeIcon />}
                sx={{ mb: 2 }}
              >
                Open Menu Link
              </Button>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 4 }}>
          <Button 
            variant="outlined" 
            size="large"
            onClick={() => setFullScreenQrOpen(false)}
            sx={{ minWidth: '120px' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableManagement;
