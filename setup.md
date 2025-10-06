# Backend Setup Guide

## 🚀 How to Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env` file in backend directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=24h
MASTER_ADMIN_EMAIL=your_admin_email@example.com
MASTER_ADMIN_PASSWORD=your_admin_password
FRONTEND_URL=http://localhost:3000
PDF_PROCESS_URL=https://your_pdf_processing_api_url
SEND_SMS_URL=https://api.dify.ai/v1/chat-messages
SMS_MSG_HEADERS={"Authorization": "Bearer app-jTGLIdhWZKjQNwcVjRk3wZvg", "Content-Type": "application/json"}
CHAT_MSG_URL=https://api.dify.ai/v1/chat-messages
CHAT_MSG_HEADERS={"Authorization": "Bearer app-klulT6jcUJosmAHFbNzs9of5", "Content-Type": "application/json"}
```

### 3. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## 🔐 Login Credentials

### Master Admin Login
- **URL**: `http://localhost:3000/master-admin/login`
- **Email**: `nuramonks@gmail.com`
- **Password**: `123`

### Restaurant Admin Login
- **URL**: `http://localhost:3000/restaurant-admin/login`
- **Email**: `joy@gmail.com`
- **Password**: `123`

## ⚙️ Configuration Guide

### SMS Configuration (Order Notifications)
To change SMS settings, update these variables in `.env`:

```env
# SMS API URL (Dify AI endpoint)
SEND_SMS_URL=https://api.dify.ai/v1/chat-messages

# SMS Headers (Bearer token for SMS)
SMS_MSG_HEADERS={"Authorization": "Bearer YOUR_SMS_BEARER_TOKEN", "Content-Type": "application/json"}
```

**SMS Features:**
- Sends order notifications to restaurant
- Uses Dify AI to process order summaries
- Sends to WhatsApp number: +919428738457
- Message format: Order details + "--FROM ORDER NOW BTN"

### Chat Configuration (Customer Support)
To change chat settings, update these variables in `.env`:

```env
# Chat API URL (Dify AI endpoint)
CHAT_MSG_URL=https://api.dify.ai/v1/chat-messages

# Chat Headers (Bearer token for chat)
CHAT_MSG_HEADERS={"Authorization": "Bearer YOUR_CHAT_BEARER_TOKEN", "Content-Type": "application/json"}
```

**Chat Features:**
- Powers customer chatbot
- Processes restaurant menu data
- Handles customer queries
- Uses different Dify AI configuration than SMS

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/master-login` - Master admin login
- `POST /api/auth/restaurant-admin-login` - Restaurant admin login

### Restaurants
- `GET /api/restaurants` - List all restaurants
- `POST /api/restaurants` - Create restaurant
- `PUT /api/restaurants/:id` - Update restaurant
- `DELETE /api/restaurants/:id` - Delete restaurant

### Menu
- `POST /api/menu` - Upload menu PDF
- `GET /api/menu/qr/:restaurantName/:tableId` - Get menu for QR access
- `POST /api/menu/send-sms` - Send order via SMS

### Orders
- `GET /api/orders/restaurant/:restaurantId` - Get restaurant orders
- `PATCH /api/orders/:orderId/status` - Update order status

## 📱 SMS Message Format

When an order is placed, SMS is sent with this format:
```
Order from Table: [Table Name]

1. [Item Name] x[Quantity] ([Options]) - ₹[Price]
2. [Item Name] x[Quantity] ([Options]) - ₹[Price]

Total Price: ₹[Total Amount]

--FROM ORDER NOW BTN
```

## 🗄️ Database Models

- **Restaurant** - Restaurant information
- **RestaurantAdmin** - Restaurant admin accounts
- **Menu** - PDF menu storage and processed data
- **Table** - Table management with QR codes
- **Order** - Order tracking and management

## 🚨 Troubleshooting

### Common Issues:
1. **MongoDB Connection Error**: Check MONGODB_URI in .env
2. **SMS Not Sending**: Verify SMS_MSG_HEADERS Bearer token
3. **Chat Not Working**: Verify CHAT_MSG_HEADERS Bearer token
4. **PDF Processing Fails**: Check PDF_PROCESS_URL

### Logs:
- Check console for detailed error messages
- SMS logs: "Sending SMS via Dify AI:" and "SMS sent successfully!"
- Chat logs: "Sending chat request:" and "Chat response:"
