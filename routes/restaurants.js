const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Restaurant = require('../models/Restaurant');
const RestaurantAdmin = require('../models/RestaurantAdmin');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const restaurantName = req.body.name ? req.body.name.replace(/[^a-zA-Z0-9]/g, '_') : 'temp';
    const uploadPath = path.join('uploads', restaurantName);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, 'logo' + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ created_at: -1 });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single restaurant
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get restaurant by admin email (for restaurant admin dashboard)
router.get('/admin/:email', async (req, res) => {
  try {
    const restaurantAdmin = await RestaurantAdmin.findOne({ email: req.params.email });
    if (!restaurantAdmin) {
      return res.status(404).json({ message: 'Restaurant admin not found' });
    }
    
    const restaurant = await Restaurant.findById(restaurantAdmin.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new restaurant
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const { name, address, summary, phone, whatsapp, restaurant_admin_email, restaurant_admin_password } = req.body;
    
    // Create restaurant
    const restaurant = new Restaurant({
      name,
      address,
      summary,
      phone,
      whatsapp,
      logo: req.file ? `/uploads/${name.replace(/[^a-zA-Z0-9]/g, '_')}/logo${path.extname(req.file.originalname)}` : ''
    });
    
    const savedRestaurant = await restaurant.save();
    
    // Create restaurant admin
    const restaurantAdmin = new RestaurantAdmin({
      email: restaurant_admin_email,
      password: restaurant_admin_password, // Not hashed as per requirements
      restaurantId: savedRestaurant._id
    });
    
    await restaurantAdmin.save();
    
    res.status(201).json(savedRestaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update restaurant
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    const { name, address, summary, phone, whatsapp, restaurant_admin_email, restaurant_admin_password } = req.body;
    
    const updateData = {
      name,
      address,
      summary,
      phone,
      whatsapp,
      updated_at: Date.now()
    };
    
    // Handle logo update
    if (req.file) {
      updateData.logo = `/uploads/${name.replace(/[^a-zA-Z0-9]/g, '_')}/logo${path.extname(req.file.originalname)}`;
    }
    
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Update restaurant admin if provided
    if (restaurant_admin_email || restaurant_admin_password) {
      const updateAdminData = {};
      if (restaurant_admin_email) updateAdminData.email = restaurant_admin_email;
      if (restaurant_admin_password) updateAdminData.password = restaurant_admin_password;
      
      await RestaurantAdmin.findOneAndUpdate(
        { restaurantId: req.params.id },
        updateAdminData
      );
    }
    
    res.json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle restaurant active status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();
    
    res.json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete restaurant
router.delete('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Delete restaurant admin
    await RestaurantAdmin.findOneAndDelete({ restaurantId: req.params.id });
    
    // Delete restaurant
    await Restaurant.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
