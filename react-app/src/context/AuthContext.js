import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for logged-in user on mount
    const checkUser = async () => {
      try {
        const response = await fetch('/server/auth_function/me');
        if (response.ok) {
          const result = await response.json();
          // Assuming result.data is the user object
          if (result.status === 'success' && result.data) {
              setUser(result.data);
          } else {
              setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = () => {
    window.location.href = '/__catalyst/auth/login';
  };

  const logout = () => {
    window.location.href = '/__catalyst/auth/logout';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
