import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Leaf, LayoutDashboard, BadgeCheck, Users, LogOut, KeyRound, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar({ pendingCount, usersCount }) {
  const { adminLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    adminLogout();
    navigate('/login');
  }

  const currentPath = location.pathname;

  return (
    <>
      {/* Mobile Top Header (only visible on mobile screens <= 900px) */}
      <header className="admin-mobile-header">
        <div
          className="admin-mobile-brand"
          onClick={() => navigate('/dashboard')}
        >
          <div className="sidebar-brand-icon">
            <Leaf size={18} color="#86EFAC" strokeWidth={2.5} />
          </div>
          <span className="brand-name">HelpingHand</span>
          <span className="brand-tag">Admin</span>
        </div>

        <div className="admin-mobile-actions">
          <button
            type="button"
            className="admin-mobile-logout-btn"
            onClick={handleLogout}
            title="Sign out of Admin Console"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            className="admin-mobile-menu-btn"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Backdrop overlay for mobile menu drawer */}
      {mobileOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (drawer on mobile, fixed column on desktop) */}
      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div>
          <div
            className="admin-sidebar-brand"
            onClick={() => {
              navigate('/dashboard');
              setMobileOpen(false);
            }}
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
                onClick={() => {
                  navigate('/dashboard');
                  setMobileOpen(false);
                }}
              >
                <span className="nav-icon">
                  <LayoutDashboard size={16} strokeWidth={2} />
                </span>
                <span className="nav-label">Dashboard</span>
              </button>
            </li>
            <li>
              <button
                className={`admin-nav-link ${currentPath === '/ngo-list' || currentPath === '/ngo-verification' ? 'active' : ''}`}
                onClick={() => {
                  navigate('/ngo-list');
                  setMobileOpen(false);
                }}
              >
                <span className="nav-icon">
                  <BadgeCheck size={16} strokeWidth={2} />
                </span>
                <span className="nav-label">NGO List</span>
                {typeof pendingCount === 'number' && pendingCount > 0 && (
                  <span className="nav-count-badge">{pendingCount}</span>
                )}
              </button>
            </li>
            <li>
              <button
                className={`admin-nav-link ${currentPath === '/donators' || currentPath === '/user-accounts' ? 'active' : ''}`}
                onClick={() => {
                  navigate('/donators');
                  setMobileOpen(false);
                }}
              >
                <span className="nav-icon">
                  <Users size={16} strokeWidth={2} />
                </span>
                <span className="nav-label">Donators</span>
                {typeof usersCount === 'number' && usersCount > 0 && (
                  <span className="nav-count-badge">{usersCount}</span>
                )}
              </button>
            </li>
            <li>
              <button
                className={`admin-nav-link ${currentPath === '/change-password' ? 'active' : ''}`}
                onClick={() => {
                  navigate('/change-password');
                  setMobileOpen(false);
                }}
              >
                <span className="nav-icon">
                  <KeyRound size={16} strokeWidth={2} />
                </span>
                <span className="nav-label">Change Password</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="admin-sidebar-footer" />
      </aside>

      {/* Fixed top-right logout button for desktop */}
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
