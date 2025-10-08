import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  Fade,
  Slide,
  Divider,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Send as SendIcon,
  Chat as ChatIcon,
  SmartToy as BotIcon
} from '@mui/icons-material';

const Chatbot = ({ 
  open, 
  onClose, 
  onMinimize, 
  restaurantData, 
  tableId, 
  restaurantName 
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize chat with welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        type: 'bot',
        message: 'Hi, how can I help you?',
        timestamp: new Date()
      }]);
    }
  }, [open]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [open]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to render markdown-like text
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Split by both \n and actual line breaks
    const lines = text.split(/\n|\\n/);
    
    return lines.map((line, lineIndex) => {
      // Simple approach: find **text** patterns and replace them
      const elements = [];
      let remainingText = line;
      let key = 0;
      
      while (remainingText.length > 0) {
        const boldMatch = remainingText.match(/\*\*([^*]+)\*\*/);
        
        if (boldMatch) {
          // Add text before bold
          if (boldMatch.index > 0) {
            elements.push(
              <Typography key={key++} component="span">
                {remainingText.substring(0, boldMatch.index)}
              </Typography>
            );
          }
          
          // Add bold text
          elements.push(
            <Typography key={key++} component="span" sx={{ fontWeight: 'bold' }}>
              {boldMatch[1]}
            </Typography>
          );
          
          // Update remaining text
          remainingText = remainingText.substring(boldMatch.index + boldMatch[0].length);
        } else {
          // No more bold patterns, add remaining text
          if (remainingText.trim()) {
            elements.push(
              <Typography key={key++} component="span">
                {remainingText}
              </Typography>
            );
          }
          break;
        }
      }
      
      return (
        <Box key={lineIndex} sx={{ mb: lineIndex < lines.length - 1 ? 1 : 0 }}>
          {elements}
        </Box>
      );
    });
  };

  const handleMinimize = () => {
    console.log('Chatbot handleMinimize called');
    setIsMinimized(true);
    onMinimize();
  };

  const handleDialogClose = () => {
    // When clicking outside, minimize instead of close
    handleMinimize();
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleClose = () => {
    setMessages([]);
    setConversationId('');
    setInputMessage('');
    onClose();
  };

  const cleanPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Add +91 prefix
    return `+91${cleaned}`;
  };

  const prepareMenuData = () => {
    if (!restaurantData?.menu?.processedData) return null;

    const { restaurant_info, menu } = restaurantData.menu.processedData;
    
    return {
      restaurant_info: {
        name: restaurant_info?.name || restaurantData.restaurant?.name,
        address: restaurant_info?.address || restaurantData.restaurant?.address,
        summary: restaurant_info?.summary || restaurantData.restaurant?.summary,
        phone: restaurant_info?.phone || restaurantData.restaurant?.phone,
        whatsapp: restaurant_info?.whatsapp || restaurantData.restaurant?.whatsapp
      },
      menu: menu
    };
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const menuData = prepareMenuData();
      const user = `${restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${tableId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      
      const requestBody = {
        inputs: {
          menu: JSON.stringify(menuData),
          mob_no: cleanPhoneNumber(restaurantData?.restaurant?.whatsapp)
        },
        query: inputMessage.trim(),
        conversation_id: conversationId,
        user: user,
        files: [
          {
            type: "image",
            transfer_method: "remote_url",
            url: "https://cloud.dify.ai/logo/logo-site.png"
          }
        ]
      };

      const headers = {
        'Authorization': 'Bearer app-klulT6jcUJosmAHFbNzs9of5',
        'Content-Type': 'application/json'
      };
      
      const apiUrl = import.meta.env.VITE_CHAT_MSG_URL || 'https://api.dify.ai/v1/chat-messages';
      
      console.log('Sending chat request:', {
        url: apiUrl,
        headers,
        body: requestBody
      });
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      console.log('Chat response:', data);
      
      // Update conversation ID if received
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        message: data.answer || data.message || 'Sorry, I could not process your request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      alert('Please try again');
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const MessageBubble = ({ message }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
        mb: 2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          maxWidth: '80%',
          flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
        }}
      >
        <Avatar
          sx={{
            bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main',
            width: 32,
            height: 32,
            mx: 1
          }}
        >
          {message.type === 'user' ? <ChatIcon /> : <BotIcon />}
        </Avatar>
        <Paper
          sx={{
            p: 2,
            bgcolor: message.type === 'user' ? 'primary.main' : 'grey.100',
            color: message.type === 'user' ? 'white' : 'text.primary',
            borderRadius: 2,
            wordBreak: 'break-word'
          }}
        >
          <Typography variant="body2" component="div">
            {renderMarkdown(message.message)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              opacity: 0.7,
              fontSize: '0.7rem'
            }}
          >
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );

  // Remove the minimized button - it will be handled by the parent component

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '600px',
          borderRadius: 2,
          position: 'relative'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BotIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Restaurant Assistant
          </Typography>
        </Box>
        <Box>
          <IconButton
            onClick={handleMinimize}
            sx={{ color: 'white', mr: 1 }}
            size="small"
          >
            <MinimizeIcon />
          </IconButton>
          <IconButton
            onClick={handleClose}
            sx={{ color: 'white' }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              mb: 2
            }}
          >
            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, mx: 1 }}>
              <BotIcon />
            </Avatar>
            <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Bot is typing...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Input */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            ref={inputRef}
            fullWidth
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
            multiline
            maxRows={3}
          />
          <IconButton
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            color="primary"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Dialog>
  );
};

export default Chatbot;
