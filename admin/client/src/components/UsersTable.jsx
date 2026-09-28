import React, { useState } from 'react';

export default function UsersTable({
  users,
  editId,
  editForm,
  onStartEdit,
  onCancelEdit,
  onEditFormChange,
  onSaveEdit,
  onDeleteUser,
  isSaving,
}) {
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.mobile?.toLowerCase().includes(term) ||
      u.city?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div style={{ maxWidth: '320px', width: '100%' }}>
          <input
            type="text"
            className="admin-form-input"
            placeholder="Search by name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-muted" style={{ fontSize: 'var(--text-small)' }}>
          Showing <strong>{filteredUsers.length}</strong> of {users.length} registered accounts
        </span>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact Phone</th>
              <th>Location</th>
              <th>NGO Verification</th>
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
                const isEditing = editId === user.id;
                const statusClass =
                  user.ngoStatus === 'approved'
                    ? 'approved'
                    : user.ngoStatus === 'pending'
                    ? 'pending'
                    : user.ngoStatus === 'rejected'
                    ? 'rejected'
                    : 'none';

                return (
                  <React.Fragment key={user.id}>
                    <tr>
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
                        <span className={`badge-status ${statusClass}`}>
                          {user.ngoStatus === 'approved' ? '✓ Verified' : user.ngoStatus === 'pending' ? 'Pending' : user.ngoStatus === 'rejected' ? 'Declined' : 'None'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn-admin-outline"
                            onClick={() => onStartEdit(user)}
                          >
                            Edit Credentials
                          </button>
                          <button
                            className="btn-admin-danger"
                            onClick={() => onDeleteUser(user.id, user.name)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isEditing && (
                      <tr>
                        <td colSpan="5" style={{ padding: '0 0 var(--space-4) 0' }}>
                          <div className="admin-edit-box">
                            <h4 className="card-title mb-3" style={{ fontSize: '15px' }}>
                              Edit Credentials for {user.name}
                            </h4>
                            <form onSubmit={onSaveEdit} className="row g-3 align-items-end">
                              <div className="col-md-5">
                                <label className="form-label">
                                  Mobile Number
                                </label>
                                <input
                                  type="text"
                                  className="admin-form-input"
                                  value={editForm.mobile}
                                  onChange={(e) =>
                                    onEditFormChange({ ...editForm, mobile: e.target.value })
                                  }
                                  required
                                />
                              </div>
                              <div className="col-md-5">
                                <label className="form-label">
                                  New Password (leave blank to keep current)
                                </label>
                                <input
                                  type="password"
                                  className="admin-form-input"
                                  placeholder="Enter new password (min. 6 chars)"
                                  value={editForm.newPassword}
                                  onChange={(e) =>
                                    onEditFormChange({ ...editForm, newPassword: e.target.value })
                                  }
                                />
                              </div>
                              <div className="col-md-2 d-flex gap-2">
                                <button
                                  type="submit"
                                  disabled={isSaving}
                                  className="btn-admin-primary w-100 justify-content-center"
                                >
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  className="btn-admin-outline"
                                  onClick={onCancelEdit}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
