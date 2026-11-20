import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api/axiosInstance';
import { validatePassword } from '../utils/validation';

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassError, setCurrentPassError] = useState('');
  const [newPassError, setNewPassError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'currentPassword' && currentPassError) {
      setCurrentPassError('');
    }
    if (name === 'newPassword') {
      if (newPassError) setNewPassError('');
      if (form.confirmPassword) {
        if (value !== form.confirmPassword) {
          setConfirmError('Passwords do not match');
        } else {
          setConfirmError('');
        }
      }
    }
    if (name === 'confirmPassword') {
      if (!value) {
        setConfirmError('');
      } else if (form.newPassword && value !== form.newPassword) {
        setConfirmError('Passwords do not match');
      } else {
        setConfirmError('');
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    let curErr = '';
    if (!form.currentPassword.trim()) {
      curErr = 'Please enter your current password';
    }
    setCurrentPassError(curErr);

    let nErr = '';
    if (!form.newPassword) {
      nErr = 'Please enter new password';
    } else {
      const pErrors = validatePassword(form.newPassword);
      if (pErrors.length > 0) {
        nErr = pErrors[0];
      }
    }
    setNewPassError(nErr);

    let cError = '';
    if (!form.confirmPassword) {
      cError = 'Please re-enter your password';
    } else if (form.newPassword !== form.confirmPassword) {
      cError = 'Passwords do not match';
    }
    setConfirmError(cError);

    if (curErr || nErr || cError) {
      return;
    }

    setIsSaving(true);
    try {
      await api.patch('/api/admin/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password updated successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setCurrentPassError('');
      setNewPassError('');
      setConfirmError('');
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'Session expired') return;
      if (err.response?.status === 401 && err.response?.data?.message !== 'Current password is incorrect') return;
      const msg = err.response?.data?.message || 'Failed to update password';
      if (/current password|incorrect|wrong/i.test(msg)) {
        setCurrentPassError(msg);
      } else {
        setCurrentPassError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div style={{ maxWidth: '560px' }}>
          <section className="admin-card-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <span
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-primary-light)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <KeyRound size={18} color="var(--color-primary)" strokeWidth={2} />
                </span>
                Update Admin Password
              </h2>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ padding: 'var(--space-5)' }}>
              {/* Current Password */}
              <div className="mb-4">
                <label
                  htmlFor="currentPassword"
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '6px',
                  }}
                >
                  Current Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    className="admin-form-input"
                    placeholder="Enter your current password"
                    value={form.currentPassword}
                    onChange={handleChange}
                    onPaste={(e) => e.preventDefault()}
                    style={{
                      paddingRight: '44px',
                      borderColor: currentPassError ? 'var(--color-danger, #dc2626)' : undefined,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                    tabIndex={-1}
                    aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {currentPassError && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
                    <AlertCircle size={13} />
                    <span>{currentPassError}</span>
                  </div>
                )}
              </div>

              {/* New Password */}
              <div className="mb-3">
                <label
                  htmlFor="newPassword"
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '6px',
                  }}
                >
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNew ? 'text' : 'password'}
                    className="admin-form-input"
                    placeholder="Enter password"
                    maxLength={15}
                    value={form.newPassword}
                    onChange={handleChange}
                    onPaste={(e) => e.preventDefault()}
                    style={{
                      paddingRight: '44px',
                      borderColor: newPassError ? 'var(--color-danger, #dc2626)' : undefined,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                    tabIndex={-1}
                    aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPassError && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
                    <AlertCircle size={13} />
                    <span>{newPassError}</span>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="mb-4">
                <label
                  htmlFor="confirmPassword"
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '6px',
                  }}
                >
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    className="admin-form-input"
                    placeholder="Re-enter new password"
                    maxLength={15}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onPaste={(e) => e.preventDefault()}
                    style={{
                      paddingRight: '44px',
                      borderColor: confirmError ? 'var(--color-danger, #dc2626)' : undefined,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmError && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
                    <AlertCircle size={13} />
                    <span>{confirmError}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div
                style={{
                  borderTop: '1px solid var(--color-border-subtle)',
                  marginBottom: 'var(--space-4)',
                }}
              />

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn-admin-outline"
                  disabled={isSaving}
                  onClick={() => {
                    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setCurrentPassError('');
                    setNewPassError('');
                    setConfirmError('');
                  }}
                >
                  Clear
                </button>
                <button
                  id="change-password-submit"
                  type="submit"
                  className="btn-admin-primary"
                  disabled={isSaving}
                >
                  <ShieldCheck size={15} strokeWidth={2} />
                  {isSaving ? 'Saving\u2026' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
