// API utility functions with token validation
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Function to convert relative URLs to absolute URLs
const convertRelativeUrls = (data) => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => convertRelativeUrls(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const converted = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (typeof data[key] === 'string' && data[key].startsWith('/uploads/')) {
          // Convert relative URL to absolute URL
          const baseUrl = API_BASE_URL.replace('/api', '');
          converted[key] = `${baseUrl}${data[key]}`;
        } else {
          converted[key] = convertRelativeUrls(data[key]);
        }
      }
    }
    return converted;
  }
  
  return data;
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // If token is invalid or expired, clear storage
    if (response.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/master-admin/login';
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Enhanced API request that converts URLs
export const apiRequestWithUrlConversion = async (endpoint, options = {}) => {
  const response = await apiRequest(endpoint, options);
  
  if (response.ok) {
    const data = await response.json();
    const convertedData = convertRelativeUrls(data);
    
    // Create a new response with converted data
    return {
      ...response,
      json: () => Promise.resolve(convertedData)
    };
  }
  
  return response;
};

export const validateToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return tokenPayload.exp > currentTime;
  } catch (error) {
    return false;
  }
};
