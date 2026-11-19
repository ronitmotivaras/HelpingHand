import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BadgeCheck, Clock, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import { CITIES } from '../constants/cities';
import { validateMobile, validateName, validateNgoName, validateAddress } from '../utils/validation';

export default function NgoRegistration() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ngoName: '',
    address: '',
    city: user?.city || '',
    contactNum: user?.mobile || '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user?.ngoStatus === 'pending' || user?.ngoStatus === 'approved') {
    return (
      <>
        <Navbar />
        <main className="hh-page" style={{ maxWidth: '640px' }}>
          <div className="hh-card text-center py-5">
            <div className="mb-3 d-flex justify-content-center">
              {user?.ngoStatus === 'approved' ? (
                <BadgeCheck size={56} color="var(--color-primary)" />
              ) : (
                <Clock size={56} color="var(--color-warning)" />
              )}
            </div>
            <h2 className="section-title mt-2 mb-2">
              {user?.ngoStatus === 'approved' ? 'Verified Community Partner' : 'Verification In Progress'}
            </h2>
            <p className="food-card-meta mb-4">
              {user?.ngoStatus === 'approved'
                ? 'Your organization is already verified as an official NGO partner.'
                : 'You have an active NGO verification request currently under administrator review.'}
            </p>
            <Link to="/profile" className="btn-hh-secondary d-inline-flex align-items-center gap-2">
              <ArrowLeft size={16} />
              <span>Back to Profile</span>
            </Link>
          </div>
        </main>
      </>
    );
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  function handlePhoneChange(val) {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    update('contactNum', clean);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errors = {};
    const nameErr = validateNgoName(form.ngoName, 'Organization Name');
    if (nameErr) errors.ngoName = nameErr;

    const addrErr = validateAddress(form.address);
    if (addrErr) errors.address = addrErr;

    if (!form.city.trim()) errors.city = 'Please select a city';

    const mError = validateMobile(form.contactNum);
    if (mError) errors.contactNum = mError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/profile/apply-ngo', {
        ...form,
        contactNum: form.contactNum.trim(),
        city: form.city.trim(),
      });
      toast.success('NGO verification application submitted successfully!');
      await refreshProfile();
      navigate('/profile');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (/ngo|organization|name/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, ngoName: msg }));
      } else if (/address/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, address: msg }));
      } else if (/phone|mobile/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, contactNum: msg }));
      } else if (/city/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, city: msg }));
      } else {
        toast.error(msg || 'Failed to submit NGO application');
      }
    } finally {
      setLoading(false);
    }
  }

  const cityOptions = Array.from(new Set([...CITIES, ...(user?.city ? [user.city] : [])]));

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
          <span>Back to Profile</span>
        </Link>

        <div className="hh-card">
          <h1 className="section-title mb-1">Apply for NGO Verification</h1>
          <p className="food-card-meta mb-4">
            Register your food rescue charity, community shelter, or NGO with HelpingHand.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="ngo-name">Organization / Trust Name</label>
              <input
                id="ngo-name"
                className="form-control"
                style={{
                  borderColor: fieldErrors.ngoName ? 'var(--color-danger, #dc2626)' : undefined,
                }}
                maxLength={100}
                placeholder="Enter NGO name"
                value={form.ngoName}
                onChange={(e) => update('ngoName', e.target.value)}
              />
              {fieldErrors.ngoName && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.ngoName}</span>
                </div>
              )}
            </div>

            <div className="form-group mb-3">
              <label className="form-label" htmlFor="ngo-address">Official Operating Address</label>
              <textarea
                id="ngo-address"
                className="form-control"
                rows="3"
                style={{
                  borderColor: fieldErrors.address ? 'var(--color-danger, #dc2626)' : undefined,
                }}
                maxLength={1000}
                placeholder="Enter address"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
              />
              {fieldErrors.address && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.address}</span>
                </div>
              )}
            </div>

            <div className="row g-3 mb-4">
              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="ngo-city">City / Region</label>
                <select
                  id="ngo-city"
                  className="form-select"
                  style={{
                    borderColor: fieldErrors.city ? 'var(--color-danger, #dc2626)' : undefined,
                  }}
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                >
                  <option value="">Select City...</option>
                  {cityOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {fieldErrors.city && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.city}</span>
                  </div>
                )}
              </div>

              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="ngo-contact">Coordinator Contact Phone</label>
                <input
                  id="ngo-contact"
                  className="form-control"
                  style={{
                    borderColor: fieldErrors.contactNum ? 'var(--color-danger, #dc2626)' : undefined,
                  }}
                  placeholder="Enter mobile number (10 digit)"
                  value={form.contactNum}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  maxLength={10}
                />
                {fieldErrors.contactNum && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.contactNum}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                className="btn-hh-primary w-100 justify-content-center d-flex align-items-center gap-2"
                disabled={loading}
              >
                {loading ? 'Submitting Application...' : 'Submit Verification Request'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
