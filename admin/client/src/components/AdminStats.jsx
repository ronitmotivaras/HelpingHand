import React from 'react';
import { Users, Clock, BadgeCheck } from 'lucide-react';

export default function AdminStats({ stats, loading }) {
  const isLoading = loading || !stats;

  const displayTotalDonators = (stats?.totalDonators ?? stats?.totalUsers) ?? '—';
  const displayPendingReviews = stats?.pendingNgoReviews ?? '—';
  const displayVerifiedPartners = stats?.verifiedNgoPartners ?? '—';

  return (
    <div className="admin-stats-grid">
      {/* Total Donators */}
      <div className="admin-stat-card">
        <div
          className="admin-stat-icon-wrap"
          style={{ background: 'rgba(26,122,46,0.1)' }}
        >
          <Users size={20} color="var(--color-primary)" strokeWidth={2} />
        </div>
        <div className="admin-stat-label">Total Donators</div>
        <div className="admin-stat-value">
          {isLoading ? (
            <div className="skeleton-box" style={{ width: '64px', height: '36px', marginTop: '4px' }} />
          ) : (
            displayTotalDonators
          )}
        </div>
      </div>

      {/* Pending NGO Reviews */}
      <div className="admin-stat-card">
        <div
          className="admin-stat-icon-wrap"
          style={{ background: 'rgba(217,119,6,0.1)' }}
        >
          <Clock size={20} color="var(--color-warning)" strokeWidth={2} />
        </div>
        <div className="admin-stat-label">Pending NGO Reviews</div>
        <div
          className="admin-stat-value"
          style={{
            color: !isLoading && displayPendingReviews > 0
              ? 'var(--color-warning)'
              : 'var(--color-text)',
          }}
        >
          {isLoading ? (
            <div className="skeleton-box" style={{ width: '64px', height: '36px', marginTop: '4px' }} />
          ) : (
            displayPendingReviews
          )}
        </div>
      </div>

      {/* Verified NGO Partners */}
      <div className="admin-stat-card">
        <div
          className="admin-stat-icon-wrap"
          style={{ background: 'rgba(22,163,74,0.1)' }}
        >
          <BadgeCheck size={20} color="var(--color-success)" strokeWidth={2} />
        </div>
        <div className="admin-stat-label">Verified NGO Partners</div>
        <div className="admin-stat-value" style={{ color: 'var(--color-success)' }}>
          {isLoading ? (
            <div className="skeleton-box" style={{ width: '64px', height: '36px', marginTop: '4px' }} />
          ) : (
            displayVerifiedPartners
          )}
        </div>
      </div>
    </div>
  );
}
