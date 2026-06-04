// Appointment Management page for Receptionist
import { useState, useMemo, useEffect, useCallback } from "react";
import receptionistApi from "../../api/receptionistApi";
import "./appointments.css";

const QUICK_ACTIONS = [
  { label: "Book\nAppointment", color: "#4474f6", bgColor: "rgba(68, 116, 246, 0.08)", borderColor: "rgba(68, 116, 246, 0.25)", icon: "book" },
  { label: "Reschedule\nAppointment", color: "#6366f1", bgColor: "rgba(99, 102, 241, 0.08)", borderColor: "rgba(99, 102, 241, 0.25)", icon: "reschedule" },
  { label: "Cancel\nAppointment", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.25)", icon: "cancel" },
  { label: "Physician\nCalendar", color: "#4474f6", bgColor: "rgba(68, 116, 246, 0.08)", borderColor: "rgba(68, 116, 246, 0.25)", icon: "calendar" },
];

function QuickActionIcon({ type, color }) {
  switch (type) {
    case "book":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="12" y1="14" x2="12" y2="18" />
          <line x1="10" y1="16" x2="14" y2="16" />
        </svg>
      );
    case "reschedule":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M14 14l2 2-2 2" />
          <path d="M10 18l-2-2 2-2" />
        </svg>
      );
    case "cancel":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="10" y1="14" x2="14" y2="18" />
          <line x1="14" y1="14" x2="10" y2="18" />
        </svg>
      );
    case "calendar":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="12" cy="15" r="2" />
        </svg>
      );
    default:
      return null;
  }
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
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

const ITEMS_PER_PAGE = 10;

