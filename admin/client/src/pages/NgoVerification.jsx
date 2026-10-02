import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  Search,
  BadgeCheck,
  Clock,
  StickyNote,
  Trash2,
  RotateCcw,
  Plus,
  X,
  ShieldAlert,
  Filter,
  Pencil,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api/axiosInstance';
import { CITIES } from '../constants/cities';
import { validateMobile, validatePassword } from '../utils/validation';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NgoVerification() {
  const [ngos, setNgos] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [onlyWithNotes, setOnlyWithNotes] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [declineModalItem, setDeclineModalItem] = useState(null); // { id, name }
  const [noteModalItem, setNoteModalItem] = useState(null); // { id, name, notes }
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Delete / Fraud Modal
  const [deleteModalItem, setDeleteModalItem] = useState(null); // { id, name, phone }
  const [blockPhoneChecked, setBlockPhoneChecked] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit NGO Modal State
  const [editingNgo, setEditingNgo] = useState(null);
  const [editForm, setEditForm] = useState({
    ngoName: '',
    coordinatorName: '',
    mobile: '',
    city: '',
    address: '',
    newPassword: '',
  });
  const [mobileError, setMobileError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [isSavingNgo, setIsSavingNgo] = useState(false);

  async function loadNgos() {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        api.get('/api/admin/ngo-requests'),
        api.get('/api/admin/stats'),
      ]);
      setNgos(res.data);
      setStats(statsRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to load NGO list');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNgos();
  }, []);

  // Action 1: Verify NGO (Confirmed real)
  async function handleVerify(id, ngoName) {
    setProcessingId(id);
    try {
      await api.patch(`/api/admin/ngo-requests/${id}/approve`);
      toast.success(`"${ngoName || 'NGO'}" verified successfully as a partner`);
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to verify NGO');
    } finally {
      setProcessingId(null);
    }
  }

  // Action 2: Decline (Block) NGO -> moves to unified blocklist
  async function confirmDeclineAction() {
    if (!declineModalItem) return;
    const { id, name } = declineModalItem;
    setProcessingId(id);
    setDeclineModalItem(null);
    try {
      await api.patch(`/api/admin/ngo-requests/${id}/reject`, {
        reason: 'NGO application declined / blocked by admin',
      });
      toast.success(`"${name}" was declined and moved to the Blocked Accounts list.`);
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to decline NGO');
    } finally {
      setProcessingId(null);
    }
  }

  // Action 3: Revert to Pending
  async function handleSetPending(id, ngoName) {
    setProcessingId(id);
    try {
      await api.patch(`/api/admin/ngo-requests/${id}/pending`);
      toast.success(`"${ngoName || 'NGO'}" status reverted to Pending`);
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessingId(null);
    }
  }

  // Edit NGO Handlers
  function openEditModal(ngo) {
    setEditingNgo(ngo);
    setEditForm({
      ngoName: ngo.ngoDetails?.ngoName || ngo.ngoDetails?.name || ngo.name || '',
      coordinatorName: ngo.ngoDetails?.coordinatorName || ngo.name || '',
      mobile: ngo.ngoDetails?.contactNum || ngo.ngoDetails?.contactNumber || ngo.mobile || '',
      city: ngo.ngoDetails?.city || ngo.city || '',
      address: ngo.ngoDetails?.address || '',
      newPassword: '',
    });
    setMobileError('');
    setPasswordErrors([]);
  }

  function closeEditModal() {
    setEditingNgo(null);
    setEditForm({
      ngoName: '',
      coordinatorName: '',
      mobile: '',
      city: '',
      address: '',
      newPassword: '',
    });
    setMobileError('');
    setPasswordErrors([]);
  }

  function handleEditMobileInput(val) {
    setEditForm((prev) => ({ ...prev, mobile: val }));
    if (/[^0-9]/.test(val)) {
      setMobileError('Only digits (0-9) allowed. No characters, spaces, or symbols.');
    } else if (val.length > 0 && val.length !== 10) {
      setMobileError('Mobile number must be exactly 10 digits');
    } else {
      setMobileError('');
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingNgo) return;

    const mErr = validateMobile(editForm.mobile);
    if (mErr) {
      setMobileError(mErr);
      return;
    }

    if (editForm.newPassword) {
      const pErrors = validatePassword(editForm.newPassword);
      if (pErrors.length > 0) {
        setPasswordErrors(pErrors);
        return;
      }
    }

    setIsSavingNgo(true);
    try {
      await api.patch(`/api/admin/users/${editingNgo.id}`, {
        ngoName: editForm.ngoName.trim(),
        name: editForm.ngoName.trim(),
        coordinatorName: editForm.coordinatorName.trim(),
        mobile: editForm.mobile.trim(),
        coordinatorPhone: editForm.mobile.trim(),
        city: editForm.city.trim(),
        address: editForm.address.trim(),
        newPassword: editForm.newPassword || undefined,
      });
      toast.success(`NGO details updated for "${editForm.ngoName}"`);
      closeEditModal();
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to update NGO details');
    } finally {
      setIsSavingNgo(false);
    }
  }

  // Action 4: Save Admin Note (Couldn't reach / call attempt note)
  async function handleSaveNote(e) {
    e.preventDefault();
    if (!noteModalItem || !noteText.trim()) return;

    setIsSavingNote(true);
    try {
      await api.post(`/api/admin/ngos/${noteModalItem.id}/note`, { note: noteText.trim() });
      toast.success('Admin note saved. NGO status kept pending.');
      setNoteModalItem(null);
      setNoteText('');
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to save admin note');
    } finally {
      setIsSavingNote(false);
    }
  }

  // Action 5: Delete NGO (Confirmed fraud / fake, with option to block phone)
  async function handleDeleteConfirm() {
    if (!deleteModalItem) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/ngos/${deleteModalItem.id}`, {
        data: {
          blockPhone: blockPhoneChecked,
          reason: 'Confirmed fraud / fake NGO registration',
        },
      });
      if (blockPhoneChecked) {
        toast.success(`"${deleteModalItem.name}" deleted and phone ${deleteModalItem.phone} blocked from future registrations.`);
      } else {
        toast.success(`"${deleteModalItem.name}" deleted.`);
      }
      setDeleteModalItem(null);
      await loadNgos();
    } catch (err) {
      if (err.response?.status === 401 || err.name === 'CanceledError' || err.message === 'Session expired') return;
      toast.error(err.response?.data?.message || 'Failed to delete NGO');
    } finally {
      setIsDeleting(false);
    }
  }

  const pendingCount = ngos ? ngos.filter((n) => n.ngoStatus === 'pending').length : 0;
  const approvedCount = ngos ? ngos.filter((n) => n.ngoStatus === 'approved').length : 0;
  const rejectedCount = ngos ? ngos.filter((n) => n.ngoStatus === 'rejected').length : 0;
  const notesCount = ngos ? ngos.filter((n) => Array.isArray(n.adminNotes) && n.adminNotes.length > 0).length : 0;

  // Filter pipeline
  const filteredNgos = (ngos || []).filter((ngo) => {
    // Status filter
    if (statusFilter !== 'all' && ngo.ngoStatus !== statusFilter) {
      return false;
    }

    // Only with notes filter (Couldn't reach / follow up)
    if (onlyWithNotes && (!ngo.adminNotes || ngo.adminNotes.length === 0)) {
      return false;
    }

    // City filter
    const ngoCity = ngo.ngoDetails?.city || ngo.city || '';
    if (cityFilter && ngoCity.toLowerCase() !== cityFilter.toLowerCase()) {
      return false;
    }

    // Search term
    if (search.trim()) {
      const term = search.toLowerCase();
      const ngoName = (ngo.ngoDetails?.ngoName || ngo.ngoDetails?.name || ngo.name || '').toLowerCase();
      const coordinator = (ngo.ngoDetails?.coordinatorName || ngo.name || '').toLowerCase();
      const contact = (ngo.ngoDetails?.contactNum || ngo.mobile || '').toLowerCase();
      const address = (ngo.ngoDetails?.address || '').toLowerCase();
      const city = ngoCity.toLowerCase();
      const notesCombined = (ngo.adminNotes || []).map((n) => n.note.toLowerCase()).join(' ');

      return (
        ngoName.includes(term) ||
        coordinator.includes(term) ||
        contact.includes(term) ||
        address.includes(term) ||
        city.includes(term) ||
        notesCombined.includes(term)
      );
    }

    return true;
  });

  return (
    <div className="admin-layout">
      <AdminSidebar
        pendingCount={pendingCount}
        usersCount={stats?.totalDonators}
        blockedCount={stats?.totalBlocked}
      />

      <main className="admin-main">
        <div className="admin-breadcrumb-bar">
          <div>
            <h1 className="admin-page-title">NGO Verification & Management</h1>
          </div>
        </div>

        <section className="admin-card-panel">
          {/* Top Filter Tabs: All / Pending / Verified / Declined / Unreachable with notes */}
          <div
            className="d-flex justify-content-between align-items-center flex-wrap gap-3"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--color-border-subtle)',
              background: 'var(--color-surface-2)',
            }}
          >
            {/* Status Segmented Buttons */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                className={`btn-admin-outline ${statusFilter === 'all' && !onlyWithNotes ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => {
                  setStatusFilter('all');
                  setOnlyWithNotes(false);
                }}
              >
                All NGOs ({ngos ? ngos.length : 0})
              </button>

              <button
                type="button"
                className={`btn-admin-outline ${statusFilter === 'pending' && !onlyWithNotes ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => {
                  setStatusFilter('pending');
                  setOnlyWithNotes(false);
                }}
              >
                Pending ({pendingCount})
              </button>

              <button
                type="button"
                className={`btn-admin-outline ${statusFilter === 'approved' && !onlyWithNotes ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => {
                  setStatusFilter('approved');
                  setOnlyWithNotes(false);
                }}
              >
                Verified ({approvedCount})
              </button>

              <button
                type="button"
                className={`btn-admin-outline ${statusFilter === 'rejected' && !onlyWithNotes ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => {
                  setStatusFilter('rejected');
                  setOnlyWithNotes(false);
                }}
              >
                Declined ({rejectedCount})
              </button>

              {/* Case B Filter: Couldn't reach / Has Notes */}
              <button
                type="button"
                className={`btn-admin-outline ${onlyWithNotes ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                onClick={() => {
                  setOnlyWithNotes(!onlyWithNotes);
                }}
                title="Filter to find unreachable NGOs with logged call attempts"
              >
                <StickyNote size={14} className="me-1" />
                <span>With Call Notes ({notesCount})</span>
              </button>
            </div>

            <span className="text-muted" style={{ fontSize: 'var(--text-small)', whiteSpace: 'nowrap' }}>
              Showing <strong>{filteredNgos.length}</strong> NGOs
            </span>
          </div>

          {/* Search & City Filter Bar */}
          <div
            className="d-flex justify-content-between align-items-center flex-wrap gap-3"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                <Search
                  size={16}
                  color="var(--color-text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="admin-form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="Search name, phone, coordinator, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* City Dropdown */}
              <div style={{ width: '170px' }}>
                <select
                  className="admin-form-input"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">All Cities</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Helper Badge */}
            <div className="text-muted small d-none d-md-flex align-items-center gap-2">
              <span className="badge-status approved" style={{ fontSize: '10px' }}>Verified</span>
              <span className="badge-status pending" style={{ fontSize: '10px' }}>Pending</span>
              <span className="badge-status rejected" style={{ fontSize: '10px' }}>Declined</span>
            </div>
          </div>

          {/* Content / NGO Cards */}
          {loading && ngos === null ? (
            <div className="p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="mb-3 p-4 border rounded">
                  <div className="skeleton-box mb-2" style={{ width: '40%', height: '22px' }} />
                  <div className="skeleton-box mb-2" style={{ width: '70%', height: '16px' }} />
                  <div className="skeleton-box" style={{ width: '25%', height: '16px' }} />
                </div>
              ))}
            </div>
          ) : filteredNgos.length === 0 ? (
            <div className="admin-empty-state py-5 text-center">
              <div className="empty-icon mb-2">
                <Inbox size={48} color="var(--color-text-muted)" strokeWidth={1.5} />
              </div>
              <p className="fw-semibold mb-1">No matching NGOs found.</p>
              <span className="text-muted small">
                {onlyWithNotes
                  ? 'No NGOs have call notes matching this filter.'
                  : 'Try clearing your search or city filters.'}
              </span>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3" style={{ padding: 'var(--space-4) var(--space-5)' }}>
              {filteredNgos.map((ngo) => {
                const isProcessing = processingId === ngo.id;
                const ngoName = ngo.ngoDetails?.ngoName || ngo.ngoDetails?.name || ngo.name || 'Unnamed NGO';
                const city = ngo.ngoDetails?.city || ngo.city || '—';
                const address = ngo.ngoDetails?.address || '—';
                const contactNum = ngo.ngoDetails?.contactNum || ngo.ngoDetails?.contactNumber || ngo.mobile || '—';
                const coordinatorName = ngo.ngoDetails?.coordinatorName || ngo.name || '—';

                const isApproved = ngo.ngoStatus === 'approved';
                const isPending = ngo.ngoStatus === 'pending';
                const isRejected = ngo.ngoStatus === 'rejected';

                const statusClass = isApproved
                  ? 'approved'
                  : isPending
                  ? 'pending'
                  : isRejected
                  ? 'rejected'
                  : 'none';

                const adminNotes = Array.isArray(ngo.adminNotes) ? ngo.adminNotes : [];

                return (
                  <div
                    key={ngo.id}
                    className="p-4"
                    style={{
                      background: 'var(--color-surface)',
                      border: isPending && adminNotes.length > 0 ? '1px solid #bfdbfe' : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {/* Top Row: Title, Status Badge, Action Buttons */}
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h3
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: 'var(--color-primary)',
                              margin: 0,
                            }}
                          >
                            {ngoName}
                          </h3>

                          {isApproved && (
                            <span className="badge-status approved d-inline-flex align-items-center gap-1">
                              <BadgeCheck size={14} />
                              <span>Verified NGO</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="badge-status pending d-inline-flex align-items-center gap-1">
                              <Clock size={14} />
                              <span>Pending Review</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="badge-status rejected d-inline-flex align-items-center gap-1">
                              <XCircle size={14} />
                              <span>Declined</span>
                            </span>
                          )}
                        </div>

                        <div className="text-muted small mt-1 d-flex align-items-center gap-3 flex-wrap">
                          <span>
                            Coordinator: <strong>{coordinatorName}</strong>
                          </span>
                          <a
                            href={`tel:${contactNum}`}
                            className="phone-link-btn"
                            title="Call coordinator to verify"
                          >
                            <Phone size={13} />
                            <span>{contactNum}</span>
                          </a>
                          <span>Applied {formatDate(ngo.createdAt)}</span>
                        </div>
                      </div>

                      {/* Action buttons mapping to the 4 outcomes:
                          1. Called and confirmed real -> Verify
                          2. Couldn't reach -> Keep Pending and add a note
                          3. Doubtful, but not proven fake -> Decline (reversible)
                          4. Confirmed fraud -> Delete (with block number checkbox)
                      */}
                      <div className="d-flex gap-2 flex-wrap">
                        {/* 1. Verify button */}
                        {!isApproved && (
                          <button
                            type="button"
                            className="btn-admin-primary d-inline-flex align-items-center gap-1"
                            style={{ padding: '6px 14px', fontSize: 'var(--text-sm)' }}
                            disabled={isProcessing}
                            onClick={() => handleVerify(ngo.id, ngoName)}
                            title="Confirm real organization and grant Verified NGO badge"
                          >
                            <CheckCircle2 size={15} strokeWidth={2} />
                            <span>Verify</span>
                          </button>
                        )}

                        {/* Move to Pending button for Verified NGO */}
                        {isApproved && (
                          <button
                            type="button"
                            className="btn-admin-outline d-inline-flex align-items-center gap-1"
                            style={{
                              padding: '6px 13px',
                              fontSize: 'var(--text-sm)',
                              color: '#d97706',
                              borderColor: '#fde68a',
                            }}
                            disabled={isProcessing}
                            onClick={() => handleSetPending(ngo.id, ngoName)}
                            title="Move verified NGO back to Pending"
                          >
                            <RotateCcw size={14} />
                            <span>Move to Pending</span>
                          </button>
                        )}

                        {/* Edit NGO button */}
                        <button
                          type="button"
                          className="btn-admin-outline d-inline-flex align-items-center gap-1"
                          style={{ padding: '6px 13px', fontSize: 'var(--text-sm)' }}
                          disabled={isProcessing}
                          onClick={() => openEditModal(ngo)}
                          title="Edit NGO details (Name, Coordinator, Phone, Address, City)"
                        >
                          <Pencil size={14} />
                          <span>Edit</span>
                        </button>

                        {/* 2. Add Note button (Keep Pending & Add Note) */}
                        <button
                          type="button"
                          className="btn-admin-outline d-inline-flex align-items-center gap-1"
                          style={{
                            padding: '6px 13px',
                            fontSize: 'var(--text-sm)',
                            color: '#2563eb',
                            borderColor: '#bfdbfe',
                          }}
                          disabled={isProcessing}
                          onClick={() => {
                            setNoteModalItem({ id: ngo.id, name: ngoName, notes: adminNotes });
                            setNoteText('');
                          }}
                          title="Case B: Couldn't reach? Keep Pending and record call attempt note"
                        >
                          <StickyNote size={15} />
                          <span>{adminNotes.length > 0 ? `Notes (${adminNotes.length})` : 'Add Note'}</span>
                        </button>

                        {/* 3. Decline button (Declines and blocks fake NGO) */}
                        {!isRejected && (
                          <button
                            type="button"
                            className="btn-admin-outline d-inline-flex align-items-center gap-1"
                            style={{
                              padding: '6px 13px',
                              fontSize: 'var(--text-sm)',
                              color: '#b45309',
                              borderColor: '#fde68a',
                            }}
                            disabled={isProcessing}
                            onClick={() => setDeclineModalItem({ id: ngo.id, name: ngoName })}
                            title="Decline fake NGO and block phone number"
                          >
                            <XCircle size={15} />
                            <span>Decline</span>
                          </button>
                        )}

                        {/* If declined, option to revert to Pending */}
                        {isRejected && (
                          <button
                            type="button"
                            className="btn-admin-outline d-inline-flex align-items-center gap-1"
                            style={{ padding: '6px 13px', fontSize: 'var(--text-sm)' }}
                            disabled={isProcessing}
                            onClick={() => handleSetPending(ngo.id, ngoName)}
                            title="Revert status back to Pending"
                          >
                            <RotateCcw size={14} />
                            <span>Set Pending</span>
                          </button>
                        )}

                        {/* 4. Delete button (Permanently removes NGO completely with no user account left behind) */}
                        <button
                          type="button"
                          className="btn-admin-danger d-inline-flex align-items-center gap-1"
                          style={{ padding: '6px 12px', fontSize: 'var(--text-sm)' }}
                          disabled={isProcessing}
                          onClick={() => {
                            setDeleteModalItem({ id: ngo.id, name: ngoName, phone: contactNum });
                            setBlockPhoneChecked(true);
                          }}
                          title="Permanently remove NGO completely"
                        >
                          <Trash2 size={15} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* NGO Details Grid */}
                    <div className="row g-3 pt-2 border-top" style={{ borderColor: 'var(--color-border-subtle)', fontSize: 'var(--text-sm)' }}>
                      <div className="col-md-3">
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <MapPin size={13} /> City
                        </div>
                        <div className="fw-semibold mt-1">{city}</div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <MapPin size={13} /> Address
                        </div>
                        <div className="fw-semibold mt-1">{address}</div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <Phone size={13} /> Contact Number
                        </div>
                        <div className="fw-semibold mt-1" style={{ fontFamily: 'monospace' }}>
                          {contactNum}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <User size={13} /> Coordinator Name
                        </div>
                        <div className="fw-semibold mt-1">{coordinatorName}</div>
                      </div>
                    </div>

                    {/* Admin-only Notes Section on the card (Case B: Couldn't reach) */}
                    {adminNotes.length > 0 && (
                      <div
                        className="mt-3 p-3 rounded"
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          fontSize: 'var(--text-sm)',
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-1 fw-semibold text-primary">
                            <StickyNote size={14} />
                            <span>Admin Call Log / Notes (Hidden from NGO)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNoteModalItem({ id: ngo.id, name: ngoName, notes: adminNotes });
                              setNoteText('');
                            }}
                            className="btn btn-sm p-0 text-primary"
                            style={{ fontSize: '11px', textDecoration: 'underline' }}
                          >
                            + Add another note
                          </button>
                        </div>

                        <div className="d-flex flex-column gap-2">
                          {adminNotes.map((nt, idx) => (
                            <div
                              key={idx}
                              className="d-flex justify-content-between align-items-start gap-2 py-1 px-2 rounded"
                              style={{ background: '#ffffff', border: '1px solid #f1f5f9' }}
                            >
                              <span style={{ color: '#334155' }}>
                                📌 <strong>{nt.note}</strong>
                              </span>
                              <span className="text-muted" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                                {formatDate(nt.createdAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal 1: Decline Confirmation Modal (Reversible) */}
        {declineModalItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: '16px',
            }}
            onClick={() => setDeclineModalItem(null)}
          >
            <div
              style={{
                maxWidth: '460px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                border: '1px solid var(--color-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#b45309' }}>
                <AlertTriangle size={22} />
                <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                  Decline NGO Application (Block)
                </h3>
              </div>
              <p className="text-muted mb-3" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to decline and block <strong>"{declineModalItem.name}"</strong>?
              </p>
              <div
                className="p-3 mb-4 rounded"
                style={{ background: '#fef3c7', border: '1px solid #fde68a', fontSize: '13px', color: '#92400e' }}
              >
                <strong>Unified Blocklist Policy:</strong> Declining an NGO automatically moves it to the shared <strong>Blocked Accounts</strong> list, logs out active sessions, and cancels open pickup requests. You can unblock this organization on the Blocked page at any time to return it to Pending.
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn-admin-outline"
                  onClick={() => setDeclineModalItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-danger"
                  style={{ backgroundColor: '#b45309', borderColor: '#b45309' }}
                  onClick={confirmDeclineAction}
                >
                  Confirm Decline (Block)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Admin Call Note Modal (Case B: Couldn't reach) */}
        {noteModalItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: '16px',
            }}
            onClick={() => setNoteModalItem(null)}
          >
            <div
              style={{
                maxWidth: '480px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                border: '1px solid var(--color-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2 text-primary">
                  <StickyNote size={20} />
                  <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                    Log Call Attempt Note
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNoteModalItem(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-muted mb-2" style={{ fontSize: '13px' }}>
                Keep <strong>{noteModalItem.name}</strong> Pending and add an admin-only note. The NGO will never see this note.
              </p>

              {/* Quick Preset Buttons */}
              <div className="d-flex flex-wrap gap-1 mb-3">
                {[
                  `Called ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, no answer`,
                  'Phone switched off / unreachable',
                  'Number busy, will retry tomorrow',
                  'Coordinator requested callback later',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-sm btn-light border"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    onClick={() => setNoteText(preset)}
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSaveNote}>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>
                    Note Content
                  </label>
                  <textarea
                    rows={3}
                    className="admin-form-input w-100"
                    placeholder="e.g. Called 29 Sep 6 PM, no answer..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn-admin-outline"
                    onClick={() => setNoteModalItem(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-admin-primary"
                    disabled={isSavingNote || !noteText.trim()}
                  >
                    {isSavingNote ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Case A Confirmed Fraud Delete & Block Phone Modal */}
        {deleteModalItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: '16px',
            }}
            onClick={() => setDeleteModalItem(null)}
          >
            <div
              style={{
                maxWidth: '480px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                border: '1px solid var(--color-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center gap-2 mb-2" style={{ color: 'var(--color-danger)' }}>
                <ShieldAlert size={24} />
                <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                  Delete NGO Application (Fraud / Fake)
                </h3>
              </div>
              <p className="text-muted mb-3" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong>"{deleteModalItem.name}"</strong>? This will remove all their data from the database.
              </p>

              {/* Case A Checkbox: Also block this phone number */}
              <div
                className="p-3 mb-4 rounded"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                }}
              >
                <label className="d-flex align-items-start gap-2 cursor-pointer m-0" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={blockPhoneChecked}
                    onChange={(e) => setBlockPhoneChecked(e.target.checked)}
                    style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <div>
                    <strong style={{ color: '#991b1b', fontSize: '14px' }}>
                      Also block this phone number ({deleteModalItem.phone})
                    </strong>
                    <div className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                      Stops future account and NGO registrations with this mobile number to prevent re-registration by fraud accounts.
                    </div>
                  </div>
                </label>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn-admin-outline"
                  onClick={() => setDeleteModalItem(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-danger"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : blockPhoneChecked ? 'Delete & Block Number' : 'Delete NGO'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal 4: Edit NGO Modal */}
        {editingNgo && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: '16px',
            }}
            onClick={closeEditModal}
          >
            <div
              style={{
                maxWidth: '520px',
                width: '100%',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                border: '1px solid var(--color-border)',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="card-title m-0" style={{ fontSize: '18px' }}>
                  Edit NGO Details
                </h3>
                <button
                  type="button"
                  className="btn-link text-muted border-0 bg-transparent p-0 cursor-pointer"
                  onClick={closeEditModal}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>
                    Organization Name
                  </label>
                  <input
                    type="text"
                    className="admin-form-input w-100"
                    value={editForm.ngoName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, ngoName: e.target.value }))}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    className="admin-form-input w-100"
                    value={editForm.coordinatorName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, coordinatorName: e.target.value }))}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>
                    Contact Phone (10 digits)
                  </label>
                  <input
                    type="text"
                    className="admin-form-input w-100"
                    value={editForm.mobile}
                    onChange={(e) => handleEditMobileInput(e.target.value)}
                    required
                  />
                  {mobileError && (
                    <div className="text-danger small mt-1">{mobileError}</div>
                  )}
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>
                      City
                    </label>
                    <select
                      className="admin-form-input w-100"
                      value={editForm.city}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                      required
                    >
                      <option value="">Select City...</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>
                      Reset Password (Optional)
                    </label>
                    <input
                      type="password"
                      className="admin-form-input w-100"
                      placeholder="Leave blank to keep"
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                </div>

                {passwordErrors.length > 0 && (
                  <div className="alert alert-danger p-2 mb-3" style={{ fontSize: '12px' }}>
                    {passwordErrors.map((err, idx) => (
                      <div key={idx}>{err}</div>
                    ))}
                  </div>
                )}

                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>
                    Address
                  </label>
                  <textarea
                    rows={2}
                    className="admin-form-input w-100"
                    value={editForm.address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn-admin-outline"
                    onClick={closeEditModal}
                    disabled={isSavingNgo}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-admin-primary"
                    disabled={isSavingNgo}
                  >
                    {isSavingNgo ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
