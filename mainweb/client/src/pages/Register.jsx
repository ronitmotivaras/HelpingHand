import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Leaf,
  UserCircle,
  Phone,
  Lock,
  MapPin,
  AlertCircle,
  Building2,
  User,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validatePassword, validateMobile, validateName, validateAddress } from '../utils/validation';
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

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password Focus States (to display password rules on click/focus)
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [ngoPasswordFocused, setNgoPasswordFocused] = useState(false);

  // Validation States
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function handleAccountTypeChange(type) {
    setAccountType(type);
    setHasSubmitted(false);
    setPasswordErrors([]);
    setConfirmPasswordError('');
    setFieldErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordFocused(false);
    setNgoPasswordFocused(false);
  }

  function updateDonator(field, value) {
    let finalVal = value;
    if (field === 'mobile') {
      // Allow only numbers and stop after 10 digits
      finalVal = value.replace(/\D/g, '').slice(0, 10);
    }
    setDonatorForm((prev) => ({ ...prev, [field]: finalVal }));

    // Clear field-specific error on user input if previously marked
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (field === 'password' && passwordErrors.length > 0) {
      setPasswordErrors([]);
    }
    if (field === 'confirmPassword' && confirmPasswordError) {
      setConfirmPasswordError('');
    }
  }

  function updateNgo(field, value) {
    let finalVal = value;
    if (field === 'mobile') {
      // Allow only numbers and stop after 10 digits
      finalVal = value.replace(/\D/g, '').slice(0, 10);
    }
    setNgoForm((prev) => ({ ...prev, [field]: finalVal }));

    // Clear field-specific error on user input if previously marked
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (field === 'password' && passwordErrors.length > 0) {
      setPasswordErrors([]);
    }
    if (field === 'confirmPassword' && confirmPasswordError) {
      setConfirmPasswordError('');
    }
  }

  async function handleDonatorSubmit(e) {
    e.preventDefault();
    setHasSubmitted(true);

    const errors = {};

    // 1. Name validation: alphabets and spaces only
    const nameErr = validateName(donatorForm.name, 'Full Name');
    if (nameErr) errors.name = nameErr;

    // 2. Mobile validation: 10 digits only
    const mError = validateMobile(donatorForm.mobile);
    if (mError) errors.mobile = mError;

    // 3. City validation
    if (!donatorForm.city.trim()) errors.city = 'Please select your city';

    // 4. Password validation: 6-14 chars, A-Za-z0-9@ only
    const pErrors = validatePassword(donatorForm.password);

    // 5. Confirm password
    let cError = '';
    if (!donatorForm.confirmPassword) {
      cError = 'Please re-enter your password';
    } else if (donatorForm.password !== donatorForm.confirmPassword) {
      cError = 'Passwords do not match';
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
        accountType: 'donator',
        name: donatorForm.name.trim(),
        mobile: donatorForm.mobile.trim(),
        city: donatorForm.city.trim(),
        password: donatorForm.password,
        confirmPassword: donatorForm.confirmPassword,
      });
      toast.success('Donator account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      if (err.response?.status === 409 || errorMsg.toLowerCase().includes('already registered')) {
        setFieldErrors((prev) => ({ ...prev, mobile: 'Mobile number is already registered' }));
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleNgoSubmit(e) {
    e.preventDefault();
    setHasSubmitted(true);

    const errors = {};

    // 1. NGO Name validation: alphabets and spaces only
    const ngoNameErr = validateName(ngoForm.ngoName, 'NGO Name');
    if (ngoNameErr) errors.ngoName = ngoNameErr;

    // 2. Mobile validation: 10 digits only
    const mError = validateMobile(ngoForm.mobile);
    if (mError) errors.mobile = mError;

    // 3. City validation
    if (!ngoForm.city.trim()) errors.city = 'Please select NGO city';

    // 4. Address validation: letters, numbers, spaces only (no symbols)
    const addressErr = validateAddress(ngoForm.address);
    if (addressErr) errors.address = addressErr;

    // 5. Coordinator Name validation: alphabets and spaces only
    const coordErr = validateName(ngoForm.coordinatorName, 'Coordinator Name');
    if (coordErr) errors.coordinatorName = coordErr;

    // 6. Password validation: 6-14 chars, A-Za-z0-9@ only
    const pErrors = validatePassword(ngoForm.password);

    // 7. Confirm password
    let cError = '';
    if (!ngoForm.confirmPassword) {
      cError = 'Please re-enter your password';
    } else if (ngoForm.password !== ngoForm.confirmPassword) {
      cError = 'Passwords do not match';
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
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'NGO Registration failed. Please try again.';
      if (err.response?.status === 409 || errorMsg.toLowerCase().includes('already registered')) {
        setFieldErrors((prev) => ({ ...prev, mobile: 'Mobile number is already registered' }));
      }
      toast.error(errorMsg);
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
          <form onSubmit={handleDonatorSubmit} noValidate>
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
                  style={{
                    paddingLeft: '2.4rem',
                    borderColor: hasSubmitted && fieldErrors.name ? '#dc2626' : undefined,
                  }}
                  placeholder="Enter name"
                  value={donatorForm.name}
                  onChange={(e) => updateDonator('name', e.target.value)}
                />
              </div>
              {hasSubmitted && fieldErrors.name && (
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
                  type="tel"
                  className="form-control"
                  style={{
                    paddingLeft: '2.4rem',
                    borderColor: hasSubmitted && fieldErrors.mobile ? '#dc2626' : undefined,
                  }}
                  placeholder="Enter mobile number (10 digit)"
                  value={donatorForm.mobile}
                  onChange={(e) => updateDonator('mobile', e.target.value)}
                  maxLength={10}
                />
              </div>
              {hasSubmitted && fieldErrors.mobile && (
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
                  style={{
                    paddingLeft: '2.4rem',
                    borderColor: hasSubmitted && fieldErrors.city ? '#dc2626' : undefined,
                  }}
                  value={donatorForm.city}
                  onChange={(e) => updateDonator('city', e.target.value)}
                >
                  <option value="">Select your city...</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {hasSubmitted && fieldErrors.city && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.city}</span>
                </div>
              )}
            </div>

            {/* Separated Password and Confirm Password with Eye Icons */}
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
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{
                    paddingLeft: '2.4rem',
                    paddingRight: '2.5rem',
                    borderColor: hasSubmitted && (passwordErrors.length > 0 || fieldErrors.password) ? '#dc2626' : undefined,
                  }}
                  placeholder="Enter password"
                  value={donatorForm.password}
                  onChange={(e) => updateDonator('password', e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onPaste={(e) => e.preventDefault()}
                  maxLength={14}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                    <li>Min 6 - 14 max characters</li>
                  </ul>
                </div>
              )}

              {hasSubmitted && passwordErrors.map((err, idx) => (
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{
                    paddingLeft: '2.4rem',
                    paddingRight: '2.5rem',
                    borderColor: hasSubmitted && (confirmPasswordError || fieldErrors.confirmPassword) ? '#dc2626' : undefined,
                  }}
                  placeholder="Re-enter password"
                  value={donatorForm.confirmPassword}
                  onChange={(e) => updateDonator('confirmPassword', e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  maxLength={14}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {hasSubmitted && confirmPasswordError && (
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

        {/* NGO REGISTRATION FORM */}
        {accountType === 'ngo' && (
          <form onSubmit={handleNgoSubmit} noValidate>
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
                  style={{
                    paddingLeft: '2.4rem',
                    borderColor: hasSubmitted && fieldErrors.ngoName ? '#dc2626' : undefined,
                  }}
                  placeholder="Enter NGO name"
                  value={ngoForm.ngoName}
                  onChange={(e) => updateNgo('ngoName', e.target.value)}
                />
              </div>
              {hasSubmitted && fieldErrors.ngoName && (
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
                  type="tel"
                  className="form-control"
                  style={{
                    paddingLeft: '2.4rem',
                    borderColor: hasSubmitted && fieldErrors.mobile ? '#dc2626' : undefined,
                  }}
                  placeholder="Enter mobile number (10 digit)"
                  value={ngoForm.mobile}
                  onChange={(e) => updateNgo('mobile', e.target.value)}
                  maxLength={10}
                />
              </div>
              {hasSubmitted && fieldErrors.mobile && (
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
                  style={{
                    paddingLeft: '2.4rem',
                    borderColor: hasSubmitted && fieldErrors.city ? '#dc2626' : undefined,
                  }}
                  value={ngoForm.city}
                  onChange={(e) => updateNgo('city', e.target.value)}
                >
                  <option value="">Select NGO city...</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {hasSubmitted && fieldErrors.city && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.city}</span>
                </div>
              )}
            </div>

            {/* 4) Address (alphabets, numbers, spaces only) */}
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="ngo-address" style={{ marginBottom: '3px', fontSize: '13px' }}>Address</label>
              <textarea
                id="ngo-address"
                className="form-control"
                rows="2"
                placeholder="Enter address"
                style={{
                  borderColor: hasSubmitted && fieldErrors.address ? '#dc2626' : undefined,
                }}
                value={ngoForm.address}
                onChange={(e) => updateNgo('address', e.target.value)}
              />
              {hasSubmitted && fieldErrors.address && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.address}</span>
                </div>
              )}
            </div>

            {/* 5) Coordinator Name (alphabets and spaces only) */}
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
                  style={{
                    paddingLeft: '2.4rem',
                    borderColor: hasSubmitted && fieldErrors.coordinatorName ? '#dc2626' : undefined,
                  }}
                  placeholder="Enter coordinator name"
                  value={ngoForm.coordinatorName}
                  onChange={(e) => updateNgo('coordinatorName', e.target.value)}
                />
              </div>
              {hasSubmitted && fieldErrors.coordinatorName && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.coordinatorName}</span>
                </div>
              )}
            </div>

            {/* 6) Password with Eye Icon */}
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
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{
                    paddingLeft: '2.4rem',
                    paddingRight: '2.5rem',
                    borderColor: hasSubmitted && (passwordErrors.length > 0 || fieldErrors.password) ? '#dc2626' : undefined,
                  }}
                  placeholder="Enter password"
                  value={ngoForm.password}
                  onChange={(e) => updateNgo('password', e.target.value)}
                  onFocus={() => setNgoPasswordFocused(true)}
                  onBlur={() => setNgoPasswordFocused(false)}
                  onPaste={(e) => e.preventDefault()}
                  maxLength={14}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Rules on focus/click for NGO */}
              {ngoPasswordFocused && (
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
                    <li>Min 6 - 14 max characters</li>
                  </ul>
                </div>
              )}

              {hasSubmitted && passwordErrors.map((err, idx) => (
                <div key={idx} className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{err}</span>
                </div>
              ))}
            </div>

            {/* 7) Confirm Password with Eye Icon */}
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{
                    paddingLeft: '2.4rem',
                    paddingRight: '2.5rem',
                    borderColor: hasSubmitted && (confirmPasswordError || fieldErrors.confirmPassword) ? '#dc2626' : undefined,
                  }}
                  placeholder="Re-enter password"
                  value={ngoForm.confirmPassword}
                  onChange={(e) => updateNgo('confirmPassword', e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  maxLength={14}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {hasSubmitted && confirmPasswordError && (
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
