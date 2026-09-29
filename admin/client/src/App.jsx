import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import NgoVerification from './pages/NgoVerification';
import UserAccounts from './pages/UserAccounts';
import BlockedAccounts from './pages/BlockedAccounts';
import ChangePassword from './pages/ChangePassword';
import './admin.css';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ngo-verification"
        element={
          <ProtectedRoute>
            <NgoVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ngo-list"
        element={
          <ProtectedRoute>
            <NgoVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-accounts"
        element={
          <ProtectedRoute>
            <UserAccounts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donators"
        element={
          <ProtectedRoute>
            <UserAccounts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blocked"
        element={
          <ProtectedRoute>
            <BlockedAccounts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blocked-accounts"
        element={
          <ProtectedRoute>
            <BlockedAccounts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
