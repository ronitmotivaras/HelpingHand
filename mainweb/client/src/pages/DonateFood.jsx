import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import { CITIES } from '../constants/cities';
import { validateMobile } from '../utils/validation';

export default function DonateFood() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    foodName: '',
    quantity: '',
    foodType: 'veg',
    contactName: user?.name || '',
    phone: user?.mobile || '',
    city: user?.city || 'Ahmedabad',
    availableUpto: '',
    address: '',
  });
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhoneChange(val) {
    update('phone', val);
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

    const mError = validateMobile(form.phone);
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
      await api.post('/donations', {
        ...form,
        phone: form.phone.trim(),
        city: form.city.trim(),
      });
      toast.success('Food donation listing published successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post food listing');
    } finally {
      setLoading(false);
    }
  }

  const cityOptions = Array.from(new Set([...CITIES, ...(user?.city ? [user.city] : [])]));

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ maxWidth: '680px' }}>
        <Link
          to="/"
          className="d-inline-flex align-items-center gap-2 mb-4 text-decoration-none"
          style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to listings</span>
        </Link>

        <div className="hh-card">
          <h1 className="section-title mb-1">List Surplus Food</h1>
          <p className="food-card-meta mb-4">
            Helping food reach someone nearby. Location: <strong>{form.city}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="food-name">Food Name or Description</label>
              <input
                id="food-name"
                className="form-control"
                placeholder="e.g. 5 boxes of fresh lunch wraps, vegetable curry"
                value={form.foodName}
                onChange={(e) => update('foodName', e.target.value)}
                required
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="food-quantity">Estimated Quantity</label>
                <input
                  id="food-quantity"
                  className="form-control"
                  placeholder="e.g. 10 portions, 3 kg"
                  value={form.quantity}
                  onChange={(e) => update('quantity', e.target.value)}
                  required
                />
              </div>

              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="food-type">Food Category</label>
                <select
                  id="food-type"
                  className="form-select"
                  value={form.foodType}
                  onChange={(e) => update('foodType', e.target.value)}
                >
                  <option value="veg">Vegetarian (Veg)</option>
                  <option value="nonveg">Non-Vegetarian (Non-Veg)</option>
                </select>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="contact-name">Contact Person</label>
                <input
                  id="contact-name"
                  className="form-control"
                  value={form.contactName}
                  onChange={(e) => update('contactName', e.target.value)}
                  required
                />
              </div>

              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="contact-phone">Phone for Pickup Coordination</label>
                <input
                  id="contact-phone"
                  className="form-control"
                  placeholder="10-digit mobile number"
                  value={form.phone}
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

            <div className="row g-3 mb-3">
              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="donation-city">City</label>
                <select
                  id="donation-city"
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
                <label className="form-label" htmlFor="available-upto">Available Until (Expiry / Pickup window)</label>
                <input
                  id="available-upto"
                  type="datetime-local"
                  className="form-control"
                  value={form.availableUpto}
                  onChange={(e) => update('availableUpto', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label" htmlFor="pickup-address">Exact Pickup Address</label>
              <textarea
                id="pickup-address"
                className="form-control"
                rows="3"
                placeholder="Building, street name, landmarks..."
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                required
              />
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
                    <span>Posting Food Listing...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Publish Food Listing</span>
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
