const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableName: {
    type: String,
    required: true,
    trim: true
  },
  tableId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  qrCode: {
    type: String,
    default: ''
  },
  qrLink: {
    type: String,
    required: true,
    trim: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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
tableSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Table', tableSchema);
