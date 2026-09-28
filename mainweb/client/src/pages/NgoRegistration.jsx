import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BadgeCheck, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

export default function NgoRegistration() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ngoName: '',
    address: '',
    city: user?.city || '',
    contactNum: user?.mobile || '',
  });
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

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/profile/apply-ngo', form);
      toast.success('NGO verification application submitted successfully!');
      await refreshProfile();
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit NGO application');
    } finally {
      setLoading(false);
    }
  }

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
          <span>Back to profile</span>
        </Link>

        <div className="hh-card">
          <div className="d-flex align-items-center gap-2 mb-1">
            <BadgeCheck size={24} color="var(--color-primary)" />
            <h1 className="section-title m-0">Apply for NGO Verification</h1>
          </div>
          <p className="food-card-meta mb-4">
            Help verify your organization so community donors can prioritize larger food rescues.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="ngo-name">Official Organization / Trust Name</label>
              <input
                id="ngo-name"
                className="form-control"
                placeholder="e.g. Seva Food Relief Foundation"
                value={form.ngoName}
                onChange={(e) => update('ngoName', e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label" htmlFor="ngo-address">Operating Address / Hub</label>
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
                <input
                  id="ngo-city"
                  className="form-control"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  required
                />
              </div>

              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="ngo-contact">Coordinator Contact Phone</label>
                <input
                  id="ngo-contact"
                  className="form-control"
                  value={form.contactNum}
                  onChange={(e) => update('contactNum', e.target.value)}
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
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck size={18} />
                    <span>Submit Verification Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
