import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  RotateCcw,
  Inbox,
  Flame,
  UserCheck,
  Calendar,
  AlertCircle,
  X,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';

function getStatusBadge(status) {
  if (status === 'booked') return <span className="badge-status booked">Booked</span>;
  if (status === 'pickedUp') return <span className="badge-status pickedUp">Picked Up</span>;
  if (status === 'expired') return <span className="badge-status expired">Expired</span>;
  return <span className="badge-status available">Available</span>;
}

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

export default function DonorDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'all'
  const [processingId, setProcessingId] = useState(null);

  // Modal for booking with NGO name note
  const [bookingModalItem, setBookingModalItem] = useState(null);
  const [ngoNote, setNgoNote] = useState('');

  async function loadListings() {
    setLoading(true);
    try {
      const { data } = await api.get('/food/mine');
      setListings(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load your listings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, []);

  // Stats calculation
  const totalCount = listings.length;
  const activeCount = listings.filter((l) => l.status === 'available' || l.status === 'booked').length;
  const pickedUpCount = listings.filter((l) => l.status === 'pickedUp').length;

  // Filter listings by tab
  const filteredListings = listings.filter((l) => {
    if (activeTab === 'active') return l.status === 'available' || l.status === 'booked';
    if (activeTab === 'completed') return l.status === 'pickedUp';
    return true; // 'all'
  });

  // Action: Open book modal
  function openBookModal(listing) {
    setBookingModalItem(listing);
    setNgoNote('');
  }

  // Action: Confirm Book
  async function handleConfirmBook(e) {
    e.preventDefault();
    if (!bookingModalItem) return;
    setProcessingId(bookingModalItem.id);
    try {
      await api.post(`/food/${bookingModalItem.id}/book`, { ngoName: ngoNote });
      toast.success('Listing marked as booked by NGO');
      setBookingModalItem(null);
      await loadListings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book listing');
    } finally {
      setProcessingId(null);
    }
  }

  // Action: Release booked listing
  async function handleRelease(id) {
    setProcessingId(id);
    try {
      await api.post(`/food/${id}/release`);
      toast.success('Listing released back to available');
      await loadListings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release listing');
    } finally {
      setProcessingId(null);
    }
  }

  // Action: Mark Picked Up
  async function handlePickedUp(id) {
    setProcessingId(id);
    try {
      await api.post(`/food/${id}/picked-up`);
      toast.success('Listing marked as Picked Up!');
      await loadListings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ paddingBottom: '96px' }}>
        {/* Header with Title and "Donate Food" button */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h1 className="display-title mb-1">Donor Dashboard</h1>
            <p className="food-card-meta mb-0" style={{ fontSize: 'var(--text-base)' }}>
              Manage your food donations, track pickups, and mark statuses.
            </p>
          </div>
          <Link to="/donate" className="btn-hh-primary d-inline-flex align-items-center gap-2">
            <Plus size={18} strokeWidth={2.5} />
            <span>Donate Food</span>
          </Link>
        </div>

        {/* 3 Stat Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
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
          <div className="col-md-4">
            <div className="donor-stat-card">
              <div className="donor-stat-icon active">
                <Clock size={22} />
              </div>
              <div>
                <div className="donor-stat-value">{activeCount}</div>
                <div className="donor-stat-label">Active Listings</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
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
        </div>

        {/* Tabs: Active / Completed / All */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div className="donor-nav-tabs">
            <button
              className={`donor-nav-tab ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              <span>Active</span>
              <span className="donor-tab-count">{activeCount}</span>
            </button>
            <button
              className={`donor-nav-tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              <span>Completed</span>
              <span className="donor-tab-count">{pickedUpCount}</span>
            </button>
            <button
              className={`donor-nav-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>All Listings</span>
              <span className="donor-tab-count">{totalCount}</span>
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
        {!loading && filteredListings.length === 0 && (
          <div className="empty-state text-center py-5">
            <div className="mb-3">
              <Inbox size={56} color="var(--color-text-muted)" strokeWidth={1.5} />
            </div>
            <h3 className="section-title mb-2">
              {activeTab === 'active'
                ? 'No active donations right now'
                : activeTab === 'completed'
                ? 'No completed pickups yet'
                : 'No donations posted yet'}
            </h3>
            <p className="empty-state-text mb-4">
              {activeTab === 'active'
                ? 'Have extra food to share? Create a new listing and connect with local NGOs.'
                : 'When NGOs pick up your food, they will appear in your Completed history.'}
            </p>
            <Link to="/donate" className="btn-hh-secondary d-inline-flex align-items-center gap-2">
              <Plus size={16} />
              <span>Post a Food Donation</span>
            </Link>
          </div>
        )}

        {/* Listings Cards */}
        {!loading && filteredListings.length > 0 && (
          <div className="d-flex flex-column gap-3">
            {filteredListings.map((listing) => {
              const isNonVeg = listing.foodType === 'nonveg';
              const isBusy = processingId === listing.id;
              const urgent = isExpiringSoon(listing.expiryAt);

              return (
                <div className="hh-card mb-0" key={listing.id}>
                  {/* Card top */}
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3 flex-wrap">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`diet-symbol ${isNonVeg ? 'non-veg' : 'veg'}`}
                          title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}
                        >
                          <span className="diet-dot" />
                        </span>
                        <h3 className="card-title m-0">{listing.foodName}</h3>
                        {urgent && listing.status !== 'pickedUp' && listing.status !== 'expired' && (
                          <span className="badge-use-quickly">
                            <Flame size={12} />
                            <span>Use quickly</span>
                          </span>
                        )}
                      </div>
                      <p className="food-card-meta mb-0 d-flex align-items-center gap-1">
                        <MapPin size={13} />
                        <span>{listing.address}, {listing.city}</span>
                      </p>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {getStatusBadge(listing.status)}
                    </div>
                  </div>

                  {/* Multiple items pills */}
                  {listing.items && listing.items.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {listing.items.map((it, idx) => (
                        <span className="item-chip" key={idx}>
                          <Package size={12} color="var(--color-primary)" />
                          <strong>{it.quantity} {it.unit}</strong> {it.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pickup & Expiry timing row */}
                  <div
                    className="row g-2 mb-3 py-2 border-top border-bottom"
                    style={{ borderColor: 'var(--color-border-subtle)', fontSize: 'var(--text-sm)' }}
                  >
                    <div className="col-sm-6">
                      <div className="text-muted d-flex align-items-center gap-1">
                        <Calendar size={13} />
                        <span>Pickup Window:</span>
                      </div>
                      <div className="fw-semibold mt-1">
                        {formatDate(listing.pickupFrom)} — {formatDate(listing.pickupTo)}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-muted d-flex align-items-center gap-1">
                        <Clock size={13} />
                        <span>Consume Before:</span>
                      </div>
                      <div className="fw-semibold mt-1" style={{ color: urgent ? 'var(--color-danger)' : 'inherit' }}>
                        {formatDate(listing.expiryAt)}
                      </div>
                    </div>
                  </div>

                  {/* Booked by NGO info banner */}
                  {listing.status === 'booked' && (
                    <div className="pickup-prompt-box mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-1 fw-semibold" style={{ color: '#b45309' }}>
                          <UserCheck size={16} />
                          <span>Booked by NGO {listing.bookedByNgoName ? `(${listing.bookedByNgoName})` : ''}</span>
                        </div>
                        <div className="small text-muted mt-1">
                          Was this donation picked up by the NGO?
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn-hh-primary d-inline-flex align-items-center gap-1"
                          style={{ padding: '6px 14px', fontSize: 'var(--text-sm)' }}
                          disabled={isBusy}
                          onClick={() => handlePickedUp(listing.id)}
                        >
                          <CheckCircle2 size={15} />
                          <span>Picked Up</span>
                        </button>
                        <button
                          type="button"
                          className="btn-hh-secondary d-inline-flex align-items-center gap-1"
                          style={{ padding: '6px 14px', fontSize: 'var(--text-sm)' }}
                          disabled={isBusy}
                          onClick={() => handleRelease(listing.id)}
                          title="Release back to available so another NGO can take it"
                        >
                          <RotateCcw size={14} />
                          <span>Release</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions for Available status */}
                  {listing.status === 'available' && (
                    <div className="d-flex justify-content-end gap-2 pt-1">
                      <button
                        type="button"
                        className="btn-hh-secondary d-inline-flex align-items-center gap-1"
                        style={{ padding: '6px 14px', fontSize: 'var(--text-sm)' }}
                        disabled={isBusy}
                        onClick={() => openBookModal(listing)}
                      >
                        <UserCheck size={15} />
                        <span>Mark as Booked</span>
                      </button>
                      <button
                        type="button"
                        className="btn-hh-primary d-inline-flex align-items-center gap-1"
                        style={{ padding: '6px 14px', fontSize: 'var(--text-sm)' }}
                        disabled={isBusy}
                        onClick={() => handlePickedUp(listing.id)}
                      >
                        <CheckCircle2 size={15} />
                        <span>Mark as Picked Up</span>
                      </button>
                    </div>
                  )}

                  {/* Picked up note */}
                  {listing.status === 'pickedUp' && (
                    <div className="text-muted small d-flex align-items-center gap-1 pt-1">
                      <CheckCircle2 size={14} color="var(--color-success)" />
                      <span>Successfully picked up {listing.pickedUpAt ? `on ${formatDate(listing.pickedUpAt)}` : ''}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Mark as Booked by NGO */}
        {bookingModalItem && (
          <div
            className="modal-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: '16px',
            }}
          >
            <div className="hh-card" style={{ maxWidth: '440px', width: '100%', margin: 0 }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title m-0">Mark as Booked</h4>
                <button
                  type="button"
                  onClick={() => setBookingModalItem(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>
              <p className="food-card-meta mb-3">
                Record which NGO is coming to collect <strong>{bookingModalItem.foodName}</strong>.
              </p>
              <form onSubmit={handleConfirmBook}>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="ngo-note">
                    NGO Name / Note (Optional)
                  </label>
                  <input
                    id="ngo-note"
                    className="form-control"
                    placeholder="e.g. Robin Hood Army, Local Relief NGO"
                    value={ngoNote}
                    onChange={(e) => setNgoNote(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="d-flex justify-content-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn-hh-secondary"
                    onClick={() => setBookingModalItem(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-hh-primary"
                    disabled={processingId === bookingModalItem.id}
                  >
                    {processingId === bookingModalItem.id ? 'Saving...' : 'Confirm Booked'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
