# Restaurant Management System - Backend

Express.js backend for the restaurant management system.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp env.example .env
   ```

3. Update `.env` with your MongoDB connection:
   ```
   MONGODB_URI=mongodb://localhost:27017/restaurant_management
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication
- `POST /api/auth/master-login` - Master admin login

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `POST /api/restaurants` - Create restaurant (with file upload)
- `PUT /api/restaurants/:id` - Update restaurant
- `PATCH /api/restaurants/:id/toggle-status` - Toggle active status
- `DELETE /api/restaurants/:id` - Delete restaurant

## File Upload

Restaurant logos are uploaded to `uploads/{restaurant_name}/logo.{extension}`


