import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api/axiosInstance';
import { CITIES } from '../constants/cities';
import { validateMobile, validatePassword } from '../utils/validation';

export default function UserAccounts() {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Edit Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', mobile: '', city: '', newPassword: '' });
  const [mobileError, setMobileError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation Modal State
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users?type=donator');
      setUsers(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load donator accounts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openEditModal(user) {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      mobile: user.mobile || '',
      city: user.city || '',
      newPassword: '',
    });
    setMobileError('');
    setPasswordErrors([]);
  }

  function closeEditModal() {
    setEditingUser(null);
    setEditForm({ name: '', mobile: '', city: '', newPassword: '' });
    setMobileError('');
    setPasswordErrors([]);
  }

  function handleMobileInput(val) {
    setEditForm((prev) => ({ ...prev, mobile: val }));
    if (/[^0-9]/.test(val)) {
      setMobileError('Only digits (0-9) allowed. No characters, spaces, or symbols.');
    } else if (val.length > 0 && val.length !== 10) {
      setMobileError('Mobile number must be exactly 10 digits');
    } else {
      setMobileError('');
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingUser) return;

    // Validate mobile
    const mErr = validateMobile(editForm.mobile);
    if (mErr) {
      setMobileError(mErr);
      return;
    }

    // Validate password if provided
    let pErrors = [];
    if (editForm.newPassword) {
      pErrors = validatePassword(editForm.newPassword);
      if (pErrors.length > 0) {
        setPasswordErrors(pErrors);
        return;
      }
    }

    setIsSaving(true);
    try {
      await api.patch(`/api/admin/users/${editingUser.id}`, {
        name: editForm.name.trim(),
        mobile: editForm.mobile.trim(),
        city: editForm.city.trim(),
        newPassword: editForm.newPassword || undefined,
      });
      toast.success(`Donator details updated for "${editForm.name}"`);
      closeEditModal();
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update donator credentials');
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
      toast.success(`Donator "${deletingUser.name}" has been removed`);
      closeDeleteModal();
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete donator');
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredUsers = (users || []).filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(term) ||
      u.mobile?.toLowerCase().includes(term) ||
      u.city?.toLowerCase().includes(term);

    const matchesCity = !selectedCity || u.city?.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  return (
    <div className="admin-layout">
      <AdminSidebar usersCount={users ? users.length : undefined} />

      <main className="admin-main">
        <div className="admin-breadcrumb-bar">
          <div>
            <h1 className="admin-page-title">Donators</h1>
          </div>
        </div>

        <section className="admin-card-panel">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
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

              {/* City Filter Dropdown */}
              <div style={{ width: '170px' }}>
                <select
                  className="admin-form-input"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
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
              Showing <strong>{filteredUsers.length}</strong> of {users ? users.length : 0} donators
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
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">
                        No matching donator accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
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
                          <span className="d-inline-flex align-items-center gap-1">
                            <MapPin size={13} color="var(--color-text-muted)" />
                            {user.city}
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
                    ))
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
                  Edit Donator Details
                </h3>
              </div>
              <p className="text-muted small mb-4">Editing account for {editingUser.name}</p>

              <form onSubmit={handleSaveEdit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="edit-name">
                    Full Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    className="admin-form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="edit-mobile">
                    Mobile Number
                  </label>
                  <input
                    id="edit-mobile"
                    type="text"
                    className="admin-form-input"
                    value={editForm.mobile}
                    onChange={(e) => handleMobileInput(e.target.value)}
                    placeholder="10-digit mobile number"
                    required
                  />
                  {mobileError && (
                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                      <AlertTriangle size={13} />
                      <span>{mobileError}</span>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="edit-city">
                    City
                  </label>
                  <select
                    id="edit-city"
                    className="admin-form-input"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    required
                  >
                    <option value="">Select City...</option>
                    {Array.from(new Set([...CITIES, editForm.city].filter(Boolean))).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label" htmlFor="edit-new-pass">
                    New Password <span className="text-muted fw-normal">(leave blank to keep current)</span>
                  </label>
                  <input
                    id="edit-new-pass"
                    type="password"
                    className="admin-form-input"
                    placeholder="Enter 6-30 characters (letters, numbers, @)..."
                    value={editForm.newPassword}
                    onChange={(e) => {
                      setEditForm({ ...editForm, newPassword: e.target.value });
                      setPasswordErrors([]);
                    }}
                    onPaste={(e) => e.preventDefault()}
                  />
                  {passwordErrors.length > 0 && (
                    <div className="mt-1 d-flex flex-column gap-1">
                      {passwordErrors.map((err, idx) => (
                        <span key={idx} className="text-danger small d-flex align-items-center gap-1">
                          <AlertTriangle size={12} />
                          {err}
                        </span>
                      ))}
                    </div>
                  )}
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
                  Delete Donator Account
                </h3>
              </div>
              <p className="text-muted mb-4" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to delete donator <strong>"{deletingUser.name}"</strong>? This will remove all their profile data and associated food donation listings. <strong>This action cannot be undone.</strong>
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
