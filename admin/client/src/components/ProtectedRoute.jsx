import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isTokenExpired } from '../utils/token';

export default function ProtectedRoute({ children }) {
  const { isAdmin, adminToken } = useAuth();

  if (!isAdmin || isTokenExpired(adminToken)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

