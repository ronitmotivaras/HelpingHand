import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  BadgeCheck,
  Clock,
  XCircle,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api/axiosInstance';

export default function UserAccounts() {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ mobile: '', newPassword: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation Modal State
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openEditModal(user) {
    setEditingUser(user);
    setEditForm({ mobile: user.mobile, newPassword: '' });
  }

  function closeEditModal() {
    setEditingUser(null);
    setEditForm({ mobile: '', newPassword: '' });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);
    try {
      await api.patch(`/api/admin/users/${editingUser.id}`, {
        mobile: editForm.mobile,
        newPassword: editForm.newPassword || undefined,
      });
      toast.success(`Credentials updated for "${editingUser.name}"`);
      closeEditModal();
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user credentials');
    } finally {
      setIsSaving(false);
    }
  }

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
      toast.success(`User "${deletingUser.name}" has been removed`);
      closeDeleteModal();
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredUsers = (users || []).filter((u) => {
    const term = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.mobile?.toLowerCase().includes(term) ||
      u.city?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="admin-layout">
      <AdminSidebar usersCount={users ? users.length : undefined} />

      <main className="admin-main">
        <div className="admin-breadcrumb-bar">
          <div>
            <div className="admin-breadcrumb">Admin / User Accounts</div>
            <h1 className="admin-page-title">
              User Accounts {users !== null && `(${users.length} total)`}
            </h1>
          </div>


        </div>

        <section className="admin-card-panel">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div style={{ maxWidth: '340px', width: '100%', position: 'relative' }}>
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
            <span className="text-muted" style={{ fontSize: 'var(--text-small)' }}>
              Showing <strong>{filteredUsers.length}</strong> of {users ? users.length : 0} registered accounts
            </span>
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
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>City</th>
                    <th>NGO Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No matching user accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isApproved = user.ngoStatus === 'approved';
                      const isPending = user.ngoStatus === 'pending';
                      const isRejected = user.ngoStatus === 'rejected';

                      const statusClass = isApproved
                        ? 'approved'
                        : isPending
                        ? 'pending'
                        : isRejected
                        ? 'rejected'
                        : 'none';

                      return (
                        <tr key={user.id}>
                          <td>
                            <strong>{user.name}</strong>
                            <div className="text-muted small">
                              Joined {new Date(user.createdAt || Date.now()).toLocaleDateString([], { dateStyle: 'medium' })}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{user.mobile}</span>
                          </td>
                          <td>
                            <span>{user.city}</span>
                          </td>
                          <td>
                            <span className={`badge-status ${statusClass} d-inline-flex align-items-center gap-1`}>
                              {isApproved && <BadgeCheck size={14} />}
                              {isPending && <Clock size={14} />}
                              {isRejected && <XCircle size={14} />}
                              <span>
                                {isApproved
                                  ? 'Verified NGO'
                                  : isPending
                                  ? 'Pending'
                                  : isRejected
                                  ? 'Declined'
                                  : 'Individual'}
                              </span>
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                className="btn-admin-outline d-inline-flex align-items-center gap-1"
                                onClick={() => openEditModal(user)}
                              >
                                <Pencil size={14} />
                                <span>Edit</span>
                              </button>
                              <button
                                className="btn-admin-danger d-inline-flex align-items-center gap-1"
                                onClick={() => openDeleteModal(user)}
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Edit User Modal */}
        {editingUser && (
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
            onClick={closeEditModal}
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
              <div className="d-flex align-items-center gap-2 mb-1">
                <Pencil size={18} color="var(--color-primary)" />
                <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                  Edit Credentials
                </h3>
              </div>
              <p className="text-muted small mb-4">Editing account for {editingUser.name}</p>

              <form onSubmit={handleSaveEdit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="edit-mobile">
                    Mobile Number
                  </label>
                  <input
                    id="edit-mobile"
                    type="text"
                    className="admin-form-input"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" htmlFor="edit-new-pass">
                    New Password <span className="text-muted fw-normal">(leave blank to keep current)</span>
                  </label>
                  <input
                    id="edit-new-pass"
                    type="password"
                    className="admin-form-input"
                    placeholder="Enter min. 6 characters..."
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    onPaste={(e) => e.preventDefault()}
                  />
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn-admin-outline" onClick={closeEditModal} disabled={isSaving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-admin-primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
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
                  Delete User Account
                </h3>
              </div>
              <p className="text-muted mb-4" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to delete user <strong>"{deletingUser.name}"</strong>? This will remove all their profile data and associated food donation listings. <strong>This action cannot be undone.</strong>
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
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
