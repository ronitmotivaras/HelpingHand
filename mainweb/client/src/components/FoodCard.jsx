import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Package, Clock, ArrowRight } from 'lucide-react';

function getBadgeClass(status) {
  if (status === 'accepted') return 'badge-status accepted';
  if (status === 'available') return 'badge-status available';
  if (status === 'expired') return 'badge-status expired';
  return 'badge-status picked_up';
}

function statusLabel(status) {
  if (status === 'accepted') return 'Accepted';
  if (status === 'available') return 'Available';
  if (status === 'picked_up') return 'Picked Up';
  if (status === 'expired') return 'Expired';
  return status;
}

export default function FoodCard({ donation }) {
  const badgeClass = getBadgeClass(donation.status);
  const isNonVeg =
    donation.foodType?.toLowerCase().includes('non') ||
    donation.type?.toLowerCase().includes('non');

  return (
    <Link to={`/food/${donation.id}`} className="text-decoration-none">
      <article className="food-card">
        {/* Top row: title + badge */}
        <div className="food-card-top">
          <div className="d-flex align-items-center gap-2">
            <span
              className={`diet-symbol ${isNonVeg ? 'non-veg' : 'veg'}`}
              title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}
            >
              <span className="diet-dot" />
            </span>
            <h3 className="food-card-title">{donation.foodName}</h3>
          </div>
          <span className={badgeClass}>{statusLabel(donation.status)}</span>
        </div>

        {/* Quantity */}
        <div className="food-card-body">
          <Package size={14} color="var(--color-text-muted)" />
          <span>
            <span style={{ color: 'var(--color-text-muted)' }}>Qty: </span>
            <strong style={{ color: 'var(--color-text)' }}>{donation.quantity}</strong>
          </span>
        </div>

        {/* Donor */}
        <div className="food-card-meta">
          <span style={{ color: 'var(--color-text-muted)' }}>Donated by </span>
          <strong style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {donation.donorName}
          </strong>
        </div>

        {/* Expiry */}
        {donation.expiryTime && (
          <div className="food-card-meta" style={{ color: 'var(--color-warning)' }}>
            <Clock size={13} />
            <span>
              Expires{' '}
              {new Date(donation.expiryTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {/* Footer: address */}
        {donation.address && (
          <div className="food-card-footer">
            <MapPin size={13} color="var(--color-text-muted)" />
            <span className="food-card-meta" style={{ flex: 1 }}>
              {donation.address}, {donation.city}
            </span>
            <ArrowRight size={14} color="var(--color-primary)" />
          </div>
        )}
      </article>
    </Link>
  );
}
