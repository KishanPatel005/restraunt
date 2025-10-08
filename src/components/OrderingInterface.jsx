import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  Button,
  Divider,
  Chip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Minimize as MinimizeIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const OrderingInterface = ({ 
  menuData, 
  onMinimize, 
  onBackToMenu, 
  onOrderComplete,
  // Ordering state props
  selectedItems,
  quantities,
  selectedOptions,
  // Ordering handler props
  onItemToggle,
  onQuantityChange,
  onOptionToggle,
  // Restaurant and table data
  restaurantData,
  tableId,
  restaurantName
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Initialize expanded categories only
  useEffect(() => {
    if (menuData?.categories) {
      const initialExpanded = {};
      
      // Auto-expand the first category
      if (menuData.categories.length > 0) {
        initialExpanded[menuData.categories[0].cat_id] = true;
      }
      
      setExpandedCategories(initialExpanded);
    }
  }, [menuData]);

  // State management functions are now handled by parent component

  const handleCategoryToggle = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const calculateItemPrice = (item) => {
    try {
      // Handle undefined or null price
      if (!item.price) {
        console.log('No price for item:', item.item_name);
        return 0;
      }
      
      // Debug logging
      console.log('Calculating price for:', item.item_name, 'Price:', item.price, 'Type:', typeof item.price);
      
      // Convert price to string if it's a number, then parse
      let priceStr = typeof item.price === 'string' ? item.price : String(item.price);
      const basePrice = parseFloat(priceStr.replace('$', ''));
      
      // Check if parsing was successful
      if (isNaN(basePrice)) {
        console.log('Failed to parse price:', priceStr, 'for item:', item.item_name);
        return 0;
      }
      
      let totalPrice = basePrice;
      console.log('Base price for', item.item_name, ':', basePrice);
      
      // Add selected options
      const itemOptions = selectedOptions[item.item_id] || {};
      Object.entries(itemOptions).forEach(([optionName, isSelected]) => {
        if (isSelected) {
          const option = item.options?.find(opt => opt.name === optionName);
          if (option && option.price) {
            let optionPriceStr = typeof option.price === 'string' ? option.price : String(option.price);
            const optionPrice = parseFloat(optionPriceStr.replace('+$', ''));
            if (!isNaN(optionPrice)) {
              totalPrice += optionPrice;
              console.log('Added option', optionName, 'price:', optionPrice, 'total now:', totalPrice);
            }
          }
        }
      });
      
      console.log('Final price for', item.item_name, ':', totalPrice);
      return totalPrice;
    } catch (error) {
      console.error('Error calculating item price:', error, 'Item:', item);
      return 0;
    }
  };

  const calculateTotal = () => {
    let total = 0;
    if (!selectedItems || !quantities) {
      return 0;
    }
    
    Object.entries(selectedItems).forEach(([itemId, isSelected]) => {
      if (isSelected) {
        const item = findItemById(itemId);
        if (item) {
          const itemPrice = calculateItemPrice(item);
          const quantity = quantities[itemId] || 1;
          total += itemPrice * quantity;
        }
      }
    });
    return total || 0;
  };

  const findItemById = (itemId) => {
    if (!menuData?.categories) return null;
    
    for (const category of menuData.categories) {
      for (const subcategory of category.subcategories || []) {
        for (const item of subcategory.items || []) {
          if (item.item_id === itemId) {
            return item;
          }
        }
      }
    }
    return null;
  };

  const getSelectedItemsList = () => {
    const items = [];
    Object.entries(selectedItems).forEach(([itemId, isSelected]) => {
      if (isSelected) {
        const item = findItemById(itemId);
        if (item) {
          const quantity = quantities[itemId] || 1;
          const itemPrice = calculateItemPrice(item);
          const selectedOpts = selectedOptions[itemId] || {};
          const selectedOptionsList = Object.entries(selectedOpts)
            .filter(([_, isSelected]) => isSelected)
            .map(([optionName, _]) => {
              const option = item.options?.find(opt => opt.name === optionName);
              return option ? `${optionName} (${option.price})` : optionName;
            });
          
          console.log('Item:', item.item_name, 'Price:', itemPrice, 'Quantity:', quantity, 'Total:', itemPrice * quantity);
          
          // Find category and subcategory info
          let categoryInfo = { category_id: 'unknown', category_name: 'Unknown Category' };
          let subcategoryInfo = { subcategory_id: 'unknown', subcategory_name: 'All Items' };
          
          if (menuData?.categories) {
            for (const category of menuData.categories) {
              if (category.subcategories) {
                for (const subcategory of category.subcategories) {
                  if (subcategory.items?.some(subItem => subItem.item_id === itemId)) {
                    categoryInfo = {
                      category_id: category.cat_id,
                      category_name: category.category_name
                    };
                    subcategoryInfo = {
                      subcategory_id: subcategory.sub_cat_id,
                      subcategory_name: subcategory.subcategory_name
                    };
                    break;
                  }
                }
              } else if (category.items?.some(catItem => catItem.item_id === itemId)) {
                categoryInfo = {
                  category_id: category.cat_id,
                  category_name: category.category_name
                };
                break;
              }
            }
          }
          
          items.push({
            ...item,
            ...categoryInfo,
            ...subcategoryInfo,
            quantity,
            base_price: typeof item.price === 'string' ? parseFloat(item.price.replace('$', '') || '0') : (item.price || 0),
            item_total: itemPrice * quantity,
            totalPrice: itemPrice * quantity, // Add this for display compatibility
            selectedOptions: selectedOptionsList
          });
        }
      }
    });
    return items;
  };

  const createOrderSummary = () => {
    const selectedItemsList = getSelectedItemsList();
    const totalAmount = calculateTotal();
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderTime = new Date().toISOString();

    // Get restaurant and table info from props
    const restaurantInfo = {
      name: restaurantData?.restaurant?.name || "Unknown Restaurant",
      address: restaurantData?.restaurant?.address || "Unknown Address",
      admin_email: restaurantData?.restaurant?.email || "admin@restaurant.com",
      phone: restaurantData?.restaurant?.phone || "Unknown Phone",
      whatsapp: restaurantData?.restaurant?.whatsapp || "Unknown WhatsApp"
    };

    const tableInfo = {
      name: `Table ${tableId}` || "Unknown Table",
      id: tableId || "unknown_table"
    };

    // Group items by category
    const itemsByCategory = {};
    selectedItemsList.forEach(item => {
      const categoryId = item.category_id || 'unknown';
      if (!itemsByCategory[categoryId]) {
        itemsByCategory[categoryId] = {
          category_id: categoryId,
          category_name: item.category_name || 'Unknown Category',
          subcategory_id: item.subcategory_id || 'unknown',
          subcategory_name: item.subcategory_name || 'All Items',
          items: []
        };
      }
      itemsByCategory[categoryId].items.push(item);
    });

    // Create formatted summary for SMS
    const formattedSummary = createFormattedSummary(itemsByCategory, totalAmount);

    return {
      restaurant: restaurantInfo,
      table: tableInfo,
      order: {
        order_id: orderId,
        timestamp: orderTime,
        total_amount: totalAmount,
        currency: "USD",
        categories: Object.values(itemsByCategory),
        formatted_summary: formattedSummary
      }
    };
  };

  const createFormattedSummary = (itemsByCategory, totalAmount) => {
    let summary = "🍽️ NEW ORDER RECEIVED\n\n";
    
    Object.values(itemsByCategory).forEach(category => {
      // Replace unknown category names with "Items"
      const displayCategoryName = (category.category_name === 'Unknown Category' || category.category_name === 'unknown') 
        ? 'Items' 
        : category.category_name;
      
      summary += `📂 ${displayCategoryName}\n`;
      
      if (category.subcategory_name !== 'All Items' && category.subcategory_name !== 'unknown') {
        summary += `   └── ${category.subcategory_name}\n`;
      }
      
      category.items.forEach(item => {
        summary += `   • ${item.item_name} x${item.quantity} - $${item.item_total.toFixed(2)}\n`;
        
        if (item.description) {
          summary += `     📝 ${item.description}\n`;
        }
        
        if (item.selectedOptions && item.selectedOptions.length > 0) {
          summary += `     ⚙️ Options: ${item.selectedOptions.join(', ')}\n`;
        }
        
        summary += `\n`;
      });
    });
    
    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `💰 TOTAL: $${totalAmount.toFixed(2)} USD\n\n`;
    
    return summary;
  };

  const selectedItemsList = getSelectedItemsList() || [];
  const totalAmount = calculateTotal() || 0;

  // Debug logging
  console.log('Menu Data:', menuData);
  console.log('Categories:', menuData?.categories);
  console.log('Selected Items:', selectedItems);
  console.log('Quantities:', quantities);
  console.log('Selected Options:', selectedOptions);
  
  // Debug each category
  if (menuData?.categories) {
    menuData.categories.forEach((category, index) => {
      console.log(`Category ${index}:`, category.category_name);
      console.log('  - Subcategories:', category.subcategories?.length || 0);
      console.log('  - Direct items:', category.items?.length || 0);
      if (category.subcategories) {
        category.subcategories.forEach((sub, subIndex) => {
          console.log(`    Subcategory ${subIndex}:`, sub.subcategory_name, 'Items:', sub.items?.length || 0);
        });
      }
    });
  }

  if (!menuData?.categories) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Menu not available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please try refreshing the page or contact support.
        </Typography>
      </Box>
    );
  }

  // Check if there are any categories with items
  const hasAnyItems = menuData.categories.some(category => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const hasDirectItems = category.items && category.items.length > 0;
    const hasItemsInSubcategories = hasSubcategories && 
      category.subcategories.some(sub => sub.items && sub.items.length > 0);
    
    return hasItemsInSubcategories || hasDirectItems;
  });

  if (!hasAnyItems) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No menu items available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please check back later or contact the restaurant.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: '#1976d2',
          color: 'white',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CartIcon />
          <Typography variant="h6">Order Now</Typography>
        </Box>
        <IconButton 
          onClick={onMinimize}
          sx={{ color: 'white' }}
          title="Minimize"
        >
          <MinimizeIcon />
        </IconButton>
      </Paper>

      {/* Menu Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {menuData.categories.map((category) => {
          // Check if category has any items (either in subcategories or directly)
          const hasSubcategories = category.subcategories && category.subcategories.length > 0;
          const hasDirectItems = category.items && category.items.length > 0;
          const hasItemsInSubcategories = hasSubcategories && 
            category.subcategories.some(sub => sub.items && sub.items.length > 0);
          
          const hasItems = hasItemsInSubcategories || hasDirectItems;
          
          console.log(`Category: ${category.category_name}`, {
            hasSubcategories,
            hasDirectItems,
            hasItemsInSubcategories,
            hasItems,
            subcategories: category.subcategories?.length || 0,
            directItems: category.items?.length || 0
          });
          
          // Skip categories with no items
          if (!hasItems) {
            console.log(`Skipping empty category: ${category.category_name}`);
            return null;
          }
          
          return (
            <Card key={category.cat_id} sx={{ mb: 2 }}>
              <Accordion 
                expanded={expandedCategories[category.cat_id] || false}
                onChange={() => handleCategoryToggle(category.cat_id)}
              >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: '#f5f5f5' 
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {(category.category_name === 'Unknown Category' || category.category_name === 'unknown') 
                    ? 'Items' 
                    : category.category_name}
                </Typography>
                <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                  Click to {expandedCategories[category.cat_id] ? 'collapse' : 'expand'}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* Check if category has subcategories with items */}
                {category.subcategories && category.subcategories.length > 0 && 
                 category.subcategories.some(sub => sub.items && sub.items.length > 0) ? (
                  // Show subcategories
                  category.subcategories.map((subcategory) => {
                    // Skip empty subcategories
                    if (!subcategory.items || subcategory.items.length === 0) {
                      return null;
                    }
                    
                    return (
                    <Box key={subcategory.sub_cat_id} sx={{ mb: 2 }}>
                      {subcategory.subcategory_name !== 'All Items' && (
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                          {subcategory.subcategory_name}
                        </Typography>
                      )}
                      
                      {subcategory.items?.map((item) => {
                        // Skip items without required data
                        if (!item || !item.item_id || !item.item_name) {
                          return null;
                        }
                        
                        return (
                          <Card key={item.item_id} sx={{ mb: 2, border: selectedItems[item.item_id] ? '2px solid #1976d2' : '1px solid #e0e0e0' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Checkbox
                                  checked={selectedItems[item.item_id] || false}
                                  onChange={(e) => onItemToggle(item.item_id, e.target.checked)}
                                  color="primary"
                                />
                                
                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                      {item.item_name || 'Unnamed Item'}
                                    </Typography>
                                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                      {(() => {
                                        const calculatedPrice = calculateItemPrice(item);
                                        if (calculatedPrice > 0) {
                                          return `$${calculatedPrice.toFixed(2)}`;
                                        } else if (item.price) {
                                          return `$${item.price}`;
                                        } else {
                                          return 'Price N/A';
                                        }
                                      })()}
                                    </Typography>
                                  </Box>
                                
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {item.description || 'No description available'}
                                  </Typography>
                                  
                                  {/* Tags */}
                                  {item.tags && item.tags.length > 0 && (
                                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                                      {item.tags.map((tag, index) => (
                                        <Chip 
                                          key={index} 
                                          label={tag} 
                                          size="small" 
                                          variant="outlined"
                                          color={tag === 'vegetarian' ? 'success' : tag === 'non-veg' ? 'error' : 'default'}
                                        />
                                      ))}
                                    </Box>
                                  )}
                                          
                                  {/* Options */}
                                  {item.options && item.options.length > 0 && 
                                   item.options.some(option => option?.name && option.name.trim() !== '') && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                        Options:
                                      </Typography>
                                      {item.options.map((option, index) => {
                                        // Handle undefined or null option properties
                                        const optionName = option?.name;
                                        const optionPrice = option?.price || '';
                                        
                                        // Skip options without proper names
                                        if (!optionName || optionName.trim() === '') {
                                          return null;
                                        }
                                        
                                        return (
                                          <FormControlLabel
                                            key={index}
                                            control={
                                              <Checkbox
                                                checked={selectedOptions[item.item_id]?.[optionName] || false}
                                                onChange={(e) => onOptionToggle(item.item_id, optionName, optionPrice)}
                                                size="small"
                                              />
                                            }
                                            label={`${optionName} ${optionPrice}`}
                                            sx={{ display: 'block', ml: 0 }}
                                          />
                                        );
                                      })}
                                    </Box>
                                  )}
                                  
                                  {/* Quantity Selector */}
                                  {selectedItems[item.item_id] && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                      <Typography variant="body2">Quantity:</Typography>
                                      <IconButton 
                                        size="small" 
                                        onClick={() => onQuantityChange(item.item_id, -1)}
                                        disabled={quantities[item.item_id] <= 1}
                                      >
                                        <RemoveIcon />
                                      </IconButton>
                                      <Typography variant="body1" sx={{ minWidth: '30px', textAlign: 'center' }}>
                                        {quantities[item.item_id] || 1}
                                      </Typography>
                                      <IconButton 
                                        size="small" 
                                        onClick={() => onQuantityChange(item.item_id, 1)}
                                      >
                                        <AddIcon />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                    );
                  })
                ) : (
                  // Show items directly under category if no subcategories or subcategories are empty
                  category.items && category.items.length > 0 ? (
                    category.items.map((item) => {
                      // Skip items without required data
                      if (!item || !item.item_id || !item.item_name) {
                        return null;
                      }
                    
                    return (
                      <Card key={item.item_id} sx={{ mb: 2, border: selectedItems[item.item_id] ? '2px solid #1976d2' : '1px solid #e0e0e0' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Checkbox
                              checked={selectedItems[item.item_id] || false}
                              onChange={(e) => onItemToggle(item.item_id, e.target.checked)}
                              color="primary"
                            />
                            
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                  {item.item_name || 'Unnamed Item'}
                                </Typography>
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                  {(() => {
                                    const calculatedPrice = calculateItemPrice(item);
                                    if (calculatedPrice > 0) {
                                      return `$${calculatedPrice.toFixed(2)}`;
                                    } else if (item.price) {
                                      return `$${item.price}`;
                                    } else {
                                      return 'Price N/A';
                                    }
                                  })()}
                                </Typography>
                              </Box>
                            
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {item.description || 'No description available'}
                              </Typography>
                              
                              {/* Tags */}
                              {item.tags && item.tags.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                                  {item.tags.map((tag, index) => (
                                    <Chip 
                                      key={index} 
                                      label={tag} 
                                      size="small" 
                                      variant="outlined"
                                      color={tag === 'vegetarian' ? 'success' : tag === 'non-veg' ? 'error' : 'default'}
                                    />
                                  ))}
                                </Box>
                              )}
                              
                              {/* Options */}
                              {item.options && item.options.length > 0 && 
                               item.options.some(option => option?.name && option.name.trim() !== '') && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Options:
                                  </Typography>
                                  {item.options.map((option, index) => {
                                    // Handle undefined or null option properties
                                    const optionName = option?.name;
                                    const optionPrice = option?.price || '';
                                    
                                    // Skip options without proper names
                                    if (!optionName || optionName.trim() === '') {
                                      return null;
                                    }
                                    
                                    return (
                                      <FormControlLabel
                                        key={index}
                                        control={
                                          <Checkbox
                                            checked={selectedOptions[item.item_id]?.[optionName] || false}
                                            onChange={(e) => onOptionToggle(item.item_id, optionName, optionPrice)}
                                            size="small"
                                          />
                                        }
                                        label={`${optionName} ${optionPrice}`}
                                        sx={{ display: 'block', ml: 0 }}
                                      />
                                    );
                                  })}
                                </Box>
                              )}
                              
                              {/* Quantity Selector */}
                              {selectedItems[item.item_id] && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                  <Typography variant="body2">Quantity:</Typography>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => onQuantityChange(item.item_id, -1)}
                                    disabled={quantities[item.item_id] <= 1}
                                  >
                                    <RemoveIcon />
                                  </IconButton>
                                  <Typography variant="body1" sx={{ minWidth: '30px', textAlign: 'center' }}>
                                    {quantities[item.item_id] || 1}
                                  </Typography>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => onQuantityChange(item.item_id, 1)}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No items available in this category
                    </Typography>
                  )
                )}
              </AccordionDetails>
            </Accordion>
          </Card>
          );
        })}
      </Box>

      {/* Bottom Summary and Actions */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          backgroundColor: 'white', 
          borderTop: '1px solid #e0e0e0',
          flexShrink: 0
        }}
      >
        {selectedItemsList.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="primary" />
              Order Summary ({selectedItemsList.length} items)
            </Typography>
            
            <Box sx={{ maxHeight: '150px', overflow: 'auto', mb: 2 }}>
              {selectedItemsList.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {item.item_name} x{item.quantity}
                    </Typography>
                    {item.selectedOptions.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {item.selectedOptions.join(', ')}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    ${(item.totalPrice || 0).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Total: ${(totalAmount || 0).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onBackToMenu}
            sx={{ flex: 1 }}
          >
            Back to Menu
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowCheckout(true)}
            disabled={selectedItemsList.length === 0}
            sx={{ flex: 1 }}
          >
            Proceed to Checkout
          </Button>
        </Box>
      </Paper>

      {/* Checkout Dialog */}
      <Dialog 
        open={showCheckout} 
        onClose={() => setShowCheckout(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Order Confirmation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your order has been placed successfully! 
          </Typography>
          
          <Typography variant="h6" sx={{ mb: 1 }}>
            Order Details:
          </Typography>
          
          {selectedItemsList.map((item, index) => (
            <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {item.item_name} x{item.quantity}
              </Typography>
              {item.selectedOptions.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {item.selectedOptions.join(', ')}
                </Typography>
              )}
              <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                ${(item.totalPrice || 0).toFixed(2)}
              </Typography>
            </Box>
          ))}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" sx={{ textAlign: 'right', fontWeight: 'bold' }}>
            Total: ${(totalAmount || 0).toFixed(2)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCheckout(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setShowCheckout(false);
              const orderSummary = createOrderSummary();
              onOrderComplete(orderSummary); // Send order summary and clear state
            }}
          >
            Confirm Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderingInterface;
