import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api/axiosInstance';

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

  const [newPasswordErrors, setNewPasswordErrors] = useState([]);
  const [confirmError, setConfirmError] = useState('');

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const pErrors = [];
    if (!form.newPassword || form.newPassword.length < 6) {
      pErrors.push('Password must be at least 6 characters');
    }
    if (form.newPassword && form.newPassword.length > 30) {
      pErrors.push('Password must be no more than 30 characters');
    }
    if (form.newPassword && /[^a-zA-Z0-9@]/.test(form.newPassword)) {
      pErrors.push('Password can only contain letters, numbers, and @');
    }

    let cError = '';
    if (form.newPassword !== form.confirmPassword) {
      cError = 'Passwords do not match';
    }

    setNewPasswordErrors(pErrors);
    setConfirmError(cError);

    if (pErrors.length > 0 || cError) {
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
      setNewPasswordErrors([]);
      setConfirmError('');
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'Session expired') return;
      if (err.response?.status === 401 && err.response?.data?.message !== 'Current password is incorrect') return;
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  }

  /* Simple strength indicator */
  const strength = (() => {
    const p = form.newPassword;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'Weak', color: 'var(--color-danger)', width: '25%' };
    if (score <= 2) return { label: 'Fair', color: 'var(--color-warning)', width: '50%' };
    if (score <= 3) return { label: 'Good', color: '#3b82f6', width: '75%' };
    return { label: 'Strong', color: 'var(--color-success)', width: '100%' };
  })();

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-breadcrumb-bar">
          <div>
            <h1 className="admin-page-title">Change Password</h1>
          </div>
        </div>

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

            <form onSubmit={handleSubmit} style={{ padding: 'var(--space-5)' }}>
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
                    required
                    style={{ paddingRight: '44px' }}
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
                    value={form.newPassword}
                    onChange={handleChange}
                    onPaste={(e) => e.preventDefault()}
                    required
                    style={{ paddingRight: '44px' }}
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

                {newPasswordErrors.map((err, idx) => (
                  <p
                    key={idx}
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-danger)',
                      marginTop: '4px',
                      marginBottom: 0,
                      fontWeight: 500,
                    }}
                  >
                    {err}
                  </p>
                ))}

                {/* Strength bar */}
                {strength && (
                  <div style={{ marginTop: '8px' }}>
                    <div
                      style={{
                        height: '4px',
                        borderRadius: '9999px',
                        background: 'var(--color-border)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: strength.width,
                          background: strength.color,
                          borderRadius: '9999px',
                          transition: 'width 250ms ease, background 250ms ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: strength.color,
                        marginTop: '4px',
                        display: 'inline-block',
                      }}
                    >
                      {strength.label}
                    </span>
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
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onPaste={(e) => e.preventDefault()}
                    required
                    style={{
                      paddingRight: '44px',
                      borderColor: confirmError ? 'var(--color-danger)' : undefined,
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
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-danger)',
                      marginTop: '5px',
                      fontWeight: 500,
                    }}
                  >
                    {confirmError}
                  </p>
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
                  onClick={() =>
                    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }
                >
                  Clear
                </button>
                <button
                  id="change-password-submit"
                  type="submit"
                  className="btn-admin-primary"
                  disabled={
                    isSaving ||
                    !form.currentPassword ||
                    !form.newPassword ||
                    !form.confirmPassword
                  }
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
