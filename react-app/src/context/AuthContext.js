import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // BYPASS AUTH FOR TESTING
    // Mocking a logged-in user directly
    console.log("Auth Bypassed: Setting Mock User");
    setUser({
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        role_details: { role_name: "App Admin" }
    });
    setLoading(false);
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
