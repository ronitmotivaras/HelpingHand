import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BadgeCheck, Clock, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import { CITIES } from '../constants/cities';
import { validateMobile } from '../utils/validation';

export default function NgoRegistration() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ngoName: '',
    address: '',
    city: user?.city || '',
    contactNum: user?.mobile || '',
  });
  const [phoneError, setPhoneError] = useState('');
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
  }

  function handlePhoneChange(val) {
    update('contactNum', val);
    if (/[^0-9]/.test(val)) {
      setPhoneError('Only numbers (0-9) are allowed. No characters, symbols, or spaces.');
    } else if (val.length > 0 && val.length !== 10) {
      setPhoneError('Mobile number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const mError = validateMobile(form.contactNum);
    if (mError) {
      setPhoneError(mError);
      return;
    }
    if (!form.city.trim()) {
      toast.error('Please select a city');
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
      toast.error(err.response?.data?.message || 'Failed to submit NGO application');
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

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="ngo-name">Organization / Trust Name</label>
              <input
                id="ngo-name"
                className="form-control"
                placeholder="e.g. Robin Hood Army, Annamrita Foundation"
                value={form.ngoName}
                onChange={(e) => update('ngoName', e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label" htmlFor="ngo-address">Official Operating Address</label>
              <textarea
                id="ngo-address"
                className="form-control"
                rows="3"
                placeholder="Address of your community center or kitchen..."
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                required
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="ngo-city">City / Region</label>
                <select
                  id="ngo-city"
                  className="form-select"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  required
                >
                  <option value="">Select City...</option>
                  {cityOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="ngo-contact">Coordinator Contact Phone</label>
                <input
                  id="ngo-contact"
                  className="form-control"
                  placeholder="10-digit mobile number"
                  value={form.contactNum}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  required
                />
                {phoneError && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{phoneError}</span>
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
