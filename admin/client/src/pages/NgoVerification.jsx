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
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api/axiosInstance';
import { CITIES } from '../constants/cities';

export default function NgoVerification() {
  const [ngos, setNgos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [cityFilter, setCityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Reject confirmation modal
  const [confirmReject, setConfirmReject] = useState(null);

  async function loadNgos() {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/ngo-requests');
      setNgos(res.data);
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

  async function handleApprove(id, ngoName) {
    setProcessingId(id);
    try {
      await api.patch(`/api/admin/ngo-requests/${id}/approve`);
      toast.success(`"${ngoName || 'NGO'}" approved as a verified partner`);
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to approve NGO request');
    } finally {
      setProcessingId(null);
    }
  }

  function promptReject(id, ngoName) {
    setConfirmReject({ id, name: ngoName || 'this NGO' });
  }

  async function confirmRejectAction() {
    if (!confirmReject) return;
    const { id, name } = confirmReject;
    setProcessingId(id);
    setConfirmReject(null);
    try {
      await api.patch(`/api/admin/ngo-requests/${id}/reject`);
      toast.success(`Verification status for "${name}" was updated`);
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to update NGO status');
    } finally {
      setProcessingId(null);
    }
  }

  const pendingCount = ngos ? ngos.filter((n) => n.ngoStatus === 'pending').length : 0;

  const filteredNgos = (ngos || []).filter((ngo) => {
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

      return (
        ngoName.includes(term) ||
        coordinator.includes(term) ||
        contact.includes(term) ||
        address.includes(term) ||
        city.includes(term)
      );
    }

    return true;
  });

  return (
    <div className="admin-layout">
      <AdminSidebar pendingCount={pendingCount} />

      <main className="admin-main">
        <div className="admin-breadcrumb-bar">
          <div>
            <h1 className="admin-page-title">Registered NGOs</h1>
          </div>
        </div>

        <section className="admin-card-panel">
          {/* Header Controls: Search, City Dropdown, Count */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
                <Search
                  size={16}
                  color="var(--color-text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="admin-form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="Search by name, phone, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* City Dropdown Filter */}
              <div style={{ width: '170px' }}>
                <select
                  className="admin-form-input"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">All Cities</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <span className="text-muted" style={{ fontSize: 'var(--text-small)', whiteSpace: 'nowrap' }}>
              Showing <strong>{filteredNgos.length}</strong> of {ngos ? ngos.length : 0} NGOs
            </span>
          </div>

          {loading && ngos === null ? (
            <div className="p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="mb-3 p-3 border rounded">
                  <div className="skeleton-box mb-2" style={{ width: '40%', height: '22px' }} />
                  <div className="skeleton-box mb-2" style={{ width: '70%', height: '16px' }} />
                  <div className="skeleton-box" style={{ width: '25%', height: '16px' }} />
                </div>
              ))}
            </div>
          ) : filteredNgos.length === 0 ? (
            <div className="admin-empty-state">
              <div className="empty-icon mb-2">
                <Inbox size={48} color="var(--color-text-muted)" strokeWidth={1.5} />
              </div>
              <p className="fw-semibold mb-1">No matching NGOs found.</p>
              <span className="text-muted small">
                When relief organizations and charities register, they will be listed here.
              </span>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3" style={{ padding: 'var(--space-4) var(--space-5)' }}>
              {filteredNgos.map((ngo) => {
                const isProcessing = processingId === ngo.id;
                const ngoName = ngo.ngoDetails?.ngoName || ngo.ngoDetails?.name || ngo.name || 'Unnamed NGO';
                const city = ngo.ngoDetails?.city || ngo.city || '—';
                const address = ngo.ngoDetails?.address || '—';
                const contactNum = ngo.ngoDetails?.contactNum || ngo.ngoDetails?.contactNumber || ngo.mobile || '—';
                const coordinatorName = ngo.ngoDetails?.coordinatorName || ngo.name || '—';

                const isApproved = ngo.ngoStatus === 'approved';
                const isPending = ngo.ngoStatus === 'pending';
                const isRejected = ngo.ngoStatus === 'rejected';

                const statusClass = isApproved
                  ? 'approved'
                  : isPending
                  ? 'pending'
                  : isRejected
                  ? 'rejected'
                  : 'none';

                return (
                  <div
                    key={ngo.id}
                    className="p-4"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h3
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: 'var(--color-primary)',
                              margin: 0,
                            }}
                          >
                            {ngoName}
                          </h3>
                          <span className={`badge-status ${statusClass} d-inline-flex align-items-center gap-1`}>
                            {isApproved && <BadgeCheck size={14} />}
                            {isPending && <Clock size={14} />}
                            {isRejected && <XCircle size={14} />}
                            <span>
                              {isApproved
                                ? 'Verified NGO'
                                : isPending
                                ? 'Pending Review'
                                : 'Declined'}
                            </span>
                          </span>
                        </div>
                        <div className="text-muted small mt-1">
                          Coordinator: <strong>{coordinatorName}</strong> &bull; Contact: <strong>{contactNum}</strong>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        {isPending && (
                          <>
                            <button
                              className="btn-admin-primary d-inline-flex align-items-center gap-1"
                              disabled={isProcessing}
                              onClick={() => handleApprove(ngo.id, ngoName)}
                            >
                              <CheckCircle2 size={16} strokeWidth={2} />
                              <span>{isProcessing ? 'Processing...' : 'Approve'}</span>
                            </button>
                            <button
                              className="btn-admin-danger d-inline-flex align-items-center gap-1"
                              disabled={isProcessing}
                              onClick={() => promptReject(ngo.id, ngoName)}
                            >
                              <XCircle size={16} strokeWidth={2} />
                              <span>{isProcessing ? 'Processing...' : 'Reject'}</span>
                            </button>
                          </>
                        )}
                        {isApproved && (
                          <button
                            className="btn-admin-danger d-inline-flex align-items-center gap-1"
                            disabled={isProcessing}
                            onClick={() => promptReject(ngo.id, ngoName)}
                            title="Revoke verification status"
                          >
                            <XCircle size={15} />
                            <span>Revoke</span>
                          </button>
                        )}
                        {isRejected && (
                          <button
                            className="btn-admin-primary d-inline-flex align-items-center gap-1"
                            disabled={isProcessing}
                            onClick={() => handleApprove(ngo.id, ngoName)}
                            title="Re-approve NGO"
                          >
                            <CheckCircle2 size={15} />
                            <span>Re-Approve</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="row g-3 pt-2 border-top" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="col-md-3">
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <MapPin size={13} /> City
                        </div>
                        <div className="fw-semibold mt-1">{city}</div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <MapPin size={13} /> Address
                        </div>
                        <div className="fw-semibold mt-1">{address}</div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <Phone size={13} /> Contact Number
                        </div>
                        <div className="fw-semibold mt-1" style={{ fontFamily: 'monospace' }}>
                          {contactNum}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <User size={13} /> Coordinator Name
                        </div>
                        <div className="fw-semibold mt-1">{coordinatorName}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Confirmation Modal for Rejecting NGO */}
        {confirmReject && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: '16px',
            }}
            onClick={() => setConfirmReject(null)}
          >
            <div
              style={{
                maxWidth: '440px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                border: '1px solid var(--color-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center gap-2 mb-2" style={{ color: 'var(--color-danger)' }}>
                <AlertTriangle size={20} />
                <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                  Decline NGO Application
                </h3>
              </div>
              <p className="text-muted mb-4" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to decline the verification application for <strong>"{confirmReject.name}"</strong>? This will update the status of this NGO.
              </p>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn-admin-outline"
                  onClick={() => setConfirmReject(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-danger"
                  onClick={confirmRejectAction}
                >
                  Yes, Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
