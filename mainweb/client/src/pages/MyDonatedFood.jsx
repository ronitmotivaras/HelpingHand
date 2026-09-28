import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, CheckCircle2, Clock, Inbox, Package } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';

function getBadgeClass(status) {
  if (status === 'accepted') return 'badge-status accepted';
  if (status === 'available') return 'badge-status available';
  return 'badge-status picked_up';
}

function statusLabel(status) {
  if (status === 'accepted') return 'Accepted';
  if (status === 'available') return 'Available';
  if (status === 'picked_up') return 'Picked Up';
  if (status === 'expired') return 'Expired';
  return status;
}

export default function MyDonatedFood() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/donations/my-history');
      setItems(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load donation history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAccepted(id) {
    setUpdatingId(id);
    try {
      await api.patch(`/donations/${id}/accept`);
      toast.success('Listing status updated: Accepted for pickup');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  async function markPickedUp(id) {
    setUpdatingId(id);
    try {
      await api.patch(`/donations/${id}/picked-up`);
      toast.success('Listing marked as completed (Picked Up)');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as picked up');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ maxWidth: '800px' }}>
        <Link
          to="/profile"
          className="d-inline-flex align-items-center gap-2 mb-4 text-decoration-none"
          style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to profile</span>
        </Link>

        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="section-title mb-1">My Food Donations</h1>
            <p className="food-card-meta mb-0">Track and update the status of your listings.</p>
          </div>
          <Link to="/donate" className="btn-hh-primary d-inline-flex align-items-center gap-2">
            <Plus size={16} strokeWidth={2.5} />
            <span>Post New Listing</span>
          </Link>
        </div>

        {loading && (
          <div className="d-flex flex-column gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="hh-card p-4">
                <div className="skeleton-box mb-2" style={{ width: '50%', height: '24px' }} />
                <div className="skeleton-box mb-3" style={{ width: '35%', height: '16px' }} />
                <div className="skeleton-box" style={{ width: '80%', height: '20px' }} />
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="empty-state text-center py-5">
            <div className="mb-3">
              <Inbox size={56} color="var(--color-text-muted)" strokeWidth={1.5} />
            </div>
            <h3 className="section-title mb-2">No donations posted yet</h3>
            <p className="food-card-meta mb-4">
              Whenever you have extra food, list it here so someone in your community can pick it up!
            </p>
            <Link to="/donate" className="btn-hh-secondary d-inline-flex align-items-center gap-2">
              <Plus size={16} />
              <span>Post Your First Donation</span>
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="d-flex flex-column gap-3">
            {items.map((item) => {
              const isNonVeg =
                item.foodType?.toLowerCase().includes('non') || item.type?.toLowerCase().includes('non');
              const isBusy = updatingId === item.id;

              return (
                <div className="hh-card mb-0" key={item.id}>
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span
                          className={`diet-symbol ${isNonVeg ? 'non-veg' : 'veg'}`}
                          title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}
                        >
                          <span className="diet-dot" />
                        </span>
                        <h3 className="card-title m-0">{item.foodName}</h3>
                      </div>
                      <p className="food-card-meta mb-0 d-flex align-items-center gap-1">
                        <Clock size={13} />
                        <span>
                          Available until:{' '}
                          {new Date(item.availableUpto).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </p>
                    </div>
                    <span className={getBadgeClass(item.status)}>{statusLabel(item.status)}</span>
                  </div>

                  <div
                    className="d-flex flex-wrap gap-4 mb-3 pb-3 border-bottom"
                    style={{ borderColor: 'var(--color-border)', fontSize: 'var(--text-body)' }}
                  >
                    <div>
                      <span className="text-muted d-block small">Quantity</span>
                      <strong className="d-flex align-items-center gap-1">
                        <Package size={14} /> {item.quantity}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted d-block small">Category</span>
                      <strong>{isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}</strong>
                    </div>
                    <div>
                      <span className="text-muted d-block small">Status</span>
                      <strong>{statusLabel(item.status)}</strong>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    {item.status === 'available' && (
                      <button
                        className="btn-hh-primary d-inline-flex align-items-center gap-1"
                        style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-small)' }}
                        disabled={isBusy}
                        onClick={() => markAccepted(item.id)}
                      >
                        <CheckCircle2 size={16} />
                        <span>{isBusy ? 'Updating...' : 'Mark as Accepted'}</span>
                      </button>
                    )}
                    {item.status === 'accepted' && (
                      <button
                        className="btn-hh-primary d-inline-flex align-items-center gap-1"
                        style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-small)' }}
                        disabled={isBusy}
                        onClick={() => markPickedUp(item.id)}
                      >
                        <CheckCircle2 size={16} />
                        <span>{isBusy ? 'Updating...' : 'Mark as Picked Up'}</span>
                      </button>
                    )}
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
