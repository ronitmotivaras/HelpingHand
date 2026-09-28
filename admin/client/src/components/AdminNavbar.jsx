import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminNavbar() {
  const { adminLogout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    adminLogout();
    navigate('/login');
  }

  return (
    <header className="admin-header-bar">
      <div className="d-flex align-items-center justify-content-between">
        <div className="brand-container">
          <div className="brand-logo-icon">🌿</div>
          <div>
            <span className="brand-title">HelpingHand</span>
            <span className="admin-header-badge">Admin Console</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="api-status-badge d-none d-sm-flex">
            <span className="status-dot-pulse"></span>
            <span>Port 5001 • MongoDB Active</span>
          </div>
          <button
            id="admin-logout-btn"
            className="btn-admin-danger btn-sm"
            onClick={handleLogout}
            title="Sign out of Admin Console"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
