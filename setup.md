# Frontend Setup Guide

## 🚀 How to Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env` file in frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:3000
VITE_CHAT_MSG_URL=https://api.dify.ai/v1/chat-messages
VITE_CHAT_MSG_HEADERS={"Authorization": "Bearer app-klulT6jcUJosmAHFbNzs9of5", "Content-Type": "application/json"}
```

### 3. Start Development Server
```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Frontend will run on `http://localhost:3000`

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

### Chat Configuration (Customer Support)
To change chat settings, update these variables in `.env`:

```env
# Chat API URL (Dify AI endpoint)
VITE_CHAT_MSG_URL=https://api.dify.ai/v1/chat-messages

# Chat Headers (Bearer token for chat)
VITE_CHAT_MSG_HEADERS={"Authorization": "Bearer YOUR_CHAT_BEARER_TOKEN", "Content-Type": "application/json"}
```

**Chat Features:**
- Customer chatbot for menu questions
- Processes restaurant menu data
- Handles customer queries
- Minimize/maximize functionality
- Conversation persistence within session

### API Configuration
```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Frontend URL (for redirects)
VITE_FRONTEND_URL=http://localhost:3000
```

## 🎯 User Modules

### 1. Master Admin Module
- **Access**: `/master-admin/login`
- **Features**: Manage all restaurants, create restaurant admins
- **Components**: MasterAdminLogin, MasterAdminDashboard, RestaurantManagement

### 2. Restaurant Admin Module
- **Access**: `/restaurant-admin/login`
- **Features**: Manage menu, tables, orders for their restaurant
- **Components**: RestaurantAdminLogin, RestaurantAdminDashboard, MenuManagement, TableManagement, OrdersManagement

### 3. User Module (Customers)
- **Access**: QR code scan → `/:restaurantName/:tableId`
- **Features**: View menu, place orders, chat with restaurant
- **Components**: QRCodePage, OrderingInterface, Chatbot

## 💬 Chatbot Integration

### Features:
- Modal-based chat interface
- Minimize/maximize functionality
- Conversation persistence within session
- Typing indicators
- Error handling with user-friendly messages
- Mobile-optimized design

### Chat Flow:
1. User clicks "Chat Now" → Opens chatbot modal
2. First message: "Hi, how can I help you?"
3. User types query → Sent to Dify AI
4. Bot responds with AI-generated answer
5. User can minimize chat to view menu
6. Reopening chat shows all previous messages
7. Page refresh starts new conversation

### Data Sent to Dify AI:
```json
{
  "inputs": {
    "menu": "restaurant_menu_data_json",
    "mob_no": "+91restaurant_whatsapp_number"
  },
  "query": "user_message",
  "conversation_id": "empty_or_received_id",
  "user": "restaurantname_tablename",
  "files": [{"type": "image", "transfer_method": "remote_url", "url": "https://cloud.dify.ai/logo/logo-site.png"}]
}
```

## 🛒 Ordering System

### Order Flow:
1. User scans QR code → Accesses restaurant menu
2. User clicks "Order Now" → Opens ordering interface
3. User selects items → Adds to cart
4. User clicks "Proceed to Checkout" → Shows order summary
5. User clicks "Confirm" → 
   - Saves order to database
   - Sends SMS to restaurant
   - Shows success message

### Order Message Format:
```
Order from Table: [Table Name]

1. [Item Name] x[Quantity] ([Options]) - ₹[Price]
2. [Item Name] x[Quantity] ([Options]) - ₹[Price]

Total Price: ₹[Total Amount]

--FROM ORDER NOW BTN
```

## 🎨 UI Components

### Main Components:
- **QRCodePage** - Customer interface with menu viewer and ordering
- **OrderingInterface** - Order placement system
- **Chatbot** - AI-powered customer support
- **MasterAdminDashboard** - System administration
- **RestaurantAdminDashboard** - Restaurant management

### Styling:
- Material-UI components
- Responsive design
- Dark theme for restaurant admin
- Mobile-optimized interface

## 🚨 Troubleshooting

### Common Issues:
1. **API Connection Error**: Check VITE_API_URL in .env
2. **Chat Not Working**: Verify VITE_CHAT_MSG_HEADERS Bearer token
3. **Order Not Sending**: Check backend server is running
4. **Menu Not Loading**: Verify PDF file exists and is accessible

### Debug Logs:
- Open browser console (F12)
- Look for "=== ORDER COMPLETION START ===" logs
- Check "SMS Message Content:" for order details
- Verify "Chat request:" logs for chatbot issues

### Environment Variables:
- All VITE_ variables are required
- Bearer tokens must be valid Dify AI tokens
- API URL must match backend server address
