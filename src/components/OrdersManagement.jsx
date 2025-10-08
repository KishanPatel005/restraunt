import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

const OrdersManagement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const statusColors = {
    pending: 'warning',
    confirmed: 'info',
    preparing: 'primary',
    ready: 'success',
    delivered: 'success',
    cancelled: 'error'
  };

  const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };

  useEffect(() => {
    if (user?.restaurantId) {
      fetchOrders();
    }
  }, [user, currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const response = await apiRequest(`/orders/restaurant/${user.restaurantId}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setTotalOrders(data.totalOrders);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const response = await apiRequest(`/orders/${orderId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.order);
        setShowOrderDetails(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to fetch order details');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        // Update the order in the list
        setOrders(orders.map(order => 
          order.order_id === orderId 
            ? { ...order, status: newStatus }
            : order
        ));
        
        // Update selected order if it's the same
        if (selectedOrder && selectedOrder.order_id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const OrderDetailsDialog = () => (
    <Dialog 
      open={showOrderDetails} 
      onClose={() => setShowOrderDetails(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Order Details - {selectedOrder?.order_id}
          </Typography>
          <IconButton onClick={() => setShowOrderDetails(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {selectedOrder && (
          <Box>
            {/* Order Info */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Order ID
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {selectedOrder.order_id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip 
                  label={statusLabels[selectedOrder.status]} 
                  color={statusColors[selectedOrder.status]}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Table
                </Typography>
                <Typography variant="body1">
                  {selectedOrder.table_name} ({selectedOrder.table_id})
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Order Time
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedOrder.order_time)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(selectedOrder.total_price)}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            {/* Order Items */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Order Items
            </Typography>
            
            {selectedOrder.order_summary?.order?.categories?.map((category, categoryIndex) => {
              // Show all categories but replace "Unknown Category" and "unknown" names
              const displayCategoryName = (category.category_name === 'Unknown Category' || category.category_name === 'unknown') 
                ? 'Items' 
                : category.category_name;
              
              // Ensure we have items to display
              if (!category.items || category.items.length === 0) {
                return null;
              }
              
              return (
                <Card key={categoryIndex} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      {displayCategoryName}
                      {category.subcategory_name !== 'All Items' && category.subcategory_name !== 'unknown' && (
                        <Typography variant="subtitle2" color="text.secondary">
                          {category.subcategory_name}
                        </Typography>
                      )}
                    </Typography>
                  
                  {category.items?.map((item, itemIndex) => (
                    <Box key={itemIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {item.item_name} x{item.quantity}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(item.item_total)}
                        </Typography>
                      </Box>
                      
                      {item.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {item.description}
                        </Typography>
                      )}
                      
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Options:</strong> {item.selectedOptions.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>
              );
            })}

            {/* Status Update */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Update Status
              </Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.order_id, e.target.value)}
                  label="Status"
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setShowOrderDetails(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

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
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Orders Management
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
            >
              <MenuItem value="">All Orders</MenuItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchOrders}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Total Orders: {totalOrders}
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Table</TableCell>
                  <TableCell>Order Time</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {order.order_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {order.table_name}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {order.table_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatDate(order.order_time)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(order.total_price)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={statusLabels[order.status]} 
                        color={statusColors[order.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewOrder(order.order_id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <OrderDetailsDialog />
    </Box>
  );
};

export default OrdersManagement;
