import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  UserCircle,
  Phone,
  MapPin,
  Lock,
  LogOut,
  Package,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

export default function Profile() {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  async function handlePassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setIsUpdating(true);
    try {
      await api.patch('/profile/password', { oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      toast.success('Password updated successfully!');
      await refreshProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsUpdating(false);
    }
  }

  function handleLogout() {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  }

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ maxWidth: '780px' }}>
        <Link
          to="/"
          className="d-inline-flex align-items-center gap-2 mb-4 text-decoration-none"
          style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to listings</span>
        </Link>

        {/* User Card */}
        <div className="hh-card mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <UserCircle size={26} color="var(--color-primary)" />
              <h1 className="section-title mb-0">{user?.name}</h1>
              {user?.ngoStatus === 'approved' && (
                <span className="badge-status approved d-inline-flex align-items-center gap-1">
                  <BadgeCheck size={14} />
                  <span>Verified NGO</span>
                </span>
              )}
            </div>
            <Link
              to="/my-donations"
              className="btn-hh-secondary d-inline-flex align-items-center gap-2"
              style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-small)' }}
            >
              <Package size={16} />
              <span>My Listings</span>
            </Link>
          </div>
          <div className="detail-row">
            <span className="d-flex align-items-center gap-2">
              <Phone size={15} color="var(--color-text-muted)" />
              <span>Registered Phone</span>
            </span>
            <strong style={{ fontFamily: 'monospace' }}>{user?.mobile}</strong>
          </div>
          <div className="detail-row">
            <span className="d-flex align-items-center gap-2">
              <MapPin size={15} color="var(--color-text-muted)" />
              <span>Primary City</span>
            </span>
            <strong>{user?.city}</strong>
          </div>
        </div>

        {/* NGO Status Card */}
        <div className="hh-card mb-4">
          <h2 className="card-title mb-2">Community NGO Status</h2>
          {user?.ngoStatus === 'none' || user?.ngoStatus === 'rejected' ? (
            <>
              <p className="food-card-meta mb-3">
                Register as a verified non-profit organization or food relief volunteer to unlock priority coordination features.
              </p>
              {user?.ngoStatus === 'rejected' && (
                <p className="text-danger small mb-3">
                  Your previous NGO verification was declined. You may re-apply with updated details.
                </p>
              )}
              <Link to="/apply-ngo" className="btn-hh-primary d-inline-flex align-items-center gap-2">
                <BadgeCheck size={18} />
                <span>Apply for NGO Verification</span>
              </Link>
            </>
          ) : user?.ngoStatus === 'pending' ? (
            <div className="d-flex align-items-center gap-2">
              <span className="badge-status pending d-inline-flex align-items-center gap-1">
                <Clock size={14} />
                <span>Pending Review</span>
              </span>
              <p className="food-card-meta mb-0">Our administrators are reviewing your submission.</p>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <span className="badge-status approved d-inline-flex align-items-center gap-1">
                <BadgeCheck size={14} />
                <span>Verified Community Partner</span>
              </span>
              <p className="food-card-meta mb-0">Your account is fully verified as an NGO partner.</p>
            </div>
          )}
        </div>

        {/* Password Security Card */}
        <div className="hh-card mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Lock size={18} color="var(--color-primary)" />
            <h2 className="card-title m-0">Account Security</h2>
          </div>

          <form onSubmit={handlePassword}>
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="current-pass">Current Password</label>
              <input
                id="current-pass"
                type="password"
                className="form-control"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group mb-4">
              <label className="form-label" htmlFor="new-pass">New Password</label>
              <input
                id="new-pass"
                type="password"
                className="form-control"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-hh-secondary" disabled={isUpdating} type="submit">
              {isUpdating ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Logout Action */}
        <div className="d-flex justify-content-end pt-2">
          <button
            className="btn-hh-danger d-inline-flex align-items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </main>
    </>
  );
}