export default function Appointments({ onBook, onReschedule, onCalendar, isEmbedded = false }) {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ today: 0, upcoming: 0, rescheduled: 0, cancelled: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (searchQuery.trim()) {
        data = await receptionistApi.searchAppointments(searchQuery.trim());
      } else {
        const params = {};
        if (departmentFilter !== "all") params.department = departmentFilter;
        if (doctorFilter !== "all") params.doctor = doctorFilter;
        if (dateFilter) params.date = dateFilter;
        data = await receptionistApi.getDailyAppointments(params);
      }
      
      const apptList = Array.isArray(data) ? data : (data.appointments || data.results || []);
      setAppointments(apptList);
      setTotalCount(data.total_count || data.count || apptList.length);
      if (data.summary && !searchQuery.trim()) {
        const s = data.summary;
        setStats({
          today: s.total ?? apptList.length,
          upcoming: s.scheduled ?? 0,
          rescheduled: s.rescheduled ?? 0,
          cancelled: s.cancelled ?? 0,
        });
      } else {
        setStats({
          today: apptList.length,
          upcoming: apptList.filter(a => a.status === "SCHEDULED").length,
          rescheduled: apptList.filter(a => a.status === "RESCHEDULED").length,
          cancelled: apptList.filter(a => a.status === "CANCELLED").length,
        });
      }
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setError("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [departmentFilter, doctorFilter, dateFilter, searchQuery]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const data = await receptionistApi.getDepartmentList();
      const list = Array.isArray(data) ? data : (data.departments || data.results || []);
      setDepartments(list);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Fetch doctors
  const fetchDoctors = useCallback(async () => {
    try {
      const data = await receptionistApi.getDoctorList();
      const list = Array.isArray(data) ? data : (data.doctors || data.results || []);
      setDoctors(list);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Client-side filtering (status and type only — doctor/dept/date are server-side)
  const filteredAppointments = useMemo(() => {
    let result = [...appointments];
    if (statusFilter !== "all") {
      result = result.filter(a => (a.status || "").toUpperCase() === statusFilter.toUpperCase());
    }
    if (typeFilter !== "all") {
      result = result.filter(a => (a.appointment_type || a.type || "").toLowerCase().includes(typeFilter.toLowerCase()));
    }
    return result;
  }, [appointments, statusFilter, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE) || 1;
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, doctorFilter, typeFilter, departmentFilter, dateFilter]);

  const STATS_DISPLAY = [
    { label: "Today's appointments", value: stats.today },
    { label: "Upcoming appointments", value: stats.upcoming },
    { label: "Rescheduled today", value: stats.rescheduled },
    { label: "Cancelled today", value: stats.cancelled },
  ];

  return (
    <div className="appt-page">
      {!isEmbedded && (
        <>
          {/* Header */}
          <div className="appt-header">
            <h2 className="appt-title">Appointment management</h2>
            <p className="appt-subtitle">Manage patient appointments, schedules, and consultation bookings.</p>
          </div>

          {/* Quick Action Cards */}
          <div className="appt-quick-actions">
        {QUICK_ACTIONS.map((action, idx) => (
          <button
            key={idx}
            className="appt-action-card"
            style={{
              "--action-color": action.color,
              "--action-bg": action.bgColor,
              "--action-border": action.borderColor,
            }}
            onClick={() => {
              if (action.icon === "book" && onBook) {
                onBook();
              } else if (action.icon === "reschedule" && onReschedule) {
                onReschedule(null);
              } else if (action.icon === "calendar" && onCalendar) {
                onCalendar();
              }
            }}
          >
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
        </>
      )}

      {/* Filter Bar */}
      <div className="appt-filter-bar">
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <input
            id="apptSearchInput"
            type="text"
            placeholder="Search appointments..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchQuery(searchInput);
                setCurrentPage(1);
              }
            }}
            style={{
              padding: "10px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              width: "100%",
              background: "white",
            }}
          />
          <button 
            onClick={() => { setSearchQuery(searchInput); setCurrentPage(1); }}
            style={{
              position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#64748b"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
        <div style={{ position: "relative" }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); setSearchQuery(""); }}
            style={{
              padding: "10px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              color: dateFilter ? "#0f172a" : "#94a3b8",
              background: "white",
            }}
          />
        </div>
        <div className="appt-filter-select-wrapper">
          <select
            className="appt-filter-select"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
          >
            <option value="all">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.name || doc.doctor_name}>
                {doc.name || doc.doctor_name}
              </option>
            ))}
          </select>
        </div>
        <div className="appt-filter-select-wrapper">
          <select
            className="appt-filter-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name || dept.department_name}
              </option>
            ))}
          </select>
        </div>
        <div className="appt-filter-select-wrapper">
          <select
            className="appt-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Type</option>
            <option value="REGULAR">Regular</option>
            <option value="FOLLOWUP">Follow Up</option>
            <option value="NEW">New</option>
          </select>
        </div>
        <div className="appt-filter-select-wrapper">
          <select
            className="appt-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
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
          <thead>
            <tr>
              <th>Appointment ID</th>
              <th>Patient name</th>
              <th>Doctor</th>
              <th>Time</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px 0", color: "#718096" }}>
                  Loading appointments...
                </td>
              </tr>
            ) : paginatedAppointments.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px 0", color: "#718096" }}>
                  No appointments found.
                </td>
              </tr>
            ) : (
              paginatedAppointments.map((appt, idx) => {
                const patientName = appt.patient_name || appt.name || "-";
                const patientPhone = appt.patient_phone || appt.phone || appt.mobile || "";
                const appointmentId = appt.appointment_id || appt.id || "-";
                const doctorName = appt.doctor_name || appt.doctor || "-";
                const apptType = appt.appointment_type || appt.type || appt.visit_type || "-";
                const apptStatus = appt.status_display || appt.status || "Scheduled";
                const statusClass = (appt.status || "").toLowerCase();
                const appointment_time = appt.time_display || "-";
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
                          <EditIcon />
                        </button>
                        <button className="appt-action-btn" title="View">
                          <ViewIcon />
                        </button>
                        <button 
                          className="appt-action-btn" 
                          title="Reschedule"
                          onClick={() => {
                            if (onReschedule && appt.id) {
                              onReschedule(appt.id);
                            }
                          }}
                        >
                          <RescheduleIcon />
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
          <button
            className="appt-page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            &lt;
          </button>
          <button
            className="appt-page-btn active"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}