const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  table_id: {
    type: String,
    required: true,
    trim: true
  },
  table_name: {
    type: String,
    required: true,
    trim: true
  },
  order_summary: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  order_time: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
orderSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
