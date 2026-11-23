import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Inbox,
  Package,
  Calendar,
  User,
  Phone,
  MapPin,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';

export default function AcceptedFoodHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pickedUp' | 'accepted'

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const { data } = await api.get('/donations/ngo-accepted-history');
        setOrders(data || []);
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  // Stats calculation
  const totalCount = orders.length;
  const pickedUpCount = orders.filter((o) => o.status === 'pickedUp' || o.status === 'picked_up').length;
  const acceptedCount = orders.filter((o) => o.status !== 'pickedUp' && o.status !== 'picked_up').length;

  // Filter items by tab
  const filteredOrders = orders.filter((order) => {
    const isPickedUp = order.status === 'pickedUp' || order.status === 'picked_up';
    if (filterTab === 'pickedUp') return isPickedUp;
    if (filterTab === 'accepted') return !isPickedUp;
    return true;
  });

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ maxWidth: '960px' }}>
        {/* Header link back to profile */}
        <Link
          to="/profile"
          className="d-inline-flex align-items-center gap-2 mb-3 text-decoration-none"
          style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to profile</span>
        </Link>

        {/* Page Title & Subtitle */}
        <div className="mb-4">
          <h1 className="display-title mb-1">Accepted Food History</h1>
          <p className="food-card-meta mb-0" style={{ fontSize: 'var(--text-base)' }}>
            Complete history of donor food requests accepted by your organization.
          </p>
        </div>

        {/* 3 Top Stat Cards (identical to My Donated Food UI) */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="donor-stat-card">
              <div className="donor-stat-icon total">
                <Package size={22} />
              </div>
              <div>
                <div className="donor-stat-value">{totalCount}</div>
                <div className="donor-stat-label">TOTAL DONATIONS</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="donor-stat-card">
              <div className="donor-stat-icon completed">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="donor-stat-value">{pickedUpCount}</div>
                <div className="donor-stat-label">PICKED UP</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="donor-stat-card">
              <div className="donor-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <Clock size={22} />
              </div>
              <div>
                <div className="donor-stat-value">{acceptedCount}</div>
                <div className="donor-stat-label">NOT PICKED UP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div className="donor-nav-tabs">
            <button
              type="button"
              className={`donor-nav-tab ${filterTab === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTab('all')}
            >
              <span>All Donations</span>
            </button>
            <button
              type="button"
              className={`donor-nav-tab ${filterTab === 'pickedUp' ? 'active' : ''}`}
              onClick={() => setFilterTab('pickedUp')}
            >
              <span>Picked Up</span>
            </button>
            <button
              type="button"
              className={`donor-nav-tab ${filterTab === 'accepted' ? 'active' : ''}`}
              onClick={() => setFilterTab('accepted')}
            >
              <span>Pending Pickup</span>
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="d-flex flex-column gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="hh-card p-4">
                <div className="skeleton-box mb-2" style={{ width: '40%', height: '24px' }} />
                <div className="skeleton-box mb-3" style={{ width: '60%', height: '16px' }} />
                <div className="skeleton-box" style={{ width: '30%', height: '20px' }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredOrders.length === 0 && (
          <div className="empty-state text-center py-5">
            <div className="mb-3">
              <Inbox size={56} color="var(--color-text-muted)" strokeWidth={1.5} />
            </div>
            <h3 className="section-title mb-0">
              {filterTab === 'pickedUp'
                ? 'No picked up orders yet'
                : filterTab === 'accepted'
                ? 'No pending pickup orders'
                : 'No accepted food orders yet'}
            </h3>
          </div>
        )}

        {/* Order Cards matching My Donated Food UI */}
        {!loading && filteredOrders.length > 0 && (
          <div className="d-flex flex-column gap-3">
            {filteredOrders.map((order) => {
              const isPickedUp = order.status === 'pickedUp' || order.status === 'picked_up';
              const itemsList = order.items && order.items.length > 0 ? order.items : [];
              const title = itemsList.length > 0 ? itemsList.map((i) => i.name).join(', ') : 'Food Donation';
              const quantityStr = order.totalQuantity || (itemsList.length > 0 ? itemsList.map((i) => `${i.quantity} ${i.unit || 'portions'}`).join(', ') : '1 portion');
              const recDate = order.receivedDate
                ? new Date(order.receivedDate).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Nov 20, 2026';

              return (
                <div className="hh-card p-4 mb-0" key={order.id}>
                  {/* Top Header: Title, Veg badge, and Picked Up status pill */}
                  <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="diet-symbol veg" title="Veg">
                        <span className="diet-dot" />
                      </span>
                      <h3 className="card-title m-0 text-capitalize" style={{ fontSize: '18px' }}>
                        {title}
                      </h3>
                      <span
                        className="badge"
                        style={{
                          fontSize: '11px',
                          background: 'var(--color-surface-2)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        Veg
                      </span>
                    </div>

                    <div>
                      <span
                        className="badge-status"
                        style={{
                          background: isPickedUp ? '#ede9fe' : '#fef3c7',
                          color: isPickedUp ? '#6d28d9' : '#92400e',
                          fontWeight: 600,
                          fontSize: '12px',
                          padding: '4px 12px',
                          borderRadius: '16px',
                          border: `1px solid ${isPickedUp ? '#ddd6fe' : '#fde68a'}`,
                        }}
                      >
                        {isPickedUp ? 'Picked Up' : 'Accepted'}
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Date Section */}
                  <div
                    className="d-flex flex-wrap gap-4 mb-3 pb-3 border-bottom"
                    style={{ borderColor: 'var(--color-border)', fontSize: 'var(--text-body)' }}
                  >
                    <div>
                      <span className="text-muted d-block small">Quantity</span>
                      <strong className="d-flex align-items-center gap-1">
                        <Package size={14} />
                        <span>{quantityStr}</span>
                      </strong>
                    </div>

                    <div>
                      <span className="text-muted d-block small">Date</span>
                      <strong className="d-flex align-items-center gap-1">
                        <Calendar size={14} />
                        <span>{recDate}</span>
                      </strong>
                    </div>
                  </div>

                  {/* Horizontal Bar: Donor Name, Mobile Num, Address & City */}
                  <div
                    className="d-flex align-items-center justify-content-between flex-wrap gap-3 px-3 py-2 rounded"
                    style={{
                      background: 'var(--color-primary-light, #f0fdf4)',
                      color: 'var(--color-primary, #16a34a)',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {/* Donor Name */}
                    <div className="d-flex align-items-center gap-1.5">
                      <User size={15} />
                      <span className="text-muted fw-normal" style={{ color: '#166534' }}>Donor:</span>
                      <strong className="text-dark">{order.donorName || 'Donor'}</strong>
                    </div>

                    {/* Mobile Number */}
                    <div className="d-flex align-items-center gap-1.5">
                      <Phone size={14} />
                      <span className="text-muted fw-normal" style={{ color: '#166534' }}>Phone:</span>
                      {order.donorPhone ? (
                        <a
                          href={`tel:${order.donorPhone}`}
                          className="text-decoration-none fw-bold"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {order.donorPhone}
                        </a>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </div>

                    {/* Address & City */}
                    <div className="d-flex align-items-center gap-1.5">
                      <MapPin size={15} />
                      <span className="text-muted fw-normal" style={{ color: '#166534' }}>Pickup:</span>
                      <span className="text-dark fw-semibold">
                        {order.address ? `${order.address}, ${order.city}` : order.city || 'Local area'}
                      </span>
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
