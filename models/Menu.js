const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    unique: true // One menu per restaurant
  },
  pdfFile: {
    type: String,
    required: true // Path to stored PDF file
  },
  processedData: {
    type: mongoose.Schema.Types.Mixed,
    required: true // The processed JSON data with IDs
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
menuSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Menu', menuSchema);
