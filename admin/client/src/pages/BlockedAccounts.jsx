import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Ban,
  RotateCcw,
  Trash2,
  Search,
  AlertTriangle,
  MapPin,
  Calendar,
  Building2,
  User,
  ShieldAlert,
  Phone,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api/axiosInstance';

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BlockedAccounts() {
  const [blockedUsers, setBlockedUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'donator' | 'ngo'
  const [stats, setStats] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Unblock Modal State
  const [unblockingUser, setUnblockingUser] = useState(null);
  const [isUnblocking, setIsUnblocking] = useState(false);

  // Delete Modal State
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [blockedRes, statsRes] = await Promise.all([
        api.get(`/api/admin/blocked?type=${typeFilter}&search=${encodeURIComponent(search)}`),
        api.get('/api/admin/stats'),
      ]);
      setBlockedUsers(blockedRes.data);
      setStats(statsRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to load blocked accounts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Unblock Action: Unblocking an NGO sets it back to Pending, unblocking a donor restores the account
  async function confirmUnblock() {
    if (!unblockingUser) return;
    setIsUnblocking(true);
    setProcessingId(unblockingUser.id);
    try {
      await api.post(`/api/admin/users/${unblockingUser.id}/unblock`);
      const isNgo = unblockingUser.accountType === 'NGO';
      toast.success(
        isNgo
          ? `NGO "${unblockingUser.name}" unblocked and returned to Pending verification.`
          : `Donor "${unblockingUser.name}" unblocked and account restored.`
      );
      setUnblockingUser(null);
      await loadData();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to unblock account');
    } finally {
      setIsUnblocking(false);
      setProcessingId(null);
    }
  }

  // Delete All Data Action: Permanently deletes user, food listings, and pickup requests
  async function confirmDeleteAll() {
    if (!deletingUser) return;
    setIsDeleting(true);
    setProcessingId(deletingUser.id);
    try {
      await api.delete(`/api/admin/users/${deletingUser.id}?blockPhone=true`);
      toast.success(`All data for "${deletingUser.name}" permanently deleted.`);
      setDeletingUser(null);
      await loadData();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to delete account data');
    } finally {
      setIsDeleting(false);
      setProcessingId(null);
    }
  }

  const usersList = blockedUsers || [];

  return (
    <div className="admin-layout">
      <AdminSidebar
        pendingCount={stats?.pendingNgoReviews}
        usersCount={stats?.totalDonators}
        blockedCount={stats?.totalBlocked}
      />

      <main className="admin-main">
        {/* Header */}
        <div className="admin-breadcrumb-bar">
          <div>
            <h1 className="admin-page-title">Blocked Accounts</h1>
          </div>
        </div>

        {/* Panel Section */}
        <section className="admin-card-panel">
          {/* Top Filter Bar: All / Donors Only / NGOs Only */}
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
                className={`btn-admin-outline ${typeFilter === 'all' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => setTypeFilter('all')}
              >
                All Accounts ({stats?.totalBlocked ?? usersList.length})
              </button>
              <button
                type="button"
                className={`btn-admin-outline ${typeFilter === 'donator' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => setTypeFilter('donator')}
              >
                Donors Only
              </button>
              <button
                type="button"
                className={`btn-admin-outline ${typeFilter === 'ngo' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => setTypeFilter('ngo')}
              >
                NGOs Only
              </button>
            </div>

            <span
              className="badge"
              style={{
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger-border)',
                fontWeight: 700,
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '12px',
              }}
            >
              {stats?.totalBlocked ?? usersList.length} Blocked
            </span>
          </div>

          {/* Search Bar matching other admin pages */}
          <div
            className="d-flex justify-content-between align-items-center flex-wrap gap-3"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
                <Search
                  size={16}
                  color="var(--color-text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="admin-form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="Search by name, organization, phone, note..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <span className="text-muted" style={{ fontSize: 'var(--text-small)', whiteSpace: 'nowrap' }}>
              Showing <strong>{usersList.length}</strong> of {stats?.totalBlocked ?? usersList.length} blocked accounts
            </span>
          </div>
          {loading ? (
            <div className="p-5 text-center">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading blocked accounts...</span>
              </div>
              <p className="mt-2 text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                Loading blocked accounts list...
              </p>
            </div>
          ) : usersList.length === 0 ? (
            <div className="empty-state p-5 text-center">
              <div className="empty-icon mb-3">
                <Ban size={48} color="var(--color-text-muted)" strokeWidth={1.5} />
              </div>
              <h3 className="section-title mb-1">No Blocked Accounts</h3>
              <p className="text-muted small mb-0">
                {search
                  ? `No blocked accounts match "${search}".`
                  : 'There are currently no blocked users or organizations on the platform.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>Type</th>
                    <th>Name / Organization</th>
                    <th>Phone Number</th>
                    <th>Date Blocked</th>
                    <th>Admin Reason / Note</th>
                    <th style={{ textAlign: 'right', minWidth: '220px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => {
                    const isNgo = user.accountType === 'NGO';
                    const isBusy = processingId === user.id;

                    return (
                      <tr key={user.id}>
                        {/* Type Column */}
                        <td>
                          {isNgo ? (
                            <span
                              className="d-inline-flex align-items-center gap-1"
                              style={{
                                background: '#f5f3ff',
                                color: '#7c3aed',
                                border: '1px solid #ddd6fe',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              <Building2 size={12} />
                              <span>NGO</span>
                            </span>
                          ) : (
                            <span
                              className="d-inline-flex align-items-center gap-1"
                              style={{
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              <User size={12} />
                              <span>Donor</span>
                            </span>
                          )}
                        </td>

                        {/* Name Column */}
                        <td>
                          <div>
                            <strong style={{ fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>
                              {isNgo ? (user.ngoDetails?.ngoName || user.name) : user.name}
                            </strong>
                            {isNgo && user.ngoDetails?.ngoName && user.name !== user.ngoDetails.ngoName && (
                              <div className="text-muted small">
                                Contact: {user.name}
                              </div>
                            )}
                            {user.city && (
                              <div className="text-muted small d-inline-flex align-items-center gap-1 mt-1">
                                <MapPin size={11} />
                                <span>{user.city}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Phone Column */}
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px' }}>
                              {user.mobile}
                            </span>
                            <span
                              className="badge"
                              style={{
                                fontSize: '10px',
                                background: 'var(--color-danger-bg)',
                                color: 'var(--color-danger)',
                                padding: '1px 5px',
                              }}
                              title="Registration blocked"
                            >
                              Locked
                            </span>
                          </div>
                          {user.ngoDetails?.coordinatorPhone && user.ngoDetails.coordinatorPhone !== user.mobile && (
                            <div className="text-muted small font-monospace">
                              Coord: {user.ngoDetails.coordinatorPhone}
                            </div>
                          )}
                        </td>

                        {/* Date Blocked Column */}
                        <td>
                          <div style={{ fontSize: 'var(--text-sm)' }}>
                            {formatDate(user.blockedAt || user.createdAt)}
                          </div>
                        </td>

                        {/* Admin Reason / Note Column */}
                        <td>
                          <div
                            style={{
                              fontSize: 'var(--text-sm)',
                              color: user.blockedReason ? '#b91c1c' : 'var(--color-text-secondary)',
                              fontWeight: user.blockedReason ? 600 : 400,
                              maxWidth: '280px',
                            }}
                          >
                            {user.blockedReason || (user.adminNotes?.[0]?.note ?? 'No reason specified')}
                          </div>
                          {user.adminNotes && user.adminNotes.length > 0 && user.adminNotes[0].note !== user.blockedReason && (
                            <div className="text-muted small mt-1" style={{ fontSize: '11px' }}>
                              Note: {user.adminNotes[0].note}
                            </div>
                          )}
                        </td>

                        {/* Actions Column: Unblock & Delete all data */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="d-inline-flex gap-2">
                            {/* Unblock */}
                            <button
                              type="button"
                              className="btn-admin-outline d-inline-flex align-items-center gap-1"
                              style={{
                                color: 'var(--color-primary)',
                                borderColor: 'rgba(26, 122, 46, 0.3)',
                                fontSize: 'var(--text-sm)',
                                padding: '5px 12px',
                              }}
                              disabled={isBusy}
                              onClick={() => setUnblockingUser(user)}
                              title={
                                isNgo
                                  ? 'Unblock NGO and return to Pending verification status'
                                  : 'Unblock donor and restore full account access'
                              }
                            >
                              <RotateCcw size={14} />
                              <span>Unblock</span>
                            </button>

                            {/* Delete all data */}
                            <button
                              type="button"
                              className="btn-admin-danger d-inline-flex align-items-center gap-1"
                              style={{ fontSize: 'var(--text-sm)', padding: '5px 12px' }}
                              disabled={isBusy}
                              onClick={() => setDeletingUser(user)}
                              title="Permanently delete user, food listings, and pickup requests"
                            >
                              <Trash2 size={14} />
                              <span>Delete all data</span>
                            </button>
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

        {/* Modal 1: Unblock Confirmation Modal */}
        {unblockingUser && (
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
            onClick={() => !isUnblocking && setUnblockingUser(null)}
          >
            <div
              className="admin-edit-box"
              style={{
                maxWidth: '480px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <RotateCcw size={20} color="var(--color-primary)" />
                <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                  Unblock Account
                </h3>
              </div>

              <p className="text-muted mb-3" style={{ fontSize: 'var(--text-sm)' }}>
                Are you sure you want to unblock{' '}
                <strong>
                  {unblockingUser.accountType === 'NGO'
                    ? (unblockingUser.ngoDetails?.ngoName || unblockingUser.name)
                    : unblockingUser.name}
                </strong>{' '}
                ({unblockingUser.mobile})?
              </p>

              <div
                className="p-3 rounded mb-4"
                style={{
                  background: 'var(--color-primary-light, #e8f5e9)',
                  border: '1px solid rgba(26, 122, 46, 0.25)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {unblockingUser.accountType === 'NGO' ? (
                  <div>
                    <strong>NGO Unblock Policy:</strong> Unblocking this organization will set its verification status to{' '}
                    <span className="badge-status pending" style={{ fontSize: '11px', padding: '1px 6px' }}>
                      Pending
                    </span>
                    . It can browse listings but will require admin verification before requesting pickups again.
                  </div>
                ) : (
                  <div>
                    <strong>Donor Unblock Policy:</strong> Unblocking this account will fully restore login access and allow the donor to create new food listings.
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn-admin-outline"
                  disabled={isUnblocking}
                  onClick={() => setUnblockingUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-primary d-inline-flex align-items-center gap-1"
                  disabled={isUnblocking}
                  onClick={confirmUnblock}
                >
                  <RotateCcw size={15} />
                  <span>{isUnblocking ? 'Unblocking...' : 'Confirm Unblock'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Delete All Data Confirmation Modal */}
        {deletingUser && (
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
            onClick={() => !isDeleting && setDeletingUser(null)}
          >
            <div
              className="admin-edit-box"
              style={{
                maxWidth: '480px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <AlertTriangle size={22} color="var(--color-danger)" />
                <h3 className="card-title m-0" style={{ fontSize: '18px', color: 'var(--color-danger)' }}>
                  Delete All Data Permanently
                </h3>
              </div>

              <p className="text-muted mb-3" style={{ fontSize: 'var(--text-sm)' }}>
                This is an irreversible action. You are about to permanently delete:
              </p>

              <div
                className="p-3 rounded mb-3"
                style={{
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  fontSize: 'var(--text-sm)',
                  color: '#991b1b',
                }}
              >
                <ul className="mb-0 ps-3">
                  <li>User account ({deletingUser.name} &bull; {deletingUser.mobile})</li>
                  <li>All surplus food listings created by this account</li>
                  <li>All pickup requests created by or directed to this account</li>
                  <li>The phone number remains locked on the blocklist to prevent re-registration</li>
                </ul>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn-admin-outline"
                  disabled={isDeleting}
                  onClick={() => setDeletingUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-danger d-inline-flex align-items-center gap-1"
                  disabled={isDeleting}
                  onClick={confirmDeleteAll}
                >
                  <Trash2 size={15} />
                  <span>{isDeleting ? 'Deleting data...' : 'Delete All Data'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
