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
  Pencil,
  ChevronRight,
  Shield,
  Check,
  X,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

export default function Profile() {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editMobile, setEditMobile] = useState(user?.mobile || '');
  const [editCity, setEditCity] = useState(user?.city || '');
  const [saving, setSaving] = useState(false);

  function handleLogout() {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  }

  function startEditing() {
    setEditName(user?.name || '');
    setEditMobile(user?.mobile || '');
    setEditCity(user?.city || '');
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditName(user?.name || '');
    setEditMobile(user?.mobile || '');
    setEditCity(user?.city || '');
  }

  async function saveEditing() {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (!editMobile.trim()) {
      toast.error('Mobile number cannot be empty');
      return;
    }
    if (!editCity.trim()) {
      toast.error('City cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await api.put('/profile', {
        name: editName.trim(),
        mobile: editMobile.trim(),
        city: editCity.trim(),
      });
      await refreshProfile();
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ maxWidth: '680px' }}>
        {/* Header row: "← Back" on the left, "Logout" on the top-right */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <Link
            to="/"
            className="d-inline-flex align-items-center gap-2 text-decoration-none"
            style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>

          <button
            className="btn-hh-danger d-inline-flex align-items-center gap-2"
            style={{ padding: '6px 14px', fontSize: 'var(--text-small)' }}
            onClick={handleLogout}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>

        {/* Info card: Name with pencil icon (turns Name and City editable in place, phone read-only) */}
        <div className="hh-card mb-4">
          <div className="d-flex align-items-start justify-content-between mb-3 gap-2">
            <div className="d-flex align-items-center gap-2 flex-grow-1">
              <UserCircle size={28} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              {isEditing ? (
                <div style={{ flexGrow: 1, maxWidth: '320px' }}>
                  <label className="form-label mb-1" style={{ fontSize: 'var(--text-xs)' }}>Full Name</label>
                  <input
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Full name"
                    autoFocus
                  />
                </div>
              ) : (
                <h1 className="section-title mb-0" style={{ fontSize: 'var(--text-2xl)' }}>{user?.name}</h1>
              )}
            </div>

            <div>
              {isEditing ? (
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn-hh-primary d-inline-flex align-items-center gap-1"
                    style={{ padding: '6px 12px', fontSize: 'var(--text-small)' }}
                    onClick={saveEditing}
                    disabled={saving}
                  >
                    <Check size={14} />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    className="btn-hh-secondary d-inline-flex align-items-center gap-1"
                    style={{ padding: '6px 12px', fontSize: 'var(--text-small)' }}
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    <X size={14} />
                    <span>Cancel</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEditing}
                  aria-label="Edit Profile"
                  title="Edit Profile Details"
                  style={{
                    background: 'none',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all var(--transition)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <Pencil size={15} color="var(--color-primary)" />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Registered Phone (editable when isEditing) */}
          <div className="detail-row">
            <span className="d-flex align-items-center gap-2">
              <Phone size={15} color="var(--color-text-muted)" />
              <span>Registered Phone</span>
            </span>
            {isEditing ? (
              <div style={{ maxWidth: '220px', width: '100%' }}>
                <input
                  className="form-control"
                  style={{ padding: '4px 10px', fontSize: 'var(--text-sm)', fontFamily: 'monospace' }}
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  placeholder="Mobile number"
                />
              </div>
            ) : (
              <strong style={{ fontFamily: 'monospace' }}>{user?.mobile}</strong>
            )}
          </div>

          {/* Primary City (editable in place) */}
          <div className="detail-row">
            <span className="d-flex align-items-center gap-2">
              <MapPin size={15} color="var(--color-text-muted)" />
              <span>Primary City</span>
            </span>
            {isEditing ? (
              <div style={{ maxWidth: '220px', width: '100%' }}>
                <input
                  className="form-control"
                  style={{ padding: '4px 10px', fontSize: 'var(--text-sm)' }}
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="Primary city"
                />
              </div>
            ) : (
              <strong>{user?.city}</strong>
            )}
          </div>

          {/* Small read-only NGO status line - ONLY shown if user registered as NGO */}
          {user?.ngoStatus && user.ngoStatus !== 'none' && (
            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <Shield size={15} color="var(--color-text-muted)" />
                <span>NGO Status</span>
              </span>
              <span>
                {user?.ngoStatus === 'approved' ? (
                  <span className="badge-status approved d-inline-flex align-items-center gap-1">
                    <BadgeCheck size={13} />
                    <span>NGO</span>
                  </span>
                ) : user?.ngoStatus === 'pending' ? (
                  <span className="badge-status pending d-inline-flex align-items-center gap-1">
                    <Clock size={13} />
                    <span>Pending</span>
                  </span>
                ) : (
                  <span className="badge-status rejected d-inline-flex align-items-center gap-1">
                    <span>Declined</span>
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Below info card: Two simple navigation rows */}
        <div className="hh-card p-0 mb-4" style={{ overflow: 'hidden' }}>
          <Link
            to="/change-password"
            className="d-flex align-items-center justify-content-between p-4 text-decoration-none"
            style={{
              color: 'var(--color-text)',
              borderBottom: '1px solid var(--color-border)',
              transition: 'background var(--transition)',
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Lock size={18} color="var(--color-primary)" />
              </div>
              <span style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>Change Password</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-muted)" />
          </Link>

          <Link
            to="/my-donations"
            className="d-flex align-items-center justify-content-between p-4 text-decoration-none"
            style={{
              color: 'var(--color-text)',
              transition: 'background var(--transition)',
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Package size={18} color="var(--color-primary)" />
              </div>
              <span style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>My Donated Food</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-muted)" />
          </Link>
        </div>
      </main>
    </>
  );
}
