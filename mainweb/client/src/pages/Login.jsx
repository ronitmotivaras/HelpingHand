import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf, Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateMobile } from '../utils/validation';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobile, setMobile] = useState(location.state?.mobile || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function handleMobileChange(val) {
    setMobile(val);
    if (/[^0-9]/.test(val)) {
      setFieldErrors((prev) => ({ ...prev, mobile: 'Only numbers (0-9) are allowed. No characters, symbols, or spaces.' }));
    } else if (val.length > 0 && val.length !== 10) {
      setFieldErrors((prev) => ({ ...prev, mobile: 'Mobile number must be exactly 10 digits' }));
    } else {
      setFieldErrors((prev) => ({ ...prev, mobile: '' }));
    }
  }

  function handlePasswordChange(val) {
    setPassword(val);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errors = {};
    if (!mobile || !mobile.trim()) {
      errors.mobile = 'Please enter your registered mobile number';
    } else {
      const clean = mobile.trim();
      if (!/^\d{10}$/.test(clean)) {
        errors.mobile = 'Mobile number must be exactly 10 digits';
      }
    }
    if (!password) {
      errors.password = 'Please enter your password';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      await login(mobile.trim(), password);
      toast.success('Welcome back to HelpingHand!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect mobile number or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hh-auth-wrap">
      <div className="hh-auth-card">
        <div className="d-flex align-items-center gap-2 mb-2">
          <Leaf size={28} color="var(--color-primary)" strokeWidth={2.5} />
          <h1 className="section-title mb-0" style={{ color: 'var(--color-primary)' }}>HelpingHand</h1>
        </div>
        <p className="food-card-meta mb-4">Community surplus food rescue network.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group mb-3">
            <label className="form-label" htmlFor="login-mobile">Registered Mobile Number</label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Phone size={16} />
              </div>
              <input
                id="login-mobile"
                className="form-control"
                style={{
                  paddingLeft: '2.4rem',
                  borderColor: fieldErrors.mobile ? 'var(--color-danger)' : undefined,
                }}
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                autoFocus={!location.state?.mobile}
              />
            </div>
            {fieldErrors.mobile && (
              <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                <AlertCircle size={13} />
                <span>{fieldErrors.mobile}</span>
              </div>
            )}
          </div>

          <div className="form-group mb-4">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Lock size={16} />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{
                  paddingLeft: '2.4rem',
                  paddingRight: '2.8rem',
                  borderColor: fieldErrors.password ? 'var(--color-danger)' : undefined,
                }}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                autoFocus={Boolean(location.state?.mobile)}
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                <AlertCircle size={13} />
                <span>{fieldErrors.password}</span>
              </div>
            )}
          </div>

          <button
            className="btn-hh-primary w-100 justify-content-center d-flex align-items-center gap-2 mb-3"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Signing In...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="food-card-meta text-center mb-0 mt-3 pt-3 border-top" style={{ borderColor: 'var(--color-border)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
