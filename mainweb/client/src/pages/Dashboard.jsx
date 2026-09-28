import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, SlidersHorizontal, Inbox } from 'lucide-react';
import Navbar from '../components/Navbar';
import FoodCard from '../components/FoodCard';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

export default function Dashboard() {
  const { user } = useAuth();
  const [foodType, setFoodType] = useState('all');
  const [donations, setDonations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = { city: user.city };
        if (foodType !== 'all') {
          params.foodType = foodType;
        }
        const { data } = await api.get('/donations', { params });
        if (!cancelled) setDonations(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load food listings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [foodType, user.city]);

  return (
    <>
      <Navbar />
      <main className="hh-page">
        {/* Premium gradient page header */}
        <div className="hh-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Available Food in {user.city}</h1>
            <p>Surplus food listings available for pickup near you</p>
          </div>
          <Link to="/donate" className="btn-hh" style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', color: '#fff', boxShadow: 'none' }}>
            <Plus size={18} strokeWidth={2.5} />
            <span>Donate Food</span>
          </Link>
        </div>

        {/* Filter bar */}
        <div className="d-flex align-items-center gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
          <div className="d-flex align-items-center gap-2">
            <SlidersHorizontal size={15} color="var(--color-text-muted)" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Filter:</span>
          </div>
          <div className="filter-button-group">
            <button
              className={`filter-btn ${foodType === 'all' ? 'active' : ''}`}
              onClick={() => setFoodType('all')}
            >
              All Items
            </button>
            <button
              className={`filter-btn d-inline-flex align-items-center gap-2 ${foodType === 'veg' ? 'active' : ''}`}
              onClick={() => setFoodType('veg')}
            >
              <span className="diet-symbol veg" style={{ width: '12px', height: '12px' }}>
                <span className="diet-dot" style={{ width: '6px', height: '6px' }} />
              </span>
              <span>Vegetarian</span>
            </button>
            <button
              className={`filter-btn d-inline-flex align-items-center gap-2 ${foodType === 'nonveg' ? 'active' : ''}`}
              onClick={() => setFoodType('nonveg')}
            >
              <span className="diet-symbol non-veg" style={{ width: '12px', height: '12px' }}>
                <span className="diet-dot" style={{ width: '6px', height: '6px' }} />
              </span>
              <span>Non-Veg</span>
            </button>
          </div>
          {!loading && donations.length > 0 && (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
              {donations.length} listing{donations.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {error && <div className="alert-danger">{error}</div>}

        {/* Skeleton cards while fetching */}
        {loading && (
          <div className="row g-4">
            {[1, 2, 3, 4].map((i) => (
              <div className="col-md-6" key={i}>
                <div className="food-card p-4">
                  <div className="d-flex justify-content-between mb-3">
                    <div className="skeleton-box" style={{ width: '50%', height: '24px' }} />
                    <div className="skeleton-box" style={{ width: '25%', height: '24px' }} />
                  </div>
                  <div className="skeleton-box mb-2" style={{ width: '40%', height: '16px' }} />
                  <div className="skeleton-box mb-3" style={{ width: '30%', height: '16px' }} />
                  <div className="skeleton-box pt-2 border-top" style={{ width: '70%', height: '16px' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && donations.length === 0 && (
          <div className="empty-state text-center py-5">
            <div className="mb-3">
              <Inbox size={56} color="var(--color-text-muted)" strokeWidth={1.5} />
            </div>
            <h3 className="section-title mb-2">No food available in {user.city} right now</h3>
            <p className="food-card-meta mb-4">
              Check back soon, or be the first to share extra food with your community.
            </p>
            <Link to="/donate" className="btn-hh-secondary d-inline-flex align-items-center gap-2">
              <Plus size={16} />
              <span>Post a Food Donation</span>
            </Link>
          </div>
        )}

        {/* Actual cards */}
        {!loading && donations.length > 0 && (
          <div className="row g-4">
            {donations.map((donation) => (
              <div className="col-md-6" key={donation.id}>
                <FoodCard donation={donation} />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
