const express = require('express');
const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Get all tables for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const tables = await Table.find({ restaurantId: req.params.restaurantId }).sort({ created_at: -1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single table
router.get('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new table
router.post('/', async (req, res) => {
  try {
    const { restaurantId, tableName } = req.body;
    
    // Get restaurant details
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Check if table name already exists for this restaurant
    const existingTable = await Table.findOne({ 
      restaurantId: restaurantId, 
      tableName: tableName 
    });
    
    if (existingTable) {
      return res.status(400).json({ message: 'Table name already exists for this restaurant' });
    }
    
    // Generate table ID
    const tableId = `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate QR link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const restaurantName = restaurant.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const qrLink = `${frontendUrl}/${restaurantName}/${tableId}`;
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(qrLink);
    
    // Save QR code as image
    const qrDir = path.join('uploads', restaurantName, 'qrcodes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
    
    const qrFileName = `table_${tableId}.png`;
    const qrPath = path.join(qrDir, qrFileName);
    const qrImagePath = `/uploads/${restaurantName}/qrcodes/${qrFileName}`;
    
    // Convert data URL to buffer and save
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(qrPath, buffer);
    
    // Create table
    const table = new Table({
      tableName,
      tableId,
      qrCode: qrImagePath,
      qrLink,
      restaurantId
    });
    
    const savedTable = await table.save();
    res.status(201).json(savedTable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update table
router.put('/:id', async (req, res) => {
  try {
    const { tableName, isActive } = req.body;
    
    // Get the existing table to check restaurant
    const existingTable = await Table.findById(req.params.id);
    if (!existingTable) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Check if table name already exists for this restaurant (excluding current table)
    if (tableName && tableName !== existingTable.tableName) {
      const duplicateTable = await Table.findOne({ 
        restaurantId: existingTable.restaurantId, 
        tableName: tableName,
        _id: { $ne: req.params.id }
      });
      
      if (duplicateTable) {
        return res.status(400).json({ message: 'Table name already exists for this restaurant' });
      }
    }
    
    const updateData = {
      tableName,
      isActive,
      updated_at: Date.now()
    };
    
    const table = await Table.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    res.json(table);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle table active status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    table.isActive = !table.isActive;
    await table.save();
    
    res.json(table);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete table
router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Delete QR code file
    if (table.qrCode) {
      const qrFilePath = path.join('uploads', table.qrCode.replace('/uploads/', ''));
      if (fs.existsSync(qrFilePath)) {
        fs.unlinkSync(qrFilePath);
      }
    }
    
    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get next table number for a restaurant
router.get('/restaurant/:restaurantId/next-number', async (req, res) => {
  try {
    const tableCount = await Table.countDocuments({ restaurantId: req.params.restaurantId });
    const nextNumber = tableCount + 1;
    res.json({ nextTableName: `Table ${nextNumber}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
