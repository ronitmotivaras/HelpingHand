import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
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

  const [passwordFocused, setPasswordFocused] = useState(false);
  const [currentPassError, setCurrentPassError] = useState('');
  const [newPassError, setNewPassError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  function handleCurrentPasswordChange(val) {
    setOldPassword(val);
    if (currentPassError) setCurrentPassError('');
  }

  function handleNewPasswordChange(val) {
    setNewPassword(val);
    if (newPassError) setNewPassError('');
    if (confirmPassword) {
      if (val !== confirmPassword) {
        setConfirmError('Passwords do not match');
      } else {
        setConfirmError('');
      }
    }
  }

  function handleConfirmPasswordChange(val) {
    setConfirmPassword(val);
    if (!val) {
      setConfirmError('');
    } else if (newPassword && val !== newPassword) {
      setConfirmError('Passwords do not match');
    } else {
      setConfirmError('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    let curErr = '';
    if (!oldPassword.trim()) {
      curErr = 'Please enter your current password';
    }
    setCurrentPassError(curErr);

    let nErr = '';
    if (!newPassword) {
      nErr = 'Please enter new password';
    } else {
      const pErrors = validatePassword(newPassword);
      if (pErrors.length > 0) {
        nErr = pErrors[0];
      }
    }
    setNewPassError(nErr);

    let cError = '';
    if (!confirmPassword) {
      cError = 'Please re-enter your password';
    } else if (newPassword !== confirmPassword) {
      cError = 'Passwords do not match';
    }
    setConfirmError(cError);

    if (curErr || nErr || cError) {
      return;
    }

    setIsUpdating(true);
    try {
      await api.patch('/profile/password', { oldPassword, newPassword });
      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassError('');
      setNewPassError('');
      setConfirmError('');
      navigate('/profile');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      if (/current password|incorrect|wrong|old password/i.test(msg)) {
        setCurrentPassError(msg);
      } else {
        setCurrentPassError(msg);
      }
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

        {/* Change Password Card */}
        <div className="hh-card">
          <h1 className="section-title mb-4">Change Password</h1>

          <form onSubmit={handleSubmit} noValidate>
            {/* Current Password */}
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="current-pass">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="current-pass"
                  type={showOld ? 'text' : 'password'}
                  className="form-control"
                  style={{
                    paddingRight: '2.8rem',
                    borderColor: currentPassError ? 'var(--color-danger)' : undefined,
                  }}
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
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
              {currentPassError && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{currentPassError}</span>
                </div>
              )}
            </div>

            {/* New Password */}
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="new-pass">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-pass"
                  type={showNew ? 'text' : 'password'}
                  className="form-control"
                  style={{
                    paddingRight: '2.8rem',
                    borderColor: newPassError ? 'var(--color-danger)' : undefined,
                  }}
                  placeholder="Enter new password"
                  maxLength={15}
                  value={newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onPaste={(e) => e.preventDefault()}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
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

              {/* Password Rules on focus/click */}
              {passwordFocused && (
                <div
                  className="p-2 mt-2 rounded"
                  style={{
                    background: 'var(--color-surface-2, #f8fafc)',
                    border: '1px solid var(--color-border-subtle, #e2e8f0)',
                    fontSize: '12px',
                    lineHeight: '1.5',
                  }}
                >
                  <div className="fw-semibold mb-1" style={{ color: 'var(--color-text, #334155)' }}>
                    Password Rules:
                  </div>
                  <ul className="mb-0 ps-3" style={{ color: 'var(--color-text-muted, #64748b)' }}>
                    <li>A-Z, a-z allowed</li>
                    <li>0-9 allowed</li>
                    <li>@ allowed (no other symbols)</li>
                    <li>Min 6 - 15 max characters</li>
                  </ul>
                </div>
              )}

              {newPassError && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{newPassError}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group mb-4">
              <label className="form-label" htmlFor="confirm-pass">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm-pass"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-control"
                  style={{
                    paddingRight: '2.8rem',
                    borderColor: confirmError ? 'var(--color-danger)' : undefined,
                  }}
                  placeholder="Re-enter password"
                  maxLength={15}
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
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
                {isUpdating ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
