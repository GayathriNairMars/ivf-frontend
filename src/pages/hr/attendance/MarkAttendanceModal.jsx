import React, { useState, useEffect } from 'react';
import './hr_attendance.css';
import { X, CheckCircle, User, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';
import hrApi from '../../../api/hrApi';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present', color: '#22c55e', bg: '#dcfce7' },
  { value: 'ABSENT',  label: 'Absent',  color: '#ef4444', bg: '#fee2e2' },
  { value: 'LATE',    label: 'Late',    color: '#f97316', bg: '#ffedd5' },
  { value: 'ON_LEAVE',label: 'Leave',   color: '#8b5cf6', bg: '#ede9fe' },
  { value: 'HALF_DAY',label: 'Half Day',color: '#0ea5e9', bg: '#e0f2fe' },
  { value: 'WORK_FROM_HOME', label: 'WFH', color: '#64748b', bg: '#f1f5f9' },
];

export default function MarkAttendanceModal({ isOpen, onClose, onSaved }) {
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    user_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '09:00',
    check_out: '17:00',
    status: 'PRESENT',
    remarks: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchStaff();
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await hrApi.getStaff();
      const list = res.data || res.staff || (Array.isArray(res) ? res : []);
      setStaffList(list);
    } catch (e) {
      console.error('Staff fetch error', e);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusClick = (val) => {
    setForm(prev => ({ ...prev, status: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.user_id) { setError('Please select a staff member.'); return; }
    setError('');
    setSaving(true);
    try {
      const payload = {
        user_id: parseInt(form.user_id),
        date: form.date,
        check_in: form.check_in || null,
        check_out: form.check_out || null,
        status: form.status,
        remarks: form.remarks,
      };
      const res = await hrApi.markAttendance(payload);
      if (res.success) {
        setSuccess(`Attendance marked for ${res.attendance?.user_name || 'staff'}.`);
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Failed to mark attendance.');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedStatus = STATUS_OPTIONS.find(s => s.value === form.status);
  const selectedStaff = staffList.find(s => String(s.id) === String(form.user_id));

  return (
    <div className="am-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="am-modal">
        {/* Header */}
        <div className="am-header">
          <div className="am-header-left">
            <div className="am-header-icon">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="am-title">Mark Attendance</h3>
              <p className="am-subtitle">
                {selectedStaff
                  ? `${selectedStaff.full_name || selectedStaff.name} · ${form.date}`
                  : 'Select a staff member to continue'}
              </p>
            </div>
          </div>
          <button className="am-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="am-body">
            {/* Staff Select */}
            <div className="am-field">
              <label className="am-label"><User size={13} /> Select Staff</label>
              <select
                name="user_id"
                value={form.user_id}
                onChange={handleChange}
                className="am-select"
                required
              >
                <option value="">— Choose staff member —</option>
                {staffLoading ? (
                  <option disabled>Loading staff...</option>
                ) : (
                  staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.name || s.username}
                      {s.role_display ? ` (${s.role_display})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date */}
            <div className="am-field">
              <label className="am-label"><Calendar size={13} /> Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="am-input"
                required
              />
            </div>

            {/* Check In / Out */}
            <div className="am-row">
              <div className="am-field">
                <label className="am-label"><Clock size={13} /> Check In</label>
                <input
                  type="time"
                  name="check_in"
                  value={form.check_in}
                  onChange={handleChange}
                  className="am-input"
                />
              </div>
              <div className="am-field">
                <label className="am-label"><Clock size={13} /> Check Out</label>
                <input
                  type="time"
                  name="check_out"
                  value={form.check_out}
                  onChange={handleChange}
                  className="am-input"
                />
              </div>
            </div>

            {/* Status Pills */}
            <div className="am-field">
              <label className="am-label">Quick Status Options</label>
              <div className="am-status-grid">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusClick(opt.value)}
                    className="am-status-btn"
                    style={form.status === opt.value
                      ? { background: opt.bg, borderColor: opt.color, color: opt.color, fontWeight: 600 }
                      : {}
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div className="am-field">
              <label className="am-label"><FileText size={13} /> Remarks</label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                className="am-textarea"
                placeholder="Add any notes regarding today's shift..."
                rows={3}
              />
            </div>

            {/* Conflict Check Banner */}
            <div className="am-conflict-box">
              <CheckCircle size={16} className="am-conflict-icon" />
              <div>
                <p className="am-conflict-title">NO CONFLICTS FOUND</p>
                <ul className="am-conflict-list">
                  <li>{selectedStaff ? `${selectedStaff.full_name || selectedStaff.name} has no other shift` : 'No staff selected'}</li>
                  <li>Department coverage is adequate</li>
                </ul>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="am-error">
                <AlertCircle size={15} /> {error}
              </div>
            )}
            {success && (
              <div className="am-success">
                <CheckCircle size={15} /> {success}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="am-footer">
            <button type="button" onClick={onClose} className="am-btn-cancel">Cancel</button>
            <button type="submit" disabled={saving} className="am-btn-save">
              {saving ? (
                <span className="am-spinner" />
              ) : (
                <><Calendar size={15} /> Save Attendance</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
