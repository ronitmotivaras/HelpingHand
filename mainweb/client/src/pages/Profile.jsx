import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  UserCircle,
  Building2,
  User,
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
  Plus,
  Compass,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import { validateMobile } from '../utils/validation';
import { CITIES } from '../constants/cities';

export default function Profile() {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const isNgo = Boolean(user?.ngoStatus && user.ngoStatus !== 'none');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || user?.ngoDetails?.ngoName || '');
  const [editCoordinatorName, setEditCoordinatorName] = useState(user?.ngoDetails?.coordinatorName || '');
  const [editAddress, setEditAddress] = useState(user?.ngoDetails?.address || '');
  const [editMobile, setEditMobile] = useState(user?.mobile || '');
  const [editCity, setEditCity] = useState(user?.city || '');
  const [mobileError, setMobileError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleLogout() {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  }

  function startEditing() {
    setEditName(user?.name || user?.ngoDetails?.ngoName || '');
    setEditCoordinatorName(user?.ngoDetails?.coordinatorName || '');
    setEditAddress(user?.ngoDetails?.address || '');
    setEditMobile(user?.mobile || '');
    setEditCity(user?.city || '');
    setMobileError('');
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditName(user?.name || user?.ngoDetails?.ngoName || '');
    setEditCoordinatorName(user?.ngoDetails?.coordinatorName || '');
    setEditAddress(user?.ngoDetails?.address || '');
    setEditMobile(user?.mobile || '');
    setEditCity(user?.city || '');
    setMobileError('');
  }

  function handleMobileChange(val) {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
    setEditMobile(cleaned);
    if (/[^0-9]/.test(val)) {
      setMobileError('Only numbers (0-9) are allowed. No characters, symbols, or spaces.');
    } else if (cleaned.length > 0 && cleaned.length !== 10) {
      setMobileError('Mobile number must be exactly 10 digits');
    } else {
      setMobileError('');
    }
  }

  async function saveEditing() {
    if (!editName.trim()) {
      toast.error(isNgo ? 'Organization name cannot be empty' : 'Name cannot be empty');
      return;
    }
    if (isNgo && !editCoordinatorName.trim()) {
      toast.error('Coordinator name cannot be empty');
      return;
    }
    const mErr = validateMobile(editMobile);
    if (mErr) {
      setMobileError(mErr);
      toast.error(mErr);
      return;
    }
    if (!editCity.trim()) {
      toast.error('Please select a city');
      return;
    }
    if (isNgo && !editAddress.trim()) {
      toast.error('Organization address cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: editName.trim(),
        mobile: editMobile.trim(),
        city: editCity.trim(),
      };
      if (isNgo) {
        payload.coordinatorName = editCoordinatorName.trim();
        payload.address = editAddress.trim();
        payload.ngoName = editName.trim();
      }

      await api.put('/profile', payload);
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
            to={isNgo ? '/feed' : '/donor'}
            className="d-inline-flex align-items-center gap-2 text-decoration-none"
            style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
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

        {/* Profile Card */}
        <div className="hh-card mb-4">
          <div className="d-flex align-items-start justify-content-between mb-3 gap-2">
            <div className="d-flex align-items-center gap-2 flex-grow-1">
              {isNgo ? (
                <Building2 size={28} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              ) : (
                <UserCircle size={28} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              )}
              {isEditing ? (
                <div style={{ flexGrow: 1, maxWidth: '340px' }}>
                  <label className="form-label mb-1" style={{ fontSize: 'var(--text-xs)' }}>
                    {isNgo ? 'NGO Organization Name' : 'Full Name'}
                  </label>
                  <input
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={isNgo ? 'Organization name' : 'Full name'}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h1 className="section-title mb-0" style={{ fontSize: 'var(--text-2xl)' }}>
                    {user?.ngoDetails?.ngoName || user?.name}
                  </h1>
                  {isNgo && user?.ngoStatus === 'approved' && (
                    <span className="badge-verified-ngo">
                      <BadgeCheck size={14} />
                      <span>Verified NGO</span>
                    </span>
                  )}
                  {isNgo && user?.ngoStatus === 'pending' && (
                    <span className="badge-status pending">
                      <Clock size={12} />
                      <span>Verification Pending</span>
                    </span>
                  )}
                </div>
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

          {/* NGO Coordinator Name (Only for NGO accounts) */}
          {isNgo && (
            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <User size={15} color="var(--color-text-muted)" />
                <span>Coordinator Name</span>
              </span>
              {isEditing ? (
                <div style={{ maxWidth: '260px', width: '100%' }}>
                  <input
                    className="form-control"
                    style={{ padding: '5px 10px', fontSize: 'var(--text-sm)' }}
                    value={editCoordinatorName}
                    onChange={(e) => setEditCoordinatorName(e.target.value)}
                    placeholder="Coordinator full name"
                  />
                </div>
              ) : (
                <strong>{user?.ngoDetails?.coordinatorName || 'Not specified'}</strong>
              )}
            </div>
          )}

          {/* Registered Phone */}
          <div className="detail-row">
            <span className="d-flex align-items-center gap-2">
              <Phone size={15} color="var(--color-text-muted)" />
              <span>Registered Phone</span>
            </span>
            {isEditing ? (
              <div style={{ maxWidth: '240px', width: '100%' }}>
                <input
                  className="form-control"
                  style={{ padding: '5px 10px', fontSize: 'var(--text-sm)', fontFamily: 'monospace' }}
                  maxLength={10}
                  value={editMobile}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  placeholder="10-digit mobile"
                />
                {mobileError && (
                  <div className="text-danger small mt-1" style={{ fontSize: '11px', lineHeight: 1.2 }}>
                    {mobileError}
                  </div>
                )}
              </div>
            ) : (
              <strong style={{ fontFamily: 'monospace' }}>{user?.mobile}</strong>
            )}
          </div>

          {/* City */}
          <div className="detail-row">
            <span className="d-flex align-items-center gap-2">
              <MapPin size={15} color="var(--color-text-muted)" />
              <span>City</span>
            </span>
            {isEditing ? (
              <div style={{ maxWidth: '240px', width: '100%' }}>
                <select
                  className="form-select"
                  style={{ padding: '5px 10px', fontSize: 'var(--text-sm)' }}
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                >
                  <option value="">Select a city...</option>
                  {Array.from(new Set([...CITIES, ...(user?.city ? [user.city] : [])])).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <strong>{user?.city}</strong>
            )}
          </div>

          {/* NGO Address (Only for NGO accounts) */}
          {isNgo && (
            <div className="detail-row" style={{ alignItems: 'flex-start' }}>
              <span className="d-flex align-items-center gap-2 pt-1">
                <MapPin size={15} color="var(--color-text-muted)" />
                <span>Organization Address</span>
              </span>
              {isEditing ? (
                <div style={{ maxWidth: '320px', width: '100%' }}>
                  <textarea
                    className="form-control"
                    rows="2"
                    style={{ padding: '5px 10px', fontSize: 'var(--text-sm)' }}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Registered NGO office address"
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'right', maxWidth: '300px', fontWeight: 600 }}>
                  {user?.ngoDetails?.address || 'Not specified'}
                </div>
              )}
            </div>
          )}

          {/* NGO Verification Status Badge (Only for NGO accounts) */}
          {isNgo && (
            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <Shield size={15} color="var(--color-text-muted)" />
                <span>Verification Status</span>
              </span>
              <span>
                {user?.ngoStatus === 'approved' ? (
                  <span className="badge-verified-ngo">
                    <BadgeCheck size={14} />
                    <span>Verified NGO Partner</span>
                  </span>
                ) : user?.ngoStatus === 'pending' ? (
                  <span className="badge-status pending d-inline-flex align-items-center gap-1">
                    <Clock size={13} />
                    <span>Waiting for Admin Verification</span>
                  </span>
                ) : (
                  <span className="badge-status declined">
                    <span>Application Declined</span>
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Role-Specific Navigation Links */}
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

          {isNgo ? (
            /* NGO Action: Browse Available Food (NGOs do not donate food) */
            <Link
              to="/feed"
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
                  <Compass size={18} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>Browse Available Food</div>
                  <div className="text-muted small">View surplus donations from community donors</div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--color-text-muted)" />
            </Link>
          ) : (
            /* Donor Actions: My Donated Food & Post Food Donation */
            <>
              <Link
                to="/donor"
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
                    <Package size={18} color="var(--color-primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>My Donated Food</div>
                    <div className="text-muted small">Manage your donation listings & pickup requests</div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--color-text-muted)" />
              </Link>

              <Link
                to="/donate"
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
                    <Plus size={18} color="var(--color-primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>Post Food Donation</div>
                    <div className="text-muted small">List surplus food for pickup by verified NGOs</div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--color-text-muted)" />
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  );
}
