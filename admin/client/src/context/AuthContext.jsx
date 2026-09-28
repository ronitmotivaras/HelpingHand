import React, { createContext, useContext, useMemo, useState } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminToken, setAdminToken] = useState(
    () => localStorage.getItem('adminToken') || localStorage.getItem('hh_admin_token')
  );

  async function adminLogin(password) {
    const { data } = await api.post('/api/admin/login', { password });
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('hh_admin_token', data.token);
    setAdminToken(data.token);
    return data;
  }

  function adminLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('hh_admin_token');
    setAdminToken(null);
  }


  const value = useMemo(
    () => ({
      adminToken,
      isAdmin: Boolean(adminToken),
      adminLogin,
      adminLogout,
    }),
    [adminToken]
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
