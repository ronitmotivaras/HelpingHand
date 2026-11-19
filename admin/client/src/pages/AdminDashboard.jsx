import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar';
import AdminStats from '../components/AdminStats';
import api from '../api/axiosInstance';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const statsRes = await api.get('/api/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to load live admin data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-breadcrumb-bar">
          <div>
            <h1 className="admin-page-title">System Overview</h1>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <AdminStats stats={stats} loading={loading && stats === null} />
      </main>
    </div>
  );
}
