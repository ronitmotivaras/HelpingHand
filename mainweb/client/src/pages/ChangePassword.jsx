import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';
import { validatePassword } from '../utils/validation';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordErrors, setPasswordErrors] = useState([]);
  const [confirmError, setConfirmError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const pErrors = validatePassword(newPassword);
    let cError = '';
    if (newPassword !== confirmPassword) {
      cError = 'Passwords do not match';
    }

    setPasswordErrors(pErrors);
    setConfirmError(cError);

    if (pErrors.length > 0 || cError) {
      return;
    }

    setIsUpdating(true);
    try {
      await api.patch('/profile/password', { oldPassword, newPassword });
      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ maxWidth: '640px' }}>
        <Link
          to="/profile"
          className="d-inline-flex align-items-center gap-2 mb-4 text-decoration-none"
          style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to profile</span>
        </Link>

        {/* Card using existing card style: icon + "Account Security" heading */}
        <div className="hh-card">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Lock size={20} color="var(--color-primary)" />
            <h1 className="card-title m-0" style={{ fontSize: 'var(--text-xl)' }}>Account Security</h1>
          </div>
          <p className="food-card-meta mb-4">
            Update your account password. Must be between 6 and 30 characters using only letters, numbers, and @.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Current Password */}
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="current-pass">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="current-pass"
                  type={showOld ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingRight: '2.8rem' }}
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOld((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  tabIndex={-1}
                  aria-label={showOld ? 'Hide password' : 'Show password'}
                >
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="new-pass">
                New Password <span className="text-muted fw-normal" style={{ fontSize: 'var(--text-xs)' }}>(Minimum 6 characters)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-pass"
                  type={showNew ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingRight: '2.8rem' }}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  tabIndex={-1}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordErrors.map((err, idx) => (
                <div key={idx} className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{err}</span>
                </div>
              ))}
            </div>

            {/* Confirm New Password */}
            <div className="form-group mb-4">
              <label className="form-label" htmlFor="confirm-new-pass">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm-new-pass"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-control"
                  style={{
                    paddingRight: '2.8rem',
                    borderColor: confirmError ? 'var(--color-danger)' : undefined,
                  }}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmError && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{confirmError}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                className="btn-hh-primary d-inline-flex align-items-center justify-content-center gap-2"
                style={{ minWidth: '180px' }}
                disabled={isUpdating}
                type="submit"
              >
                {isUpdating ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
