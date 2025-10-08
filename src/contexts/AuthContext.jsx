import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      
      if (savedUser && savedToken) {
        try {
          // Parse the token to check if it's expired
          const tokenPayload = JSON.parse(atob(savedToken.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (tokenPayload.exp > currentTime) {
            // Token is still valid
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
          } else {
            // Token is expired, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } catch (error) {
          // Invalid token, clear storage
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    // Add a small delay to prevent flash of login screen
    const timer = setTimeout(initializeAuth, 100);
    
    // Validate token when window regains focus
    const handleFocus = () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const tokenPayload = JSON.parse(atob(savedToken.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (tokenPayload.exp <= currentTime) {
            // Token is expired, logout
            logout();
          }
        } catch (error) {
          // Invalid token, logout
          logout();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const login = async (email, password, userType = 'master_admin') => {
    try {
      const endpoint = userType === 'restaurant_admin' 
        ? '/auth/restaurant-admin-login' 
        : '/auth/master-login';
        
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const validateToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Parse the token to check if it's expired
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (tokenPayload.exp > currentTime) {
        return true;
      } else {
        // Token is expired, clear storage
        logout();
        return false;
      }
    } catch (error) {
      // Invalid token, clear storage
      logout();
      return false;
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    validateToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


