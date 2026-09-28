import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf, UserCircle, Phone, Lock, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    city: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};

    if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully! Welcome to HelpingHand.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Mobile may already be registered.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hh-auth-wrap">
      <div className="hh-auth-card">
        <div className="d-flex align-items-center gap-2 mb-2">
          <Leaf size={28} color="var(--color-primary)" strokeWidth={2.5} />
          <h1 className="section-title mb-0" style={{ color: 'var(--color-primary)' }}>Join HelpingHand</h1>
        </div>
        <p className="food-card-meta mb-4">Register to share or receive extra food in your city.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
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
                <UserCircle size={16} />
              </div>
              <input
                id="reg-name"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="e.g. Ramesh Patel"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group mb-3">
            <label className="form-label" htmlFor="reg-mobile">Mobile Number</label>
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
                id="reg-mobile"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="e.g. 9876543210"
                value={form.mobile}
                onChange={(e) => update('mobile', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-sm-6 form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
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
                  id="reg-password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="6+ chars"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                />
              </div>
              {fieldErrors.password && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.password}</span>
                </div>
              )}
            </div>

            <div className="col-sm-6 form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
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
                  id="reg-confirm"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="Re-enter"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  required
                />
              </div>
              {fieldErrors.confirmPassword && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.confirmPassword}</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label" htmlFor="reg-city">City</label>
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
                <MapPin size={16} />
              </div>
              <input
                id="reg-city"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="e.g. Ahmedabad, Surat, Mumbai"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              className="btn-hh-primary w-100 justify-content-center d-flex align-items-center gap-2"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 text-center border-top" style={{ borderColor: 'var(--color-border)' }}>
          <span className="food-card-meta">
            Already registered?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              Sign in here
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
