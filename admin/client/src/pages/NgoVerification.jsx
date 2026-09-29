import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api/axiosInstance';

export default function NgoVerification() {
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Reject confirmation modal
  const [confirmReject, setConfirmReject] = useState(null);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/ngo-requests');
      setRequests(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load NGO verification requests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleApprove(id, ngoName) {
    setProcessingId(id);
    try {
      await api.patch(`/api/admin/ngo-requests/${id}/approve`);
      toast.success(`"${ngoName || 'NGO'}" approved as a verified partner`);
      await loadRequests();
    } catch (err) {
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
      toast.success(`Verification request for "${name}" was declined`);
      await loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline NGO request');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar pendingCount={requests ? requests.length : undefined} />

      <main className="admin-main">
        <div className="admin-breadcrumb-bar">
          <div>
            <div className="admin-breadcrumb">Admin / NGO Verification</div>
            <h1 className="admin-page-title">
              NGO Verification Requests {requests !== null && `(${requests.length} pending)`}
            </h1>
          </div>


        </div>

        <section className="admin-card-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span>Pending Applications</span>
              {requests !== null && <span className="count-chip">{requests.length}</span>}
            </h2>
          </div>

          {loading && requests === null ? (
            <div className="p-3">
              {[1, 2].map((i) => (
                <div key={i} className="mb-3 p-3 border rounded">
                  <div className="skeleton-box mb-2" style={{ width: '40%', height: '22px' }} />
                  <div className="skeleton-box mb-2" style={{ width: '70%', height: '16px' }} />
                  <div className="skeleton-box" style={{ width: '25%', height: '16px' }} />
                </div>
              ))}
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="admin-empty-state">
              <div className="empty-icon mb-2">
                <Inbox size={48} color="var(--color-text-muted)" strokeWidth={1.5} />
              </div>
              <p className="fw-semibold mb-1">No pending NGO registration requests right now.</p>
              <span className="text-muted small">
                When registered community food relief organizations submit verification requests, they will appear here.
              </span>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {requests.map((req) => {
                const isProcessing = processingId === req.id;
                const ngoName = req.ngoDetails?.ngoName || req.ngoDetails?.name || 'Unnamed NGO';
                const city = req.ngoDetails?.city || req.city || '—';
                const address = req.ngoDetails?.address || '—';
                const contactNum = req.ngoDetails?.contactNum || req.ngoDetails?.contactNumber || req.mobile || '—';
                const coordinatorName = req.ngoDetails?.coordinatorName || req.name || '—';

                return (
                  <div
                    key={req.id}
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
                        <div className="d-flex align-items-center gap-2">
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
                          <span className="badge-status pending">Pending Review</span>
                        </div>
                        <div className="text-muted small mt-1">Coordinator: {coordinatorName} &bull; Contact: {contactNum}</div>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn-admin-primary d-inline-flex align-items-center gap-1"
                          disabled={isProcessing}
                          onClick={() => handleApprove(req.id, ngoName)}
                        >
                          <CheckCircle2 size={16} strokeWidth={2} />
                          <span>{isProcessing ? 'Processing...' : 'Approve'}</span>
                        </button>
                        <button
                          className="btn-admin-danger d-inline-flex align-items-center gap-1"
                          disabled={isProcessing}
                          onClick={() => promptReject(req.id, ngoName)}
                        >
                          <XCircle size={16} strokeWidth={2} />
                          <span>{isProcessing ? 'Processing...' : 'Reject'}</span>
                        </button>
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
                        <div className="fw-semibold mt-1" style={{ fontFamily: 'monospace' }}>{contactNum}</div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <MapPin size={13} /> Coordinator
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
                Are you sure you want to decline the verification application for <strong>"{confirmReject.name}"</strong>? This will notify the applicant and mark the review as declined.
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
                  Yes, Decline Request
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
