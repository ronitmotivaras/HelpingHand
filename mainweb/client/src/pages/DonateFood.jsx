import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Calendar, Package, Pencil, AlertCircle, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import { CITIES } from '../constants/cities';
import { validateMobile, validateName, validateAddress } from '../utils/validation';

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

  // Compute default start time and end time (both start from current time)
  const defaultTimes = useMemo(() => {
    const now = new Date();
    const currentStr = getLocalDateTimeString(now);
    return { startStr: currentStr, endStr: currentStr };
  }, []);

  // Form state
  const [items, setItems] = useState([
    { name: '', quantity: '', unit: 'portions' },
  ]);
  const [itemErrors, setItemErrors] = useState([{}]);

  const [form, setForm] = useState({
    foodType: '', // Not default veg; user must choose
    contactName: user?.name || '',
    phone: user?.mobile || '',
    city: user?.city || 'Ahmedabad',
    pickupFrom: defaultTimes.startStr,
    pickupTo: defaultTimes.endStr,
    address: '',
  });

  // Edit locks: not allowed to edit name or phone until edit icon is clicked
  const [canEditName, setCanEditName] = useState(false);
  const [canEditPhone, setCanEditPhone] = useState(false);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Handle pickup times with past-time restriction
  function handlePickupFromChange(val) {
    const minNow = getLocalDateTimeString();
    if (val < minNow) {
      toast.error('Pickup start time cannot be in the past');
      updateForm('pickupFrom', minNow);
    } else {
      updateForm('pickupFrom', val);
    }
    if (fieldErrors.pickupFrom) setFieldErrors((prev) => ({ ...prev, pickupFrom: '' }));
  }

  function handlePickupToChange(val) {
    const minNow = getLocalDateTimeString();
    const effectiveMin = form.pickupFrom && form.pickupFrom > minNow ? form.pickupFrom : minNow;
    if (val < effectiveMin) {
      toast.error('Pickup available end time cannot be before pickup start time or in the past');
      return;
    }
    updateForm('pickupTo', val);
    if (fieldErrors.pickupTo) setFieldErrors((prev) => ({ ...prev, pickupTo: '' }));
  }

  // Manage multiple item rows
  function handleItemChange(index, field, value) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    setItemErrors((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: '' };
      }
      return copy;
    });
    if (fieldErrors.items) {
      setFieldErrors((prev) => ({ ...prev, items: '' }));
    }
  }

  function handleAddItem() {
    setItems((prev) => [...prev, { name: '', quantity: '', unit: 'portions' }]);
    setItemErrors((prev) => [...prev, {}]);
  }

  function handleRemoveItem(index) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setItemErrors((prev) => prev.filter((_, i) => i !== index));
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

  async function handleSubmit(e) {
    e.preventDefault();
    setHasSubmitted(true);

    const errors = {};

    // 1. Contact Person Name validation (alphabets and spaces only)
    const nErr = validateName(form.contactName, 'Contact Person');
    if (nErr) errors.contactName = nErr;

    // 2. Mobile validation (10 digits only)
    const mErr = validateMobile(form.phone);
    if (mErr) errors.phone = mErr;

    // 3. City validation
    if (!form.city.trim()) errors.city = 'Please select a city';

    // 4. Address validation (letters, numbers, spaces only)
    const aErr = validateAddress(form.address);
    if (aErr) errors.address = aErr;

    // 5. Food Category validation (user must choose from options)
    if (!form.foodType) errors.foodType = 'Please select a food category';

    // 6. Items validation (symbols not allowed in name, numbers only in qty)
    const newItemErrors = items.map((it) => {
      const err = {};
      const nameStr = (it.name || '').trim();
      if (!nameStr) {
        err.name = 'Please enter food item name';
      } else if (nameStr.length > 100) {
        err.name = 'Food name cannot exceed 100 characters';
      } else if (!/^[a-zA-Z0-9\s,.\-@]+$/.test(nameStr)) {
        err.name = 'Symbols not allowed';
      }

      const qStr = String(it.quantity || '').trim();
      if (!qStr) {
        err.quantity = 'Please enter quantity';
      } else if (!/^[0-9]+(\.[0-9]+)?$/.test(qStr) || parseFloat(qStr) <= 0) {
        err.quantity = 'Only numbers allowed';
      }
      return err;
    });

    setItemErrors(newItemErrors);
    const hasItemError = newItemErrors.some((e) => e.name || e.quantity);
    if (hasItemError) {
      errors.items = 'Please check food items marked in red';
    }

    const validItems = items.filter(
      (it, idx) => !newItemErrors[idx]?.name && !newItemErrors[idx]?.quantity && it.name.trim() && it.quantity
    );

    // 7. Pickup Window validation (pickupFrom and pickupTo only, no expiry)
    if (!form.pickupFrom) errors.pickupFrom = 'Pickup start time is required';
    if (!form.pickupTo) errors.pickupTo = 'Pickup available end time is required';

    if (form.pickupFrom && form.pickupTo) {
      const fromDate = new Date(form.pickupFrom);
      const toDate = new Date(form.pickupTo);
      const nowWithBuffer = Date.now() - 30000;
      if (fromDate.getTime() < nowWithBuffer) {
        errors.pickupFrom = 'Pickup start time cannot be in the past';
      }
      if (toDate.getTime() < nowWithBuffer) {
        errors.pickupTo = 'Pickup available end time cannot be in the past';
      }
      if (toDate.getTime() <= fromDate.getTime()) {
        errors.pickupTo = 'Pickup available end time must be after pickup start time';
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const fromDate = new Date(form.pickupFrom);
      const toDate = new Date(form.pickupTo);

      await api.post('/food', {
        items: validItems,
        foodType: form.foodType,
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        pickupFrom: fromDate.toISOString(),
        pickupTo: toDate.toISOString(),
        expiryAt: toDate.toISOString(), // Defaults expiry to pickupTo
      });

      toast.success('Food donation listing published successfully!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (/contact|name/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, contactName: msg }));
      } else if (/phone|mobile/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, phone: msg }));
      } else if (/address/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, address: msg }));
      } else if (/city/i.test(msg)) {
        setFieldErrors((prev) => ({ ...prev, city: msg }));
      } else {
        toast.error(msg || 'Failed to post food listing');
      }
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
          className="d-inline-flex align-items-center gap-2 mb-3 text-decoration-none"
          style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to dashboard</span>
        </Link>

        <div className="hh-card">
          <h1 className="section-title mb-4">List Surplus Food</h1>

          <form onSubmit={handleSubmit} noValidate>
            {/* 1. Contact Person Name & Mobile Number (input field, read-only until edit icon clicked) */}
            <div className="row g-3 mb-3">
              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="contact-name">Contact Person</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="contact-name"
                    readOnly={!canEditName}
                    className="form-control"
                    style={{
                      paddingRight: '2.5rem',
                      backgroundColor: !canEditName ? 'var(--color-surface-2, #f8fafc)' : '#ffffff',
                      cursor: !canEditName ? 'default' : 'text',
                      borderColor: hasSubmitted && fieldErrors.contactName ? 'var(--color-danger)' : undefined,
                    }}
                    placeholder="Enter name"
                    maxLength={100}
                    value={form.contactName}
                    onChange={(e) => {
                      if (canEditName) {
                        updateForm('contactName', e.target.value);
                        if (fieldErrors.contactName) setFieldErrors((prev) => ({ ...prev, contactName: '' }));
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!canEditName) {
                        setCanEditName(true);
                        setTimeout(() => document.getElementById('contact-name')?.focus(), 50);
                      } else {
                        setCanEditName(false);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: canEditName ? 'var(--color-primary)' : 'var(--color-text-muted, #64748b)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={canEditName ? 'Done editing' : 'Click to edit name'}
                    aria-label={canEditName ? 'Done editing name' : 'Edit name'}
                  >
                    {canEditName ? <Check size={16} /> : <Pencil size={15} />}
                  </button>
                </div>
                {hasSubmitted && fieldErrors.contactName && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.contactName}</span>
                  </div>
                )}
              </div>

              <div className="col-sm-6 form-group">
                <label className="form-label" htmlFor="contact-phone">Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="contact-phone"
                    type="tel"
                    readOnly={!canEditPhone}
                    className="form-control"
                    style={{
                      paddingRight: '2.5rem',
                      backgroundColor: !canEditPhone ? 'var(--color-surface-2, #f8fafc)' : '#ffffff',
                      cursor: !canEditPhone ? 'default' : 'text',
                      borderColor: hasSubmitted && fieldErrors.phone ? 'var(--color-danger)' : undefined,
                    }}
                    placeholder="Enter mobile number (10 digit)"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => {
                      if (canEditPhone) {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                        updateForm('phone', clean);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!canEditPhone) {
                        setCanEditPhone(true);
                        setTimeout(() => document.getElementById('contact-phone')?.focus(), 50);
                      } else {
                        setCanEditPhone(false);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: canEditPhone ? 'var(--color-primary)' : 'var(--color-text-muted, #64748b)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={canEditPhone ? 'Done editing' : 'Click to edit mobile number'}
                    aria-label={canEditPhone ? 'Done editing mobile number' : 'Edit mobile number'}
                  >
                    {canEditPhone ? <Check size={16} /> : <Pencil size={15} />}
                  </button>
                </div>
                {hasSubmitted && fieldErrors.phone && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. City Option */}
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="donation-city">City</label>
              <select
                id="donation-city"
                className="form-select"
                style={{
                  borderColor: hasSubmitted && fieldErrors.city ? 'var(--color-danger)' : undefined,
                }}
                value={form.city}
                onChange={(e) => {
                  updateForm('city', e.target.value);
                  if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: '' }));
                }}
              >
                <option value="">Select City...</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {hasSubmitted && fieldErrors.city && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.city}</span>
                </div>
              )}
            </div>

            {/* 3. Address */}
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="pickup-address">Address</label>
              <textarea
                id="pickup-address"
                className="form-control"
                rows="2"
                maxLength={1000}
                style={{
                  borderColor: hasSubmitted && fieldErrors.address ? 'var(--color-danger)' : undefined,
                }}
                placeholder="Enter address"
                value={form.address}
                onChange={(e) => {
                  updateForm('address', e.target.value);
                  if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
                }}
              />
              {hasSubmitted && fieldErrors.address && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.address}</span>
                </div>
              )}
            </div>

            {/* 4. Food Category (Option to choose first, not default veg) */}
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="food-type">Food Category</label>
              <select
                id="food-type"
                className="form-select"
                style={{
                  borderColor: hasSubmitted && fieldErrors.foodType ? 'var(--color-danger)' : undefined,
                }}
                value={form.foodType}
                onChange={(e) => {
                  updateForm('foodType', e.target.value);
                  if (fieldErrors.foodType) setFieldErrors((prev) => ({ ...prev, foodType: '' }));
                }}
              >
                <option value="">Select Food Category...</option>
                <option value="veg">Vegetarian (Veg)</option>
                <option value="nonveg">Non-Vegetarian (Non-Veg)</option>
                <option value="mixed">Mixed (Veg &amp; Non-Veg)</option>
              </select>
              {hasSubmitted && fieldErrors.foodType && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.foodType}</span>
                </div>
              )}
            </div>

            {/* 5. Food Item Menu (shown in 4th image) */}
            <div className="mb-4">
              <label className="form-label mb-1" style={{ fontWeight: 600 }}>
                Food Items
              </label>

              {items.map((it, idx) => (
                <div className="item-row mb-2" key={idx} style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: '1 1 50%' }}>
                    <input
                      className="form-control"
                      style={{
                        borderColor: hasSubmitted && itemErrors[idx]?.name ? 'var(--color-danger, #dc2626)' : undefined,
                      }}
                      maxLength={100}
                      placeholder={idx === 0 ? 'e.g. Vegetable Biryani' : 'e.g. Steamed Rice, Dal'}
                      value={it.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    />
                    {hasSubmitted && itemErrors[idx]?.name && (
                      <div className="text-danger small mt-1" style={{ fontSize: '11px', lineHeight: 1.2 }}>
                        {itemErrors[idx].name}
                      </div>
                    )}
                  </div>
                  <div style={{ width: '100px' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="form-control"
                      style={{
                        borderColor: hasSubmitted && itemErrors[idx]?.quantity ? 'var(--color-danger, #dc2626)' : undefined,
                      }}
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        handleItemChange(idx, 'quantity', val);
                      }}
                    />
                    {hasSubmitted && itemErrors[idx]?.quantity && (
                      <div className="text-danger small mt-1" style={{ fontSize: '11px', lineHeight: 1.2 }}>
                        {itemErrors[idx].quantity}
                      </div>
                    )}
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
                      style={{ marginTop: '6px' }}
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
              {hasSubmitted && fieldErrors.items && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.items}</span>
                </div>
              )}
            </div>

            {/* 6. Pickup Window (defaults to current time, future only, no past time allowed) */}
            <div className="p-3 mb-4 rounded" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <div className="fw-bold mb-2 d-flex align-items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                <Calendar size={16} />
                <span>Pickup Window</span>
              </div>

              <div className="row g-3">
                <div className="col-sm-6 form-group mb-0">
                  <label className="form-label" htmlFor="pickup-from" style={{ fontSize: 'var(--text-xs)' }}>
                    Pickup Starts From
                  </label>
                  <input
                    id="pickup-from"
                    type="datetime-local"
                    min={currentMinTime}
                    onFocus={() => setCurrentMinTime(getLocalDateTimeString())}
                    className="form-control"
                    style={{
                      borderColor: hasSubmitted && fieldErrors.pickupFrom ? 'var(--color-danger)' : undefined,
                    }}
                    value={form.pickupFrom}
                    onChange={(e) => handlePickupFromChange(e.target.value)}
                  />
                  {hasSubmitted && fieldErrors.pickupFrom && (
                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.pickupFrom}</span>
                    </div>
                  )}
                </div>

                <div className="col-sm-6 form-group mb-0">
                  <label className="form-label" htmlFor="pickup-to" style={{ fontSize: 'var(--text-xs)' }}>
                    Pickup Available Until
                  </label>
                  <input
                    id="pickup-to"
                    type="datetime-local"
                    min={form.pickupFrom && form.pickupFrom > currentMinTime ? form.pickupFrom : currentMinTime}
                    onFocus={() => setCurrentMinTime(getLocalDateTimeString())}
                    className="form-control"
                    style={{
                      borderColor: hasSubmitted && fieldErrors.pickupTo ? 'var(--color-danger)' : undefined,
                    }}
                    value={form.pickupTo}
                    onChange={(e) => handlePickupToChange(e.target.value)}
                  />
                  {hasSubmitted && fieldErrors.pickupTo && (
                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.pickupTo}</span>
                    </div>
                  )}
                </div>
              </div>
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

            <div className="pt-1">
              <button
                className="btn-hh-primary w-100 justify-content-center d-flex align-items-center gap-2"
                disabled={loading}
                type="submit"
                style={{ padding: '10px 16px', fontSize: '15px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Posting Food Listing...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Publish Food Donation</span>
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
