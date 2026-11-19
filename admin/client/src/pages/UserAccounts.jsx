import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Trash2,
  Search,
  AlertTriangle,
  MapPin,
  Ban,
  RotateCcw,
  Eye,
  X,
  User,
  Phone,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api/axiosInstance';
import { CITIES } from '../constants/cities';

export default function UserAccounts() {
  const [users, setUsers] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [listFilter, setListFilter] = useState('active'); // 'active' | 'blocked'

  // View Details Modal State
  const [detailsUser, setDetailsUser] = useState(null);

  // Block Modal State
  const [blockingUser, setBlockingUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  // Unblock State
  const [isUnblocking, setIsUnblocking] = useState(false);

  // Delete Confirmation Modal State
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/api/admin/users?type=donator&includeBlocked=true'),
        api.get('/api/admin/stats'),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to load donator accounts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openDeleteModal(user) {
    setDeletingUser(user);
  }

  function closeDeleteModal() {
    setDeletingUser(null);
  }

  async function handleConfirmDelete() {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/users/${deletingUser.id}`);
      toast.success(`Donator "${deletingUser.name}" and their data were permanently deleted.`);
      closeDeleteModal();
      if (detailsUser?.id === deletingUser.id) setDetailsUser(null);
      await loadUsers();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to delete donator');
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmBlockUser() {
    if (!blockingUser) return;
    setIsBlocking(true);
    try {
      await api.post(`/api/admin/users/${blockingUser.id}/block`, {
        reason: blockReason.trim() || 'Account blocked by admin',
      });
      toast.success(`Donator "${blockingUser.name}" has been blocked.`);
      setBlockingUser(null);
      if (detailsUser?.id === blockingUser.id) setDetailsUser(null);
      await loadUsers();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to block user');
    } finally {
      setIsBlocking(false);
    }
  }

  async function handleUnblockUser(user) {
    setIsUnblocking(true);
    try {
      await api.post(`/api/admin/users/${user.id}/unblock`);
      toast.success(`Donator "${user.name}" unblocked and account restored.`);
      if (detailsUser?.id === user.id) setDetailsUser(null);
      await loadUsers();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to unblock donator');
    } finally {
      setIsUnblocking(false);
    }
  }

  const activeDonators = (users || []).filter((u) => !u.isBlocked);
  const blockedDonators = (users || []).filter((u) => u.isBlocked);

  const filteredUsers = (users || []).filter((u) => {
    if (listFilter === 'active' && u.isBlocked) return false;
    if (listFilter === 'blocked' && !u.isBlocked) return false;

    const term = search.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(term) ||
      u.mobile?.toLowerCase().includes(term) ||
      u.city?.toLowerCase().includes(term) ||
      u.blockedReason?.toLowerCase().includes(term);

    const matchesCity = !selectedCity || u.city?.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-breadcrumb-bar">
          <div>
            <h1 className="admin-page-title">Donators</h1>
          </div>
        </div>

        <section className="admin-card-panel">
          {/* Top Filter Tabs: Active Donators / Blocked */}
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
                className={`btn-admin-outline ${listFilter === 'active' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => setListFilter('active')}
              >
                Donators
              </button>

              <button
                type="button"
                className={`btn-admin-outline ${listFilter === 'blocked' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => setListFilter('blocked')}
                title="Blocked Donator Accounts"
              >
                <Ban size={14} className="me-1" />
                <span>Blocked</span>
              </button>
            </div>

            {/* Showing Count at top right */}
            <span className="text-muted" style={{ fontSize: 'var(--text-small)', whiteSpace: 'nowrap' }}>
              Showing <strong>{filteredUsers.length}</strong> of{' '}
              {listFilter === 'active' ? activeDonators.length : blockedDonators.length} donators
            </span>
          </div>

          {/* Search & City Filter Bar */}
          <div
            className="d-flex justify-content-between align-items-center flex-wrap gap-3"
            style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}
          >
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

              {/* City Filter Dropdown with visible arrow */}
              <div style={{ position: 'relative', width: '170px' }}>
                <select
                  className="admin-form-input"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
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

          {loading && users === null ? (
            <div className="p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="d-flex gap-3 align-items-center mb-3 p-3 border rounded">
                  <div className="skeleton-box" style={{ width: '30%', height: '20px' }} />
                  <div className="skeleton-box" style={{ width: '25%', height: '20px' }} />
                  <div className="skeleton-box" style={{ width: '20%', height: '20px' }} />
                  <div className="skeleton-box" style={{ width: '15%', height: '20px' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th>Donator Name</th>
                    <th>City</th>
                    <th>Phone Number</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        {listFilter === 'blocked'
                          ? 'No blocked donator accounts found.'
                          : 'No matching donator accounts found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id}>
                        {/* Index Number */}
                        <td className="fw-bold" style={{ fontFamily: 'monospace', color: '#111827' }}>
                          {index + 1}
                        </td>

                        {/* Donator Name (solid black) */}
                        <td>
                          <strong style={{ fontSize: '15px', color: '#111827' }}>{user.name}</strong>
                        </td>

                        {/* City (solid black) */}
                        <td>
                          <span className="d-inline-flex align-items-center gap-1" style={{ color: '#111827' }}>
                            <MapPin size={13} color="#111827" />
                            {user.city}
                          </span>
                        </td>

                        {/* Phone Number (solid black) */}
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#111827' }}>{user.mobile}</span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            {/* View Details Button */}
                            <button
                              type="button"
                              className="btn-admin-outline d-inline-flex align-items-center gap-1"
                              style={{ padding: '5px 11px', fontSize: 'var(--text-sm)', color: '#2563eb', borderColor: '#bfdbfe' }}
                              onClick={() => setDetailsUser(user)}
                              title="View donator details"
                            >
                              <Eye size={14} />
                              <span>Details</span>
                            </button>

                            {/* Block or Unblock Button */}
                            {user.isBlocked ? (
                              <button
                                type="button"
                                className="btn-admin-outline d-inline-flex align-items-center gap-1"
                                style={{
                                  padding: '5px 11px',
                                  fontSize: 'var(--text-sm)',
                                  color: 'var(--color-primary)',
                                  borderColor: 'rgba(26, 122, 46, 0.3)',
                                }}
                                disabled={isUnblocking}
                                onClick={() => handleUnblockUser(user)}
                                title="Unblock donator and restore account access"
                              >
                                <RotateCcw size={14} />
                                <span>Unblock</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-admin-outline d-inline-flex align-items-center gap-1"
                                style={{
                                  padding: '5px 11px',
                                  fontSize: 'var(--text-sm)',
                                  color: '#b91c1c',
                                  borderColor: '#fca5a5',
                                }}
                                onClick={() => {
                                  setBlockingUser(user);
                                  setBlockReason('');
                                }}
                                title="Block this donor account"
                              >
                                <Ban size={14} />
                                <span>Block</span>
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              type="button"
                              className="btn-admin-danger d-inline-flex align-items-center gap-1"
                              style={{ padding: '5px 11px', fontSize: 'var(--text-sm)' }}
                              onClick={() => openDeleteModal(user)}
                              title="Permanently delete user and data from database"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* View Details Modal */}
        {detailsUser && (
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
            onClick={() => setDetailsUser(null)}
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
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <User size={20} color="var(--color-primary)" />
                  <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                    Donator Account Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsUser(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="d-flex flex-column gap-3 mb-4">
                <div className="p-3 rounded" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)' }}>
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="text-muted small">Full Name</div>
                      <div className="fw-semibold">{detailsUser.name}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Mobile Number</div>
                      <div className="fw-semibold font-monospace">{detailsUser.mobile}</div>
                    </div>
                    <div className="col-6 mt-2">
                      <div className="text-muted small">City</div>
                      <div className="fw-semibold">{detailsUser.city || '—'}</div>
                    </div>
                    <div className="col-6 mt-2">
                      <div className="text-muted small">Registered Date</div>
                      <div className="small">
                        {detailsUser.createdAt
                          ? new Date(detailsUser.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                          : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* If Blocked: show blocked reason and blockedAt */}
                {detailsUser.isBlocked && (
                  <div
                    className="p-3 rounded"
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', fontSize: 'var(--text-sm)', color: '#991b1b' }}
                  >
                    <div className="d-flex align-items-center gap-1 fw-semibold mb-1">
                      <ShieldAlert size={15} />
                      <span>Block Details</span>
                    </div>
                    <div>
                      <strong>Reason:</strong> {detailsUser.blockedReason || 'Policy violation / spam activity'}
                    </div>
                    {detailsUser.blockedAt && (
                      <div className="small text-muted mt-1">
                        Blocked on {new Date(detailsUser.blockedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal - Pure delete */}
        {deletingUser && (
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
            onClick={closeDeleteModal}
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
                  Delete Donator Account
                </h3>
              </div>
              <p className="text-muted mb-3" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to delete donator <strong>&quot;{deletingUser.name}&quot;</strong>?
              </p>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn-admin-outline" onClick={closeDeleteModal} disabled={isDeleting}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-danger"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Block Donator Confirmation Modal */}
        {blockingUser && (
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
            onClick={() => !isBlocking && setBlockingUser(null)}
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
              <div className="d-flex align-items-center gap-2 mb-2" style={{ color: 'var(--color-danger)' }}>
                <Ban size={22} />
                <h3 className="card-title m-0" style={{ fontSize: '18px', color: 'var(--color-danger)' }}>
                  Block Donor Account
                </h3>
              </div>

              <p className="text-muted mb-3" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to block <strong>&quot;{blockingUser.name}&quot;</strong> ({blockingUser.mobile})?
              </p>

              <div className="mb-4">
                <label className="form-label" htmlFor="block-reason" style={{ fontSize: '13px', fontWeight: 600 }}>
                  Reason for blocking (Admin note)
                </label>
                <input
                  id="block-reason"
                  type="text"
                  className="admin-form-input"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Reason for block (optional)..."
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn-admin-outline"
                  onClick={() => setBlockingUser(null)}
                  disabled={isBlocking}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-danger d-inline-flex align-items-center gap-1"
                  onClick={confirmBlockUser}
                  disabled={isBlocking}
                >
                  <Ban size={15} />
                  <span>{isBlocking ? 'Blocking...' : 'Block Account'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
