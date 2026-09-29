import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  Package,
  UserCircle,
  Calendar,
  Flame,
  Lock,
  Users,
  CheckCircle2,
  XCircle,
  Send,
  RotateCcw,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isExpiringSoon(expiryDateStr) {
  if (!expiryDateStr) return false;
  const exp = new Date(expiryDateStr).getTime();
  const now = Date.now();
  const diffHours = (exp - now) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 3;
}

export default function FoodDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/food/${id}`);
      setDonation(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load food details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const isNonVeg =
    donation?.foodType?.toLowerCase().includes('non') || donation?.type?.toLowerCase().includes('non');
  const urgent = isExpiringSoon(donation?.expiryAt);

  const isOwner = Boolean(user && donation && String(donation.donorId) === String(user.id || user._id));
  const isNgo = Boolean(user?.ngoStatus && user.ngoStatus !== 'none');
  const isApprovedNgo = user?.ngoStatus === 'approved';
  const isPendingNgo = user?.ngoStatus === 'pending';

  // NGO Request Pickup
  async function handleRequestPickup() {
    if (!isApprovedNgo) {
      toast.error('Only verified NGOs can request pickups. Your account is waiting for verification.');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await api.post(`/food/${id}/request`);
      setDonation(data);
      toast.success('Pickup request sent! The donor will review your request.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request pickup');
    } finally {
      setActionLoading(false);
    }
  }

  // NGO Cancel Pickup Request
  async function handleCancelRequest() {
    setActionLoading(true);
    try {
      const { data } = await api.post(`/food/${id}/cancel-request`);
      setDonation(data);
      toast.success('Pickup request cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ maxWidth: '780px', paddingBottom: '96px' }}>
        <Link
          to="/"
          className="d-inline-flex align-items-center gap-2 mb-4 text-decoration-none"
          style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to dashboard</span>
        </Link>

        {error && <div className="alert-danger mb-4">{error}</div>}

        {loading && (
          <div className="hh-card">
            <div className="skeleton-box mb-3" style={{ width: '60%', height: '32px' }} />
            <div className="skeleton-box mb-4" style={{ width: '30%', height: '18px' }} />
            <div className="skeleton-box mb-3" style={{ width: '100%', height: '24px' }} />
            <div className="skeleton-box mb-3" style={{ width: '100%', height: '24px' }} />
            <div className="skeleton-box mb-3" style={{ width: '100%', height: '24px' }} />
          </div>
        )}

        {!loading && donation && (
          <div className="hh-card">
            {/* Header row */}
            <div className="d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`diet-symbol ${isNonVeg ? 'non-veg' : 'veg'}`}
                    title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}
                  >
                    <span className="diet-dot" />
                  </span>
                  <h1 className="section-title m-0">{donation.foodName}</h1>
                  {urgent && donation.status !== 'pickedUp' && donation.status !== 'expired' && (
                    <span className="badge-use-quickly">
                      <Flame size={12} />
                      <span>Use quickly</span>
                    </span>
                  )}
                  {donation.requestCount > 0 && donation.status === 'available' && (
                    <span className="ngo-requests-badge">
                      <Users size={12} />
                      <span>
                        {donation.requestCount} NGO{donation.requestCount > 1 ? 's' : ''} requested
                      </span>
                    </span>
                  )}
                </div>
                <p className="food-card-meta mb-0 d-flex align-items-center gap-1">
                  <MapPin size={14} />
                  <span>Listed in {donation.city}</span>
                </p>
              </div>

              <span className={`badge-status ${donation.status}`}>
                {donation.status === 'accepted' || donation.status === 'booked'
                  ? 'Accepted'
                  : donation.status === 'pickedUp'
                  ? 'Picked Up'
                  : donation.status === 'expired'
                  ? 'Expired'
                  : 'Available'}
              </span>
            </div>

            {/* Multiple items list */}
            {donation.items && donation.items.length > 0 && (
              <div className="mb-4 p-3 rounded" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <div className="fw-bold mb-2 d-flex align-items-center gap-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                  <Package size={15} color="var(--color-primary)" />
                  <span>Items in this Donation ({donation.items.length}):</span>
                </div>
                <div className="d-flex flex-column gap-2">
                  {donation.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="d-flex justify-content-between align-items-center py-1 px-2 rounded"
                      style={{ background: '#fff', border: '1px solid var(--color-border-subtle)', fontSize: 'var(--text-sm)' }}
                    >
                      <span className="fw-semibold">{it.name}</span>
                      <span className="badge-status available" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {it.quantity} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Donor detail */}
            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <UserCircle size={16} color="var(--color-text-muted)" />
                <span>Donor</span>
              </span>
              <strong>{donation.donorName}</strong>
            </div>

            {/* Contact phone with role-based visibility */}
            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <Phone size={16} color="var(--color-text-muted)" />
                <span>Contact Phone</span>
              </span>
              {donation.phoneVisible && donation.donorPhone ? (
                <strong>
                  <a
                    href={`tel:${donation.donorPhone}`}
                    className="phone-link-btn"
                  >
                    <Phone size={13} />
                    <span>{donation.donorPhone}</span>
                  </a>
                </strong>
              ) : (
                <span
                  className="d-inline-flex align-items-center gap-1 text-muted small"
                  title="Only verified NGO partners can view donor contact numbers"
                >
                  <Lock size={13} color="var(--color-warning)" />
                  <span>Locked (Verified NGOs only)</span>
                </span>
              )}
            </div>

            {/* Diet category */}
            <div className="detail-row">
              <span>Food Category</span>
              <strong className="d-flex align-items-center gap-2">
                <span className={`diet-symbol ${isNonVeg ? 'non-veg' : 'veg'}`}>
                  <span className="diet-dot" />
                </span>
                <span>{isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}</span>
              </strong>
            </div>

            {/* Pickup window */}
            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <Calendar size={16} color="var(--color-text-muted)" />
                <span>Pickup Window</span>
              </span>
              <strong>
                {formatTime(donation.pickupFrom)} — {formatTime(donation.pickupTo)}
              </strong>
            </div>

            {/* Consume before */}
            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <Clock size={16} color={urgent ? 'var(--color-danger)' : 'var(--color-text-muted)'} />
                <span>Consume Before (Freshness Expiry)</span>
              </span>
              <strong style={{ color: urgent ? 'var(--color-danger)' : 'inherit' }}>
                {formatTime(donation.expiryAt)}
              </strong>
            </div>

            {/* Address */}
            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <MapPin size={16} color="var(--color-text-muted)" />
                <span>Pickup Address</span>
              </span>
              <strong>{donation.address}</strong>
            </div>

            {/* NGO Request Action Box */}
            {isNgo && !isOwner && donation.status === 'available' && (
              <div
                className="mt-4 p-4 rounded"
                style={{
                  background: donation.hasRequested ? '#f0fdf4' : 'var(--color-surface-2)',
                  border: `1px solid ${donation.hasRequested ? '#86efac' : 'var(--color-border)'}`,
                }}
              >
                {isApprovedNgo ? (
                  donation.hasRequested ? (
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 fw-bold text-success mb-1">
                          <CheckCircle2 size={18} />
                          <span>Pickup Requested</span>
                        </div>
                        <p className="food-card-meta mb-0">
                          Your organization has requested pickup. The donor can see your verified contact info to coordinate.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-hh-secondary d-inline-flex align-items-center gap-1"
                        style={{ padding: '8px 16px', fontSize: 'var(--text-sm)' }}
                        disabled={actionLoading}
                        onClick={handleCancelRequest}
                      >
                        <XCircle size={16} />
                        <span>{actionLoading ? 'Cancelling...' : 'Cancel Request'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div>
                        <div className="fw-bold mb-1" style={{ fontSize: 'var(--text-base)' }}>
                          Interested in collecting this food?
                        </div>
                        <p className="food-card-meta mb-0">
                          Click Request Pickup to notify the donor. Several NGOs can request; the donor will coordinate by phone and accept.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-hh-primary d-inline-flex align-items-center gap-2"
                        style={{ padding: '9px 20px', fontSize: 'var(--text-base)' }}
                        disabled={actionLoading}
                        onClick={handleRequestPickup}
                      >
                        <Send size={16} />
                        <span>{actionLoading ? 'Submitting...' : 'Request Pickup'}</span>
                      </button>
                    </div>
                  )
                ) : isPendingNgo ? (
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <Clock size={18} color="#d97706" className="flex-shrink-0" />
                      <span style={{ fontSize: 'var(--text-sm)', color: '#92400e' }}>
                        <strong>Waiting for verification:</strong> Only verified NGOs can request pickups. Your application is under admin review.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-hh-primary d-inline-flex align-items-center gap-2"
                      style={{ padding: '9px 20px', fontSize: 'var(--text-base)', opacity: 0.5, cursor: 'not-allowed' }}
                      disabled
                      title="Your NGO account is waiting for admin verification"
                    >
                      <Send size={16} />
                      <span>Request Pickup</span>
                    </button>
                  </div>
                ) : (
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <Lock size={16} />
                    <span style={{ fontSize: 'var(--text-sm)' }}>
                      Only verified NGO accounts can request food pickups.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Direct connection note */}
            <div className="p-3 mt-4 rounded" style={{ background: '#FFFFFF', border: '1px solid var(--color-border)' }}>
              {donation.phoneVisible ? (
                <p className="food-card-meta mb-0">
                  💬 <strong>Direct Coordination:</strong> Talk by phone to agree on pickup details and containers before collection.
                </p>
              ) : (
                <p className="food-card-meta mb-0 text-muted">
                  🔒 <strong>Verified NGO Access:</strong> To prevent fraud, donor contact numbers are accessible only to verified NGOs.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
