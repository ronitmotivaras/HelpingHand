import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Inbox,
  Package,
  AlertCircle,
  MapPin,
  Building2,
  Calendar,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';

function isListingExpired(l) {
  if (!l) return false;
  if (l.status === 'expired') return true;
  if (l.status === 'pickedUp' || l.status === 'picked_up') return false;
  if (l.expiryAt && new Date(l.expiryAt).getTime() <= Date.now()) return true;
  if (l.pickupTo && new Date(l.pickupTo).getTime() <= Date.now()) return true;
  if (l.availableUpto && new Date(l.availableUpto).getTime() <= Date.now()) return true;
  return false;
}

function getStatusBadge(status, expired = false) {
  if (status === 'pickedUp' || status === 'picked_up') {
    return <span className="badge-status pickedUp">Picked Up</span>;
  }
  if (status === 'expired' || expired) {
    return <span className="badge-status expired">Not Accepted</span>;
  }
  if (status === 'accepted' || status === 'booked') {
    return <span className="badge-status accepted">Accepted</span>;
  }
  return <span className="badge-status available">Available</span>;
}

function formatDateOnly(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MyDonatedFood() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pickedUp' | 'expired' | 'active'

  async function load() {
    try {
      const { data } = await api.get('/food/mine');
      setItems(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load donation history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Stats calculation
  const totalCount = items.length;
  const pickedUpCount = items.filter((l) => l.status === 'pickedUp' || l.status === 'picked_up').length;
  const expiredCount = items.filter((l) => isListingExpired(l)).length;

  // Filter items by selected tab
  const filteredItems = items.filter((item) => {
    const expired = isListingExpired(item);
    if (filterTab === 'pickedUp') {
      return item.status === 'pickedUp' || item.status === 'picked_up';
    }
    if (filterTab === 'expired') {
      return expired;
    }
    return true;
  });

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ maxWidth: '960px' }}>
        {/* Header link back to profile */}
        <Link
          to="/profile"
          className="d-inline-flex align-items-center gap-2 mb-3 text-decoration-none"
          style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to profile</span>
        </Link>

        {/* Page Title & Subtitle */}
        <div className="mb-4">
          <h1 className="display-title mb-1">My Donated Food</h1>
          <p className="food-card-meta mb-0" style={{ fontSize: 'var(--text-base)' }}>
            Complete history of your food donations, pickups, and completed listings.
          </p>
        </div>

        {/* 3 Stat Cards: Total Donations, Picked Up, Expired */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="donor-stat-card">
              <div className="donor-stat-icon total">
                <Package size={22} />
              </div>
              <div>
                <div className="donor-stat-value">{totalCount}</div>
                <div className="donor-stat-label">Total Donations</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="donor-stat-card">
              <div className="donor-stat-icon completed">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="donor-stat-value">{pickedUpCount}</div>
                <div className="donor-stat-label">Picked Up</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="donor-stat-card">
              <div className="donor-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                <AlertCircle size={22} />
              </div>
              <div>
                <div className="donor-stat-value">{expiredCount}</div>
                <div className="donor-stat-label">Not Accepted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div className="donor-nav-tabs">
            <button
              className={`donor-nav-tab ${filterTab === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTab('all')}
            >
              <span>All Donations</span>
            </button>
            <button
              className={`donor-nav-tab ${filterTab === 'pickedUp' ? 'active' : ''}`}
              onClick={() => setFilterTab('pickedUp')}
            >
              <span>Picked Up</span>
            </button>
            <button
              className={`donor-nav-tab ${filterTab === 'expired' ? 'active' : ''}`}
              onClick={() => setFilterTab('expired')}
            >
              <span>Not Accepted</span>
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="d-flex flex-column gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="hh-card p-4">
                <div className="skeleton-box mb-2" style={{ width: '40%', height: '24px' }} />
                <div className="skeleton-box mb-3" style={{ width: '60%', height: '16px' }} />
                <div className="skeleton-box" style={{ width: '30%', height: '20px' }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredItems.length === 0 && (
          <div className="empty-state text-center py-5">
            <div className="mb-3">
              <Inbox size={56} color="var(--color-text-muted)" strokeWidth={1.5} />
            </div>
            <h3 className="section-title mb-0">
              {filterTab === 'pickedUp'
                ? 'No picked up donations yet'
                : filterTab === 'expired'
                ? 'No donations in Not Accepted'
                : 'No donations posted yet'}
            </h3>
          </div>
        )}

        {/* Donation listings */}
        {!loading && filteredItems.length > 0 && (
          <div className="d-flex flex-column gap-3">
            {filteredItems.map((item) => {
              const expired = isListingExpired(item);
              const isNonVeg = item.foodType === 'nonveg' || String(item.foodType).toLowerCase().includes('non');
              const isMixed = item.foodType === 'mixed';
              const dietClass = isNonVeg ? 'non-veg' : isMixed ? 'mixed' : 'veg';
              const dietLabel = isNonVeg ? 'Non-Veg' : isMixed ? 'Mixed' : 'Veg';
              const dateVal = item.expiryAt || item.pickupTo || item.availableUpto;

              return (
                <div className="hh-card p-4 mb-0" key={item.id || item._id}>
                  <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className={`diet-symbol ${dietClass}`} title={dietLabel}>
                        <span className="diet-dot" />
                      </span>
                      <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                        {item.title || item.foodName}
                      </h3>
                      <span className="badge" style={{ fontSize: '11px', background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                        {dietLabel}
                      </span>
                    </div>
                    <div>{getStatusBadge(item.status, expired)}</div>
                  </div>

                  <div
                    className="d-flex flex-wrap gap-4 mb-3 pb-3 border-bottom"
                    style={{ borderColor: 'var(--color-border)', fontSize: 'var(--text-body)' }}
                  >
                    <div>
                      <span className="text-muted d-block small">Quantity</span>
                      <strong className="d-flex align-items-center gap-1">
                        <Package size={14} />{' '}
                        {item.items && item.items.length > 0
                          ? item.items.map((it) => `${it.quantity} ${it.unit} ${it.name}`).join(', ')
                          : item.quantity || '1 portion'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-muted d-block small">Date</span>
                      <strong className="d-flex align-items-center gap-1">
                        <Calendar size={14} /> {formatDateOnly(item.createdAt || item.updatedAt || dateVal)}
                      </strong>
                    </div>
                  </div>

                  {/* Recipient NGO Info if accepted or picked up */}
                  {(item.bookedByNgoName || item.acceptedNgoName) && (
                    <div
                      className="d-flex align-items-center gap-2 px-3 py-2 rounded"
                      style={{
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <Building2 size={16} />
                      <span>
                        {item.status === 'pickedUp' || item.status === 'picked_up' ? 'Picked up by: ' : 'Reserved for NGO: '}
                        <strong>{item.bookedByNgoName || item.acceptedNgoName}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
