import React, { useState, useEffect } from "react";
import { Download, Users, CheckCircle, XCircle, Calendar, Clock, RefreshCw, ListFilter, Search } from "lucide-react";
import hrApi from "../../../api/hrApi";
import MarkAttendanceModal from "./MarkAttendanceModal";
import BulkMarkModal from "./BulkMarkModal";
import ViewAllAttendance from "./ViewAllAttendance";
import "./hr_attendance.css";

export default function HRAttendance() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [view, setView] = useState("dashboard"); // "dashboard" | "viewall"
  const [timeFilter, setTimeFilter] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => { 
    if (timeFilter !== "custom") fetchDashboard(); 
  }, [timeFilter]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const params = { filter: timeFilter };
      if (timeFilter === "custom") {
        if (!customStart || !customEnd) {
          setLoading(false);
          return;
        }
        params.start_date = customStart;
        params.end_date = customEnd;
      }
      const res = await hrApi.getAttendanceDashboard(params);
      if (res.success) setDashboardData(res.dashboard);
    } catch (err) { console.error("Dashboard fetch failed", err); }
    finally { setLoading(false); }
  };

  if (view === "viewall") {
    return <ViewAllAttendance onClose={() => setView("dashboard")} />;
  }

  if (loading || !dashboardData) {
    return (
      <div className="att-loading-wrap">
        <div className="att-spinner-lg" />
        <p>Loading Attendance Data...</p>
      </div>
    );
  }

  const { date, day, today, department_stats = [], recent_activity = [] } = dashboardData;

  const quickActions = [
    { label: "Mark attendance", icon: <CheckCircle size={20} />, onClick: () => setShowMarkModal(true) },
    { label: "Bulk attendance", icon: <Users size={20} />, onClick: () => setShowBulkModal(true) },
    { label: "View records", icon: <ListFilter size={20} />, onClick: () => setView("viewall") },
    { label: "Leave requests", icon: <Calendar size={20} />, onClick: () => { } },
    { label: "Export data", icon: <Download size={20} />, onClick: () => { } },
  ];

  const statCards = [
    { label: "Total staff", value: today.total_staff, color: "color-blue", bg: "bg-blue", badge: "" },
    { label: "Present today", value: today.present, color: "color-blue", bg: "bg-blue", badge: `${Math.round((today.present / today.total_staff) * 100) || 0}%`, pb: "bg-blue-bar" },
    { label: "Absent", value: today.absent, color: "color-red", bg: "bg-red", badge: `${Math.round((today.absent / today.total_staff) * 100) || 0}%`, pb: "bg-red-bar" },
    { label: "On leave", value: today.on_leave, color: "color-green", bg: "bg-green", badge: `${Math.round((today.on_leave / today.total_staff) * 100) || 0}%`, pb: "bg-green-bar" },
    { label: "Pending", value: today.not_marked, color: "color-orange", bg: "bg-orange", badge: `${Math.round((today.not_marked / today.total_staff) * 100) || 0}%`, pb: "bg-orange-bar" },
  ];

  return (
    <div className="attendance-module">
      {/* Top Header */}
      <div className="attendance-header">
        <div>
          <h2 className="header-title">Attendance dashboard</h2>
          <p className="header-subtitle">
            Monitor staff attendance, workforce availability, and trends across all clinic departments.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="qa-grid">
        {quickActions.map((qa, i) => (
          <div key={i} className="qa-card" onClick={qa.onClick}>
            <div className="qa-icon">{qa.icon}</div>
            <div className="qa-label">{qa.label}</div>
          </div>
        ))}
      </div>

      {/* Time Filter */}
      <div className="filter-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', marginBottom: '24px' }}>
        <div className="time-filter">
          <span className={`tf-btn ${timeFilter === "today" ? "active" : ""}`} onClick={() => setTimeFilter("today")}>Today</span>
          <span className={`tf-btn ${timeFilter === "weekly" ? "active" : ""}`} onClick={() => setTimeFilter("weekly")}>This week</span>
          <span className={`tf-btn ${timeFilter === "monthly" ? "active" : ""}`} onClick={() => setTimeFilter("monthly")}>This month</span>
          <span className={`tf-btn ${timeFilter === "custom" ? "active" : ""}`} onClick={() => setTimeFilter("custom")}>Custom range</span>
        </div>
        {timeFilter === "custom" && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #C3C6D6', fontSize: '13px' }} />
            <span style={{ fontSize: '13px', color: '#434654' }}>to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #C3C6D6', fontSize: '13px' }} />
            <button className="btn-small" onClick={fetchDashboard} style={{ background: '#3B82F6', color: 'white', padding: '6px 12px' }}>Apply</button>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-header">
              <div className={`stat-icon ${s.bg} ${s.color}`}>{i === 0 ? <Users size={18} /> : i === 1 ? <CheckCircle size={18} /> : i === 2 ? <XCircle size={18} /> : i === 3 ? <Calendar size={18} /> : <Clock size={18} />}</div>
            </div>
            <div className="stat-label-new">{s.label}</div>
            <div className="stat-value-new">{s.value}</div>
            {i > 0 && (
              <>
                <div className="progress-bar-thin">
                  <div className={`progress-thin ${s.pb}`} style={{ width: s.badge }} />
                </div>
                <div className="stat-badge-new">{s.badge}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Attendance Exceptions */}
      <div className="exceptions-section">
        <h3 className="section-title">Attendance Exceptions</h3>
        <div className="exceptions-grid">
          <div className="exc-card">
            <div className="exc-header">
              <span>Missing Check-Outs</span>
            </div>
            <div className="progress-bar-thin"><div className="progress-thin bg-red-bar" style={{ width: '30%' }}></div></div>
          </div>
          <div className="exc-card">
            <div className="exc-header">
              <span>Late Arrivals</span>
            </div>
            <div className="progress-bar-thin"><div className="progress-thin bg-blue-bar" style={{ width: '45%' }}></div></div>
          </div>
          <div className="exc-card">
            <div className="exc-header">
              <span>Missing Check-Outs</span>
            </div>
            <div className="progress-bar-thin"><div className="progress-thin bg-red-bar" style={{ width: '25%' }}></div></div>
          </div>
          <div className="exc-card">
            <div className="exc-header">
              <span>Pending Reviews</span>
            </div>
            <div className="progress-bar-thin"><div className="progress-thin bg-orange-bar" style={{ width: '60%' }}></div></div>
          </div>
        </div>
      </div>

      {/* Main 2-col layout (or bottom layout) */}
      <div className="tables-layout">
        <div className="panel" style={{ flex: 1 }}>
          <div className="panel-header">
            <h3>Attendance by Department</h3>
            <button className="btn-link" onClick={() => setView("viewall")}>View Report</button>
          </div>
          <table className="dept-table">
            <thead>
              <tr><th>Department name</th><th>Staff</th><th>Present</th><th>Absent</th><th>Rate (%)</th><th>Status</th></tr>
            </thead>
            <tbody>
              {department_stats.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>No department data</td></tr>
              ) : department_stats.map((dept) => (
                <tr key={dept.department_id}>
                  <td className="dept-name-val">{dept.department_name}</td>
                  <td className="center-col">{dept.total_staff}</td>
                  <td className="center-col txt-green">{dept.present}</td>
                  <td className="center-col txt-red">{dept.absent}</td>
                  <td className="center-col">{dept.attendance_rate}%</td>
                  <td className="center-col">
                    <span className={`status-pill-new ${dept.attendance_rate >= 80 ? "excellent" : dept.attendance_rate >= 70 ? "good" : "attention"}`}>
                      {dept.attendance_rate >= 80 ? "Excellent" : dept.attendance_rate >= 70 ? "Good" : "Attention"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bottom-grid" style={{ marginTop: '24px' }}>
        <div className="panel">
          <div className="panel-header">
            <h3>Recent Attendance Activity</h3>
            <div style={{ display: "flex", gap: 16, alignItems: 'center' }}>
              <div className="search-filter">
                <Search size={16} color="#6B7280" />
                <input type="text" placeholder="Search activities..." />
              </div>
            </div>
          </div>
          <table className="activity-table">
            <thead>
              <tr><th>Time</th><th>Staff id</th><th>Staff name</th><th>Department</th><th>Action</th><th>Status</th><th>Marked by</th></tr>
            </thead>
            <tbody>
              {recent_activity.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>No recent activity</td></tr>
              ) : recent_activity.map((act) => (
                <tr key={act.id}>
                  <td className="bold-time">{act.check_in ? new Date(`1970-01-01T${act.check_in}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="muted-id">{act.user_role}</td>
                  <td className="activity-name-val">{act.user_name}</td>
                  <td>{act.department_name || "—"}</td>
                  <td>Check-In</td>
                  <td>
                    <span className={`status-badge-new ${act.status?.toLowerCase()}`}>
                      {act.status_display}
                    </span>
                  </td>
                  <td className="muted-id">{act.marked_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            <span className="showing-text">Showing 1 to {recent_activity.length} of {today.total_staff} entries</span>
            <div className="pagination">
              <button disabled>Previous</button>
              <button className="active">1</button>
              <button>2</button>
              <button>Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MarkAttendanceModal
        isOpen={showMarkModal}
        onClose={() => setShowMarkModal(false)}
        onSaved={fetchDashboard}
      />
      <BulkMarkModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSaved={fetchDashboard}
      />
    </div>
  );
}
