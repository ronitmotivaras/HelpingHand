import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { adminLogin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(password);
      toast.success('Signed in to Admin Console');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid admin password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">

        {/* Brand icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--color-primary), #1d9e3b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(26,122,46,0.35)',
            }}
          >
            <Leaf size={28} color="#fff" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <h1 className="login-title">Admin Console</h1>
        <p className="login-subtitle">HelpingHand Platform Administration</p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label
              className="form-label"
              htmlFor="admin-pass"
              style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}
            >
              Admin Password
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '13px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                }}
              >
                <Lock size={15} />
              </div>
              <input
                id="admin-pass"
                type={showPassword ? 'text' : 'password'}
                className="admin-form-input"
                style={{ paddingLeft: '2.4rem', paddingRight: '2.8rem' }}
                placeholder="Enter your admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            id="admin-submit-btn"
            className="btn-admin-primary w-100"
            style={{ justifyContent: 'center', padding: '11px', marginTop: '4px' }}
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '15px',
                    height: '15px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    display: 'inline-block',
                  }}
                />
                <span>Signing In...</span>
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer note */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <ShieldCheck size={13} color="var(--color-text-muted)" />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Restricted access — authorized personnel only
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
