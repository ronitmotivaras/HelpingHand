import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';
import { isTokenExpired, getTokenRemainingMs, clearAdminSession } from '../utils/token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [adminToken, setAdminToken] = useState(() => {
    const stored = localStorage.getItem('adminToken');
    if (!stored) return null;
    if (isTokenExpired(stored)) {
      clearAdminSession();
      return null;
    }
    return stored;
  });

  const adminLogout = useCallback((reason) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    clearAdminSession();
    setAdminToken(null);
    if (reason) {
      toast.error(reason, { id: 'admin-session-expired' });
    }
    navigate('/login', { replace: true });
  }, [navigate]);

  async function adminLogin(password) {
    const { data } = await api.post('/api/admin/login', { password });
    localStorage.setItem('adminToken', data.token);
    setAdminToken(data.token);
    return data;
  }

  // Auto-logout when token expires in real-time
  useEffect(() => {
    if (!adminToken) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (isTokenExpired(adminToken)) {
      adminLogout('Session expired. Please log in again.');
      return;
    }

    const remainingMs = getTokenRemainingMs(adminToken);
    timerRef.current = setTimeout(() => {
      adminLogout('Session expired. Please log in again.');
    }, remainingMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [adminToken, adminLogout]);

  // Listen for session expiration events dispatched by axios interceptors
  useEffect(() => {
    function handleSessionExpired(event) {
      const msg = event?.detail?.message || 'Session expired. Please log in again.';
      adminLogout(msg);
    }

    window.addEventListener('admin:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('admin:session-expired', handleSessionExpired);
    };
  }, [adminLogout]);

  const value = useMemo(
    () => ({
      adminToken,
      isAdmin: Boolean(adminToken && !isTokenExpired(adminToken)),
      adminLogin,
      adminLogout: () => adminLogout(),
    }),
    [adminToken, adminLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

