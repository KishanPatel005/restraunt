import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Paper,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  RestaurantMenu as MenuIcon2,
  TableRestaurant as TableIcon,
  Receipt as OrderIcon,
  Logout as LogoutIcon,
  Restaurant as RestaurantIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import TableManagement from './TableManagement';
import MenuManagement from './MenuManagement';
import OrdersManagement from './OrdersManagement';
import AddMenu from './AddMenu';

const drawerWidth = 240;

// Dark theme for restaurant admin
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff6b35',
    },
    secondary: {
      main: '#f7931e',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const RestaurantAdminDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine current view based on URL
  const getCurrentView = () => {
    if (location.pathname.includes('/menu/add') || location.pathname.includes('/menu/update')) return 'add-menu';
    if (location.pathname.includes('/menu')) return 'menu';
    if (location.pathname.includes('/tables')) return 'tables';
    if (location.pathname.includes('/orders')) return 'orders';
    return 'dashboard';
  };
  
  const [currentView, setCurrentView] = useState(getCurrentView());

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (user?.email) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/restaurants/admin/${encodeURIComponent(user.email)}`);
          if (response.ok) {
            const restaurantData = await response.json();
            setRestaurant(restaurantData);
          }
        } catch (error) {
          console.error('Error fetching restaurant:', error);
        }
      }
      setLoading(false);
    };

    fetchRestaurant();
  }, [user?.email]);

  // Update current view when URL changes
  useEffect(() => {
    setCurrentView(getCurrentView());
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
    if (view === 'dashboard') {
      navigate('/restaurant-admin/dashboard');
    } else if (view === 'menu') {
      navigate('/restaurant-admin/menu');
    } else if (view === 'tables') {
      navigate('/restaurant-admin/tables');
    } else if (view === 'orders') {
      navigate('/restaurant-admin/orders');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/restaurant-admin/login');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      view: 'dashboard'
    },
    {
      text: 'Menu',
      icon: <MenuIcon2 />,
      view: 'menu'
    },
    {
      text: 'Tables',
      icon: <TableIcon />,
      view: 'tables'
    },
    {
      text: 'Orders',
      icon: <OrderIcon />,
      view: 'orders'
    }
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
          {restaurant?.logo ? (
            <img 
              src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${restaurant.logo}`}
              alt="Restaurant Logo"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                objectFit: 'cover',
                marginRight: 12,
                border: '2px solid #ff6b35'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <Box 
            display={restaurant?.logo ? 'none' : 'flex'} 
            alignItems="center"
            sx={{ width: '100%' }}
          >
            <RestaurantIcon sx={{ mr: 1, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {restaurant?.name || user?.restaurantName}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={currentView === item.view}
              onClick={() => handleNavigation(item.view)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading restaurant details...</Typography>
        </Box>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <RestaurantDashboardContent user={user} restaurant={restaurant} />;
      case 'menu':
        return <MenuManagement restaurant={restaurant} />;
      case 'add-menu':
        return <AddMenu />;
      case 'tables':
        return <TableManagement restaurant={restaurant} />;
      case 'orders':
        return <OrdersManagement />;
      default:
        return <RestaurantDashboardContent user={user} restaurant={restaurant} />;
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Restaurant Management System
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="body2" sx={{ mr: 2 }}>
              Welcome, {user?.email}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
        >
          <Toolbar />
          {renderContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

// Dashboard Content Component
const RestaurantDashboardContent = ({ user, restaurant }) => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Dashboard
    </Typography>
    
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Restaurant Name
            </Typography>
            <Typography variant="h5" component="div">
              {restaurant?.name || user?.restaurantName}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Admin Email
            </Typography>
            <Typography variant="h6" component="div">
              {user?.email}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Phone
            </Typography>
            <Typography variant="h6" component="div">
              {restaurant?.phone || 'N/A'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              WhatsApp
            </Typography>
            <Typography variant="h6" component="div">
              {restaurant?.whatsapp || 'N/A'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {restaurant && (
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Address
              </Typography>
              <Typography variant="body1" component="div">
                {restaurant.address}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body1" component="div">
                {restaurant.summary}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )}

    <Paper sx={{ mt: 3, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Quick Actions
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Use the sidebar to navigate to different sections of your restaurant management system.
      </Typography>
    </Paper>
  </Box>
);

// Menu Content Component
const MenuContent = ({ restaurant }) => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Menu Management
    </Typography>
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {restaurant?.name} - Menu Items
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Menu management features will be implemented here.
      </Typography>
    </Paper>
  </Box>
);

// Tables Content Component
const TablesContent = ({ restaurant }) => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Table Management
    </Typography>
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {restaurant?.name} - Restaurant Tables
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Table management features will be implemented here.
      </Typography>
    </Paper>
  </Box>
);


export default RestaurantAdminDashboard;
