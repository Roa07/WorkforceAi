import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hrms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hrms_token') || '');

  // Set default auth header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const data = res.data;
    const userData = {
      user_id: data.user_id,
      role: data.role,
      employee_id: data.employee_id,
      employee_code: data.employee_code,
      full_name: data.full_name
    };
    setToken(data.access_token);
    setUser(userData);
    localStorage.setItem('hrms_token', data.access_token);
    localStorage.setItem('hrms_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (payload) => {
    const res = await axios.post('/api/auth/register', payload);
    const data = res.data;
    const userData = {
      user_id: data.user_id,
      role: data.role,
      employee_id: data.employee_id,
      employee_code: data.employee_code,
      full_name: data.full_name
    };
    setToken(data.access_token);
    setUser(userData);
    localStorage.setItem('hrms_token', data.access_token);
    localStorage.setItem('hrms_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAdmin: user?.role === 'SUPER_ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
