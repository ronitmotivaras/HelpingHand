import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  Search,
  BadgeCheck,
  Clock,
  Trash2,
  RotateCcw,
  X,
  Ban,
  Eye,
  ChevronDown,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api/axiosInstance';
import { CITIES } from '../constants/cities';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NgoVerification() {
  const [ngos, setNgos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Tabs: 'verified' | 'pending' | 'declined' | 'blocked'
  const [listFilter, setListFilter] = useState('verified');
  const [cityFilter, setCityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Details Modal (Show More)
  const [detailsNgo, setDetailsNgo] = useState(null);

  // Decline Modal State
  const [declineModalItem, setDeclineModalItem] = useState(null); // { id, name }
  const [declineReason, setDeclineReason] = useState('');
  const [isDeclining, setIsDeclining] = useState(false);

  // Block Modal State
  const [blockingNgo, setBlockingNgo] = useState(null); // { id, name, phone }
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  // Delete Modal State
  const [deleteModalItem, setDeleteModalItem] = useState(null); // { id, name }
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadNgos() {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/ngo-requests?includeBlocked=true');
      setNgos(res.data);
      // If details modal is open, refresh its data
      if (detailsNgo) {
        const updated = res.data.find((n) => n.id === detailsNgo.id);
        if (updated) setDetailsNgo(updated);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to load NGO list');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNgos();
  }, []);

  // Action: Verify NGO
  async function handleVerify(id, ngoName) {
    setProcessingId(id);
    try {
      await api.patch(`/api/admin/ngo-requests/${id}/approve`);
      toast.success(`"${ngoName || 'NGO'}" verified successfully.`);
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to verify NGO');
    } finally {
      setProcessingId(null);
    }
  }

  // Action: Set to Pending
  async function handleSetPending(id, ngoName) {
    setProcessingId(id);
    try {
      await api.patch(`/api/admin/ngo-requests/${id}/pending`);
      toast.success(`"${ngoName || 'NGO'}" status moved to Pending review.`);
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessingId(null);
    }
  }

  // Action: Confirm Decline (with note input)
  async function confirmDeclineAction() {
    if (!declineModalItem) return;
    const { id, name } = declineModalItem;
    setIsDeclining(true);
    setProcessingId(id);
    try {
      await api.patch(`/api/admin/ngo-requests/${id}/reject`, {
        reason: declineReason.trim() || 'NGO application declined by admin',
      });
      toast.success(`"${name}" declined and moved to Declined list.`);
      setDeclineModalItem(null);
      setDeclineReason('');
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to decline NGO');
    } finally {
      setIsDeclining(false);
      setProcessingId(null);
    }
  }

  // Action: Confirm Block
  async function confirmBlockNgo() {
    if (!blockingNgo) return;
    setIsBlocking(true);
    try {
      await api.post(`/api/admin/users/${blockingNgo.id}/block`, {
        reason: blockReason.trim() || 'NGO blocked by admin',
      });
      toast.success(`"${blockingNgo.name}" blocked and moved to Blocked list.`);
      setBlockingNgo(null);
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to block NGO');
    } finally {
      setIsBlocking(false);
    }
  }

  // Action: Confirm Unblock
  async function handleUnblockNgo(id, ngoName) {
    setProcessingId(id);
    try {
      await api.post(`/api/admin/users/${id}/unblock`);
      toast.success(`"${ngoName || 'NGO'}" unblocked and returned to Pending list.`);
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to unblock NGO');
    } finally {
      setProcessingId(null);
    }
  }

  // Action: Confirm Delete (complete wipe from database)
  async function handleDeleteConfirm() {
    if (!deleteModalItem) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/ngos/${deleteModalItem.id}`);
      toast.success(`"${deleteModalItem.name}" and all data permanently deleted.`);
      if (detailsNgo?.id === deleteModalItem.id) setDetailsNgo(null);
      setDeleteModalItem(null);
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to delete NGO');
    } finally {
      setIsDeleting(false);
    }
  }

  // Counts for tabs
  const verifiedCount = ngos ? ngos.filter((n) => n.ngoStatus === 'approved' && !n.isBlocked).length : 0;
  const pendingCount = ngos ? ngos.filter((n) => n.ngoStatus === 'pending' && !n.isBlocked).length : 0;
  const declinedCount = ngos ? ngos.filter((n) => n.ngoStatus === 'rejected' && !n.isBlocked).length : 0;
  const blockedCount = ngos ? ngos.filter((n) => n.isBlocked).length : 0;

  // Filter pipeline
  const filteredNgos = (ngos || []).filter((ngo) => {
    if (listFilter === 'blocked') {
      if (!ngo.isBlocked) return false;
    } else {
      if (ngo.isBlocked) return false;
      if (listFilter === 'verified' && ngo.ngoStatus !== 'approved') return false;
      if (listFilter === 'pending' && ngo.ngoStatus !== 'pending') return false;
      if (listFilter === 'declined' && ngo.ngoStatus !== 'rejected') return false;
    }

    // City filter
    const ngoCity = ngo.ngoDetails?.city || ngo.city || '';
    if (cityFilter && ngoCity.toLowerCase() !== cityFilter.toLowerCase()) {
      return false;
    }

    // Search term
    if (search.trim()) {
      const term = search.toLowerCase();
      const ngoName = (ngo.ngoDetails?.ngoName || ngo.ngoDetails?.name || ngo.name || '').toLowerCase();
      const coordinator = (ngo.ngoDetails?.coordinatorName || ngo.name || '').toLowerCase();
      const contact = (ngo.ngoDetails?.contactNum || ngo.mobile || '').toLowerCase();
      const address = (ngo.ngoDetails?.address || '').toLowerCase();
      const city = ngoCity.toLowerCase();
      const notesCombined = (ngo.adminNotes || []).map((n) => n.note.toLowerCase()).join(' ');

      return (
        ngoName.includes(term) ||
        coordinator.includes(term) ||
        contact.includes(term) ||
        address.includes(term) ||
        city.includes(term) ||
        notesCombined.includes(term)
      );
    }

    return true;
  });

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-breadcrumb-bar">
          <div>
            <h1 className="admin-page-title">NGO Management</h1>
          </div>
        </div>

        <section className="admin-card-panel">
          {/* Top Filter Tabs: Verified NGOs / Pending / Declined / Blocked */}
          <div
            className="d-flex justify-content-between align-items-center flex-wrap gap-3"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--color-border-subtle)',
              background: 'var(--color-surface-2)',
            }}
          >
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                className={`btn-admin-outline ${listFilter === 'verified' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => setListFilter('verified')}
              >
                Verified NGOs
              </button>

              <button
                type="button"
                className={`btn-admin-outline ${listFilter === 'pending' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => setListFilter('pending')}
              >
                Pending
              </button>

              <button
                type="button"
                className={`btn-admin-outline ${listFilter === 'declined' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => setListFilter('declined')}
              >
                Declined
              </button>

              <button
                type="button"
                className={`btn-admin-outline ${listFilter === 'blocked' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => setListFilter('blocked')}
                title="Blocked NGOs"
              >
                <Ban size={14} className="me-1" />
                <span>Blocked</span>
              </button>
            </div>

            {/* Showing Count at top right */}
            <span className="text-muted" style={{ fontSize: 'var(--text-small)', whiteSpace: 'nowrap' }}>
              Showing <strong>{filteredNgos.length}</strong> of{' '}
              {listFilter === 'verified'
                ? verifiedCount
                : listFilter === 'pending'
                ? pendingCount
                : listFilter === 'declined'
                ? declinedCount
                : blockedCount}{' '}
              NGOs
            </span>
          </div>

          {/* Search & City Filter Bar */}
          <div
            className="d-flex justify-content-between align-items-center flex-wrap gap-3"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                <Search
                  size={16}
                  color="var(--color-text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="admin-form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="Search name, phone, coordinator, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* City Dropdown with visible dropdown arrow */}
              <div style={{ position: 'relative', width: '170px' }}>
                <select
                  className="admin-form-input"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  style={{
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    paddingRight: '34px',
                  }}
                >
                  <option value="">All Cities</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  color="var(--color-text-muted)"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Structured Table Layout */}
          {loading && ngos === null ? (
            <div className="p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="d-flex gap-3 align-items-center mb-3 p-3 border rounded">
                  <div className="skeleton-box" style={{ width: '5%', height: '20px' }} />
                  <div className="skeleton-box" style={{ width: '30%', height: '20px' }} />
                  <div className="skeleton-box" style={{ width: '20%', height: '20px' }} />
                  <div className="skeleton-box" style={{ width: '20%', height: '20px' }} />
                  <div className="skeleton-box" style={{ width: '25%', height: '20px' }} />
                </div>
              ))}
            </div>
          ) : filteredNgos.length === 0 ? (
            <div className="admin-empty-state py-5 text-center">
              <div className="empty-icon mb-2">
                <Inbox size={48} color="var(--color-text-muted)" strokeWidth={1.5} />
              </div>
              <p className="fw-semibold mb-1">No matching NGOs found.</p>
              <span className="text-muted small">
                Try selecting another tab or clearing your search filters.
              </span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th>NGO Name</th>
                    <th>City</th>
                    <th>Phone Number</th>
                    <th style={{ textAlign: 'right', minWidth: '280px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNgos.map((ngo, index) => {
                    const isProcessing = processingId === ngo.id;
                    const ngoName = ngo.ngoDetails?.ngoName || ngo.ngoDetails?.name || ngo.name || 'Unnamed NGO';
                    const city = ngo.ngoDetails?.city || ngo.city || '—';
                    const contactNum = ngo.ngoDetails?.contactNum || ngo.ngoDetails?.contactNumber || ngo.mobile || '—';

                    const isApproved = ngo.ngoStatus === 'approved';
                    const isPending = ngo.ngoStatus === 'pending';
                    const isRejected = ngo.ngoStatus === 'rejected';

                    return (
                      <tr key={ngo.id}>
                        {/* Index Number */}
                        <td className="fw-bold" style={{ fontFamily: 'monospace', color: '#111827' }}>
                          {index + 1}
                        </td>

                        {/* NGO Name (only name, solid black) */}
                        <td>
                          <strong style={{ color: '#111827', fontSize: '15px' }}>{ngoName}</strong>
                        </td>

                        {/* City (solid black) */}
                        <td>
                          <span className="d-inline-flex align-items-center gap-1" style={{ color: '#111827' }}>
                            <MapPin size={13} color="#111827" />
                            {city}
                          </span>
                        </td>

                        {/* Phone Number (solid black) */}
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#111827' }}>{contactNum}</span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {/* Details Button */}
                            <button
                              type="button"
                              className="btn-admin-outline d-inline-flex align-items-center gap-1"
                              style={{ padding: '5px 11px', fontSize: 'var(--text-sm)', color: '#2563eb', borderColor: '#bfdbfe' }}
                              onClick={() => {
                                setDetailsNgo(ngo);
                              }}
                              title="Show full NGO details"
                            >
                              <Eye size={14} />
                              <span>Details</span>
                            </button>

                            {/* Context Actions */}
                            {ngo.isBlocked ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-admin-outline d-inline-flex align-items-center gap-1"
                                  style={{ padding: '5px 11px', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', borderColor: 'rgba(26, 122, 46, 0.3)' }}
                                  disabled={isProcessing}
                                  onClick={() => handleUnblockNgo(ngo.id, ngoName)}
                                  title="Unblock NGO and return to Pending review"
                                >
                                  <RotateCcw size={14} />
                                  <span>Unblock</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-admin-danger d-inline-flex align-items-center gap-1"
                                  style={{ padding: '5px 11px', fontSize: 'var(--text-sm)' }}
                                  disabled={isProcessing}
                                  onClick={() => setDeleteModalItem({ id: ngo.id, name: ngoName })}
                                  title="Permanently delete NGO from database"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Verify button if not approved */}
                                {!isApproved && (
                                  <button
                                    type="button"
                                    className="btn-admin-primary d-inline-flex align-items-center gap-1"
                                    style={{ padding: '5px 11px', fontSize: 'var(--text-sm)' }}
                                    disabled={isProcessing}
                                    onClick={() => handleVerify(ngo.id, ngoName)}
                                    title="Verify NGO"
                                  >
                                    <CheckCircle2 size={14} />
                                    <span>Verify</span>
                                  </button>
                                )}

                                {/* Move to Pending if approved */}
                                {isApproved && (
                                  <button
                                    type="button"
                                    className="btn-admin-outline d-inline-flex align-items-center gap-1"
                                    style={{ padding: '5px 11px', fontSize: 'var(--text-sm)', color: '#d97706', borderColor: '#fde68a' }}
                                    disabled={isProcessing}
                                    onClick={() => handleSetPending(ngo.id, ngoName)}
                                    title="Move back to Pending"
                                  >
                                    <RotateCcw size={14} />
                                    <span>Pending</span>
                                  </button>
                                )}

                                {/* Decline button only for Pending */}
                                {isPending && (
                                  <button
                                    type="button"
                                    className="btn-admin-outline d-inline-flex align-items-center gap-1"
                                    style={{ padding: '5px 11px', fontSize: 'var(--text-sm)', color: '#b45309', borderColor: '#fde68a' }}
                                    disabled={isProcessing}
                                    onClick={() => {
                                      setDeclineModalItem({ id: ngo.id, name: ngoName });
                                      setDeclineReason('');
                                    }}
                                    title="Decline NGO application"
                                  >
                                    <XCircle size={14} />
                                    <span>Decline</span>
                                  </button>
                                )}

                                {/* Block button */}
                                <button
                                  type="button"
                                  className="btn-admin-outline d-inline-flex align-items-center gap-1"
                                  style={{ padding: '5px 11px', fontSize: 'var(--text-sm)', color: '#b91c1c', borderColor: '#fca5a5' }}
                                  disabled={isProcessing}
                                  onClick={() => {
                                    setBlockingNgo({ id: ngo.id, name: ngoName, phone: contactNum });
                                    setBlockReason('');
                                  }}
                                  title="Block this NGO"
                                >
                                  <Ban size={14} />
                                  <span>Block</span>
                                </button>

                                {/* Delete button */}
                                <button
                                  type="button"
                                  className="btn-admin-danger d-inline-flex align-items-center gap-1"
                                  style={{ padding: '5px 11px', fontSize: 'var(--text-sm)' }}
                                  disabled={isProcessing}
                                  onClick={() => setDeleteModalItem({ id: ngo.id, name: ngoName })}
                                  title="Permanently delete NGO from database"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal: Full NGO Details ("Show More") */}
        {detailsNgo && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '16px',
            }}
            onClick={() => setDetailsNgo(null)}
          >
            <div
              style={{
                maxWidth: '600px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                border: '1px solid var(--color-border)',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h3 className="card-title m-0" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>
                      {detailsNgo.ngoDetails?.ngoName || detailsNgo.name}
                    </h3>
                    {detailsNgo.isBlocked ? (
                      <span className="badge-status rejected" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        Blocked
                      </span>
                    ) : detailsNgo.ngoStatus === 'approved' ? (
                      <span className="badge-status approved" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        Verified
                      </span>
                    ) : detailsNgo.ngoStatus === 'pending' ? (
                      <span className="badge-status pending" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        Pending
                      </span>
                    ) : detailsNgo.ngoStatus === 'rejected' ? (
                      <span className="badge-status rejected" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        Declined
                      </span>
                    ) : null}
                  </div>
                  <div className="text-muted small mt-1">
                    Applied on {formatDate(detailsNgo.createdAt)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailsNgo(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* NGO Structured Information Grid */}
              <div
                className="p-3 rounded mb-3"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)' }}
              >
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="text-muted small d-flex align-items-center gap-1">
                      <User size={13} /> Coordinator Name
                    </div>
                    <div className="fw-semibold mt-1">
                      {detailsNgo.ngoDetails?.coordinatorName || detailsNgo.name || '—'}
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <div className="text-muted small d-flex align-items-center gap-1">
                      <Phone size={13} /> Contact Number
                    </div>
                    <div className="fw-semibold mt-1" style={{ fontFamily: 'monospace' }}>
                      <a href={`tel:${detailsNgo.ngoDetails?.contactNum || detailsNgo.mobile}`} className="phone-link-btn">
                        <Phone size={12} />
                        <span>{detailsNgo.ngoDetails?.contactNum || detailsNgo.mobile || '—'}</span>
                      </a>
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <div className="text-muted small d-flex align-items-center gap-1">
                      <MapPin size={13} /> City
                    </div>
                    <div className="fw-semibold mt-1">
                      {detailsNgo.ngoDetails?.city || detailsNgo.city || '—'}
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <div className="text-muted small d-flex align-items-center gap-1">
                      <MapPin size={13} /> Full Address
                    </div>
                    <div className="fw-semibold mt-1">
                      {detailsNgo.ngoDetails?.address || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Block Details if Blocked */}
              {detailsNgo.isBlocked && (
                <div className="p-3 rounded" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 'var(--text-sm)' }}>
                  <strong>Blocked Reason:</strong> {detailsNgo.blockedReason || 'Policy violation / fake organization'}
                  {detailsNgo.blockedAt && (
                    <div className="small text-muted mt-1">Blocked on {formatDate(detailsNgo.blockedAt)}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Decline NGO Application (with Notes input) */}
        {declineModalItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '16px',
            }}
            onClick={() => !isDeclining && setDeclineModalItem(null)}
          >
            <div
              style={{
                maxWidth: '460px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                border: '1px solid var(--color-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#b45309' }}>
                <XCircle size={22} />
                <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                  Decline NGO Application
                </h3>
              </div>
              <p className="text-muted mb-3" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to decline <strong>&quot;{declineModalItem.name}&quot;</strong>?
              </p>

              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ fontSize: '13px' }} htmlFor="decline-notes-input">
                  Reason for Decline
                </label>
                <textarea
                  id="decline-notes-input"
                  rows={3}
                  className="admin-form-input w-100"
                  placeholder="Reason for decline (optional)..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn-admin-outline"
                  onClick={() => setDeclineModalItem(null)}
                  disabled={isDeclining}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-decline"
                  onClick={confirmDeclineAction}
                  disabled={isDeclining}
                >
                  {isDeclining ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Block NGO */}
        {blockingNgo && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '16px',
            }}
            onClick={() => !isBlocking && setBlockingNgo(null)}
          >
            <div
              style={{
                maxWidth: '480px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                border: '1px solid var(--color-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center gap-2 mb-2" style={{ color: 'var(--color-danger)' }}>
                <Ban size={22} />
                <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                  Block NGO Account
                </h3>
              </div>
              <p className="text-muted mb-3" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to block <strong>&quot;{blockingNgo.name}&quot;</strong>?
              </p>

              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ fontSize: '13px' }} htmlFor="block-reason-input">
                  Reason for Block
                </label>
                <input
                  id="block-reason-input"
                  type="text"
                  className="admin-form-input w-100"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Reason for block (optional)..."
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn-admin-outline"
                  onClick={() => setBlockingNgo(null)}
                  disabled={isBlocking}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-danger d-inline-flex align-items-center gap-1"
                  onClick={confirmBlockNgo}
                  disabled={isBlocking}
                >
                  <Ban size={15} />
                  <span>{isBlocking ? 'Blocking...' : 'Block NGO'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Permanently Delete NGO */}
        {deleteModalItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '16px',
            }}
            onClick={() => !isDeleting && setDeleteModalItem(null)}
          >
            <div
              style={{
                maxWidth: '480px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                border: '1px solid var(--color-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center gap-2 mb-2" style={{ color: 'var(--color-danger)' }}>
                <Trash2 size={24} />
                <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                  Delete NGO
                </h3>
              </div>
              <p className="text-muted mb-4" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>&quot;{deleteModalItem.name}&quot;</strong>?
              </p>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn-admin-outline"
                  onClick={() => setDeleteModalItem(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-danger"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
