# Chatbot Integration

## Overview
The chatbot integration replaces the WhatsApp "Chat Now" functionality with an AI-powered chatbot using Dify AI.

## Features
- ✅ Modal-based chat interface
- ✅ Minimize/maximize functionality
- ✅ Conversation persistence within session
- ✅ Typing indicators
- ✅ Error handling with user-friendly messages
- ✅ Mobile-optimized design

## Environment Variables
Add these to your `.env` file:

```env
VITE_CHAT_MSG_URL=https://api.dify.ai/v1/chat-messages
VITE_CHAT_MSG_HEADERS={"Authorization": "Bearer app-klulT6jcUJosmAHFbNzs9of5", "Content-Type": "application/json"}
```

## API Integration
The chatbot sends requests to Dify AI with:
- **Restaurant menu data** in the `inputs.menu` field
- **WhatsApp number** (with +91 prefix) in the `inputs.mob_no` field
- **User ID** in format: `restaurantname_tablename`
- **Conversation ID** for maintaining chat context

## Usage Flow
1. User clicks "Chat Now" → Opens chatbot modal
2. First message: "Hi, how can I help you?"
3. User types query → Sent to Dify AI
4. Bot responds with AI-generated answer
5. User can minimize chat to view menu
6. Reopening chat shows all previous messages
7. Page refresh starts new conversation

## Components
- `Chatbot.jsx` - Main chatbot component
- `QRCodePage.jsx` - Updated to use chatbot instead of WhatsApp

## Testing
1. Ensure environment variables are set
2. Test with a restaurant that has menu data
3. Check browser console for API request/response logs
4. Verify conversation ID persistence
5. Test minimize/maximize functionality
