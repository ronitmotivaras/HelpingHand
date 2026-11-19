import React from 'react';
import { Users, Building2, BadgeCheck, Clock } from 'lucide-react';

export default function AdminStats({ stats, loading }) {
  const isLoading = loading || !stats;

  const cards = [
    {
      label: 'Total Donators',
      value: stats?.totalDonators ?? '—',
      icon: Users,
      iconBg: 'rgba(26,122,46,0.1)',
      iconColor: 'var(--color-primary)',
    },
    {
      label: 'Total NGOs',
      value: stats?.totalNgos ?? '—',
      icon: Building2,
      iconBg: 'rgba(37,99,235,0.1)',
      iconColor: '#2563eb',
    },
    {
      label: 'Verified NGOs',
      value: stats?.verifiedNgoPartners ?? '—',
      icon: BadgeCheck,
      iconBg: 'rgba(22,163,74,0.1)',
      iconColor: 'var(--color-success)',
      valueColor: 'var(--color-success)',
    },
    {
      label: 'Pending NGOs',
      value: stats?.pendingNgoReviews ?? '—',
      icon: Clock,
      iconBg: 'rgba(217,119,6,0.1)',
      iconColor: 'var(--color-warning)',
      valueColor:
        !isLoading && (stats?.pendingNgoReviews ?? 0) > 0
          ? 'var(--color-warning)'
          : 'var(--color-text)',
    },
  ];

  return (
    <div className="admin-stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div className="admin-stat-card" key={card.label}>
            <div className="admin-stat-icon-wrap" style={{ background: card.iconBg }}>
              <Icon size={20} color={card.iconColor} strokeWidth={2} />
            </div>
            <div className="admin-stat-label">{card.label}</div>
            <div className="admin-stat-value" style={{ color: card.valueColor || 'var(--color-text)' }}>
              {isLoading ? (
                <div className="skeleton-box" style={{ width: '64px', height: '36px', marginTop: '4px' }} />
              ) : (
                card.value
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
