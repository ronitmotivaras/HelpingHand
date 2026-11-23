import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Package,
  MapPin,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Inbox,
  Calendar,
  Phone,
  BadgeCheck,
  Users,
  AlertCircle,
  X,
  Eye,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';

function isListingExpired(l) {
  if (!l) return false;
  if (l.status === 'expired') return true;
  if (l.status === 'pickedUp') return false;
  if (l.pickupTo && new Date(l.pickupTo).getTime() <= Date.now()) return true;
  return false;
}

function getStatusBadge(status, expired = false) {
  if (status === 'pickedUp') {
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

export default function DonorDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [loadingNgoProfile, setLoadingNgoProfile] = useState(false);
  const [ngoModalOpen, setNgoModalOpen] = useState(false);

  async function handleOpenNgoProfile(foodId, ngoId) {
    if (!ngoId) {
      toast.error('NGO details are not linked to an account');
      return;
    }
    setLoadingNgoProfile(true);
    setNgoModalOpen(true);
    try {
      const res = await api.get(`/food/${foodId}/ngo-profile/${ngoId}`);
      setSelectedNgo(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load NGO profile');
      setNgoModalOpen(false);
    } finally {
      setLoadingNgoProfile(false);
    }
  }

  async function loadListings(isBackground = false) {
    if (!isBackground) setLoading(true);
    try {
      const { data } = await api.get('/food/mine');
      setListings(data);
    } catch (err) {
      if (!isBackground) toast.error(err.response?.data?.message || 'Failed to load your listings');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
    // Live update donor dashboard every 5 seconds so incoming requests, status changes update automatically
    const interval = setInterval(() => {
      loadListings(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Show only active food listings on the donor dashboard
  const activeListings = listings.filter((l) => {
    const expired = isListingExpired(l);
    return !expired && (l.status === 'available' || l.status === 'accepted' || l.status === 'booked');
  });

  // Action: Accept an NGO request
  async function handleAcceptRequest(listingId, requestId, ngoName) {
    setProcessingId(requestId || listingId);
    try {
      await api.post(`/food/${listingId}/requests/${requestId}/accept`);
      toast.success(`Request accepted! Food is now reserved for ${ngoName || 'the NGO'}.`);
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
            <h1 className="display-title mb-0">Donor Dashboard</h1>
          </div>
          <Link to="/donate" className="btn-hh-primary d-inline-flex align-items-center gap-2">
            <Plus size={18} strokeWidth={2.5} />
            <span>Donate Food</span>
          </Link>
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
        {!loading && activeListings.length === 0 && (
          <div className="empty-state text-center py-5">
            <div className="mb-3">
              <Inbox size={56} color="var(--color-text-muted)" strokeWidth={1.5} />
            </div>
            <h3 className="section-title mb-0">No active donations right now</h3>
          </div>
        )}

        {/* Listings Cards - Active Food Only */}
        {!loading && activeListings.length > 0 && (
          <div className="d-flex flex-column gap-4">
            {activeListings.map((listing) => {
              const isNonVeg = listing.foodType === 'nonveg';
              const isMixed = listing.foodType === 'mixed';
              const dietClass = isNonVeg ? 'non-veg' : isMixed ? 'mixed' : 'veg';
              const dietTitle = isNonVeg ? 'Non-Vegetarian' : isMixed ? 'Mixed (Veg & Non-Veg)' : 'Vegetarian';
              const isBusy = processingId === listing.id;

              const expired = isListingExpired(listing);
              const isAccepted = !expired && (listing.status === 'accepted' || listing.status === 'booked');
              const isAvailable = !expired && listing.status === 'available';
              const isPickedUp = listing.status === 'pickedUp';

              const pendingRequests = (listing.requests || []).filter((r) => r.status === 'pending');
              const requestCount = listing.requestCount ?? pendingRequests.length;

              const acceptedNgo = listing.acceptedNgo || (listing.bookedByNgoName ? { ngoName: listing.bookedByNgoName } : null);

              return (
                <div
                  className="hh-card mb-0"
                  key={listing.id}
                  style={{
                    border: isAccepted ? '1px solid #fde68a' : expired && !isPickedUp ? '1px solid #fecaca' : undefined,
                    opacity: expired && !isPickedUp ? 0.92 : 1,
                  }}
                >
                  {/* Card top row */}
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3 flex-wrap">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`diet-symbol ${dietClass}`}
                          title={dietTitle}
                        >
                          <span className="diet-dot" />
                        </span>
                        <h3 className="card-title m-0">{listing.foodName}</h3>
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
                      {getStatusBadge(listing.status, expired)}
                    </div>
                  </div>

                  {/* Multiple items pills (only show if not just repeating the exact single food title) */}
                  {listing.items && listing.items.length > 0 && (
                    (() => {
                      const displayItems =
                        listing.items.length === 1 &&
                        listing.foodName?.toLowerCase().trim() === listing.items[0].name?.toLowerCase().trim()
                          ? []
                          : listing.items;

                      return displayItems.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          {displayItems.map((it, idx) => (
                            <span className="item-chip" key={idx}>
                              <Package size={12} color="var(--color-primary)" />
                              <strong>{it.quantity} {it.unit}</strong> {it.name}
                            </span>
                          ))}
                        </div>
                      ) : null;
                    })()
                  )}

                  {/* Pickup timing row */}
                  <div
                    className="mb-3 py-2 px-3 rounded d-flex align-items-center gap-2 flex-wrap"
                    style={{
                      background: 'var(--color-surface-2, #f9fafb)',
                      border: '1px solid var(--color-border-subtle, #e5e7eb)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    <span className="text-muted d-flex align-items-center gap-1">
                      <Calendar size={14} color="var(--color-primary)" />
                      <strong>Pickup Window:</strong>
                    </span>
                    <span className="fw-semibold text-dark">
                      {formatDate(listing.pickupFrom)} — {formatDate(listing.pickupTo)}
                    </span>
                  </div>

                  {/* CASE 0: EXPIRED (not picked up) - Informative alert */}
                  {expired && !isPickedUp && (
                    <div
                      className="p-3 rounded mt-2"
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <AlertCircle size={16} />
                        <strong style={{ fontSize: 'var(--text-sm)' }}>Food Has Expired</strong>
                      </div>
                      <p className="mb-0 mt-1" style={{ fontSize: 'var(--text-sm)', color: '#7f1d1d' }}>
                        The pickup window for this listing has passed. It has been automatically moved out of active listings and hidden from NGOs so it cannot be claimed.
                      </p>
                    </div>
                  )}

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
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNgoProfile(listing.id, req.ngoId)}
                                      className="btn-link text-decoration-none p-0 border-0 bg-transparent text-start fw-bold"
                                      style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary)', cursor: 'pointer' }}
                                      title="Click to view verified NGO profile"
                                    >
                                      {req.ngoName}
                                    </button>
                                    <span className="badge-verified-ngo">
                                      <BadgeCheck size={13} />
                                      <span>Verified NGO</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNgoProfile(listing.id, req.ngoId)}
                                      className="btn-hh-secondary d-inline-flex align-items-center gap-1"
                                      style={{
                                        fontSize: '11px',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                      }}
                                    >
                                      <Eye size={11} />
                                      <span>View Profile</span>
                                    </button>
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
                    <div className="mt-2 d-flex flex-column gap-3">
                      <div
                        className="p-3 rounded"
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
                              {acceptedNgo?.ngoId && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenNgoProfile(listing.id, acceptedNgo.ngoId)}
                                  className="btn-hh-secondary d-inline-flex align-items-center gap-1"
                                  style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: '#fef3c7',
                                    borderColor: '#fde68a',
                                    color: '#92400e',
                                  }}
                                >
                                  <Eye size={11} />
                                  <span>View Profile</span>
                                </button>
                              )}
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
                              {(acceptedNgo?.acceptedAt || listing.bookedAt) && (
                                <span style={{ fontSize: '11px', color: '#92400e', fontWeight: 600 }}>
                                  Accepted At: {formatDate(acceptedNgo?.acceptedAt || listing.bookedAt)}
                                </span>
                              )}
                            </div>
                            <div className="small text-muted mt-1">
                              Once collected, click Picked Up. If this NGO cannot come, click Release to view and accept other requests in the queue.
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
                              title="If this NGO cannot come, cancel acceptance and release back"
                            >
                              <RotateCcw size={15} />
                              <span>Release</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Info indicator that other requests are waiting in queue */}
                      {pendingRequests.filter((r) => String(r.ngoId) !== String(acceptedNgo?.ngoId)).length > 0 && (
                        <div
                          className="px-3 py-2 rounded text-muted"
                          style={{
                            background: '#f8fafc',
                            border: '1px dashed var(--color-border)',
                            fontSize: '12px',
                          }}
                        >
                          <span className="fw-semibold text-dark">
                            {pendingRequests.filter((r) => String(r.ngoId) !== String(acceptedNgo?.ngoId)).length} other NGO request(s) waiting in queue.
                          </span>{' '}
                          They are held in queue and will appear for your acceptance if you release the current NGO.
                        </div>
                      )}
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

        {/* NGO Profile Modal */}
        {ngoModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 1050,
            }}
            onClick={() => setNgoModalOpen(false)}
          >
            <div
              className="hh-card"
              style={{
                width: '100%',
                maxWidth: '520px',
                padding: '24px',
                borderRadius: '16px',
                background: 'var(--color-surface, #ffffff)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--color-border, #e2e8f0)',
                animation: 'fadeIn 0.2s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {loadingNgoProfile ? (
                <div className="py-5 text-center">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading NGO profile...</span>
                  </div>
                  <p className="mt-2 text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                    Loading verified profile...
                  </p>
                </div>
              ) : selectedNgo ? (
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <h3 className="mb-0" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                          {selectedNgo.ngoName}
                        </h3>
                        {selectedNgo.isVerified && (
                          <span className="badge-verified-ngo">
                            <BadgeCheck size={14} />
                            <span>Verified NGO</span>
                          </span>
                        )}
                      </div>
                      <div className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                        Verified Community Partner Organization
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-close-custom"
                      onClick={() => setNgoModalOpen(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted, #64748b)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* NGO Coordinator & Contact details */}
                  <div
                    className="p-3 rounded mb-3"
                    style={{ background: 'var(--color-surface-2, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)' }}
                  >
                    <div className="mb-2 pb-2 border-bottom d-flex justify-content-between align-items-center">
                      <span className="text-muted" style={{ fontSize: '12px' }}>Coordinator</span>
                      <strong style={{ fontSize: 'var(--text-sm)' }}>
                        {selectedNgo.coordinatorName || 'Designated Representative'}
                      </strong>
                    </div>

                    <div className="mb-2 pb-2 border-bottom d-flex justify-content-between align-items-center">
                      <span className="text-muted" style={{ fontSize: '12px' }}>Phone Number</span>
                      {selectedNgo.phone ? (
                        <a
                          href={`tel:${selectedNgo.phone}`}
                          className="phone-link-btn d-inline-flex align-items-center gap-1"
                          style={{
                            background: 'var(--color-primary-light, #e8f5e9)',
                            color: 'var(--color-primary, #16a34a)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <Phone size={13} />
                          <span>{selectedNgo.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Not provided</span>
                      )}
                    </div>

                    <div className="d-flex justify-content-between align-items-start">
                      <span className="text-muted" style={{ fontSize: '12px' }}>Location & City</span>
                      <div className="text-end" style={{ fontSize: 'var(--text-sm)', maxWidth: '65%' }}>
                        <div className="fw-semibold d-flex align-items-center justify-content-end gap-1">
                          <MapPin size={13} color="var(--color-primary)" />
                          <span>{selectedNgo.city || 'Local area'}</span>
                        </div>
                        {selectedNgo.address && (
                          <div className="text-muted small mt-1">
                            {selectedNgo.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 p-2 rounded text-muted mb-3" style={{ background: '#f1f5f9', fontSize: '11px' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>
                      Private contact info shown only to you because this NGO has an active pickup request on your food.
                    </span>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn-hh-secondary"
                      onClick={() => setNgoModalOpen(false)}
                      style={{ padding: '6px 16px', fontSize: 'var(--text-sm)' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-muted">
                  NGO profile details could not be loaded.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
