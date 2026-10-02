import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, UserCircle, BadgeCheck, Clock, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

export default function Navbar() {
  const { user } = useAuth();
  const isNgo = Boolean(user?.ngoStatus && user.ngoStatus !== 'none');
  const isApprovedNgo = user?.ngoStatus === 'approved';
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        if (isMounted) {
          setUnreadCount(res.data?.unreadCount || 0);
        }
      } catch (err) {
        // Silently ignore polling errors
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 45000); // Poll every 45s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, location.pathname]);

  return (
    <header className="hh-navbar">
      <div className="container d-flex align-items-center justify-content-between">
        <Link to="/" className="hh-brand d-flex align-items-center gap-2">
          <Leaf size={22} strokeWidth={2.5} color="var(--color-primary)" />
          <span>HelpingHand</span>
        </Link>

        <div className="hh-nav-links d-flex align-items-center gap-2">
          {user && (
            <Link
              to="/notifications"
              className="position-relative d-inline-flex align-items-center justify-content-center text-decoration-none"
              title="Notifications"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: location.pathname === '/notifications' ? 'var(--color-primary-light, #e8f5e9)' : 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border, #e2e8f0)',
                color: unreadCount > 0 || location.pathname === '/notifications' ? 'var(--color-primary)' : 'var(--color-text-secondary, #64748b)',
                transition: 'all 0.2s ease',
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '700',
                    borderRadius: '10px',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          <Link to="/profile" className="hh-profile-btn d-inline-flex align-items-center gap-1">
            <UserCircle size={17} />
            <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
