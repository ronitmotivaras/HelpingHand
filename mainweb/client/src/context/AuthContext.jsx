import React, { createContext, useContext, useMemo, useState } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

function readUser() {
  try {
    const raw = localStorage.getItem('hh_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [token, setToken] = useState(() => localStorage.getItem('userToken'));

  function persistUserSession(nextToken, nextUser) {
    localStorage.setItem('userToken', nextToken);
    localStorage.setItem('hh_user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  async function login(mobile, password) {
    const { data } = await api.post('/auth/login', { mobile, password });
    persistUserSession(data.token, data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  }

  function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('hh_user');
    setToken(null);
    setUser(null);
  }

  async function refreshProfile() {
    const { data } = await api.get('/profile');
    localStorage.setItem('hh_user', JSON.stringify(data));
    setUser(data);
    return data;
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      refreshProfile,
      setUser,
    }),
    [user, token]
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
