import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell,
  CheckCheck,
  Package,
  Calendar,
  Clock,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Inbox,
  Flame,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';

function formatNotificationTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type) {
  switch (type) {
    case 'request_received':
      return <Package size={18} color="#2563eb" />;
    case 'request_accepted':
      return <CheckCircle2 size={18} color="#16a34a" />;
    case 'request_declined':
    case 'request_closed':
    case 'request_cancelled':
      return <XCircle size={18} color="#dc2626" />;
    case 'listing_released':
      return <Package size={18} color="#d97706" />;
    case 'listing_expired':
      return <Flame size={18} color="#dc2626" />;
    case 'status_changed':
      return <ShieldCheck size={18} color="#16a34a" />;
    default:
      return <Bell size={18} color="var(--color-primary)" />;
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();

  async function loadNotifications() {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleClickNotification(notification) {
    if (!notification.isRead) {
      try {
        await api.patch(`/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        // Continue navigation regardless
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ maxWidth: '720px', paddingBottom: '96px' }}>
        {/* Back and Page Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <Link
            to="/"
            className="d-inline-flex align-items-center gap-2 text-decoration-none"
            style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>

          {unreadCount > 0 && (
            <button
              type="button"
              className="btn-hh-secondary d-inline-flex align-items-center gap-1"
              style={{ padding: '6px 14px', fontSize: 'var(--text-small)' }}
              disabled={markingAll}
              onClick={handleMarkAllRead}
            >
              <CheckCheck size={16} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <h1 className="display-title mb-0" style={{ fontSize: 'var(--text-2xl)' }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span
                style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="d-flex flex-column gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="hh-card p-3 d-flex gap-3 align-items-center">
                <div className="skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton-box mb-2" style={{ width: '60%', height: '16px' }} />
                  <div className="skeleton-box" style={{ width: '30%', height: '12px' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && notifications.length === 0 && (
          <div className="hh-card text-center py-5">
            <div className="mb-3">
              <Inbox size={56} color="var(--color-text-muted)" strokeWidth={1.5} />
            </div>
            <h3 className="section-title mb-1">No notifications yet</h3>
            <p className="food-card-meta mb-0">
              When donors post updates or NGOs request food pickups, you will receive timely notifications here.
            </p>
          </div>
        )}

        {/* Notifications list */}
        {!loading && notifications.length > 0 && (
          <div className="d-flex flex-column gap-2">
            {notifications.map((notif) => {
              const isUnread = !notif.isRead;
              return (
                <div
                  key={notif._id}
                  onClick={() => handleClickNotification(notif)}
                  className="p-3 rounded d-flex align-items-start gap-3"
                  style={{
                    background: isUnread ? '#f0fdf4' : 'var(--color-surface)',
                    border: `1px solid ${isUnread ? '#bbf7d0' : 'var(--color-border)'}`,
                    cursor: notif.link ? 'pointer' : 'default',
                    transition: 'all var(--transition)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                    if (!isUnread) e.currentTarget.style.borderColor = 'var(--color-border-focus)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    if (!isUnread) e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                >
                  {/* Unread indicator dot */}
                  {isUnread && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        width: '9px',
                        height: '9px',
                        backgroundColor: '#16a34a',
                        borderRadius: '50%',
                      }}
                      title="Unread notification"
                    />
                  )}

                  {/* Icon Avatar */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: isUnread ? '#dcfce7' : 'var(--color-surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, paddingRight: isUnread ? '16px' : '0' }}>
                    {notif.title && (
                      <div className="fw-bold mb-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                        {notif.title}
                      </div>
                    )}
                    <p
                      className="mb-1"
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: isUnread ? 'var(--color-text)' : 'var(--color-text-secondary)',
                        lineHeight: 1.45,
                      }}
                    >
                      {notif.message}
                    </p>
                    <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '11px' }}>
                      <Clock size={12} />
                      <span>{formatNotificationTime(notif.createdAt)}</span>
                      {notif.link && (
                        <span className="d-inline-flex align-items-center gap-1 text-primary fw-semibold ms-2">
                          <span>View details</span>
                          <ArrowRight size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
