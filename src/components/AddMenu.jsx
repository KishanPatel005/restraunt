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
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AddMenu = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isUpdate = location.pathname.includes('/update');

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/restaurants/admin/${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const restaurantData = await response.json();
        setRestaurant(restaurantData);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }

    if (!restaurant) {
      toast.error('Restaurant information not found');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('menuPdf', selectedFile);
      formData.append('restaurantId', restaurant._id);
      formData.append('restaurantName', restaurant.name);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/menu`, {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        toast.success(`Menu ${isUpdate ? 'updated' : 'uploaded'} successfully!`);
        navigate('/restaurant-admin/menu');
      } else {
        const errorData = await response.json();
        if (errorData.error === 'API_ERROR') {
          toast.error('PDF processing failed. Please try with a different PDF file.');
        } else {
          toast.error(errorData.message || 'Upload failed');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleBack = () => {
    navigate('/restaurant-admin/menu');
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
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back to Menu
        </Button>
        <Typography variant="h4">
          {isUpdate ? 'Update Menu' : 'Add Menu'}
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent>
          <Box textAlign="center" mb={3}>
            <PdfIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isUpdate ? 'Update Your Menu' : 'Upload Menu PDF'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload a PDF file of your restaurant menu. Our system will automatically process it and extract menu items.
            </Typography>
          </Box>

          <Box mb={3}>
            <input
              accept=".pdf"
              style={{ display: 'none' }}
              id="pdf-upload"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="pdf-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                disabled={uploading}
                fullWidth
                sx={{ py: 2 }}
              >
                {selectedFile ? 'Change PDF File' : 'Select PDF File'}
              </Button>
            </label>
          </Box>


          {uploading && (
            <Box mb={3}>
              <Typography variant="body2" gutterBottom sx={{ color: 'green' }}>
                Processing PDF... {uploadProgress.toFixed(2)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ 
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'green'
                  }
                }}
              />
            </Box>
          )}

          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {uploading ? 'Processing...' : (isUpdate ? 'Update Menu' : 'Upload Menu')}
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Note:</strong> The PDF will be processed by our AI system to extract menu items. 
              Processing may take a few moments depending on the file size.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddMenu;
