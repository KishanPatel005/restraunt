const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const Order = require('../models/Order');
const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const restaurantName = req.body.restaurantName ? req.body.restaurantName.replace(/[^a-zA-Z0-9]/g, '_') : 'temp';
    const uploadPath = path.join('uploads', restaurantName, 'menu');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    console.log('Upload destination:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, 'menu.pdf');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Generate unique IDs for menu structure
const generateIds = (menuData, restaurantInfo) => {
  console.log('=== GENERATE IDS DEBUG ===');
  console.log('Raw menuData:', JSON.stringify(menuData, null, 2));
  console.log('menuData type:', typeof menuData);
  
  // Parse the JSON string from json_menu field
  let parsedMenuData;
  if (menuData.json_menu) {
    try {
      parsedMenuData = JSON.parse(menuData.json_menu);
      console.log('Parsed menu data:', JSON.stringify(parsedMenuData, null, 2));
    } catch (parseError) {
      console.error('Error parsing json_menu:', parseError.message);
      throw new Error('Failed to parse JSON menu data from API response');
    }
  } else {
    parsedMenuData = menuData;
  }
  
  console.log('parsedMenuData.menu:', parsedMenuData.menu);
  console.log('parsedMenuData.menu type:', typeof parsedMenuData.menu);
  
  // Check if parsed menu data has the expected structure
  if (!parsedMenuData || !parsedMenuData.menu || !parsedMenuData.menu.categories) {
    console.error('Invalid menu data structure after parsing:', parsedMenuData);
    throw new Error('Invalid menu data structure received from PDF processing API');
  }
  
  const processedData = {
    restaurant_info: {
      name: restaurantInfo.name,
      address: restaurantInfo.address,
      summary: restaurantInfo.summary,
      phone: restaurantInfo.phone,
      whatsapp: restaurantInfo.whatsapp
    },
    menu: {
      categories: parsedMenuData.menu.categories.map((category, catIndex) => ({
        cat_id: `cat_${Date.now()}_${catIndex}`,
        category_name: category.name, // API uses 'name' not 'category_name'
        subcategories: [{
          sub_cat_id: `subcat_${Date.now()}_${catIndex}_0`,
          subcategory_name: "All Items", // Single subcategory for all items
          items: category.items.map((item, itemIndex) => ({
            item_id: `item_${Date.now()}_${catIndex}_0_${itemIndex}`,
            item_name: item.name || null, // API uses 'name' not 'item_name'
            description: item.description || null,
            price: item.price || 0, // Default to 0 if price is missing
            currency: item.currency || "USD", // Default currency
            options: item.options || [],
            tags: item.tags || []
          }))
        }]
      }))
    }
  };
  
  console.log('Processed data created successfully');
  return processedData;
};

// Test PDF processing API
router.get('/test-pdf-api', async (req, res) => {
  try {
    console.log('Testing PDF processing API:', process.env.PDF_PROCESS_URL);
    
    // Test with a simple request to see if the API is reachable
    const response = await axios.get(process.env.PDF_PROCESS_URL, {
      timeout: 10000
    });
    
    res.json({ 
      success: true, 
      message: 'PDF processing API is reachable',
      status: response.status,
      data: response.data
    });
  } catch (error) {
    console.error('PDF API test error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'PDF processing API is not reachable',
      error: error.message
    });
  }
});

