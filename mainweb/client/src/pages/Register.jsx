import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf, UserCircle, Phone, Lock, MapPin, AlertCircle, Building2, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validatePassword, validateMobile } from '../utils/validation';
import { CITIES } from '../constants/cities';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('donator'); // 'donator' or 'ngo'

  // Donator Form State
  const [donatorForm, setDonatorForm] = useState({
    name: '',
    mobile: '',
    city: '',
    password: '',
    confirmPassword: '',
  });

  // NGO Form State
  const [ngoForm, setNgoForm] = useState({
    ngoName: '',
    mobile: '',
    city: '',
    address: '',
    coordinatorName: '',
    password: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function handleAccountTypeChange(type) {
    setAccountType(type);
    setPasswordErrors([]);
    setConfirmPasswordError('');
    setFieldErrors({});
  }

  function updateDonator(field, value) {
    setDonatorForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'mobile') {
      if (/[^0-9]/.test(value)) {
        setFieldErrors((prev) => ({ ...prev, mobile: 'Only numbers (0-9) are allowed. No characters, symbols, or spaces.' }));
      } else if (value.length > 0 && value.length !== 10) {
        setFieldErrors((prev) => ({ ...prev, mobile: 'Mobile number must be exactly 10 digits' }));
      } else {
        setFieldErrors((prev) => ({ ...prev, mobile: '' }));
      }
    } else if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  function updateNgo(field, value) {
    setNgoForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'mobile') {
      if (/[^0-9]/.test(value)) {
        setFieldErrors((prev) => ({ ...prev, mobile: 'Only numbers (0-9) are allowed. No characters, symbols, or spaces.' }));
      } else if (value.length > 0 && value.length !== 10) {
        setFieldErrors((prev) => ({ ...prev, mobile: 'Mobile number must be exactly 10 digits' }));
      } else {
        setFieldErrors((prev) => ({ ...prev, mobile: '' }));
      }
    } else if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  async function handleDonatorSubmit(e) {
    e.preventDefault();

    const pErrors = validatePassword(donatorForm.password);
    let cError = '';
    if (donatorForm.password !== donatorForm.confirmPassword) {
      cError = 'Passwords do not match';
    }

    const errors = {};
    if (!donatorForm.name.trim()) errors.name = 'Please enter your full name';
    const mError = validateMobile(donatorForm.mobile);
    if (mError) errors.mobile = mError;
    if (!donatorForm.city.trim()) errors.city = 'Please select your city';

    setPasswordErrors(pErrors);
    setConfirmPasswordError(cError);
    setFieldErrors(errors);

    if (pErrors.length > 0 || cError || Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await register({
        accountType: 'donator',
        name: donatorForm.name.trim(),
        mobile: donatorForm.mobile.trim(),
        city: donatorForm.city.trim(),
        password: donatorForm.password,
        confirmPassword: donatorForm.confirmPassword,
      });
      toast.success('Donator account created successfully! Please sign in.');
      navigate('/login', { state: { mobile: donatorForm.mobile } });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleNgoSubmit(e) {
    e.preventDefault();

    const pErrors = validatePassword(ngoForm.password);
    let cError = '';
    if (ngoForm.password !== ngoForm.confirmPassword) {
      cError = 'Passwords do not match';
    }

    const errors = {};
    if (!ngoForm.ngoName.trim()) errors.ngoName = 'Please enter NGO name';
    const mError = validateMobile(ngoForm.mobile);
    if (mError) errors.mobile = mError;
    if (!ngoForm.city.trim()) errors.city = 'Please select NGO city';
    if (!ngoForm.address.trim()) errors.address = 'Please enter operating address';
    if (!ngoForm.coordinatorName.trim()) errors.coordinatorName = 'Please enter coordinator name';

    setPasswordErrors(pErrors);
    setConfirmPasswordError(cError);
    setFieldErrors(errors);

    if (pErrors.length > 0 || cError || Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await register({
        accountType: 'ngo',
        ngoName: ngoForm.ngoName.trim(),
        mobile: ngoForm.mobile.trim(),
        city: ngoForm.city.trim(),
        address: ngoForm.address.trim(),
        coordinatorName: ngoForm.coordinatorName.trim(),
        password: ngoForm.password,
        confirmPassword: ngoForm.confirmPassword,
      });
      toast.success('NGO verification application submitted! Please sign in.');
      navigate('/login', { state: { mobile: ngoForm.mobile.trim() } });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'NGO Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hh-auth-wrap" style={{ minHeight: '100vh', padding: 'var(--space-4) var(--space-3)' }}>
      <div className="hh-auth-card" style={{ maxWidth: '490px', padding: 'var(--space-5) var(--space-6)' }}>
        <Link
          to="/login"
          className="d-inline-flex align-items-center gap-2 mb-3 text-decoration-none"
          style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to login</span>
        </Link>
        <div className="d-flex align-items-center gap-2 mb-1">
          <Leaf size={26} color="var(--color-primary)" strokeWidth={2.5} />
          <h1 className="section-title mb-0" style={{ color: 'var(--color-primary)', fontSize: '22px' }}>HelpingHand</h1>
        </div>
        <p className="food-card-meta mb-3" style={{ fontSize: '13px' }}>Community surplus food rescue network.</p>

        {/* Choice at top: Register as: Donator (default) / NGO */}
        <div className="form-group mb-3">
          <label className="form-label mb-1" style={{ fontWeight: 600, fontSize: '13px' }}>Register as:</label>
          <div className="d-flex gap-4">
            <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
              <input
                type="radio"
                name="accountType"
                value="donator"
                checked={accountType === 'donator'}
                onChange={() => handleAccountTypeChange('donator')}
                style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>Donator</span>
            </label>
            <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
              <input
                type="radio"
                name="accountType"
                value="ngo"
                checked={accountType === 'ngo'}
                onChange={() => handleAccountTypeChange('ngo')}
                style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>NGO</span>
            </label>
          </div>
        </div>

        {/* DONATOR REGISTRATION FORM */}
        {accountType === 'donator' && (
          <form onSubmit={handleDonatorSubmit}>
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="donator-name" style={{ marginBottom: '3px', fontSize: '13px' }}>Full Name</label>
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
                  id="donator-name"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. Ramesh Patel"
                  value={donatorForm.name}
                  onChange={(e) => updateDonator('name', e.target.value)}
                  required
                />
              </div>
              {fieldErrors.name && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.name}</span>
                </div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label" htmlFor="donator-mobile" style={{ marginBottom: '3px', fontSize: '13px' }}>Mobile Number</label>
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
                  id="donator-mobile"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. 9876543210"
                  value={donatorForm.mobile}
                  onChange={(e) => updateDonator('mobile', e.target.value)}
                  required
                />
              </div>
              {fieldErrors.mobile && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.mobile}</span>
                </div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label" htmlFor="donator-city" style={{ marginBottom: '3px', fontSize: '13px' }}>City</label>
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
                <select
                  id="donator-city"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  value={donatorForm.city}
                  onChange={(e) => updateDonator('city', e.target.value)}
                  required
                >
                  <option value="">Select your city...</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {fieldErrors.city && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.city}</span>
                </div>
              )}
            </div>

            {/* Separated Password and Confirm Password (each on its own line) */}
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="donator-password" style={{ marginBottom: '3px', fontSize: '13px' }}>Password</label>
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
                  id="donator-password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="Enter password"
                  value={donatorForm.password}
                  onChange={(e) => updateDonator('password', e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  required
                />
              </div>
              {passwordErrors.map((err, idx) => (
                <div key={idx} className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{err}</span>
                </div>
              ))}
            </div>

            <div className="form-group mb-3">
              <label className="form-label" htmlFor="donator-confirm" style={{ marginBottom: '3px', fontSize: '13px' }}>Confirm Password</label>
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
                  id="donator-confirm"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="Re-enter password"
                  value={donatorForm.confirmPassword}
                  onChange={(e) => updateDonator('confirmPassword', e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  required
                />
              </div>
              {confirmPasswordError && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{confirmPasswordError}</span>
                </div>
              )}
            </div>

            <div className="pt-1">
              <button
                className="btn-hh-primary w-100 justify-content-center d-flex align-items-center gap-2"
                disabled={loading}
                type="submit"
                style={{ padding: '9px 16px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Creating Donator Account...</span>
                  </>
                ) : (
                  'Create Donator Account'
                )}
              </button>
            </div>
          </form>
        )}

        {/* NGO REGISTRATION FORM - Strict order: 1) NGO Name, 2) NGO City, 3) Address, 4) Coordinator Name, 5) Password, 6) Confirm Password */}
        {accountType === 'ngo' && (
          <form onSubmit={handleNgoSubmit}>
            {/* 1) NGO name */}
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="ngo-name" style={{ marginBottom: '3px', fontSize: '13px' }}>NGO Name</label>
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
                  id="ngo-name"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. Seva Food Relief Foundation"
                  value={ngoForm.ngoName}
                  onChange={(e) => updateNgo('ngoName', e.target.value)}
                  required
                />
              </div>
              {fieldErrors.ngoName && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.ngoName}</span>
                </div>
              )}
            </div>

            {/* 2) Contact Mobile Number */}
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="ngo-mobile" style={{ marginBottom: '3px', fontSize: '13px' }}>Contact Mobile Number</label>
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
                  id="ngo-mobile"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. 9876543210"
                  value={ngoForm.mobile}
                  onChange={(e) => updateNgo('mobile', e.target.value)}
                  required
                />
              </div>
              {fieldErrors.mobile && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.mobile}</span>
                </div>
              )}
            </div>

            {/* 3) NGO City */}
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="ngo-city" style={{ marginBottom: '3px', fontSize: '13px' }}>NGO City</label>
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
                <select
                  id="ngo-city"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  value={ngoForm.city}
                  onChange={(e) => updateNgo('city', e.target.value)}
                  required
                >
                  <option value="">Select NGO city...</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {fieldErrors.city && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.city}</span>
                </div>
              )}
            </div>

            {/* 3) Address */}
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="ngo-address" style={{ marginBottom: '3px', fontSize: '13px' }}>Address</label>
              <textarea
                id="ngo-address"
                className="form-control"
                rows="2"
                placeholder="Operating address, community center, or kitchen..."
                value={ngoForm.address}
                onChange={(e) => updateNgo('address', e.target.value)}
                required
              />
              {fieldErrors.address && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.address}</span>
                </div>
              )}
            </div>

            {/* 4) Coordinator Name */}
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="ngo-coordinator-name" style={{ marginBottom: '3px', fontSize: '13px' }}>Coordinator Name</label>
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
                  <User size={16} />
                </div>
                <input
                  id="ngo-coordinator-name"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. Anjali Sharma"
                  value={ngoForm.coordinatorName}
                  onChange={(e) => updateNgo('coordinatorName', e.target.value)}
                  required
                />
              </div>
              {fieldErrors.coordinatorName && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.coordinatorName}</span>
                </div>
              )}
            </div>

            {/* 5) Password (own line) */}
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="ngo-password" style={{ marginBottom: '3px', fontSize: '13px' }}>Password</label>
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
                  id="ngo-password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="Enter password"
                  value={ngoForm.password}
                  onChange={(e) => updateNgo('password', e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  required
                />
              </div>
              {passwordErrors.map((err, idx) => (
                <div key={idx} className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{err}</span>
                </div>
              ))}
            </div>

            {/* 6) Confirm Password (own line, separated) */}
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="ngo-confirm-password" style={{ marginBottom: '3px', fontSize: '13px' }}>Confirm Password</label>
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
                  id="ngo-confirm-password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="Re-enter password"
                  value={ngoForm.confirmPassword}
                  onChange={(e) => updateNgo('confirmPassword', e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  required
                />
              </div>
              {confirmPasswordError && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{confirmPasswordError}</span>
                </div>
              )}
            </div>

            <div className="pt-1">
              <button
                className="btn-hh-primary w-100 justify-content-center d-flex align-items-center gap-2"
                disabled={loading}
                type="submit"
                style={{ padding: '9px 16px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Submitting NGO Application...</span>
                  </>
                ) : (
                  'Apply for NGO Verification'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-3" style={{ fontSize: '13px' }}>
          <span className="text-muted">Already have an account? </span>
          <Link
            to="/login"
            style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
