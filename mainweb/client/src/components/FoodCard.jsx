import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Package, Clock, Calendar, ArrowRight, Flame, Users } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString([], {
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

export default function FoodCard({ donation }) {
  const isNonVeg =
    donation.foodType?.toLowerCase() === 'nonveg' ||
    donation.type?.toLowerCase() === 'nonveg';
  const isMixed =
    donation.foodType?.toLowerCase() === 'mixed' ||
    donation.type?.toLowerCase() === 'mixed';
  const dietClass = isNonVeg ? 'non-veg' : isMixed ? 'mixed' : 'veg';
  const dietTitle = isNonVeg ? 'Non-Vegetarian' : isMixed ? 'Mixed (Veg & Non-Veg)' : 'Vegetarian';
  const urgent = isExpiringSoon(donation.expiryAt);

  return (
    <Link to={`/food/${donation.id}`} className="text-decoration-none">
      <article className="food-card">
        {/* Top row: title + diet symbol + urgent badge + requested count badge */}
        <div className="food-card-top">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span
              className={`diet-symbol ${dietClass}`}
              title={dietTitle}
            >
              <span className="diet-dot" />
            </span>
            <h3 className="food-card-title">{donation.foodName}</h3>
          </div>
          <div className="d-flex align-items-center gap-1 flex-wrap">
            {donation.requestCount > 0 && (
              <span className="ngo-requests-badge" title={`${donation.requestCount} NGO(s) requested pickup`}>
                <Users size={12} />
                <span>
                  {donation.requestCount} NGO{donation.requestCount > 1 ? 's' : ''} requested
                </span>
              </span>
            )}
            {donation.hasRequested && (
              <span className="badge-status pending" style={{ fontSize: '10px', padding: '2px 7px' }}>
                Requested
              </span>
            )}
            {urgent && (
              <span className="badge-use-quickly">
                <Flame size={12} />
                <span>Use quickly</span>
              </span>
            )}
          </div>
        </div>

        {/* Multiple items chips */}
        {donation.items && donation.items.length > 0 ? (
          <div className="d-flex flex-wrap gap-1 my-1">
            {donation.items.slice(0, 3).map((it, idx) => (
              <span className="item-chip" key={idx}>
                <strong>{it.quantity} {it.unit}</strong> {it.name}
              </span>
            ))}
            {donation.items.length > 3 && (
              <span className="item-chip text-muted">
                +{donation.items.length - 3} more
              </span>
            )}
          </div>
        ) : (
          <div className="food-card-body">
            <Package size={14} color="var(--color-text-muted)" />
            <span>
              <span style={{ color: 'var(--color-text-muted)' }}>Qty: </span>
              <strong style={{ color: 'var(--color-text)' }}>{donation.quantity}</strong>
            </span>
          </div>
        )}

        {/* Donor */}
        <div className="food-card-meta">
          <span style={{ color: 'var(--color-text-muted)' }}>Donated by </span>
          <strong style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {donation.donorName}
          </strong>
        </div>

        {/* Pickup Window */}
        <div className="food-card-meta">
          <Calendar size={13} color="var(--color-primary)" />
          <span>
            <strong>Pickup:</strong> {formatDate(donation.pickupFrom)} — {formatDate(donation.pickupTo)}
          </span>
        </div>

        {/* Food Expiry */}
        <div className="food-card-meta" style={{ color: urgent ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
          <Clock size={13} />
          <span>
            <strong>Consume before:</strong> {formatDate(donation.expiryAt)}
          </span>
        </div>

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
