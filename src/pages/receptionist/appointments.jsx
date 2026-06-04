// Appointment Management page for Receptionist
import { useState, useMemo, useEffect, useCallback } from "react";
import receptionistApi from "../../api/receptionistApi";
import { CalendarPlus, CalendarClock, CalendarX2, BriefcaseMedical, Trash2, X } from "lucide-react";
import "./appointments.css";

const QUICK_ACTIONS = [
  { label: "Book\nAppointment",      color: "#4474f6", bgColor: "rgba(68, 116, 246, 0.08)",  borderColor: "rgba(68, 116, 246, 0.25)",  icon: "book"      },
  { label: "Reschedule\nAppointment",color: "#6366f1", bgColor: "rgba(99, 102, 241, 0.08)",  borderColor: "rgba(99, 102, 241, 0.25)",  icon: "reschedule" },
  { label: "Cancel\nAppointment",    color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.08)",   borderColor: "rgba(239, 68, 68, 0.25)",   icon: "cancel"    },
  { label: "Physician\nCalendar",    color: "#4474f6", bgColor: "rgba(68, 116, 246, 0.08)",  borderColor: "rgba(68, 116, 246, 0.25)",  icon: "calendar"  },
];

const CANCEL_REASONS = [
  { value: "patient_request",   label: "Patient Request"   },
  { value: "doctor_unavailable",label: "Doctor Unavailable"},
  { value: "emergency",         label: "Emergency"         },
  { value: "scheduling_conflict",label: "Scheduling Conflict"},
  { value: "other",             label: "Other"             },
];

function QuickActionIcon({ type, color }) {
  const props = { size: 22, color, strokeWidth: 2 };
  switch (type) {
    case "book":       return <CalendarPlus      {...props} />;
    case "reschedule": return <CalendarClock     {...props} />;
    case "cancel":     return <CalendarX2        {...props} />;
    case "calendar":   return <BriefcaseMedical  {...props} />;
    default:           return null;
  }
}

function ViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function RescheduleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ArrowLinkIcon({ color }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

// ── Cancel Appointment Modal ──────────────────────────────────────────────────
function CancelModal({ appointment, onClose, onSuccess }) {
  const [reason, setReason]   = useState("patient_request");
  const [notes, setNotes]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const appointmentId = appointment.id;
  const patientName   = appointment.patient_name   || appointment.name || "-";

  const handleConfirm = async () => {
    if (!notes.trim()) {
      setError("Please add a note before confirming.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await receptionistApi.deleteAppointment(appointmentId, { reason, notes: notes.trim() });
      onSuccess();
    } catch (err) {
      console.error("Cancel failed:", err);
      setError("Failed to cancel appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="cancel-modal-backdrop" onClick={handleBackdrop}>
      <div className="cancel-modal">
        {/* Header */}
        <div className="cancel-modal-header">
          <div className="cancel-modal-title-row">
            <div className="cancel-modal-icon-wrap">
              <Trash2 size={18} color="#ef4444" strokeWidth={2} />
            </div>
            <div>
              <h3 className="cancel-modal-title">Cancel Appointment</h3>
              <p className="cancel-modal-sub">This will cancel the appointment for <strong>{patientName}</strong></p>
            </div>
          </div>
          <button className="cancel-modal-close" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="cancel-modal-body">
          {error && <div className="cancel-modal-error">{error}</div>}

          {/* Reason */}
          <div className="cancel-modal-field">
            <label className="cancel-modal-label">Reason <span className="cancel-required">*</span></label>
            <select
              className="cancel-modal-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
            >
              {CANCEL_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="cancel-modal-field">
            <label className="cancel-modal-label">Notes <span className="cancel-required">*</span></label>
            <textarea
              className="cancel-modal-textarea"
              placeholder="e.g. Patient called to cancel"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="cancel-modal-footer">
          <button className="cancel-modal-btn-secondary" onClick={onClose} disabled={loading}>
            Keep Appointment
          </button>
          <button
            className="cancel-modal-btn-danger"
            onClick={handleConfirm}
            disabled={loading || !notes.trim()}
          >
            {loading ? "Cancelling…" : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

export default function Appointments() {
  const [appointments,     setAppointments]     = useState([]);
  const [stats,            setStats]            = useState({ today: 0, upcoming: 0, rescheduled: 0, cancelled: 0 });
  const [totalCount,       setTotalCount]       = useState(0);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [doctorFilter,     setDoctorFilter]     = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [typeFilter,       setTypeFilter]       = useState("all");
  const [statusFilter,     setStatusFilter]     = useState("all");
  const [currentPage,      setCurrentPage]      = useState(1);
  const [departments,      setDepartments]      = useState([]);
  const [doctors,          setDoctors]          = useState([]);
  const [dateFilter,       setDateFilter]       = useState("");
  const [cancelTarget,     setCancelTarget]     = useState(null); // appointment being cancelled

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (departmentFilter !== "all") params.department = departmentFilter;
      if (doctorFilter     !== "all") params.doctor     = doctorFilter;
      if (dateFilter)                  params.date       = dateFilter;
      const data    = await receptionistApi.getDailyAppointments(params);
      const apptList = Array.isArray(data) ? data : (data.appointments || data.results || []);
      setAppointments(apptList);
      setTotalCount(data.total_count || data.count || apptList.length);
      if (data.summary) {
        const s = data.summary;
        setStats({ today: s.total ?? apptList.length, upcoming: s.scheduled ?? 0, rescheduled: s.rescheduled ?? 0, cancelled: s.cancelled ?? 0 });
      } else {
        setStats({
          today:      apptList.length,
          upcoming:   apptList.filter(a => a.status === "SCHEDULED").length,
          rescheduled:apptList.filter(a => a.status === "RESCHEDULED").length,
          cancelled:  apptList.filter(a => a.status === "CANCELLED").length,
        });
      }
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setError("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [departmentFilter, doctorFilter, dateFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const fetchDepartments = useCallback(async () => {
    try {
      const data = await receptionistApi.getDepartments();
      setDepartments(Array.isArray(data) ? data : (data.departments || data.results || []));
    } catch (err) { console.error("Failed to fetch departments:", err); }
  }, []);
  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const fetchDoctors = useCallback(async () => {
    try {
      const data = await receptionistApi.getDoctors();
      setDoctors(Array.isArray(data) ? data : (data.doctors || data.results || []));
    } catch (err) { console.error("Failed to fetch doctors:", err); }
  }, []);
  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  // After successful cancellation — close modal and refetch to update KPIs + table
  const handleCancelSuccess = () => {
    setCancelTarget(null);
    fetchAppointments();
  };

  // Client-side filtering
  const filteredAppointments = useMemo(() => {
    let result = [...appointments];
    if (statusFilter !== "all") result = result.filter(a => (a.status || "").toUpperCase() === statusFilter.toUpperCase());
    if (typeFilter   !== "all") result = result.filter(a => (a.appointment_type || a.type || "").toLowerCase().includes(typeFilter.toLowerCase()));
    return result;
  }, [appointments, statusFilter, typeFilter]);

  const totalPages           = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE) || 1;
  const paginatedAppointments = filteredAppointments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, doctorFilter, typeFilter, departmentFilter, dateFilter]);

  const STATS_DISPLAY = [
    { label: "Today's appointments",  value: stats.today      },
    { label: "Upcoming appointments", value: stats.upcoming   },
    { label: "Rescheduled today",     value: stats.rescheduled},
    { label: "Cancelled today",       value: stats.cancelled  },
  ];

  return (
    <div className="appt-page">
      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSuccess={handleCancelSuccess}
        />
      )}

      {/* Header */}
      <div className="appt-header">
        <h2 className="appt-title">Appointment management</h2>
        <p className="appt-subtitle">Manage patient appointments, schedules, and consultation bookings.</p>
      </div>

      {/* Quick Action Cards */}
      <div className="appt-quick-actions">
        {QUICK_ACTIONS.map((action, idx) => (
          <button key={idx} className="appt-action-card" style={{ "--action-color": action.color, "--action-bg": action.bgColor, "--action-border": action.borderColor }}>
            <div className="appt-action-icon">
              <QuickActionIcon type={action.icon} color={action.color} />
            </div>
            <span className="appt-action-label">{action.label}</span>
            <div className="appt-action-arrow">
              <ArrowLinkIcon color={action.color} />
            </div>
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="appt-stats-row">
        {STATS_DISPLAY.map((stat, idx) => (
          <div key={idx} className="appt-stat-card">
            <span className="appt-stat-label">{stat.label}</span>
            <span className="appt-stat-value">{loading ? "-" : stat.value}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="appt-filter-bar">
        <div style={{ position: "relative" }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", color: dateFilter ? "#0f172a" : "#94a3b8", background: "white" }}
          />
        </div>
        <div className="appt-filter-select-wrapper">
          <select className="appt-filter-select" value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}>
            <option value="all">All Doctors</option>
            {doctors.map((doc) => <option key={doc.id} value={doc.full_name || "-"}>{doc.full_name || "-"}</option>)}
          </select>
        </div>
        <div className="appt-filter-select-wrapper">
          <select className="appt-filter-select" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="all">Department</option>
            {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name || dept.department_name}</option>)}
          </select>
        </div>
        <div className="appt-filter-select-wrapper">
          <select className="appt-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">Type</option>
            <option value="REGULAR">Regular</option>
            <option value="FOLLOWUP">Follow Up</option>
            <option value="NEW">New</option>
          </select>
        </div>
        <div className="appt-filter-select-wrapper">
          <select className="appt-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
            <option value="RESCHEDULED">Rescheduled</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="appt-table-container">
        {error && (
          <div className="appt-error-banner">
            {error}
            <button onClick={fetchAppointments} className="appt-retry-btn">Retry</button>
          </div>
        )}
        <table className="appt-table">
          <colgroup>
            <col /><col /><col /><col /><col /><col /><col /><col />
          </colgroup>
          <thead>
            <tr>
              <th>Appointment ID</th>
              <th>Patient name</th>
              <th>Doctor</th>
              <th>Department</th>
              <th>Time</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "40px 0", color: "#718096" }}>Loading appointments...</td></tr>
            ) : paginatedAppointments.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "40px 0", color: "#718096" }}>No appointments found.</td></tr>
            ) : (
              paginatedAppointments.map((appt, idx) => {
                const patientName      = appt.patient_name  || appt.name    || "-";
                const patientPhone     = appt.patient_phone || appt.phone   || appt.mobile || "";
                const appointmentId    = appt.appointment_id || appt.id     || "-";
                const doctorName       = appt.doctor_name   || appt.doctor  || "-";
                const department       = appt.department_name || "-";
                const apptType         = appt.appointment_type || appt.type || appt.visit_type || "-";
                const apptStatus       = appt.status_display  || appt.status || "Scheduled";
                const statusClass      = (appt.status || "").toLowerCase().replace(/_/g, "-");
                const appointment_time = appt.time_display || "-";
                const isCancelled      = (appt.status || "").toUpperCase() === "CANCELLED";
                return (
                  <tr key={appt.id || idx}>
                    <td className="appt-id-cell">{appointmentId}</td>
                    <td>
                      <div className="appt-patient-info">
                        <span className="appt-patient-name">{patientName}</span>
                        {patientPhone && <span className="appt-patient-phone">{patientPhone}</span>}
                      </div>
                    </td>
                    <td className="appt-doctor-cell">{doctorName}</td>
                    <td className="appt-doctor-cell">{department}</td>
                    <td className="appt-time-cell">{appointment_time}</td>
                    <td className="appt-type-cell">{apptType}</td>
                    <td>
                      <span className={`appt-status-badge ${statusClass}`}>
                        <span className="appt-status-dot" />
                        {apptStatus}
                      </span>
                    </td>
                    <td>
                      <div className="appt-actions">
                        <button className="appt-action-btn" title="Edit">
                          <RescheduleIcon />
                        </button>
                        <button className="appt-action-btn" title="View">
                          <ViewIcon />
                        </button>
                        <button
                          className="appt-action-btn appt-action-btn--delete"
                          title="Cancel appointment"
                          disabled={isCancelled}
                          onClick={() => setCancelTarget(appt)}
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="appt-pagination">
        <span className="appt-pagination-info">
          Showing <strong>{paginatedAppointments.length}</strong> of <strong className="appt-pagination-total">{filteredAppointments.length}</strong> Patients
        </span>
        <div className="appt-pagination-controls">
          <button className="appt-page-btn" disabled={currentPage === 1}      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>&lt;</button>
          <button className="appt-page-btn active" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>&gt;</button>
        </div>
      </div>
    </div>
  );
}