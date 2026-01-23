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
    console.log('=== CLIENT LOGOUT START ===');
    
    // Clear local user state immediately
    setUser(null);
    
    // Clear session storage and local storage first
    sessionStorage.clear();
    localStorage.clear();
    console.log('✓ Local storage cleared');
    
    // Call logout endpoint and WAIT for server-side session invalidation to complete
    // Do NOT redirect until the server confirms the session is invalidated
    try {
      console.log('Calling server logout endpoint (waiting for SDK signout)...');
      const response = await fetch('/server/fetch_requests_function/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      const result = await response.json();
      console.log('✓ Server logout response:', result);
      
      if (result.sessionInvalidated) {
        console.log('✓✓✓ Session successfully invalidated on server ✓✓✓');
      } else {
        console.warn('⚠ Session may not be fully invalidated');
      }
      
      // Wait an additional moment to ensure all server-side operations are complete
      console.log('Waiting 1 second for complete cleanup...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      console.error('✗ Logout endpoint error:', err);
      // Still wait even if it fails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Clear all cookies from the browser (even though they're HTTP-only, try anyway)
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.catalystserverless.in";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
    }
    
    console.log('✓ Browser cookies cleared');
    console.log('=== CLIENT LOGOUT COMPLETE - Redirecting ===');
    
    // NOW redirect after everything is confirmed complete
    window.location.replace('/app/index.html?logout=' + Date.now());
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
