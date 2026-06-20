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

  // Axios response interceptor to catch 401/403 and force logout
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && (error.response.status === 401 || (error.response.status === 403 && (error.response.data?.error === 'suspended' || error.response.data?.error === 'deleted')))) {
          setToken(null);
          setUser(null);
          localStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // SSE connection for real-time user updates
  useEffect(() => {
    if (!token) return;

    const sseUrl = `${API_URL}/auth/events?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'account_locked' || payload.type === 'account_deleted') {
          setToken(null);
          setUser(null);
          localStorage.removeItem('user');
        } else if (payload.type === 'account_updated') {
          setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, role: payload.data.role, credits: payload.data.credits };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error('[SSE] Error processing user event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] User connection error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      localStorage.setItem('token', res.data.token);
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      localStorage.setItem('token', res.data.token);
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      localStorage.setItem('token', res.data.token);
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
