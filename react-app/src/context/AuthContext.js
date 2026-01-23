import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current authenticated user from Catalyst
    const fetchUser = async () => {
      try {
        console.log('=== AUTH CHECK START ===');
        console.log('Current URL:', window.location.href);
        console.log('Cookies:', document.cookie);
        
        // First, try to check if there's a Catalyst session by calling the app endpoint
        console.log('Attempting to fetch user from /server/fetch_requests_function/auth/me');
        
        const response = await fetch('/server/fetch_requests_function/auth/me', {
          method: 'GET',
          credentials: 'include', // Important: Include cookies for session
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
          console.error('User auth endpoint failed:', response.status, response.statusText);
          setUser(null);
          setLoading(false);
          return;
        }
        
        const result = await response.json();
        console.log('User auth response:', result);
        
        if (result.status === 'success' && result.data) {
          // User is authenticated
          console.log('✓ User authenticated:', result.data.email_id);
          setUser(result.data);
        } else {
          // No active session
          console.log('✗ No active session - data is null');
          console.log('Checking if we just came from auth redirect...');
          
          // Check URL parameters for any auth tokens or session indicators
          const urlParams = new URLSearchParams(window.location.search);
          console.log('URL params:', Object.fromEntries(urlParams));
          
          setUser(null);
        }
        console.log('=== AUTH CHECK END ===');
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = () => {
    // Redirect to Catalyst login page
    // Catalyst will redirect back to the current app URL after login
    window.location.href = '/__catalyst/auth/login';
  };

  const logout = async () => {
    try {
      // Call the logout endpoint to clear session
      await fetch('/server/fetch_requests_function/auth/logout', {
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Redirect to Catalyst logout page which will clear the session
      window.location.href = '/__catalyst/auth/logout';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
