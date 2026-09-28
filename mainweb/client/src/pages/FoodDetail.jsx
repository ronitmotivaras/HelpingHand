import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Clock, Package, UserCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
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
        const { data } = await api.get(`/donations/${id}`);
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
          <span>Back to listings</span>
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
            <div className="d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span
                    className={`diet-symbol ${isNonVeg ? 'non-veg' : 'veg'}`}
                    title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}
                  >
                    <span className="diet-dot" />
                  </span>
                  <h1 className="section-title m-0">{donation.foodName}</h1>
                </div>
                <p className="food-card-meta mb-0 d-flex align-items-center gap-1">
                  <MapPin size={14} />
                  <span>Listed in {donation.city}</span>
                </p>
              </div>
              <span className={`badge-status ${donation.status === 'accepted' ? 'accepted' : 'available'}`}>
                {donation.status === 'accepted' ? 'Accepted' : 'Available'}
              </span>
            </div>

            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <UserCircle size={16} color="var(--color-text-muted)" />
                <span>Donor</span>
              </span>
              <strong>{donation.donorName}</strong>
            </div>

            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <Phone size={16} color="var(--color-text-muted)" />
                <span>Contact Phone</span>
              </span>
              <strong>
                <a
                  href={`tel:${donation.donorPhone}`}
                  className="d-inline-flex align-items-center gap-1"
                  style={{ fontWeight: 600, color: 'var(--color-primary)' }}
                >
                  <span>{donation.donorPhone}</span>
                </a>
              </strong>
            </div>

            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <Package size={16} color="var(--color-text-muted)" />
                <span>Estimated Quantity</span>
              </span>
              <strong>{donation.quantity}</strong>
            </div>

            <div className="detail-row">
              <span>Food Category</span>
              <strong className="d-flex align-items-center gap-2">
                <span className={`diet-symbol ${isNonVeg ? 'non-veg' : 'veg'}`}>
                  <span className="diet-dot" />
                </span>
                <span>{isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}</span>
              </strong>
            </div>

            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <Clock size={16} color="var(--color-text-muted)" />
                <span>Available Until</span>
              </span>
              <strong>{formatTime(donation.availableUpto)}</strong>
            </div>

            <div className="detail-row">
              <span className="d-flex align-items-center gap-2">
                <MapPin size={16} color="var(--color-text-muted)" />
                <span>Pickup Address</span>
              </span>
              <strong>{donation.address}</strong>
            </div>

            <div className="p-3 mt-4 rounded" style={{ background: '#FFFFFF', border: '1px solid var(--color-border)' }}>
              <p className="food-card-meta mb-0">
                💬 <strong>Direct Connection:</strong> Please call the donor directly to coordinate pickup timing and containers.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
