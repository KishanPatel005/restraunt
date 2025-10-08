import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import MasterAdminLogin from './components/MasterAdminLogin';
import MasterAdminDashboard from './components/MasterAdminDashboard';
import RestaurantAdminLogin from './components/RestaurantAdminLogin';
import RestaurantAdminDashboard from './components/RestaurantAdminDashboard';
import QRCodePage from './components/QRCodePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  
  // Show loading while checking authentication
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to appropriate login based on the required role
    if (requiredRole === 'restaurant_admin') {
      return <Navigate to="/restaurant-admin/login" />;
    }
    return <Navigate to="/master-admin/login" />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate login based on the required role
    if (requiredRole === 'restaurant_admin') {
      return <Navigate to="/restaurant-admin/login" />;
    }
    return <Navigate to="/master-admin/login" />;
  }
  
  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/master-admin/login" />} />
            <Route path="/master-admin" element={<Navigate to="/master-admin/login" />} />
            <Route path="/master-admin/login" element={<MasterAdminLogin />} />
            <Route path="/restaurant-admin" element={<Navigate to="/restaurant-admin/login" />} />
            <Route path="/restaurant-admin/login" element={<RestaurantAdminLogin />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredRole="master_admin">
                  <MasterAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/restaurants" 
              element={
                <ProtectedRoute requiredRole="master_admin">
                  <MasterAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/restaurant-admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="restaurant_admin">
                  <RestaurantAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/restaurant-admin/menu" 
              element={
                <ProtectedRoute requiredRole="restaurant_admin">
                  <RestaurantAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/restaurant-admin/tables" 
              element={
                <ProtectedRoute requiredRole="restaurant_admin">
                  <RestaurantAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/restaurant-admin/orders" 
              element={
                <ProtectedRoute requiredRole="restaurant_admin">
                  <RestaurantAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/restaurant-admin/menu/add" 
              element={
                <ProtectedRoute requiredRole="restaurant_admin">
                  <RestaurantAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/restaurant-admin/menu/update" 
              element={
                <ProtectedRoute requiredRole="restaurant_admin">
                  <RestaurantAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/:restaurantName/:tableId" element={<QRCodePage />} />
          </Routes>
        </Router>
        <ToastContainer />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


