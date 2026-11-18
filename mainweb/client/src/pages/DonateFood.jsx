import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, AlertTriangle, AlertCircle, Calendar, Clock, Package, Pencil } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import { CITIES } from '../constants/cities';
import { validateMobile } from '../utils/validation';

function getLocalDateTimeString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

const UNIT_OPTIONS = [
  { value: 'portions', label: 'portions' },
  { value: 'kg', label: 'kg' },
  { value: 'packets', label: 'packets' },
  { value: 'pieces', label: 'pieces' },
  { value: 'litres', label: 'litres' },
];

export default function DonateFood() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentMinTime, setCurrentMinTime] = useState(() => getLocalDateTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMinTime(getLocalDateTimeString());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Form state
  const [items, setItems] = useState([
    { name: '', quantity: '', unit: 'portions' },
  ]);

  const [form, setForm] = useState({
    foodType: 'veg',
    contactName: user?.name || '',
    phone: user?.mobile || '',
    city: user?.city || 'Ahmedabad',
    pickupFrom: '',
    pickupTo: '',
    expiryAt: '',
    address: '',
  });

  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleContactNameChange(val) {
    if (val.length > 100) return;
    updateForm('contactName', val);
    if (!val.trim()) {
      setNameError('Contact person name is required');
    } else if (!/^[a-zA-Z\s]+$/.test(val)) {
      setNameError('Contact name can only contain alphabets and spaces');
    } else {
      setNameError('');
    }
  }

  function handlePhoneChange(val) {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
    updateForm('phone', cleaned);
    if (/[^0-9]/.test(val)) {
      setPhoneError('Only numbers (0-9) are allowed. No characters, symbols, or spaces.');
    } else if (cleaned.length > 0 && cleaned.length !== 10) {
      setPhoneError('Mobile number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  }

  // Manage multiple item rows
  function handleItemChange(index, field, value) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function handleAddItem() {
    setItems((prev) => [...prev, { name: '', quantity: '', unit: 'portions' }]);
  }

  function handleRemoveItem(index) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Summary calculation
  const summary = useMemo(() => {
    const map = {};
    let count = 0;
    items.forEach((it) => {
      if (it.name.trim() && it.quantity) {
        count++;
        const u = it.unit || 'portions';
        const q = parseFloat(it.quantity);
        if (!isNaN(q) && q > 0) {
          map[u] = (map[u] || 0) + q;
        }
      }
    });

    const parts = Object.entries(map).map(([u, sum]) => `${sum} ${u}`);
    return {
      count,
      quantityText: parts.join(' + ') || '0',
      text: count > 0 ? `${count} item${count > 1 ? 's' : ''}: ${parts.join(' + ') || 'valid'}` : '',
    };
  }, [items]);

  // Warning when expiry is before pickup window end
  const expiryBeforePickupWarning = useMemo(() => {
    if (form.pickupTo && form.expiryAt) {
      const pTo = new Date(form.pickupTo).getTime();
      const exp = new Date(form.expiryAt).getTime();
      return exp < pTo;
    }
    return false;
  }, [form.pickupTo, form.expiryAt]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate items
    const validItems = items.filter((it) => it.name.trim() && it.quantity);
    if (validItems.length === 0) {
      toast.error('Please enter at least one food item with name and quantity');
      return;
    }

    for (const it of validItems) {
      const q = parseFloat(it.quantity);
      if (isNaN(q) || q <= 0) {
        toast.error(`Please enter a valid positive quantity for "${it.name}"`);
        return;
      }
    }

    if (!form.contactName.trim()) {
      setNameError('Contact person name is required');
      toast.error('Contact person name is required');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(form.contactName.trim())) {
      setNameError('Contact name can only contain alphabets and spaces');
      toast.error('Contact name can only contain alphabets and spaces');
      return;
    }

    if (form.contactName.trim().length > 100) {
      setNameError('Contact name cannot exceed 100 characters');
      toast.error('Contact name cannot exceed 100 characters');
      return;
    }

    const mError = validateMobile(form.phone);
    if (mError) {
      setPhoneError(mError);
      toast.error(mError);
      return;
    }

    if (!form.city.trim()) {
      toast.error('Please select a city');
      return;
    }

    if (!form.pickupFrom || !form.pickupTo || !form.expiryAt) {
      toast.error('Please specify pickup start, pickup end, and food expiry times');
      return;
    }

    const fromDate = new Date(form.pickupFrom);
    const toDate = new Date(form.pickupTo);
    const expDate = new Date(form.expiryAt);

    const nowWithBuffer = Date.now() - 30000;
    if (fromDate.getTime() < nowWithBuffer) {
      toast.error('Pickup start time cannot be in the past. Current time is the minimum.');
      return;
    }

    if (toDate.getTime() < nowWithBuffer) {
      toast.error('Pickup available end time cannot be in the past. Current time is the minimum.');
      return;
    }

    if (expDate.getTime() < nowWithBuffer) {
      toast.error('Food expiry time cannot be in the past. Current time is the minimum.');
      return;
    }

    // Rule: pickupTo after pickupFrom
    if (toDate.getTime() <= fromDate.getTime()) {
      toast.error('Pickup end time must be after pickup start time');
      return;
    }

    // Rule: expiryAt after pickupFrom
    if (expDate.getTime() <= fromDate.getTime()) {
      toast.error('Food expiry time must be after pickup start time');
      return;
    }

    setLoading(true);
    try {
      // Send times as ISO strings so India/local time doesn't shift on the server
      await api.post('/food', {
        items: validItems,
        foodType: form.foodType,
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        pickupFrom: fromDate.toISOString(),
        pickupTo: toDate.toISOString(),
        expiryAt: expDate.toISOString(),
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
      <main className="hh-page" style={{ maxWidth: '720px' }}>
        <Link
          to="/"
          className="d-inline-flex align-items-center gap-2 mb-4 text-decoration-none"
          style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to dashboard</span>
        </Link>

        <div className="hh-card">
          <h1 className="section-title mb-1">List Surplus Food</h1>
          <p className="food-card-meta mb-4">
            Helping extra food reach nearby community members and relief organizations.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Multiple Food Items Section */}
            <div className="mb-4">
              <label className="form-label d-flex justify-content-between align-items-center">
                <span>Food Items</span>
                <span className="text-muted small" style={{ fontWeight: 400 }}>
                  Add multiple rows if donating different food dishes
                </span>
              </label>

              {items.map((it, idx) => (
                <div className="item-row" key={idx}>
                  <div style={{ flex: '1 1 50%' }}>
                    <input
                      className="form-control"
                      placeholder={idx === 0 ? 'e.g. Vegetable Biryani' : 'e.g. Steamed Rice, Dal'}
                      value={it.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ width: '100px' }}>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      className="form-control"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ width: '120px' }}>
                    <select
                      className="form-select"
                      value={it.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="item-remove-btn"
                      onClick={() => handleRemoveItem(idx)}
                      title="Remove row"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-hh-secondary d-inline-flex align-items-center gap-1"
                  style={{ padding: '6px 14px', fontSize: 'var(--text-small)' }}
                  onClick={handleAddItem}
                >
                  <Plus size={15} />
                  <span>Add another item</span>
                </button>

                {summary.text && (
                  <div className="items-summary-box">
                    <span className="d-flex align-items-center gap-1">
                      <Package size={15} />
                      <span>{summary.text}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Food Diet Category */}
            <div className="row g-3 mb-3">
              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="food-type">Food Category</label>
                <select
                  id="food-type"
                  className="form-select"
                  value={form.foodType}
                  onChange={(e) => updateForm('foodType', e.target.value)}
                >
                  <option value="veg">Vegetarian (Veg)</option>
                  <option value="nonveg">Non-Vegetarian (Non-Veg)</option>
                  <option value="mixed">Mixed (Veg &amp; Non-Veg)</option>
                </select>
                <div className="text-muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                  Choose Mixed if donation includes both veg and non-veg dishes
                </div>
              </div>

              <div className="col-sm-6 form-group">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0" htmlFor="donation-city">City</label>
                  <button
                    type="button"
                    className="input-edit-btn"
                    onClick={() => document.getElementById('donation-city')?.focus()}
                    title="Change city for this order"
                  >
                    <Pencil size={12} />
                    <span>Edit</span>
                  </button>
                </div>
                <select
                  id="donation-city"
                  className="form-select"
                  value={form.city}
                  onChange={(e) => updateForm('city', e.target.value)}
                  required
                >
                  <option value="">Select City...</option>
                  {cityOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="text-muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                  Update if pickup location is in another city
                </div>
              </div>
            </div>

            {/* Contact Person & Phone */}
            <div className="row g-3 mb-3">
              <div className="col-sm-6 form-group">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0" htmlFor="contact-name">Contact Person</label>
                  <button
                    type="button"
                    className="input-edit-btn"
                    onClick={() => document.getElementById('contact-name')?.focus()}
                    title="Edit contact person for this order"
                  >
                    <Pencil size={12} />
                    <span>Edit</span>
                  </button>
                </div>
                <input
                  id="contact-name"
                  className={`form-control ${nameError ? 'is-invalid' : ''}`}
                  placeholder="Full name (alphabets only, max 100)"
                  maxLength={100}
                  value={form.contactName}
                  onChange={(e) => handleContactNameChange(e.target.value)}
                  required
                />
                {nameError ? (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{nameError}</span>
                  </div>
                ) : (
                  <div className="text-muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                    Alphabets and spaces only (max 100 characters)
                  </div>
                )}
              </div>

              <div className="col-sm-6 form-group">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0" htmlFor="contact-phone">Phone for Pickup Coordination</label>
                  <button
                    type="button"
                    className="input-edit-btn"
                    onClick={() => document.getElementById('contact-phone')?.focus()}
                    title="Edit phone number for this order"
                  >
                    <Pencil size={12} />
                    <span>Edit</span>
                  </button>
                </div>
                <input
                  id="contact-phone"
                  className={`form-control ${phoneError ? 'is-invalid' : ''}`}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  required
                />
                {phoneError ? (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{phoneError}</span>
                  </div>
                ) : (
                  <div className="text-muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                    10 numeric digits only
                  </div>
                )}
              </div>
            </div>

            {/* Timing Section: pickupFrom, pickupTo, expiryAt */}
            <div className="p-3 mb-3 rounded" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <div className="fw-bold mb-2 d-flex align-items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                <Calendar size={16} />
                <span>Pickup Window & Expiry Timing</span>
              </div>

              <div className="row g-3">
                <div className="col-sm-4 form-group mb-0">
                  <label className="form-label" htmlFor="pickup-from" style={{ fontSize: 'var(--text-xs)' }}>
                    Pickup Starts From
                  </label>
                  <input
                    id="pickup-from"
                    type="datetime-local"
                    min={currentMinTime}
                    onFocus={() => setCurrentMinTime(getLocalDateTimeString())}
                    className="form-control"
                    value={form.pickupFrom}
                    onChange={(e) => updateForm('pickupFrom', e.target.value)}
                    required
                  />
                  <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                    Can be future (e.g. tomorrow)
                  </div>
                </div>

                <div className="col-sm-4 form-group mb-0">
                  <label className="form-label" htmlFor="pickup-to" style={{ fontSize: 'var(--text-xs)' }}>
                    Pickup Available Until
                  </label>
                  <input
                    id="pickup-to"
                    type="datetime-local"
                    min={form.pickupFrom && form.pickupFrom > currentMinTime ? form.pickupFrom : currentMinTime}
                    onFocus={() => setCurrentMinTime(getLocalDateTimeString())}
                    className="form-control"
                    value={form.pickupTo}
                    onChange={(e) => updateForm('pickupTo', e.target.value)}
                    required
                  />
                  <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                    Window close time
                  </div>
                </div>

                <div className="col-sm-4 form-group mb-0">
                  <label className="form-label" htmlFor="expiry-at" style={{ fontSize: 'var(--text-xs)' }}>
                    Consume Before (Expiry)
                  </label>
                  <input
                    id="expiry-at"
                    type="datetime-local"
                    min={form.pickupFrom && form.pickupFrom > currentMinTime ? form.pickupFrom : currentMinTime}
                    onFocus={() => setCurrentMinTime(getLocalDateTimeString())}
                    className="form-control"
                    value={form.expiryAt}
                    onChange={(e) => updateForm('expiryAt', e.target.value)}
                    required
                  />
                  <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                    Food freshness limit
                  </div>
                </div>
              </div>

              {/* Warning if expiry is before pickupTo */}
              {expiryBeforePickupWarning && (
                <div
                  className="alert alert-warning d-flex align-items-center gap-2 mt-3 mb-0"
                  style={{
                    backgroundColor: '#fffbeb',
                    borderColor: '#fde68a',
                    color: '#b45309',
                    fontSize: 'var(--text-xs)',
                    padding: '8px 12px',
                  }}
                >
                  <AlertTriangle size={15} className="flex-shrink-0" />
                  <span>
                    <strong>Warning:</strong> Food freshness expiry time is earlier than the pickup end time. Ensure food remains safe for consumption!
                  </span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="form-group mb-4">
              <label className="form-label" htmlFor="pickup-address">Exact Pickup Address</label>
              <textarea
                id="pickup-address"
                className="form-control"
                rows="3"
                placeholder="Building name, street, nearby landmarks for NGO pickup..."
                value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
                required
              />
            </div>

            {/* End Summary: Total item count and total quantity */}
            {summary.count > 0 && (
              <div
                className="p-3 mb-4 rounded d-flex justify-content-between align-items-center flex-wrap gap-2"
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Package size={20} color="var(--color-primary)" />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Total Food Items:
                    </div>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
                      {summary.count} {summary.count === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Total Quantity:
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {summary.quantityText}
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
