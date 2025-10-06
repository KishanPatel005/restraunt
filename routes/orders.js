const express = require('express');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all orders for a restaurant (restaurant admin only)
router.get('/restaurant/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    // Check if user is restaurant admin for this restaurant
    if (req.user.role === 'restaurant_admin' && req.user.restaurantId.toString() !== restaurantId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Build query
    const query = { restaurant_id: restaurantId };
    if (status) {
      query.status = status;
    }
    
    // Get orders with pagination
    const orders = await Order.find(query)
      .populate('restaurant_id', 'name address phone whatsapp email')
      .sort({ order_time: -1 }) // Descending order by order time
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Get total count
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalOrders: total
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order details
router.get('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ order_id: orderId })
      .populate('restaurant_id', 'name address phone whatsapp email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user has access to this order
    if (req.user.role === 'restaurant_admin' && req.user.restaurantId.toString() !== order.restaurant_id._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({
      success: true,
      order
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.patch('/:orderId/status', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findOne({ order_id: orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user has access to this order
    if (req.user.role === 'restaurant_admin' && req.user.restaurantId.toString() !== order.restaurant_id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    order.status = status;
    order.updated_at = new Date();
    await order.save();
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order statistics
router.get('/stats/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Check if user is restaurant admin for this restaurant
    if (req.user.role === 'restaurant_admin' && req.user.restaurantId.toString() !== restaurantId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const stats = await Order.aggregate([
      { $match: { restaurant_id: restaurantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total_price' }
        }
      }
    ]);
    
    const totalOrders = await Order.countDocuments({ restaurant_id: restaurantId });
    const totalRevenue = await Order.aggregate([
      { $match: { restaurant_id: restaurantId } },
      { $group: { _id: null, total: { $sum: '$total_price' } } }
    ]);
    
    res.json({
      success: true,
      stats,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
    
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



