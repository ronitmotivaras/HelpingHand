import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf, UserCircle, Phone, Lock, MapPin, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validatePassword } from '../utils/validation';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('user');
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    city: '',
    ngoName: '',
    ngoAddress: '',
    ngoContactNum: '',
    coordinatorPhone: '',
  });
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
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

    const pErrors = validatePassword(form.password);
    let cError = '';
    if (form.password !== form.confirmPassword) {
      cError = 'Passwords do not match';
    }

    const errors = {};
    if (accountType === 'ngo') {
      if (!form.ngoName.trim()) errors.ngoName = 'Please enter NGO name';
      if (!form.ngoAddress.trim()) errors.ngoAddress = 'Please enter NGO address';
      if (!form.ngoContactNum.trim()) errors.ngoContactNum = 'Please enter NGO contact number';
      if (!form.coordinatorPhone.trim()) errors.coordinatorPhone = 'Please enter coordinator phone';
    }

    setPasswordErrors(pErrors);
    setConfirmPasswordError(cError);
    setFieldErrors(errors);

    if (pErrors.length > 0 || cError || Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        city: form.city.trim(),
        accountType,
        ngoName: form.ngoName.trim(),
        ngoAddress: form.ngoAddress.trim(),
        ngoContactNum: form.ngoContactNum.trim(),
        coordinatorPhone: form.coordinatorPhone.trim(),
      });
      toast.success('Account created successfully! Please sign in.');
      navigate('/login', { state: { mobile: form.mobile } });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hh-auth-wrap">
      <div className="hh-auth-card" style={{ maxWidth: accountType === 'ngo' ? '540px' : '480px' }}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <Leaf size={28} color="var(--color-primary)" strokeWidth={2.5} />
          <h1 className="section-title mb-0" style={{ color: 'var(--color-primary)' }}>Join HelpingHand</h1>
        </div>
        <p className="food-card-meta mb-4">Register to share or receive extra food in your city.</p>

        {/* Choice at top: Register as: User (default) / NGO */}
        <div className="form-group mb-4">
          <label className="form-label mb-2" style={{ fontWeight: 600 }}>Register as:</label>
          <div className="d-flex gap-4">
            <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-base)' }}>
              <input
                type="radio"
                name="accountType"
                value="user"
                checked={accountType === 'user'}
                onChange={() => setAccountType('user')}
                style={{ accentColor: 'var(--color-primary)', width: '17px', height: '17px', cursor: 'pointer' }}
              />
              <span>User</span>
            </label>
            <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-base)' }}>
              <input
                type="radio"
                name="accountType"
                value="ngo"
                checked={accountType === 'ngo'}
                onChange={() => setAccountType('ngo')}
                style={{ accentColor: 'var(--color-primary)', width: '17px', height: '17px', cursor: 'pointer' }}
              />
              <span>NGO</span>
            </label>
          </div>
        </div>

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
                  onPaste={(e) => e.preventDefault()}
                  required
                />
              </div>
              {passwordErrors.map((err, idx) => (
                <div key={idx} className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{err}</span>
                </div>
              ))}
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
                  onPaste={(e) => e.preventDefault()}
                  required
                />
              </div>
              {confirmPasswordError && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{confirmPasswordError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-group mb-3">
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

          {/* Additional NGO Fields directly below, only while NGO is selected */}
          {accountType === 'ngo' && (
            <div className="pt-2 mb-3 border-top" style={{ borderColor: 'var(--color-border)' }}>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="reg-ngo-name">NGO Name</label>
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
                    <Building2 size={16} />
                  </div>
                  <input
                    id="reg-ngo-name"
                    className="form-control"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="e.g. Seva Food Relief Foundation"
                    value={form.ngoName}
                    onChange={(e) => update('ngoName', e.target.value)}
                    required
                  />
                </div>
                {fieldErrors.ngoName && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.ngoName}</span>
                  </div>
                )}
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="reg-ngo-address">NGO Address</label>
                <textarea
                  id="reg-ngo-address"
                  className="form-control"
                  rows="2"
                  placeholder="Community center or kitchen address..."
                  value={form.ngoAddress}
                  onChange={(e) => update('ngoAddress', e.target.value)}
                  required
                />
                {fieldErrors.ngoAddress && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.ngoAddress}</span>
                  </div>
                )}
              </div>

              <div className="row g-3 mb-2">
                <div className="col-sm-6 form-group">
                  <label className="form-label" htmlFor="reg-ngo-contact">NGO Contact Number</label>
                  <input
                    id="reg-ngo-contact"
                    className="form-control"
                    placeholder="e.g. 022-12345678"
                    value={form.ngoContactNum}
                    onChange={(e) => update('ngoContactNum', e.target.value)}
                    required
                  />
                  {fieldErrors.ngoContactNum && (
                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                      <AlertCircle size={13} />
                      <span>{fieldErrors.ngoContactNum}</span>
                    </div>
                  )}
                </div>

                <div className="col-sm-6 form-group">
                  <label className="form-label" htmlFor="reg-coord-contact">Coordinator Contact Phone</label>
                  <input
                    id="reg-coord-contact"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={form.coordinatorPhone}
                    onChange={(e) => update('coordinatorPhone', e.target.value)}
                    required
                  />
                  {fieldErrors.coordinatorPhone && (
                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                      <AlertCircle size={13} />
                      <span>{fieldErrors.coordinatorPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
