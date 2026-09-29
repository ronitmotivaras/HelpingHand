import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminStats from '../components/AdminStats';
import NgoRequestsTable from '../components/NgoRequestsTable';
import api from '../api/axiosInstance';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingNgoId, setProcessingNgoId] = useState(null);

  // Reject confirmation modal
  const [confirmReject, setConfirmReject] = useState(null); // { id, name }

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, ngoRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/ngo-requests'),
      ]);
      setStats(statsRes.data);
      setRequests(ngoRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to load live admin data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApproveNgo(id, ngoName) {
    setProcessingNgoId(id);
    try {
      await api.patch(`/api/admin/ngo-requests/${id}/approve`);
      toast.success(`"${ngoName || 'NGO'}" verified successfully`);
      await loadData();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to approve NGO');
    } finally {
      setProcessingNgoId(null);
    }
  }

  function promptRejectNgo(id, ngoName) {
    setConfirmReject({ id, name: ngoName || 'this NGO' });
  }

  async function confirmRejectAction() {
    if (!confirmReject) return;
    const { id, name } = confirmReject;
    setProcessingNgoId(id);
    setConfirmReject(null);
    try {
      await api.patch(`/api/admin/ngo-requests/${id}/reject`);
      toast.success(`Verification request for "${name}" declined`);
      await loadData();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to decline NGO');
    } finally {
      setProcessingNgoId(null);
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar
        pendingCount={stats?.pendingNgoReviews ?? (requests ? requests.length : undefined)}
        usersCount={stats?.totalUsers}
      />

      <main className="admin-main">
        <div className="admin-breadcrumb-bar">
          <div>
            <h1 className="admin-page-title">System Overview</h1>
          </div>
        </div>

        {/* 3 Stat Cards from real MongoDB stats */}
        <AdminStats stats={stats} loading={loading && stats === null} />

        {/* Pending NGO Verifications */}
        <section className="admin-card-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span>Pending NGO Verifications</span>
              {requests !== null && <span className="count-chip">{requests.length}</span>}
            </h2>
          </div>

          <NgoRequestsTable
            requests={requests}
            onApprove={handleApproveNgo}
            onReject={promptRejectNgo}
            processingId={processingNgoId}
            loading={loading && requests === null}
          />
        </section>

        {/* Confirmation Modal for Rejecting NGO */}
        {confirmReject && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: '16px',
              animation: 'fadeIn 180ms ease',
            }}
            onClick={() => setConfirmReject(null)}
          >
            <div
              style={{
                maxWidth: '440px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                animation: 'slideUp 220ms cubic-bezier(0.34,1.56,0.64,1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-danger-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <AlertTriangle size={22} color="var(--color-danger)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>
                Decline NGO Application
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Are you sure you want to decline the verification request for{' '}
                <strong style={{ color: 'var(--color-text)' }}>&#34;{confirmReject.name}&#34;</strong>?
                This action will notify the applicant.
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