// Get menu for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const menu = await Menu.findOne({ restaurantId: req.params.restaurantId });
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get menu by restaurant name and table ID (for QR code scanning)
router.get('/qr/:restaurantName/:tableId', async (req, res) => {
  try {
    const { restaurantName, tableId } = req.params;
    
    // Find restaurant by name - handle both original name and sanitized name
    let restaurant = await Restaurant.findOne({ 
      name: { $regex: new RegExp(restaurantName, 'i') } 
    });
    
    // If not found with original name, try to find by sanitized name
    if (!restaurant) {
      const allRestaurants = await Restaurant.find({});
      restaurant = allRestaurants.find(r => {
        const sanitizedName = r.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return sanitizedName === restaurantName.toLowerCase();
      });
    }
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Find menu for the restaurant
    const menu = await Menu.findOne({ restaurantId: restaurant._id });
    
    if (!menu) {
      return res.status(404).json({ message: 'Menu not available for this restaurant' });
    }
    
    // Return restaurant info and menu data
    res.json({
      restaurant: {
        name: restaurant.name,
        address: restaurant.address,
        summary: restaurant.summary,
        phone: restaurant.phone,
        whatsapp: restaurant.whatsapp,
        logo: restaurant.logo
      },
      tableId: tableId,
      menu: {
        pdfFile: menu.pdfFile,
        processedData: menu.processedData
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update menu
router.post('/', upload.single('menuPdf'), async (req, res) => {
  try {
    console.log('=== MENU UPLOAD REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('PDF_PROCESS_URL:', process.env.PDF_PROCESS_URL);
    
    const { restaurantId } = req.body;
    
    if (!req.file) {
      console.log('ERROR: No PDF file uploaded');
      return res.status(400).json({ message: 'PDF file is required' });
    }
    
    // Get restaurant details
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      console.log('ERROR: Restaurant not found');
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    console.log('Restaurant found:', restaurant.name);
    
    // Process PDF with external API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    
    // Ensure we're using the correct endpoint for PDF processing
    const pdfProcessUrl = process.env.PDF_PROCESS_URL.endsWith('/') 
      ? `${process.env.PDF_PROCESS_URL}parse-menu` 
      : `${process.env.PDF_PROCESS_URL}/parse-menu`;
    
    console.log('Sending PDF to processing API:', pdfProcessUrl);
    console.log('PDF file path:', req.file.path);
    
    let processedResponse;
    try {
      const response = await axios.post(pdfProcessUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 120000 // 2 minutes timeout for PDF processing
      });
      
      console.log('PDF processing response:', response.data);
      processedResponse = response.data;
    } catch (apiError) {
      console.error('PDF processing API error:', apiError.message);
      console.error('API response:', apiError.response?.data);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ 
        message: 'PDF processing failed. Please try again with a different PDF.',
        error: 'API_ERROR',
        details: apiError.message
      });
    }
    
    // Generate IDs and add restaurant info
    let processedData;
    try {
      processedData = generateIds(processedResponse, restaurant);
    } catch (error) {
      console.error('Error generating IDs:', error.message);
      console.error('API Response that caused error:', JSON.stringify(processedResponse, null, 2));
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ 
        message: 'PDF processing failed. Invalid response format from API.',
        error: 'INVALID_RESPONSE_FORMAT',
        details: error.message,
        apiResponse: processedResponse
      });
    }
    
    // Check if menu already exists
    const existingMenu = await Menu.findOne({ restaurantId });
    
    const restaurantName = restaurant.name.replace(/[^a-zA-Z0-9]/g, '_');
    const pdfPath = `/uploads/${restaurantName}/menu/menu.pdf`;
    
    // Move the file to the correct location
    const finalUploadPath = path.join('uploads', restaurantName, 'menu');
    const finalFilePath = path.join(finalUploadPath, 'menu.pdf');
    
    // Create the final directory if it doesn't exist
    if (!fs.existsSync(finalUploadPath)) {
      fs.mkdirSync(finalUploadPath, { recursive: true });
    }
    
    // Move file from temp location to final location
    if (req.file.path !== finalFilePath) {
      fs.renameSync(req.file.path, finalFilePath);
    }
    
    const finalPdfPath = `/uploads/${restaurantName}/menu/menu.pdf`;
    console.log('Final PDF path:', finalPdfPath);
    console.log('File exists at final path:', fs.existsSync(finalFilePath));
    
    if (existingMenu) {
      // Update existing menu
      existingMenu.pdfFile = finalPdfPath;
      existingMenu.processedData = processedData;
      existingMenu.updated_at = Date.now();
      
      const updatedMenu = await existingMenu.save();
      res.json(updatedMenu);
    } else {
      // Create new menu
      const menu = new Menu({
        restaurantId,
        pdfFile: finalPdfPath,
        processedData
      });
      
      const savedMenu = await menu.save();
      res.status(201).json(savedMenu);
    }
} catch (error) {
  console.log('=== MENU UPLOAD ERROR ===');
  console.log('Error:', error.message);
  console.log('Stack:', error.stack);
  
  // Clean up uploaded file if it exists
  if (req.file && fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }
  res.status(400).json({ message: error.message });
}
});

// Update menu (replace PDF and reprocess)
router.put('/:id', upload.single('menuPdf'), async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }
    
    // Get restaurant details
    const restaurant = await Restaurant.findById(menu.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Process PDF with external API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    
    // Ensure we're using the correct endpoint for PDF processing
    const pdfProcessUrl = process.env.PDF_PROCESS_URL.endsWith('/') 
      ? `${process.env.PDF_PROCESS_URL}parse-menu` 
      : `${process.env.PDF_PROCESS_URL}/parse-menu`;
    
    console.log('Sending PDF to processing API:', pdfProcessUrl);
    console.log('PDF file path:', req.file.path);
    
    let processedResponse;
    try {
      const response = await axios.post(pdfProcessUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 120000 // 2 minutes timeout for PDF processing
      });
      
      console.log('PDF processing response:', response.data);
      processedResponse = response.data;
    } catch (apiError) {
      console.error('PDF processing API error:', apiError.message);
      console.error('API response:', apiError.response?.data);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ 
        message: 'PDF processing failed. Please try again with a different PDF.',
        error: 'API_ERROR',
        details: apiError.message
      });
    }
    
    // Generate IDs and add restaurant info
    let processedData;
    try {
      processedData = generateIds(processedResponse, restaurant);
    } catch (error) {
      console.error('Error generating IDs (update):', error.message);
      console.error('API Response that caused error:', JSON.stringify(processedResponse, null, 2));
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ 
        message: 'PDF processing failed. Invalid response format from API.',
        error: 'INVALID_RESPONSE_FORMAT',
        details: error.message,
        apiResponse: processedResponse
      });
    }
    
    // Delete old PDF file
    if (menu.pdfFile) {
      const oldPdfPath = path.join('uploads', menu.pdfFile.replace('/uploads/', ''));
      if (fs.existsSync(oldPdfPath)) {
        fs.unlinkSync(oldPdfPath);
      }
    }
    
    // Update menu
    const restaurantName = restaurant.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Move the file to the correct location
    const finalUploadPath = path.join('uploads', restaurantName, 'menu');
    const finalFilePath = path.join(finalUploadPath, 'menu.pdf');
    
    // Create the final directory if it doesn't exist
    if (!fs.existsSync(finalUploadPath)) {
      fs.mkdirSync(finalUploadPath, { recursive: true });
    }
    
    // Move file from temp location to final location
    if (req.file.path !== finalFilePath) {
      fs.renameSync(req.file.path, finalFilePath);
    }
    
    const finalPdfPath = `/uploads/${restaurantName}/menu/menu.pdf`;
    console.log('Final PDF path (update):', finalPdfPath);
    console.log('File exists at final path (update):', fs.existsSync(finalFilePath));
    
    menu.pdfFile = finalPdfPath;
    menu.processedData = processedData;
    menu.updated_at = Date.now();
    
    const updatedMenu = await menu.save();
    res.json(updatedMenu);
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete menu
router.delete('/:id', async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    
    // Delete PDF file
    if (menu.pdfFile) {
      const pdfPath = path.join('uploads', menu.pdfFile.replace('/uploads/', ''));
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }
    
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle menu active status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    
    menu.isActive = !menu.isActive;
    await menu.save();
    
    res.json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Send SMS with order summary via Dify AI
router.post('/send-sms', async (req, res) => {
  try {
    const { orderData } = req.body;
    
    if (!orderData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order data is required' 
      });
    }

    // Extract table ID from order data
    const tableId = orderData.table?.id;
    if (!tableId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Table ID is required' 
      });
    }

    // Find table in database to get table name and restaurant ID
    const table = await Table.findOne({ tableId: tableId });
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Table not found' 
      });
    }

    // Get restaurant details
    const restaurant = await Restaurant.findById(table.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }

    // Update order data with actual table name
    const updatedOrderData = {
      ...orderData,
      table: {
        ...orderData.table,
        name: table.tableName,
        id: tableId
      }
    };

    // Generate user ID in restaurantname_tablename format
    const user = `${restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${tableId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Format order summary as readable text
    let orderMessage = `Order from Table: ${updatedOrderData.table.name}\n\n`;
    
    // Add items
    if (updatedOrderData.items && updatedOrderData.items.length > 0) {
      updatedOrderData.items.forEach((item, index) => {
        orderMessage += `${index + 1}. ${item.item_name} x${item.quantity}`;
        if (item.options && item.options.length > 0) {
          orderMessage += ` (${item.options.join(', ')})`;
        }
        orderMessage += ` - ₹${item.total}\n`;
      });
    }
    
    // Add total price
    orderMessage += `\nTotal Price: ₹${updatedOrderData.order.total_amount}`;
    
    // Add source identifier
    orderMessage += `\n\n--FROM ORDER NOW BTN`;

    // Prepare Dify AI request
    const difyRequest = {
      inputs: {
        "message": orderMessage,
        "mob_no": "+919428738457"
      },
      query: ".",
      conversation_id: "",
      user: user,
      files: [
        {
          type: "image",
          transfer_method: "remote_url",
          url: "https://cloud.dify.ai/logo/logo-site.png"
        }
      ]
    };

    console.log('Sending SMS via Dify AI:', difyRequest);

    // Save order to database first
    const order = new Order({
      order_id: orderData.order.order_id,
      restaurant_id: table.restaurantId,
      table_id: tableId,
      table_name: table.tableName,
      order_summary: updatedOrderData,
      total_price: orderData.order.total_amount,
      order_time: new Date(orderData.order.timestamp)
    });

    await order.save();

    // Try to send SMS via Dify AI (but don't fail if it doesn't work)
    let smsResponse = null;
    let smsError = null;
    
    try {
      const headers = JSON.parse(process.env.SMS_MSG_HEADERS);
      smsResponse = await axios.post(process.env.SEND_SMS_URL, difyRequest, {
        headers: headers,
        timeout: 600000 // 10 minute timeout
      });
      console.log('Dify AI SMS response:', smsResponse.data);
      console.log('SMS sent successfully! Message:', smsResponse.data.answer || smsResponse.data.message || 'SMS sent via Dify AI');
      console.log('Formatted order message sent:', orderMessage);
    } catch (smsErr) {
      console.error('SMS sending failed, but order saved:', smsErr.message);
      console.error('SMS Error details:', smsErr.response?.data);
      smsError = smsErr.message;
    }

    res.json({ 
      success: true, 
      message: 'Order sent successfully and added to database',
      order_id: order.order_id,
      sms_sent: smsResponse ? true : false,
      sms_error: smsError,
      sms_message: orderMessage
    });

  } catch (error) {
    console.error('SMS sending error:', error.message);
    console.error('Error details:', error.response?.data);
    console.error('Status code:', error.response?.status);
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send order',
      error: error.message,
      details: error.response?.data,
      statusCode: error.response?.status
    });
  }
});

module.exports = router;
