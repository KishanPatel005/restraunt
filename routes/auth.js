const express = require('express');
const jwt = require('jsonwebtoken');
const RestaurantAdmin = require('../models/RestaurantAdmin');
const Restaurant = require('../models/Restaurant');
const router = express.Router();

// Master admin login (static)
router.post('/master-login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === process.env.MASTER_ADMIN_EMAIL && password === process.env.MASTER_ADMIN_PASSWORD) {
    // Generate JWT token
    const token = jwt.sign(
      { 
        email: email, 
        role: 'master_admin' 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    res.json({
      success: true,
      message: 'Master admin login successful',
      token: token,
      user: {
        email: email,
        role: 'master_admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Restaurant admin login
router.post('/restaurant-admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find restaurant admin
    const restaurantAdmin = await RestaurantAdmin.findOne({ email: email.toLowerCase() });
    
    if (!restaurantAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password (not hashed as per requirements)
    if (restaurantAdmin.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Get restaurant details
    const restaurant = await Restaurant.findById(restaurantAdmin.restaurantId);
    
    if (!restaurant) {
      return res.status(401).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Check if restaurant is active
    if (!restaurant.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Restaurant account is deactivated'
      });
    }
    
    // Update last login
    restaurantAdmin.last_login = new Date();
    await restaurantAdmin.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        email: restaurantAdmin.email, 
        role: 'restaurant_admin',
        restaurantId: restaurantAdmin.restaurantId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    res.json({
      success: true,
      message: 'Restaurant admin login successful',
      token: token,
      user: {
        email: restaurantAdmin.email,
        role: 'restaurant_admin',
        restaurantId: String(restaurantAdmin.restaurantId),
        restaurantName: restaurant.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;


