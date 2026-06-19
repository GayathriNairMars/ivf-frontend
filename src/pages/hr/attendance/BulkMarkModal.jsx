import React, { useState, useEffect } from 'react';
import './hr_attendance.css';
import { X, CheckCircle, Users, Calendar, AlertCircle } from 'lucide-react';
import hrApi from '../../../api/hrApi';

const STATUS_OPTS = ['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE', 'HALF_DAY', 'WORK_FROM_HOME'];
const STATUS_COLOR = {
  PRESENT: '#22c55e', ABSENT: '#ef4444', LATE: '#f97316',
  ON_LEAVE: '#8b5cf6', HALF_DAY: '#0ea5e9', WORK_FROM_HOME: '#64748b',
};

export default function BulkMarkModal({ isOpen, onClose, onSaved }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) { fetchStaff(); setResult(null); setError(''); }
  }, [isOpen]);

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await hrApi.getStaff();
      const list = res.data || res.staff || (Array.isArray(res) ? res : []);
      setRows(list.map(s => ({
        user_id: s.id, name: s.full_name || s.name || s.username,
        role: s.role_display || s.role || '', check_in: '09:00',
        check_out: '17:00', status: 'PRESENT', remarks: '', selected: true,
      })));
    } catch (e) { console.error(e); }
    finally { setStaffLoading(false); }
  };

  const updateRow = (idx, field, value) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  const toggleAll = (checked) => setRows(prev => prev.map(r => ({ ...r, selected: checked })));
  const setAllStatus = (status) => setRows(prev => prev.map(r => r.selected ? { ...r, status } : r));
  const selectedCount = rows.filter(r => r.selected).length;
  const filteredRows = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    const selected = rows.filter(r => r.selected);
    if (!selected.length) { setError('Select at least one staff member.'); return; }
    setSaving(true); setError('');
    try {
      const res = await hrApi.bulkMarkAttendance({
        date,
        attendances: selected.map(r => ({
          user_id: r.user_id,
          check_in: ['ON_LEAVE', 'ABSENT'].includes(r.status) ? null : r.check_in,
          check_out: ['ON_LEAVE', 'ABSENT'].includes(r.status) ? null : r.check_out,
          status: r.status, remarks: r.remarks,
        })),
      });
      if (res.success) { setResult(res); }
      else { setError(res.message || 'Bulk mark failed.'); }
    } catch (e) { setError(e?.response?.data?.error || 'Server error. Try again.'); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="am-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bm-modal">
        <div className="am-header">
          <div className="am-header-left">
            <div className="am-header-icon"><Users size={18} /></div>
            <div>
              <h3 className="am-title">Bulk Mark Attendance</h3>
              <p className="am-subtitle">{selectedCount} of {rows.length} staff selected · {date}</p>
            </div>
          </div>
          <button className="am-close" onClick={onClose}><X size={20} /></button>
        </div>

        {result ? (
          <div className="bm-result">
            <div className="bm-result-icon"><CheckCircle size={48} /></div>
            <h3 className="bm-result-title">Bulk Attendance Processed!</h3>
            <p className="bm-result-msg">{result.message}</p>
            <div className="bm-result-stats">
              <div className="bm-stat-box created"><div className="bm-stat-num">{result.created}</div><div className="bm-stat-lbl">Created</div></div>
              <div className="bm-stat-box updated"><div className="bm-stat-num">{result.updated}</div><div className="bm-stat-lbl">Updated</div></div>
            </div>
            {result.success_data && (
              <div className="bm-success-list">
                {result.success_data.slice(0, 6).map((d, i) => (
                  <div key={i} className="bm-success-item">
                    <span className="bm-success-name">{d.user_name}</span>
                    <span className="bm-success-status" style={{ color: STATUS_COLOR[d.status] }}>{d.status}</span>
                  </div>
                ))}
                {result.success_data.length > 6 && <p className="bm-more">+{result.success_data.length - 6} more</p>}
              </div>
            )}
            <button onClick={() => { onSaved(); onClose(); }} className="am-btn-save" style={{ margin: '0 auto' }}>Done</button>
          </div>
        ) : (
          <>
            <div className="bm-controls">
              <div className="bm-top-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={14} style={{ color: '#64748b' }} />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="am-input" style={{ minWidth: 155 }} />
                </div>
                <input type="text" placeholder="Search staff..." value={search}
                  onChange={e => setSearch(e.target.value)} className="am-input bm-search" />
                <div className="bm-bulk-btns">
                  <span className="bm-bulk-label">Set all:</span>
                  {['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE'].map(s => (
                    <button key={s} className="bm-set-btn" onClick={() => setAllStatus(s)}
                      style={{ borderColor: STATUS_COLOR[s], color: STATUS_COLOR[s] }}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bm-table-wrap">
              {staffLoading ? (
                <div className="am-loading">Loading staff list...</div>
              ) : (
                <table className="bm-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" checked={rows.length > 0 && rows.every(r => r.selected)} onChange={e => toggleAll(e.target.checked)} /></th>
                      <th>STAFF</th><th>STATUS</th><th>CHECK IN</th><th>CHECK OUT</th><th>REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const realIdx = rows.indexOf(row);
                      const needsTime = !['ON_LEAVE', 'ABSENT'].includes(row.status);
                      return (
                        <tr key={row.user_id} className={row.selected ? 'bm-row-selected' : 'bm-row-dim'}>
                          <td><input type="checkbox" checked={row.selected} onChange={e => updateRow(realIdx, 'selected', e.target.checked)} /></td>
                          <td>
                            <div className="bm-staff-name">{row.name}</div>
                            <div className="bm-staff-role">{row.role}</div>
                          </td>
                          <td>
                            <select value={row.status} onChange={e => updateRow(realIdx, 'status', e.target.value)}
                              className="bm-status-select" style={{ color: STATUS_COLOR[row.status], borderColor: STATUS_COLOR[row.status] }}>
                              {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                          </td>
                          <td><input type="time" value={row.check_in} disabled={!needsTime} onChange={e => updateRow(realIdx, 'check_in', e.target.value)} className="bm-time-input" /></td>
                          <td><input type="time" value={row.check_out} disabled={!needsTime} onChange={e => updateRow(realIdx, 'check_out', e.target.value)} className="bm-time-input" /></td>
                          <td><input type="text" value={row.remarks} onChange={e => updateRow(realIdx, 'remarks', e.target.value)} placeholder="Remarks..." className="bm-remarks-input" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {error && <div className="am-error" style={{ margin: '0 20px 12px' }}><AlertCircle size={15} /> {error}</div>}

            <div className="am-footer">
              <span className="bm-footer-note">{selectedCount} staff will be marked</span>
              <button type="button" onClick={onClose} className="am-btn-cancel">Cancel</button>
              <button type="button" disabled={saving || selectedCount === 0} onClick={handleSubmit} className="am-btn-save">
                {saving ? <span className="am-spinner" /> : <><CheckCircle size={15} /> Process Bulk ({selectedCount})</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
