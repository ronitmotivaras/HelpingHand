import React from 'react';
import { Inbox, CheckCircle2, XCircle, MapPin, Phone } from 'lucide-react';

export default function NgoRequestsTable({ requests, onApprove, onReject, processingId, loading }) {
  if (loading) {
    return (
      <div className="p-3">
        {[1, 2].map((i) => (
          <div key={i} className="mb-3 p-3 border rounded">
            <div className="skeleton-box mb-2" style={{ width: '40%', height: '20px' }} />
            <div className="skeleton-box" style={{ width: '70%', height: '16px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="admin-empty-state">
        <div className="empty-icon mb-2">
          <Inbox size={48} color="var(--color-text-muted)" strokeWidth={1.5} />
        </div>
        <p className="fw-semibold mb-1">No pending NGO registration requests right now.</p>
        <span className="text-muted small">
          New applications from community food relief organizations will appear here.
        </span>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Organization</th>
            <th>Applicant User</th>
            <th>Location</th>
            <th>Contact Phone</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => {
            const isProcessing = processingId === req.id;
            const orgName = req.ngoDetails?.ngoName || req.ngoDetails?.name || 'Unnamed NGO';
            const city = req.ngoDetails?.city || req.city || '—';
            const address = req.ngoDetails?.address || '—';
            const contactNum = req.ngoDetails?.contactNum || req.ngoDetails?.contactNumber || req.mobile || '—';

            return (
              <tr key={req.id}>
                <td>
                  <strong style={{ color: 'var(--color-primary)' }}>{orgName}</strong>
                  <div className="text-muted small">ID: {req.id}</div>
                </td>
                <td>
                  <div>{req.name}</div>
                  <div className="text-muted small">{req.mobile}</div>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-1">
                    <MapPin size={13} color="var(--color-text-muted)" />
                    <span>{address}</span>
                  </div>
                  <span className="badge-status none mt-1" style={{ fontSize: '11px', padding: '1px 8px' }}>
                    {city}
                  </span>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-1">
                    <Phone size={13} color="var(--color-text-muted)" />
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{contactNum}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    <button
                      className="btn-admin-primary d-inline-flex align-items-center gap-1"
                      disabled={isProcessing}
                      onClick={() => onApprove(req.id, orgName)}
                    >
                      <CheckCircle2 size={16} strokeWidth={2} />
                      <span>{isProcessing ? 'Saving...' : 'Approve'}</span>
                    </button>
                    <button
                      className="btn-admin-danger d-inline-flex align-items-center gap-1"
                      disabled={isProcessing}
                      onClick={() => onReject(req.id, orgName)}
                    >
                      <XCircle size={16} strokeWidth={2} />
                      <span>{isProcessing ? 'Saving...' : 'Reject'}</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
