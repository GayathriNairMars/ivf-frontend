import React, { useState, useEffect, useCallback } from 'react';
import './hr_attendance.css';
import { Search, Filter, Download, Edit2, Trash2, Eye, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import hrApi from '../../../api/hrApi';
import StaffAttendanceDetail from './StaffAttendanceDetail';

const STATUS_COLOR = {
  PRESENT: { color: '#15803d', bg: '#dcfce7' },
  ABSENT: { color: '#b91c1c', bg: '#fee2e2' },
  LATE: { color: '#c2410c', bg: '#ffedd5' },
  ON_LEAVE: { color: '#6d28d9', bg: '#ede9fe' },
  HALF_DAY: { color: '#0369a1', bg: '#e0f2fe' },
  WORK_FROM_HOME: { color: '#374151', bg: '#f3f4f6' },
};

function StatusBadge({ status, display }) {
  const c = STATUS_COLOR[status] || { color: '#374151', bg: '#f3f4f6' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      color: c.color, background: c.bg, whiteSpace: 'nowrap',
    }}>{display || status}</span>
  );
}

function EditModal({ record, onClose, onSaved }) {
  const [form, setForm] = useState({
    check_in: record.check_in ? record.check_in.slice(0, 5) : '',
    check_out: record.check_out ? record.check_out.slice(0, 5) : '',
    status: record.status,
    remarks: record.remarks || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await hrApi.updateAttendance(record.id, form);
      if (res.success) { onSaved(); onClose(); }
      else setError(res.message || 'Update failed.');
    } catch (e) {
      setError(e?.response?.data?.error || 'Server error.');
    } finally { setSaving(false); }
  };

  return (
    <div className="am-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="am-modal">
        <div className="am-header">
          <div className="am-header-left">
            <div className="am-header-icon" style={{ background: '#fff7ed' }}><Edit2 size={18} style={{ color: '#f97316' }} /></div>
            <div>
              <h3 className="am-title">Edit Attendance Record</h3>
              <p className="am-subtitle">{record.user_name} · {record.date} ({record.day_name})</p>
            </div>
          </div>
          <button className="am-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="am-body">
            <div className="edit-two-col">
              {/* Current */}
              <div className="edit-current-box">
                <div className="edit-current-title">CURRENT RECORD</div>
                <div className="edit-current-row"><span>Check In</span><span>{record.check_in || '—'}</span></div>
                <div className="edit-current-row"><span>Check Out</span><span>{record.check_out || '—'}</span></div>
                <div className="edit-current-row"><span>Status</span><StatusBadge status={record.status} display={record.status_display} /></div>
                {record.remarks && <div className="edit-current-remarks">"{record.remarks}"</div>}
              </div>
              {/* Update */}
              <div className="edit-update-box">
                <div className="edit-update-title">UPDATE DETAILS</div>
                <div className="am-row">
                  <div className="am-field">
                    <label className="am-label">Check In</label>
                    <input type="time" name="check_in" value={form.check_in} onChange={handleChange} className="am-input" />
                  </div>
                  <div className="am-field">
                    <label className="am-label">Check Out</label>
                    <input type="time" name="check_out" value={form.check_out} onChange={handleChange} className="am-input" />
                  </div>
                </div>
                <div className="am-field">
                  <label className="am-label">Attendance Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="am-select">
                    {Object.keys(STATUS_COLOR).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="am-field">
              <label className="am-label">Remarks / Reason for Update</label>
              <textarea name="remarks" value={form.remarks} onChange={handleChange} className="am-textarea" placeholder="Add remarks..." rows={3} />
            </div>
            <div className="am-conflict-box">
              <CheckCircle size={16} className="am-conflict-icon" />
              <div>
                <p className="am-conflict-title">Conflict Check</p>
                <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>No conflicts found. This record does not overlap with existing leave or shift patterns.</p>
              </div>
            </div>
            {error && <div className="am-error"><AlertCircle size={15} /> {error}</div>}
          </div>
          <div className="am-footer">
            <button type="button" onClick={onClose} className="am-btn-cancel">Cancel</button>
            <button type="submit" disabled={saving} className="am-btn-save">
              {saving ? <span className="am-spinner" /> : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ViewAllAttendance({ onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total_count: 0 });
  const [editRecord, setEditRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewStaffId, setViewStaffId] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    start_date: firstOfMonth,
    end_date: today,
    department_id: '',
    status: '',
    search: '',
    page: 1,
    page_size: 15,
  });

  useEffect(() => {
    hrApi.getDepartments().then(res => {
      const list = res.departments || res.data || (Array.isArray(res) ? res : []);
      setDepartments(list);
    }).catch(() => {});
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.department_id) params.department_id = filters.department_id;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      params.page = filters.page;
      params.page_size = filters.page_size;
      const res = await hrApi.getAttendanceAll(params);
      if (res.success) {
        setRecords(res.data || []);
        setPagination(res.pagination || { page: 1, total_pages: 1, total_count: 0 });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await hrApi.deleteAttendance(id);
      setDeleteId(null);
      fetchRecords();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'Day', 'Staff', 'Email', 'Role', 'Check In', 'Check Out', 'Status', 'Hours', 'Remarks', 'Marked By'].join(','),
      ...records.map(r => [
        r.date, r.day_name, r.user_name, r.user_email, r.user_role_display,
        r.check_in || '', r.check_out || '', r.status_display,
        r.total_hours || '', r.remarks || '', r.marked_by_name || '',
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance_${filters.start_date}_${filters.end_date}.csv`; a.click();
  };

  if (viewStaffId) {
    return <StaffAttendanceDetail userId={viewStaffId} onClose={() => setViewStaffId(null)} />;
  }

  return (
    <div className="va-page">
      {/* Header */}
      <div className="va-header">
        <div>
          <h2 className="header-title">All Attendance Records</h2>
          <p className="header-subtitle">{pagination.total_count} records · {filters.start_date} to {filters.end_date}</p>
        </div>
        <div className="header-actions">
          <button onClick={handleExport} className="btn-secondary"><Download size={15} /> Export CSV</button>
          {onClose && <button onClick={onClose} className="btn-icon"><X size={16} /></button>}
        </div>
      </div>

      {/* Filters */}
      <div className="va-filters panel">
        <div className="va-filter-row">
          <div className="va-filter-group">
            <label className="am-label">Start Date</label>
            <input type="date" value={filters.start_date}
              onChange={e => handleFilterChange('start_date', e.target.value)} className="am-input" />
          </div>
          <div className="va-filter-group">
            <label className="am-label">End Date</label>
            <input type="date" value={filters.end_date}
              onChange={e => handleFilterChange('end_date', e.target.value)} className="am-input" />
          </div>
          <div className="va-filter-group">
            <label className="am-label">Department</label>
            <select value={filters.department_id} onChange={e => handleFilterChange('department_id', e.target.value)} className="am-select">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="va-filter-group">
            <label className="am-label">Status</label>
            <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="am-select">
              <option value="">All Status</option>
              {Object.keys(STATUS_COLOR).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="va-filter-group va-search-group">
            <label className="am-label">Search</label>
            <div className="va-search-wrap">
              <Search size={14} className="va-search-icon" />
              <input type="text" placeholder="Name or email..." value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)} className="am-input va-search-input" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="am-loading">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="va-empty">
            <Filter size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
            <p>No records found for the selected filters.</p>
          </div>
        ) : (
          <div className="va-table-wrap">
            <table className="va-table">
              <thead>
                <tr>
                  <th>DATE</th><th>STAFF</th><th>CHECK IN</th><th>CHECK OUT</th>
                  <th>STATUS</th><th>HOURS</th><th>LATE (MIN)</th><th>MARKED BY</th><th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="va-row">
                    <td>
                      <div className="va-date">{r.date}</div>
                      <div className="va-day">{r.day_name}</div>
                    </td>
                    <td>
                      <div className="bm-staff-name">{r.user_name}</div>
                      <div className="bm-staff-role">{r.user_role_display || r.user_role}</div>
                    </td>
                    <td className="va-time">{r.check_in ? r.check_in.slice(0, 5) : '—'}</td>
                    <td className="va-time">{r.check_out ? r.check_out.slice(0, 5) : '—'}</td>
                    <td><StatusBadge status={r.status} display={r.status_display} /></td>
                    <td className="va-hours">{r.total_hours ? `${r.total_hours}h` : '—'}</td>
                    <td>{r.late_minutes > 0 ? <span className="va-late">{r.late_minutes}m</span> : '—'}</td>
                    <td className="va-marked-by">{r.marked_by_name || '—'}</td>
                    <td>
                      <div className="va-actions">
                        <button className="va-action-btn view" title="View Details" onClick={() => setViewStaffId(r.user_id || r.user || r.staff_id || r.id)}>
                          <Eye size={14} style={{ color: '#0ea5e9' }} />
                        </button>
                        <button className="va-action-btn edit" title="Edit" onClick={() => setEditRecord(r)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="va-action-btn delete" title="Delete" onClick={() => setDeleteId(r.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="va-pagination">
            <span className="va-pag-info">
              Page {pagination.page} of {pagination.total_pages} · {pagination.total_count} total
            </span>
            <div className="va-pag-btns">
              <button
                className="va-pag-btn"
                disabled={pagination.page <= 1}
                onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
              ><ChevronLeft size={16} /></button>
              {Array.from({ length: Math.min(pagination.total_pages, 5) }, (_, i) => {
                const pg = i + 1;
                return (
                  <button key={pg}
                    className={`va-pag-btn ${pagination.page === pg ? 'va-pag-active' : ''}`}
                    onClick={() => setFilters(p => ({ ...p, page: pg }))}
                  >{pg}</button>
                );
              })}
              <button
                className="va-pag-btn"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
              ><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editRecord && (
        <EditModal record={editRecord} onClose={() => setEditRecord(null)} onSaved={() => { setEditRecord(null); fetchRecords(); }} />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="am-overlay">
          <div className="am-modal" style={{ maxWidth: 380 }}>
            <div className="am-header">
              <div className="am-header-left">
                <div className="am-header-icon" style={{ background: '#fee2e2' }}><Trash2 size={18} style={{ color: '#ef4444' }} /></div>
                <div>
                  <h3 className="am-title">Delete Record</h3>
                  <p className="am-subtitle">This action cannot be undone.</p>
                </div>
              </div>
            </div>
            <div className="am-body">
              <p style={{ color: '#475569', fontSize: 14, margin: '8px 0' }}>
                Are you sure you want to delete this attendance record? The data will be permanently removed.
              </p>
            </div>
            <div className="am-footer">
              <button onClick={() => setDeleteId(null)} className="am-btn-cancel">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                className="am-btn-save" style={{ background: '#ef4444' }}>
                {deleting ? <span className="am-spinner" /> : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
