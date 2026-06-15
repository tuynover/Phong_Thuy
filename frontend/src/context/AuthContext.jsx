import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Set default axios header if token exists
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Actually, we should probably fetch the user profile here, but for now we'll just rely on the login response to set the user state.
  // In a real app, you'd fetch /api/auth/me here to validate token on load.
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true, user: res.data.user };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || null, 
        message: err.response?.data?.message || 'Đăng nhập thất bại', 
        data: err.response?.data || null 
      };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google`, { credential });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true, user: res.data.user };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || null, 
        message: err.response?.data?.message || 'Đăng nhập Google thất bại', 
        data: err.response?.data || null 
      };
    }
  };

  const register = async (email, password, name, day, month, year, hour, minute, gender) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { email, password, name, day, month, year, hour, minute, gender });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true, user: res.data.user };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || null, 
        message: err.response?.data?.message || 'Đăng ký thất bại', 
        data: err.response?.data || null 
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, register, logout, loginWithGoogle }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
