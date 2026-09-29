import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, UserCircle, Plus, BadgeCheck, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const isNgo = Boolean(user?.ngoStatus && user.ngoStatus !== 'none');
  const isApprovedNgo = user?.ngoStatus === 'approved';

  return (
    <header className="hh-navbar">
      <div className="container d-flex align-items-center justify-content-between">
        <Link to="/" className="hh-brand d-flex align-items-center gap-2">
          <Leaf size={22} strokeWidth={2.5} color="var(--color-primary)" />
          <span>HelpingHand</span>
          {isApprovedNgo ? (
            <span
              className="badge-status approved d-none d-sm-inline-flex align-items-center gap-1"
              style={{ fontSize: '11px', padding: '2px 8px' }}
            >
              <BadgeCheck size={12} />
              <span>NGO Partner</span>
            </span>
          ) : isNgo ? (
            <span
              className="badge-status pending d-none d-sm-inline-flex align-items-center gap-1"
              style={{ fontSize: '11px', padding: '2px 8px' }}
            >
              <Clock size={12} />
              <span>NGO Pending</span>
            </span>
          ) : (
            <span
              className="badge-status d-none d-sm-inline-flex align-items-center gap-1"
              style={{
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                fontSize: '11px',
                padding: '2px 8px',
              }}
            >
              <span>Donor</span>
            </span>
          )}
        </Link>

        <div className="hh-nav-links d-flex align-items-center gap-2">
          {!isNgo && (
            <Link
              to="/donate"
              className="btn-hh-primary d-inline-flex align-items-center gap-1"
              style={{ padding: '6px 14px', fontSize: 'var(--text-small)' }}
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Donate</span>
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
