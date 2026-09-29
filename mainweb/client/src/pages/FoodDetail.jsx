import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  Package,
  UserCircle,
  Calendar,
  Flame,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import Navbar from '../components/Navbar';
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
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    load();
  }, [id]);

  const isNonVeg =
    donation?.foodType?.toLowerCase().includes('non') || donation?.type?.toLowerCase().includes('non');
  const urgent = isExpiringSoon(donation?.expiryAt);

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ maxWidth: '780px' }}>
        <Link
          to="/"
          className="d-inline-flex align-items-center gap-2 mb-4 text-decoration-none"
          style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to dashboard</span>
        </Link>

        {error && <div className="alert-danger">{error}</div>}

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
                </div>
                <p className="food-card-meta mb-0 d-flex align-items-center gap-1">
                  <MapPin size={14} />
                  <span>Listed in {donation.city}</span>
                </p>
              </div>

              <span className={`badge-status ${donation.status}`}>
                {donation.status === 'booked'
                  ? 'Booked'
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
                    className="d-inline-flex align-items-center gap-1"
                    style={{ fontWeight: 600, color: 'var(--color-primary)' }}
                  >
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

            {/* Direct connection note */}
            <div className="p-3 mt-4 rounded" style={{ background: '#FFFFFF', border: '1px solid var(--color-border)' }}>
              {donation.phoneVisible ? (
                <p className="food-card-meta mb-0">
                  💬 <strong>Direct Coordination:</strong> Please call the donor directly to confirm pickup ETA and necessary containers.
                </p>
              ) : (
                <p className="food-card-meta mb-0 text-muted">
                  🔒 <strong>Verified NGO Access:</strong> To prevent misuse, donor contact phone numbers are visible exclusively to verified NGO partners.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
