import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      console.log('=== AUTH CHECK START ===');
      console.log('Current URL:', window.location.href);
      
      const response = await fetch('/server/fetch_requests_function/auth/me', {
        method: 'GET',
        credentials: 'include', // Important: Include cookies for session
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('User auth endpoint failed:', response.status, response.statusText);
        setUser(null);
        return;
      }
      
      const result = await response.json();
      console.log('User auth response:', result);
      
      if (result.status === 'success' && result.data) {
        // User is authenticated
        console.log('✓ User authenticated:', result.data.email_id);
        if (result.data.organisation) {
            console.log('✓ User belongs to organisation:', result.data.organisation.name, '(Role:', result.data.organisation.role + ')');
        }
        setUser(result.data);
      } else {
        // No active session
        console.log('✗ No active session - data is null');
        setUser(null);
      }
      console.log('=== AUTH CHECK END ===');
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = () => {
    window.location.href = '/__catalyst/auth/login';
  };

  const logout = async () => {
    console.log('=== CLIENT LOGOUT START ===');
    setUser(null);
    sessionStorage.clear();
    localStorage.clear();
    
    try {
      await fetch('/server/fetch_requests_function/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Wait for server-side cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      console.error('Logout error:', err);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Clear cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
    
    window.location.replace('/app/index.html?logout=' + Date.now());
  };

  // Helper methods
  const hasOrganisation = () => {
    return user && user.organisation !== null;
  };

  const getOrganisation = () => {
    return user?.organisation || null;
  };

  const getUserRole = () => {
    return user?.organisation?.role || null;
  };

  const canManageMembers = () => {
    const role = getUserRole();
    return role === 'Super Admin' || role === 'Admin';
  };

  const canViewAllRequests = () => {
    const role = getUserRole();
    return role === 'Super Admin' || role === 'Admin' || role === 'Viewer';
  };

  const isViewer = () => {
    return getUserRole() === 'Viewer';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      refreshUser, // Exposed method
      login, 
      logout,
      hasOrganisation,
      getOrganisation,
      getUserRole,
      canManageMembers,
      canViewAllRequests,
      isViewer,
      isSuperAdmin: () => getUserRole() === 'Super Admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
