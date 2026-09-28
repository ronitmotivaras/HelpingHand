import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Leaf, LayoutDashboard, BadgeCheck, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar({ pendingCount, usersCount }) {
  const { adminLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    adminLogout();
    navigate('/login');
  }

  const currentPath = location.pathname;

  return (
    <>
      <aside className="admin-sidebar">
        {/* Brand */}
        <div>
          <div
            className="admin-sidebar-brand"
            onClick={() => navigate('/dashboard')}
          >
            <div className="sidebar-brand-icon">
              <Leaf size={20} color="#86EFAC" strokeWidth={2.5} />
            </div>
            <div>
              <div className="brand-name">HelpingHand</div>
              <span className="brand-tag">Admin</span>
            </div>
          </div>

          <div className="sidebar-section-label">Navigation</div>

          <ul className="admin-nav">
            <li>
              <button
                className={`admin-nav-link ${currentPath === '/dashboard' || currentPath === '/' ? 'active' : ''}`}
                onClick={() => navigate('/dashboard')}
              >
                <span className="nav-icon">
                  <LayoutDashboard size={16} strokeWidth={2} />
                </span>
                <span className="nav-label">Dashboard</span>
              </button>
            </li>
            <li>
              <button
                className={`admin-nav-link ${currentPath === '/ngo-verification' ? 'active' : ''}`}
                onClick={() => navigate('/ngo-verification')}
              >
                <span className="nav-icon">
                  <BadgeCheck size={16} strokeWidth={2} />
                </span>
                <span className="nav-label">NGO Verification</span>
                {typeof pendingCount === 'number' && pendingCount > 0 && (
                  <span className="nav-count-badge">{pendingCount}</span>
                )}
              </button>
            </li>
            <li>
              <button
                className={`admin-nav-link ${currentPath === '/user-accounts' ? 'active' : ''}`}
                onClick={() => navigate('/user-accounts')}
              >
                <span className="nav-icon">
                  <Users size={16} strokeWidth={2} />
                </span>
                <span className="nav-label">User Accounts</span>
                {typeof usersCount === 'number' && usersCount > 0 && (
                  <span className="nav-count-badge">{usersCount}</span>
                )}
              </button>
            </li>
          </ul>
        </div>

        <div className="admin-sidebar-footer" />
      </aside>

      {/* Fixed top-right logout button */}
      <button
        id="admin-logout-btn"
        className="btn-topright-logout"
        onClick={handleLogout}
        title="Sign out of Admin Console"
      >
        <LogOut size={15} strokeWidth={2} />
        <span>Sign Out</span>
      </button>
    </>
  );
}
