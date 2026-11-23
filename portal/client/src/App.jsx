import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DonorDashboard from './pages/DonorDashboard';
import FoodDetail from './pages/FoodDetail';
import DonateFood from './pages/DonateFood';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Notifications from './pages/Notifications';
import MyDonatedFood from './pages/MyDonatedFood';
import AcceptedFoodHistory from './pages/AcceptedFoodHistory';
import { useAuth } from './context/AuthContext';
import './styles/app.css';

function RoleBasedHome() {
  const { user } = useAuth();
  const isNgo = Boolean(user?.ngoStatus && user.ngoStatus !== 'none');
  return isNgo ? <Dashboard /> : <DonorDashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleBasedHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donor"
        element={
          <ProtectedRoute>
            <DonorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/food/:id"
        element={
          <ProtectedRoute>
            <FoodDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donate"
        element={
          <ProtectedRoute>
            <DonateFood />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
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
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accepted-food-history"
        element={
          <ProtectedRoute>
            <AcceptedFoodHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-donated-food"
        element={
          <ProtectedRoute>
            <MyDonatedFood />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-donations"
        element={
          <ProtectedRoute>
            <MyDonatedFood />
          </ProtectedRoute>
        }
      />
      <Route path="/apply-ngo" element={<Navigate to="/profile" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
