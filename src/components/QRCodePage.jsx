import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Chat as ChatIcon,
  ShoppingCart as OrderIcon,
  PictureAsPdf as PdfIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ZoomOutMap as ResetZoomIcon,
  KeyboardArrowUp as ScrollUpIcon,
  KeyboardArrowDown as ScrollDownIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import OrderingInterface from './OrderingInterface';
import Chatbot from './Chatbot';

// Configure PDF.js worker - use local file to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

const QRCodePage = () => {
  const { restaurantName, tableId } = useParams();
  const [restaurantData, setRestaurantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [isZooming, setIsZooming] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [showAllPages, setShowAllPages] = useState(false);
  const [showOrderingInterface, setShowOrderingInterface] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [isChatbotMinimized, setIsChatbotMinimized] = useState(false);
  
  // Ordering state - moved to parent to persist across minimize/maximize
  const [selectedItems, setSelectedItems] = useState({});
  const [quantities, setQuantities] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchRestaurantData();
  }, [restaurantName, tableId]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/menu/qr/${restaurantName}/${tableId}`);
      
      if (response.ok) {
        const data = await response.json();
        setRestaurantData(data);
      } else {
        setError('Restaurant or menu not found');
      }
    } catch (err) {
      setError('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const handleChatNow = () => {
    // Always show chatbot and maximize it
    setShowChatbot(true);
    setIsChatbotMinimized(false);
  };

  const handleOrderNow = () => {
    setShowOrderingInterface(true);
  };

  const handleMinimizeOrdering = () => {
    setShowOrderingInterface(false);
  };

  const handleBackToMenu = () => {
    setShowOrderingInterface(false);
  };

  const handleChatbotClose = () => {
    setShowChatbot(false);
    setIsChatbotMinimized(false);
  };

  const handleChatbotMinimize = () => {
    console.log('Minimizing chat...');
    setIsChatbotMinimized(true);
    setShowChatbot(false); // Hide the modal when minimizing
  };


  // Ordering state handlers
  const handleItemToggle = (itemId, isSelected) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: isSelected
    }));
  };

  const handleQuantityChange = (itemId, change) => {
    setQuantities(prev => {
      const currentQty = prev[itemId] || 1;
      const newQty = Math.max(1, currentQty + change);
      return {
        ...prev,
        [itemId]: newQty
      };
    });
  };

  const handleOptionToggle = (itemId, optionName, optionPrice) => {
    setSelectedOptions(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [optionName]: !prev[itemId]?.[optionName]
      }
    }));
  };

  const handleOrderComplete = async (orderSummary) => {
    try {
      console.log('=== ORDER COMPLETION START ===');
      console.log('Order Summary to be sent:', orderSummary);
      
      // Send SMS with order summary
      const response = await apiRequest('/menu/send-sms', {
        method: 'POST',
        body: JSON.stringify({
          orderData: orderSummary
        })
      });

      const result = await response.json();
      console.log('=== ORDER COMPLETION RESPONSE ===');
      console.log('Full response:', result);

      if (result.success) {
        // Order was saved to database successfully
        if (result.sms_sent) {
          console.log('=== SMS SUCCESS ===');
          console.log('SMS sent successfully! Order added to database.');
          console.log('SMS Message Content:', result.sms_message);
          console.log('Order ID:', result.order_id);
          alert(`Thank you for your order! Message sent successfully. Sent message is: ${result.sms_message}`);
        } else {
          console.log('=== SMS FAILED ===');
          console.log('SMS failed but order added to database.');
          console.log('SMS Error:', result.sms_error);
          console.log('Order ID:', result.order_id);
          alert(`Thank you for your order! Your order has been added to the database. SMS Error: ${result.sms_error}. Please contact the restaurant directly for confirmation.`);
        }
        // Clear all ordering state after successful checkout
        setSelectedItems({});
        setQuantities({});
        setSelectedOptions({});
        setShowOrderingInterface(false);
      } else {
        console.error('Order Error Details:', result);
        const errorMsg = result.details?.message || result.error || 'Unknown error';
        const statusCode = result.statusCode || 'Unknown';
        alert(`Order failed (Error ${statusCode}: ${errorMsg}). Please try again or contact the restaurant directly.`);
      }
    } catch (error) {
      console.error('Error sending order:', error);
      alert('Order placed but failed to send notification. Please contact the restaurant directly.');
      // Still clear state even if SMS fails
      setSelectedItems({});
      setQuantities({});
      setSelectedOptions({});
      setShowOrderingInterface(false);
    }
  };

  const handleDownloadMenu = async () => {
    if (restaurantData?.menu?.pdfFile) {
      try {
        // Use environment variable for API base URL
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const pdfUrl = `${baseUrl}${restaurantData.menu.pdfFile}`;
        
        // Fetch the PDF file
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        
        // Create a blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${restaurantData.restaurant.name}_menu.pdf`;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Download failed:', error);
        // Fallback to direct link if fetch fails
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const pdfUrl = `${baseUrl}${restaurantData.menu.pdfFile}`;
        window.open(pdfUrl, '_blank');
      }
    }
  };


  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setPdfLoading(false);
    setError('Failed to load PDF. Please try refreshing the page.');
  };

  const nextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(prev => prev - 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
  };


  // Calculate distance between two touch points
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Handle touch events for pinch zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setIsZooming(true);
      setLastTouchDistance(getTouchDistance(e.touches));
      e.preventDefault();
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && isZooming) {
      const currentDistance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const scaleChange = currentDistance / lastTouchDistance;
        const newScale = scale * scaleChange;
        // Smooth the zoom change for better responsiveness
        const smoothedScale = Math.max(0.5, Math.min(3, newScale));
        setScale(prevScale => {
          const diff = Math.abs(smoothedScale - prevScale);
          // Only update if the change is significant enough
          return diff > 0.05 ? smoothedScale : prevScale;
        });
      }
      setLastTouchDistance(currentDistance);
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      setIsZooming(false);
      setLastTouchDistance(0);
    }
  };

  // Handle scroll events
  const handleScroll = (e) => {
    const element = e.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    setScrollPosition(scrollTop);
    setMaxScroll(scrollHeight - clientHeight);
    
    // Show scroll indicator if there's more content to scroll
    setShowScrollIndicator(scrollTop < scrollHeight - clientHeight - 10);
  };

  // Scroll to top function
  const scrollToTop = () => {
    const pdfContainer = document.querySelector('[data-pdf-container]');
    if (pdfContainer) {
      pdfContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Toggle between single page and all pages view
  const toggleAllPages = () => {
    setShowAllPages(prev => !prev);
    if (!showAllPages) {
      setPageNumber(1); // Reset to first page when showing all
    }
  };


  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading menu...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  // Show ordering interface if enabled
  if (showOrderingInterface) {
    console.log('Restaurant Data:', restaurantData);
    console.log('Menu Data:', restaurantData?.menu?.processedData?.menu);
    return (
      <OrderingInterface 
        menuData={restaurantData?.menu?.processedData?.menu}
        onMinimize={handleMinimizeOrdering}
        onBackToMenu={handleBackToMenu}
        onOrderComplete={handleOrderComplete}
        // Pass ordering state
        selectedItems={selectedItems}
        quantities={quantities}
        selectedOptions={selectedOptions}
        // Pass ordering handlers
        onItemToggle={handleItemToggle}
        onQuantityChange={handleQuantityChange}
        onOptionToggle={handleOptionToggle}
        // Pass restaurant and table data
        restaurantData={restaurantData}
        tableId={tableId}
        restaurantName={restaurantName}
      />
    );
  }

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        position: 'relative'
      }}
    >
      {/* Chatbot Component */}
      <Chatbot
        open={showChatbot}
        onClose={handleChatbotClose}
        onMinimize={handleChatbotMinimize}
        restaurantData={restaurantData}
        tableId={tableId}
        restaurantName={restaurantName}
      />

      {/* PDF Display - Mobile Optimized */}
      <Box 
        sx={{ 
          flex: 1, 
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {restaurantData?.menu?.pdfFile ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* PDF Viewer - Mobile Optimized */}
            <Box 
              sx={{ 
                flex: 1, 
                overflow: 'hidden',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 80px)', // Account for sticky buttons
                minHeight: 0, // Important for flex scrolling
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Navigation and Zoom Controls - No Paper wrapper */}
              <Box 
                sx={{ 
                  p: 1, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexShrink: 0,
                  backgroundColor: '#f8f9fa',
                  gap: 1,
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                {/* Page Navigation */}
                {numPages && numPages > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton 
                      size="small" 
                      onClick={prevPage} 
                      disabled={pageNumber <= 1 || showAllPages}
                      sx={{ p: 0.5 }}
                    >
                      <PrevIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ minWidth: '60px', textAlign: 'center' }}>
                      {showAllPages ? `All ${numPages}` : `${pageNumber} / ${numPages}`}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={nextPage} 
                      disabled={pageNumber >= numPages || showAllPages}
                      sx={{ p: 0.5 }}
                    >
                      <NextIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={toggleAllPages}
                      sx={{ p: 0.5 }}
                      title={showAllPages ? "Show Single Page" : "Show All Pages"}
                    >
                      <Typography variant="caption">
                        {showAllPages ? "1️⃣" : "📄"}
                      </Typography>
                    </IconButton>
                  </Box>
                )}

                {/* Zoom Controls and Download */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton 
                    size="small" 
                    onClick={zoomOut}
                    disabled={scale <= 0.5}
                    sx={{ p: 0.5 }}
                    title="Zoom Out"
                  >
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      minWidth: '50px', 
                      textAlign: 'center',
                      color: isZooming ? 'primary.main' : 'text.primary',
                      fontWeight: isZooming ? 'bold' : 'normal'
                    }}
                  >
                    {Math.round(scale * 100)}%
                    {isZooming && ' 🔍'}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={zoomIn}
                    disabled={scale >= 3}
                    sx={{ p: 0.5 }}
                    title="Zoom In"
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={resetZoom}
                    sx={{ p: 0.5 }}
                    title="Reset Zoom"
                  >
                    <ResetZoomIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDownloadMenu();
                    }}
                    sx={{ p: 0.5, ml: 1 }}
                    title="Download Menu PDF"
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* PDF Document */}
              <Box 
                data-pdf-container
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onScroll={handleScroll}
                sx={{ 
                  flex: 1, 
                  overflow: 'auto',
                  overflowX: 'hidden',
                  overflowY: 'auto', 
                  display: 'block',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  p: { xs: '20px 0', sm: '20px 1' },
                  scrollBehavior: 'smooth',
                  touchAction: 'pan-x pan-y pinch-zoom',
                  position: 'relative',
                  height: 'calc(100vh - 140px)', // Increased space for controls
                  minHeight: 'calc(100vh - 140px)',
                  maxHeight: 'calc(100vh - 140px)',
                  // Enhanced scrolling for better mobile experience
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  },
                  // Hide scrollbar for Firefox
                  scrollbarWidth: 'none',
                  // Hide scrollbar for IE and Edge
                  msOverflowStyle: 'none',
                  '& .react-pdf__Page': {
                    margin: '20px auto 20px auto', // Increased top margin to prevent cutoff
                    transition: isZooming ? 'none' : 'transform 0.2s ease-in-out',
                    cursor: isZooming ? 'grabbing' : 'grab',
                    display: 'block',
                    '&:active': {
                      cursor: 'grabbing'
                    },
                    // Ensure pages don't get cut off
                    minHeight: 'fit-content',
                    maxWidth: '100%',
                    // Center the page content
                    textAlign: 'center'
                  },
                  '& .react-pdf__Document': {
                    display: 'block',
                    width: '100%',
                    minHeight: '100%',
                    padding: isMobile ? '20px 0' : '30px 0',
                    boxSizing: 'border-box'
                  }
                }}
              >
                {pdfLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Loading PDF...
                    </Typography>
                  </Box>
                )}

                <Document
                  file={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${restaurantData.menu.pdfFile}`}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  onLoadStart={() => setPdfLoading(true)}
                  loading={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        Loading PDF...
                      </Typography>
                    </Box>
                  }
                  error={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                      <PdfIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                      <Typography variant="h6" color="error" gutterBottom>
                        Failed to load PDF
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                        The PDF could not be loaded. Please try refreshing the page.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => window.location.reload()}
                        sx={{
                          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #42a5f5 30%, #1976d2 90%)',
                          }
                        }}
                      >
                        Refresh Page
                      </Button>
                    </Box>
                  }
                >
                  <Box sx={{ 
                    display: isMobile ? 'block' : 'flex', 
                    flexDirection: 'column', 
                    alignItems: isMobile ? 'flex-start' : 'center', 
                    width: '100%' 
                  }}>
                    {showAllPages && numPages > 1 ? (
                      // Show all pages when in all pages mode
                      Array.from({ length: numPages }, (_, index) => (
                        <Page
                          key={index + 1}
                          pageNumber={index + 1}
                          scale={isMobile ? scale * 0.8 : scale * 0.8}
                          width={isMobile ? window.innerWidth - 20 : Math.min(window.innerWidth - 100, 600)}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      ))
                    ) : (
                      // Show single page
                      <Page
                        pageNumber={pageNumber}
                        scale={isMobile ? scale : scale}
                        width={isMobile ? window.innerWidth - 20 : Math.min(window.innerWidth - 100, 800)}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    )}
                  </Box>
                </Document>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              backgroundColor: '#f5f5f5',
              minHeight: '400px'
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Menu not available
            </Typography>
          </Box>
        )}
      </Box>


      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 120,
            right: 16,
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: 2,
            p: 1,
            color: 'white'
          }}
        >
          <Tooltip title="Scroll to Top">
            <IconButton 
              size="small" 
              onClick={scrollToTop}
              sx={{ color: 'white' }}
            >
              <ScrollUpIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '10px' }}>
            Scroll
          </Typography>
        </Box>
      )}

      {/* Scroll Progress Indicator */}
      {maxScroll > 0 && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: 'rgba(0,0,0,0.1)',
            zIndex: 1002
          }}
        >
          <Box
            sx={{
              height: '100%',
              backgroundColor: 'primary.main',
              width: `${(scrollPosition / maxScroll) * 100}%`,
              transition: 'width 0.1s ease-out'
            }}
          />
        </Box>
      )}


      {/* Sticky Action Buttons at Bottom */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: { xs: 1, sm: 2 },
          zIndex: 1000,
          flexShrink: 0
        }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={<ChatIcon sx={{ fontSize: { xs: '18px', sm: '20px' } }} />}
          onClick={handleChatNow}
          sx={{
            minWidth: { xs: 150, sm: 180 },
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontWeight: 'bold',
            borderRadius: '25px',
            background: 'linear-gradient(45deg, #25D366 30%, #128C7E 90%)',
            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #128C7E 30%, #25D366 90%)',
              boxShadow: '0 6px 20px rgba(37, 211, 102, 0.6)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isChatbotMinimized ? 'Open Chat' : 'Chat Now'} {isChatbotMinimized ? '' : ''}
        </Button>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<OrderIcon sx={{ fontSize: { xs: '18px', sm: '20px' } }} />}
          onClick={handleOrderNow}
          sx={{
            minWidth: { xs: 150, sm: 180 },
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontWeight: 'bold',
            borderRadius: '25px',
            background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #FF8E53 30%, #FF6B6B 90%)',
              boxShadow: '0 6px 20px rgba(255, 107, 107, 0.6)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Order Now
        </Button>
        
      </Box>
    </Box>
  );
};

export default QRCodePage;