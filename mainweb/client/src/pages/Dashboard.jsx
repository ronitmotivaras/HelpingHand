import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  SlidersHorizontal,
  Inbox,
  MapPin,
  Search,
  BadgeCheck,
  Clock,
  ShieldAlert,
  X,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import FoodCard from '../components/FoodCard';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import { CITIES } from '../constants/cities';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState(user?.city || 'Ahmedabad');
  const [foodType, setFoodType] = useState('all');
  const [search, setSearch] = useState('');
  const [donations, setDonations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const isApprovedNgo = user?.ngoStatus === 'approved';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = {
          city: selectedCity,
          sort: 'expiring',
        };
        if (foodType !== 'all') {
          params.foodType = foodType;
        }
        if (search.trim()) {
          params.search = search.trim();
        }

        const { data } = await api.get('/donations', { params });
        // Guaranteed ascending order of expiry: 1st expiring soon, then 2nd, etc.
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => {
              const aExp = a.expiryAt ? new Date(a.expiryAt).getTime() : (a.pickupTo ? new Date(a.pickupTo).getTime() : Infinity);
              const bExp = b.expiryAt ? new Date(b.expiryAt).getTime() : (b.pickupTo ? new Date(b.pickupTo).getTime() : Infinity);
              return aExp - bExp;
            })
          : [];
        if (!cancelled) setDonations(sorted);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load food listings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      load();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [foodType, selectedCity, search]);

  // Combined list of cities ensuring user's city is included
  const cityOptions = Array.from(new Set([...CITIES, ...(user?.city ? [user.city] : [])]));

  return (
    <>
      <Navbar />
      <main className="hh-page" style={{ paddingBottom: '96px' }}>
        {/* NGO Verification Status Banner if not yet approved */}
        {user?.ngoStatus && user.ngoStatus !== 'none' && !isApprovedNgo && (
          <div
            className="alert alert-warning d-flex align-items-center gap-2 mb-4"
            style={{
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#fffbeb',
              borderColor: '#fde68a',
              color: '#92400e',
              fontSize: 'var(--text-sm)',
            }}
          >
            {user.ngoStatus === 'pending' ? (
              <>
                <Clock size={18} className="flex-shrink-0" />
                <span>
                  <strong>Waiting for verification:</strong> Your organization profile is under review by our admin team. You can browse available listings now; once verified, you will be able to request pickups directly.
                </span>
              </>
            ) : (
              <>
                <ShieldAlert size={18} className="flex-shrink-0" />
                <span>
                  <strong>Verification Declined:</strong> Your NGO application was declined. You can continue browsing as a community member.
                </span>
              </>
            )}
          </div>
        )}

        {/* Page header */}
        <div className="hh-page-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <h1 className="m-0">Available Food in {selectedCity}</h1>
                {isApprovedNgo && (
                  <span className="badge-verified-ngo">
                    <BadgeCheck size={14} />
                    <span>Verified NGO</span>
                  </span>
                )}
              </div>
              <p className="m-0">Surplus food listings available for pickup near you</p>
            </div>
          </div>
        </div>

        {/* Search & City Filter Bar */}
        <div className="row g-2 mb-3">
          {/* Search Input */}
          <div className="col-md-8">
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                }}
              >
                <Search size={16} />
              </div>
              <input
                id="search-food"
                className="form-control"
                style={{ paddingLeft: '2.4rem', paddingRight: search ? '2.4rem' : '1rem' }}
                placeholder="Search food by item name, address, or donor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                  }}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* City Dropdown */}
          <div className="col-md-4">
            <div className="d-flex align-items-center gap-2" style={{ position: 'relative' }}>
              <MapPin size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <select
                id="dashboard-city-select"
                className="form-select"
                style={{
                  fontSize: 'var(--text-small)',
                  fontWeight: 600,
                  borderColor: 'var(--color-border)',
                  cursor: 'pointer',
                }}
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filter bar: Diet Type (All and Veg only) */}
        <div className="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
          {/* Veg Diet Filter */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="d-flex align-items-center gap-1">
              <SlidersHorizontal size={14} color="var(--color-text-muted)" />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Filter:</span>
            </div>
            <div className="filter-button-group">
              <button
                className={`filter-btn ${foodType === 'all' ? 'active' : ''}`}
                onClick={() => setFoodType('all')}
              >
                All
              </button>
              <button
                className={`filter-btn d-inline-flex align-items-center gap-1 ${foodType === 'veg' ? 'active' : ''}`}
                onClick={() => setFoodType('veg')}
              >
                <span className="diet-symbol veg" style={{ width: '12px', height: '12px' }}>
                  <span className="diet-dot" style={{ width: '6px', height: '6px' }} />
                </span>
                <span>Veg</span>
              </button>
            </div>
          </div>
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
            <h3 className="section-title mb-2">
              {search
                ? `No results matching "${search}" in ${selectedCity}`
                : `No food available in ${selectedCity} right now`}
            </h3>
            <p className="empty-state-text mb-4" style={{ textAlign: 'center', margin: '0 auto var(--space-4)' }}>
              {search
                ? 'Try checking for typos or searching a different term.'
                : 'Check back soon, or be the first to share extra food with your community.'}
            </p>
            {search && (
              <button
                type="button"
                className="btn-hh-secondary d-inline-flex align-items-center gap-2"
                onClick={() => setSearch('')}
              >
                <span>Clear search</span>
              </button>
            )}
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
