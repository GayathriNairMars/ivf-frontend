import React, { useState, useEffect, useCallback } from "react";
import receptionistApi from "../../api/receptionistApi";
import { 
  CalendarPlus, UserPlus, Ticket, Users, 
  Calendar as CalendarIcon, Hourglass, UserCircle,
  Clock, MapPin, Eye, Edit, Calendar, Download, RefreshCw, Briefcase, FileText
} from "lucide-react";
import "./dashboard.css";
export default function RecDashboardHome({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date range filter state
  const [dateRange, setDateRange] = useState("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Switch tab – reset custom dates when leaving custom
  const handleRangeChange = (range) => {
    setDateRange(range);
    if (range !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Build query params from current filter state
  const buildParams = useCallback(() => {
    if (dateRange === "daily") return {};
    if (dateRange === "custom") {
      if (!startDate || !endDate) return null; // not ready yet
      return { range: "custom", start_date: startDate, end_date: endDate };
    }
    return { range: dateRange }; // weekly | monthly
  }, [dateRange, startDate, endDate]);

  const load = useCallback(async () => {
    const params = buildParams();
    if (params === null) return; // custom range not fully specified yet
    try {
      setLoading(true);
      const [statsRes, ticketsRes] = await Promise.all([
        receptionistApi.getDashboardStats(params),
        receptionistApi.getTodayTickets(),
      ]);
      setStats(statsRes);
      setTickets(ticketsRes.tickets || ticketsRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Re-fetch whenever filter changes; also poll every 30s
  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <div className="rec-dash-loading">Loading Dashboard...</div>;
  if (!stats) return <div className="rec-dash-loading">Error loading dashboard</div>;

  const { receptionist_info, clinic_info, todays_stats, doctor_status, registered_today, today_appointments, notifications } = stats;

  return (
    <div className="rec-dash-container">
      {/* Header Info */}
      <div className="rec-dash-header">
        <div className="rec-dash-greeting">
          <h2>Good Morning, {receptionist_info?.name || "User"}</h2>
          <div className="rec-dash-subtitle">
            <span className="subtitle-item">
              <UserCircle size={14} /> {receptionist_info?.role} • {receptionist_info?.employee_id}
            </span>
            <span className="subtitle-item">
              <Clock size={14} /> {receptionist_info?.shift}
            </span>
            <span className="subtitle-item">
              <MapPin size={14} /> {clinic_info?.name}, {clinic_info?.location?.split(',')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rec-dash-actions">
        <button className="action-btn" onClick={() => onNavigate('book_appointment')}>
          <div className="action-icon blue"><CalendarPlus size={20} /></div>
          <span>Book Appointment</span>
        </button>
        <button className="action-btn" onClick={() => onNavigate('directory')}>
          <div className="action-icon teal"><UserPlus size={20} /></div>
          <span>Register new patient</span>
        </button>
        <button className="action-btn" onClick={() => onNavigate('ticket')}>
          <div className="action-icon purple"><Ticket size={20} /></div>
          <span>Generate OP ticket</span>
        </button>
        <button className="action-btn" onClick={() => onNavigate('queue')}>
          <div className="action-icon pink"><Users size={20} /></div>
          <span>Manage queue</span>
        </button>
      </div>

      {/* Time Filters & Export */}
      <div className="rec-dash-filters">
        <div className="time-tabs">
          {["daily", "weekly", "monthly", "custom"].map((r) => (
            <button
              key={r}
              className={`time-tab ${dateRange === r ? "active" : ""}`}
              onClick={() => handleRangeChange(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {dateRange === "custom" && (
          <div className="custom-date-picker">
            <div className="date-field">
              <label>From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
              />
            </div>
            <span className="date-sep">→</span>
            <div className="date-field">
              <label>To</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input"
              />
            </div>
          </div>
        )}

        <button className="generate-report-btn">
          <Download size={14} /> Generate Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="rec-dash-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <CalendarIcon size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Appointments today</span>
            <span className="stat-value">{todays_stats?.appointments_scheduled || todays_stats?.appointments_completed || 56}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper red">
            <Hourglass size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Patients waiting</span>
            <span className="stat-value">{stats?.queue_stats?.total_waiting || 18}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <Ticket size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">OP tickets generated</span>
            <span className="stat-value">{todays_stats?.tickets_generated || 142}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <UserPlus size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Today's registration</span>
            <span className="stat-value">{todays_stats?.patients_registered || 24}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="rec-dash-main-layout">
        
        {/* Left Column */}
        <div className="rec-dash-left">
          
          {/* Today's Appointments */}
          <div className="panel">
            <div className="panel-header">
              <h3>Today's Appointments</h3>
              <div className="panel-actions">
                <select className="dept-select">
                  <option>All Departments</option>
                </select>
                <a href="#" className="view-all">View all</a>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="rec-table">
                <thead>
                  <tr>
                    <th>Appointment ID</th>
                    <th>Patient name</th>
                    <th>Doctor</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {today_appointments?.length > 0 ? (
                    today_appointments.map((apt, idx) => (
                      <tr key={idx}>
                        <td>{apt.patient_mrn || apt.id || `APT-20255`}</td>
                        <td className="fw-600">{apt.patient_name}</td>
                        <td className="fw-600">Dr. {apt.doctor_name}</td>
                        <td>{apt.time}</td>
                        <td>{apt.type}</td>
                        <td>
                          <span className={`status-badge ${apt.status?.toLowerCase() || 'completed'}`}>
                            • {apt.status || 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                     <tr>
                        <td>PAT-20255</td>
                        <td className="fw-600">Aswathy</td>
                        <td className="fw-600">Dr. Sarah Thomas</td>
                        <td>09:00AM</td>
                        <td>Follow up</td>
                        <td><span className="status-badge completed">• Completed</span></td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="panel-footer">
              <span>Showing {today_appointments?.length || 4} of 42 Patients</span>
              <div className="pagination">
                <button disabled>&lt;</button>
                <button>&gt;</button>
              </div>
            </div>
          </div>

          {/* Doctor Availability */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Doctor Availability</h3>
                <span className="subtitle">Monitor doctor status, patient load, and consultation capacity</span>
              </div>
              <div className="panel-actions">
                <button className="refresh-btn"><RefreshCw size={14} /> Refresh Status</button>
                <button className="view-schedule-btn">View Full Schedule</button>
              </div>
            </div>
            <div className="doc-filters">
              <span className="doc-filter active">All</span>
              <span className="doc-filter"><span className="dot green"></span> Available ({doctor_status?.filter(d => d.status === 'available').length || 4})</span>
              <span className="doc-filter"><span className="dot orange"></span> In Consultation ({doctor_status?.filter(d => d.status === 'in_consultation').length || 3})</span>
              <span className="doc-filter"><span className="dot red"></span> On Break ({doctor_status?.filter(d => d.status === 'on_break').length || 1})</span>
            </div>
            <div className="doc-cards-grid">
              {doctor_status?.map((doc, idx) => (
                <div className="doc-card" key={idx}>
                  <div className="doc-header">
                    <div>
                      <h4>Dr. {doc.name}</h4>
                      <span className="doc-spec">{doc.specialization}</span>
                    </div>
                    <span className="room-badge">RM {doc.room}</span>
                  </div>
                  <div className={`doc-status-badge ${doc.status_color || (doc.status === 'available' ? 'green' : 'orange')}`}>
                    • {doc.status}
                  </div>
                  <div className="doc-workload">
                    <div className="workload-text">
                      <span>Workload</span>
                      <span className="fw-600">{doc.patients_seen_today} / {doc.total_capacity} Patients</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-fill ${doc.status_color}`} style={{width: `${(doc.patients_seen_today/doc.total_capacity)*100}%`}}></div>
                    </div>
                  </div>
                  <div className="doc-current-patient">
                    {doc.current_patient ? (
                      <>
                        <span className="label">Current</span>
                        <span className="val">{doc.current_patient} <span className="text-muted">#TK-{doc.current_token || '101'}</span></span>
                      </>
                    ) : (
                      <span className="text-muted" style={{padding: '4px 0'}}>No current patient session</span>
                    )}
                  </div>
                  <div className="doc-actions">
                    <button className="doc-btn outline">Schedule</button>
                    <button className="doc-btn filled">Assign Patient</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Tickets — shown as "Recent Registrations" */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Today's Queue</h3>
                <span className="subtitle">Tickets generated today via /api/receptionist/tickets/today/</span>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="rec-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Patient name</th>
                    <th>Doctor</th>
                    <th>Treatment</th>
                    <th>Registered date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length > 0 ? (
                    tickets.map((t) => {
                      const statusKey = (t.status || "").toLowerCase();
                      const statusLabel = t.status_display || t.status || "—";
                      const formattedDate = t.created_at
                        ? new Date(t.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "—";
                      return (
                        <tr key={t.id}>
                          <td>
                            <span style={{ fontWeight: 600, color: "#6366f1" }}>#{t.token_number}</span>
                            <br />
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{t.patient_id_str}</span>
                          </td>
                          <td className="fw-600">{t.patient_name || "—"}</td>
                          <td className="fw-600">
                            {t.doctor_name ? `Dr. ${t.doctor_name}` : <span style={{ color: "#94a3b8" }}>Not assigned</span>}
                            {t.department_name && (
                              <><br /><span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 400 }}>{t.department_name}</span></>
                            )}
                          </td>
                          <td>{t.visit_reason_display || "—"}</td>
                          <td style={{ fontSize: "0.8rem" }}>{formattedDate}</td>
                          <td>
                            <span className={`status-badge ${statusKey}`}>
                              • {statusLabel}
                            </span>
                          </td>
                          <td>
                            <div className="action-icons">
                              <Edit size={16} style={{ cursor: "pointer" }} />
                              <Eye size={16} style={{ cursor: "pointer" }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                        No tickets generated today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="panel-footer">
              <span>Showing <strong>{tickets.length}</strong> ticket{tickets.length !== 1 ? "s" : ""} today</span>
              <div className="pagination">
                <button disabled>&lt;</button>
                <button disabled={tickets.length <= 10}>&gt;</button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="rec-dash-right">
          
          {/* Urgent Alerts */}
          <div className="alerts-panel">
            <h3 className="alerts-title"><Briefcase size={16} className="text-red" /> Urgent Alerts</h3>
            
            {notifications?.map((notif, idx) => (
              <div className="alert-card" key={idx}>
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                {notif.action_required && <a href={notif.action_url} className="alert-link">Verify now</a>}
              </div>
            ))}

            <div className="alert-card">
              <h4>Wait Time Alert</h4>
              <p>Gynaecology OPD exceeds 30m threshold.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}