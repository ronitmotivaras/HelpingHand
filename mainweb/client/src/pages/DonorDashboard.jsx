import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Inbox,
  Flame,
  Calendar,
  Phone,
  BadgeCheck,
  Users,
  AlertCircle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';

function getStatusBadge(status) {
  if (status === 'accepted' || status === 'booked') {
    return <span className="badge-status accepted">Accepted</span>;
  }
  if (status === 'pickedUp') {
    return <span className="badge-status pickedUp">Picked Up</span>;
  }
  if (status === 'expired') {
    return <span className="badge-status expired">Expired</span>;
  }
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
  const activeCount = listings.filter((l) => l.status === 'available' || l.status === 'accepted' || l.status === 'booked').length;
  const pickedUpCount = listings.filter((l) => l.status === 'pickedUp').length;

  // Filter listings by tab
  const filteredListings = listings.filter((l) => {
    if (activeTab === 'active') {
      return l.status === 'available' || l.status === 'accepted' || l.status === 'booked';
    }
    if (activeTab === 'completed') {
      return l.status === 'pickedUp';
    }
    return true;
  });

  // Action: Accept an NGO request
  async function handleAcceptRequest(listingId, requestId, ngoName) {
    setProcessingId(requestId || listingId);
    try {
      await api.post(`/food/${listingId}/requests/${requestId}/accept`);
      toast.success(`Request accepted! Food is now reserved for ${ngoName || 'the NGO'}. Other requests have been closed.`);
      await loadListings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  }

  // Action: Decline an NGO request
  async function handleDeclineRequest(listingId, requestId, ngoName) {
    setProcessingId(requestId || listingId);
    try {
      await api.post(`/food/${listingId}/requests/${requestId}/decline`);
      toast.success(`Declined request from ${ngoName || 'NGO'}. Other requests remain active.`);
      await loadListings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline request');
    } finally {
      setProcessingId(null);
    }
  }

  // Action: Release accepted listing back to available
  async function handleRelease(id) {
    setProcessingId(id);
    try {
      await api.post(`/food/${id}/release`);
      toast.success('Listing released back to available and visible in NGO feed again');
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
      toast.success('Listing marked as Picked Up! Thank you for donating.');
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
              Manage your food donations, coordinate with verified NGOs, and track pickups.
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
                ? 'Have surplus food to share? Create a new listing and connect with local NGOs.'
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
          <div className="d-flex flex-column gap-4">
            {filteredListings.map((listing) => {
              const isNonVeg = listing.foodType === 'nonveg';
              const isBusy = processingId === listing.id;
              const urgent = isExpiringSoon(listing.expiryAt);

              const isAccepted = listing.status === 'accepted' || listing.status === 'booked';
              const isAvailable = listing.status === 'available';
              const isPickedUp = listing.status === 'pickedUp';

              const pendingRequests = (listing.requests || []).filter((r) => r.status === 'pending');
              const requestCount = listing.requestCount ?? pendingRequests.length;

              const acceptedNgo = listing.acceptedNgo || (listing.bookedByNgoName ? { ngoName: listing.bookedByNgoName } : null);

              return (
                <div className="hh-card mb-0" key={listing.id} style={{ border: isAccepted ? '1px solid #fde68a' : undefined }}>
                  {/* Card top row */}
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
                        {urgent && !isPickedUp && listing.status !== 'expired' && (
                          <span className="badge-use-quickly">
                            <Flame size={12} />
                            <span>Use quickly</span>
                          </span>
                        )}
                        {isAvailable && (
                          <span className="ngo-requests-badge">
                            <Users size={12} />
                            <span>
                              {requestCount > 0
                                ? `${requestCount} request${requestCount > 1 ? 's' : ''}`
                                : 'No requests yet'}
                            </span>
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

                  {/* CASE 1: AVAILABLE - Show incoming NGO requests */}
                  {isAvailable && (
                    <div
                      className="p-3 rounded mt-2"
                      style={{
                        background: pendingRequests.length > 0 ? '#f8fafc' : 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <Users size={16} color="var(--color-primary)" />
                          <strong style={{ fontSize: 'var(--text-sm)' }}>
                            NGO Pickup Requests ({pendingRequests.length})
                          </strong>
                        </div>
                        {pendingRequests.length > 0 && (
                          <span className="text-muted" style={{ fontSize: '11px' }}>
                            Talk by phone. If you agree, click Accept.
                          </span>
                        )}
                      </div>

                      {pendingRequests.length === 0 ? (
                        <div className="py-2 text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                          Listing is available in the NGO feed. When NGOs click <em>Request Pickup</em>, their details will appear here.
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2 mt-2">
                          {pendingRequests.map((req) => {
                            const isReqBusy = processingId === req.id;
                            return (
                              <div
                                key={req.id}
                                className="donor-request-item d-flex justify-content-between align-items-center flex-wrap gap-3"
                              >
                                <div>
                                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                    <strong style={{ fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>
                                      {req.ngoName}
                                    </strong>
                                    <span className="badge-verified-ngo">
                                      <BadgeCheck size={13} />
                                      <span>Verified NGO</span>
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center gap-3 text-muted flex-wrap" style={{ fontSize: 'var(--text-sm)' }}>
                                    <span>
                                      Contact: <strong>{req.coordinatorName || 'Coordinator'}</strong>
                                    </span>
                                    <a
                                      href={`tel:${req.phone}`}
                                      className="phone-link-btn"
                                      title="Call NGO coordinator"
                                    >
                                      <Phone size={13} />
                                      <span>{req.phone}</span>
                                    </a>
                                    <span style={{ fontSize: '11px' }}>
                                      Requested {formatDate(req.createdAt)}
                                    </span>
                                  </div>
                                </div>

                                <div className="d-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn-hh-primary d-inline-flex align-items-center gap-1"
                                    style={{ padding: '6px 14px', fontSize: 'var(--text-sm)' }}
                                    disabled={isReqBusy}
                                    onClick={() => handleAcceptRequest(listing.id, req.id, req.ngoName)}
                                  >
                                    <CheckCircle2 size={15} />
                                    <span>{isReqBusy ? 'Accepting...' : 'Accept'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-hh-secondary d-inline-flex align-items-center gap-1"
                                    style={{ padding: '6px 14px', fontSize: 'var(--text-sm)' }}
                                    disabled={isReqBusy}
                                    onClick={() => handleDeclineRequest(listing.id, req.id, req.ngoName)}
                                    title="Decline this request without affecting other NGOs"
                                  >
                                    <XCircle size={15} />
                                    <span>Decline</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CASE 2: ACCEPTED - Show accepted NGO, Picked Up, and Release */}
                  {isAccepted && (
                    <div
                      className="p-3 rounded mt-2"
                      style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                            <span className="badge-status accepted" style={{ padding: '2px 8px', fontSize: '11px' }}>
                              Accepted
                            </span>
                            <strong style={{ fontSize: 'var(--text-base)', color: '#92400e' }}>
                              {acceptedNgo?.ngoName || 'NGO'}
                            </strong>
                            <span className="badge-verified-ngo">
                              <BadgeCheck size={13} />
                              <span>Verified NGO</span>
                            </span>
                          </div>

                          <div className="d-flex align-items-center gap-3 text-muted flex-wrap" style={{ fontSize: 'var(--text-sm)' }}>
                            {acceptedNgo?.coordinatorName && (
                              <span>
                                Coordinator: <strong>{acceptedNgo.coordinatorName}</strong>
                              </span>
                            )}
                            {acceptedNgo?.phone && (
                              <a
                                href={`tel:${acceptedNgo.phone}`}
                                className="phone-link-btn"
                                title="Call NGO"
                              >
                                <Phone size={13} />
                                <span>{acceptedNgo.phone}</span>
                              </a>
                            )}
                            {acceptedNgo?.acceptedAt && (
                              <span style={{ fontSize: '11px' }}>
                                Accepted {formatDate(acceptedNgo.acceptedAt)}
                              </span>
                            )}
                          </div>
                          <div className="small text-muted mt-1">
                            Once collected, click Picked Up. If the NGO cannot come, click Release to make food available in the feed again.
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn-hh-primary d-inline-flex align-items-center gap-1"
                            style={{ padding: '7px 16px', fontSize: 'var(--text-sm)' }}
                            disabled={isBusy}
                            onClick={() => handlePickedUp(listing.id)}
                          >
                            <CheckCircle2 size={16} />
                            <span>{isBusy ? 'Saving...' : 'Picked Up'}</span>
                          </button>
                          <button
                            type="button"
                            className="btn-hh-secondary d-inline-flex align-items-center gap-1"
                            style={{ padding: '7px 14px', fontSize: 'var(--text-sm)' }}
                            disabled={isBusy}
                            onClick={() => handleRelease(listing.id)}
                            title="If the NGO cannot come, return listing to Available"
                          >
                            <RotateCcw size={15} />
                            <span>Release</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CASE 3: PICKED UP - Finished state */}
                  {isPickedUp && (
                    <div className="text-muted small d-flex align-items-center gap-1 pt-2">
                      <CheckCircle2 size={15} color="var(--color-success)" />
                      <span>
                        Donation completed! Picked up by {acceptedNgo?.ngoName ? <strong>{acceptedNgo.ngoName}</strong> : 'NGO'} {listing.pickedUpAt ? `on ${formatDate(listing.pickedUpAt)}` : ''}.
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
