import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import "./hr_leave.css";


/* ─── helpers ─────────────────────────────────── */
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#0d9488","#2563eb","#7c3aed","#db2777","#059669","#d97706","#0891b2"];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function typeClass(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("annual")) return "hrl-type-annual";
  if (t.includes("sick"))   return "hrl-type-sick";
  if (t.includes("casual")) return "hrl-type-casual";
  if (t.includes("maternity")) return "hrl-type-maternity";
  if (t.includes("paternity")) return "hrl-type-paternity";
  return "hrl-type-unpaid";
}

function typeLabel(type) {
  if (!type) return "Leave";
  const t = type.toLowerCase();
  const map = {
    annual: "Annual Leave", sick: "Sick Leave", casual: "Casual Leave",
    maternity: "Maternity Leave", paternity: "Paternity Leave", unpaid: "Unpaid Leave",
  };
  for (const [k, v] of Object.entries(map)) if (t.includes(k)) return v;
  return type.charAt(0).toUpperCase() + type.slice(1) + " Leave";
}

/* ─── icons ───────────────────────────────────── */
const CheckCircle = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const XCircle = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const EyeIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const CalIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={14} height={14}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={14} height={14}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/* ─── Toast ───────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`hrl-toast hrl-toast-${type}`}>{msg}</div>;
}

/* ─── Reject modal ────────────────────────────── */
function RejectModal({ leave, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div className="hrl-modal-overlay">
      <div className="hrl-modal">
        <h3>Reject Leave Request</h3>
        <p>
          Rejecting <strong>{leave.employee_name || leave.doctor_name || "Employee"}</strong>'s{" "}
          {typeLabel(leave.leave_type)} ({fmtDate(leave.start_date)} – {fmtDate(leave.end_date)}).
        </p>
        <label>Rejection Reason <span style={{ color: "#dc2626" }}>*</span></label>
        <textarea placeholder="Explain why this leave is being rejected..." value={reason} onChange={e => setReason(e.target.value)} autoFocus />
        <div className="hrl-modal-actions">
          <button className="hrl-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="hrl-modal-confirm reject-confirm" disabled={!reason.trim() || loading} onClick={() => onConfirm(reason)}>
            {loading ? "Rejecting..." : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail modal ────────────────────────────── */
function DetailModal({ leave, onClose }) {
  const name = leave.employee_name || leave.doctor_name || "Employee";
  return (
    <div className="hrl-modal-overlay" onClick={onClose}>
      <div className="hrl-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <h3>Leave Request Details</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {[
            ["Employee", name],
            ["Leave Type", typeLabel(leave.leave_type)],
            ["From", fmtDate(leave.start_date)],
            ["To", fmtDate(leave.end_date)],
            ["Days", leave.days ?? "—"],
            ["Reason", leave.reason || "—"],
            ["Status", leave.status_display || leave.status || "—"],
            ...(leave.rejection_reason ? [["Rejection Reason", leave.rejection_reason]] : []),
            ["Applied On", fmtDate(leave.created_at)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 12 }}>
              <span style={{ minWidth: 130, fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>{k}</span>
              <span style={{ fontSize: 13, color: "#1f2937", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="hrl-modal-actions">
          <button className="hrl-modal-cancel" style={{ flex: 1 }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ Main Component ══════════════════════════════ */
const PAGE_SIZE = 5;

export default function HRLeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);

  // stats state
  const [range, setRange] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);

  // modals
  const [rejectTarget, setRejectTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* fetch lists */
  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("hr/leaves/");
      const list = res.data?.leaves || res.data?.results || (Array.isArray(res.data) ? res.data : []);
      setLeaves(list);
    } catch {
      showToast("Failed to load leave requests.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /* fetch stats & trends */
  const fetchStats = useCallback(async () => {
    try {
      let statsUrl = `hr/leave-statistics/?range=${range}`;
      if (range === "custom" && customStart && customEnd) {
        statsUrl += `&start_date=${customStart}&end_date=${customEnd}`;
      }
      const statsRes = await api.get(statsUrl);
      if (statsRes.data.success) {
        setStats(statsRes.data);
      }

      let trendUrl = `hr/leave-trend/?trend=${range === "daily" || range === "weekly" ? "weekly" : "monthly"}`;
      const trendRes = await api.get(trendUrl);
      if (trendRes.data.success) {
        setTrend(trendRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching stats", err);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    if (range !== "custom" || (range === "custom" && customStart && customEnd)) {
      fetchStats();
    }
  }, [range, fetchStats]);

  /* pagination */
  const sorted = [...leaves].sort((a, b) => {
    const pa = (a.status || "").toUpperCase() === "PENDING" ? 0 : 1;
    const pb = (b.status || "").toUpperCase() === "PENDING" ? 0 : 1;
    return pa - pb;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* approve */
  const handleApprove = async (leave) => {
    setActionLoading(leave.id);
    try {
      await api.post(`hr/leaves/${leave.id}/`, { status: "APPROVED" });
      showToast("Leave approved successfully!");
      fetchLeaves();
      fetchStats();
    } catch (err) {
      showToast("Failed to approve.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  /* reject */
  const handleRejectConfirm = async (reason) => {
    setActionLoading(rejectTarget.id);
    try {
      await api.post(`hr/leaves/${rejectTarget.id}/`, { status: "REJECTED", rejection_reason: reason });
      showToast("Leave rejected.");
      setRejectTarget(null);
      fetchLeaves();
      fetchStats();
    } catch (err) {
      showToast("Failed to reject.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingLeaves = leaves.filter(l => (l.status || "").toUpperCase() === "PENDING");

  return (
    <div className="hrl-root" style={{ animation: "hrl-fadeIn 0.5s ease-out" }}>
      {/* ── Page header ── */}
      <div className="hrl-header">
        <div className="hrl-header-top">
          <div>
            <h1>Leave Management</h1>
            <p>Manage and track staff leave requests with clinical precision.</p>
          </div>
          <div className="hrl-header-actions" style={{ alignItems: "center" }}>
            <div style={{ display: "flex", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
              {["daily", "weekly", "monthly", "custom"].map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    padding: "8px 14px", border: "none", background: range === r ? "#0d9488" : "transparent",
                    color: range === r ? "#fff" : "#4b5563", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                    textTransform: "capitalize", transition: "all 0.2s"
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            {range === "custom" && (
              <div style={{ display: "flex", gap: "6px" }}>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: "7px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: "7px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              </div>
            )}
            <button className="hrl-btn-outline"><DownloadIcon /> Export Report</button>
          </div>
        </div>
      </div>

      {/* ── Dynamic Stat cards ── */}
      <div className="hrl-stats-grid" style={{ marginBottom: "20px" }}>
        <div className="hrl-stat-card" style={{ transition: "transform 0.2s", ":hover": { transform: "translateY(-4px)" } }}>
          <span className="hrl-stat-label">Pending Leaves</span>
          <div className="hrl-stat-body">
            <span className="hrl-stat-num">{stats ? stats.statistics.pending_leaves : pendingLeaves.length}</span>
            <div className="hrl-stat-icon pending"><CalIcon size={22} /></div>
          </div>
          <span className="hrl-stat-trend up">
             {stats ? `${stats.statistics.pending_percentage}% of total` : "↗ Awaiting review"}
          </span>
        </div>
        <div className="hrl-stat-card">
          <span className="hrl-stat-label">Approved Leaves</span>
          <div className="hrl-stat-body">
            <span className="hrl-stat-num">{stats ? stats.statistics.approved_leaves : "—"}</span>
            <div className="hrl-stat-icon approved"><CheckCircle size={22} /></div>
          </div>
          <span className="hrl-stat-trend up">
             {stats ? `${stats.statistics.approved_percentage}% of total` : "↗ This period"}
          </span>
        </div>
        <div className="hrl-stat-card">
          <span className="hrl-stat-label">Rejected Leaves</span>
          <div className="hrl-stat-body">
            <span className="hrl-stat-num">{stats ? stats.statistics.rejected_leaves : "—"}</span>
            <div className="hrl-stat-icon rejected"><XCircle size={22} /></div>
          </div>
          <span className="hrl-stat-trend down">
            {stats ? `${stats.statistics.rejected_percentage}% of total` : "↘ This period"}
          </span>
        </div>
      </div>

      {/* ── Charts Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        
        {/* Trend Chart (Simple CSS Bars) */}
        <div className="hrl-table-card" style={{ marginBottom: 0, display: "flex", flexDirection: "column" }}>
           <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "#111827", fontWeight: "700" }}>Leave Trends ({range === "daily" || range === "weekly" ? "Weekly" : "Monthly"})</h2>
           <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "10px", height: "200px", marginTop: "10px" }}>
             {trend && trend.length > 0 ? trend.map((t, i) => {
               const max = Math.max(...trend.map(x => x.total || 1));
               const hApp = ((t.approved || 0) / max) * 100;
               const hPen = ((t.pending || 0) / max) * 100;
               const hRej = ((t.rejected || 0) / max) * 100;
               return (
                 <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                   <div style={{ height: "150px", width: "100%", display: "flex", alignItems: "flex-end", gap: "2px", justifyContent: "center" }}>
                     <div style={{ width: "8px", background: "#059669", height: `${hApp}%`, borderRadius: "4px 4px 0 0", transition: "height 0.5s ease" }} title={`Approved: ${t.approved}`} />
                     <div style={{ width: "8px", background: "#f59e0b", height: `${hPen}%`, borderRadius: "4px 4px 0 0", transition: "height 0.5s ease" }} title={`Pending: ${t.pending}`} />
                     <div style={{ width: "8px", background: "#dc2626", height: `${hRej}%`, borderRadius: "4px 4px 0 0", transition: "height 0.5s ease" }} title={`Rejected: ${t.rejected}`} />
                   </div>
                   <span style={{ fontSize: "10px", color: "#6b7280", transform: "rotate(-45deg)", marginTop: "10px", whiteSpace: "nowrap" }}>
                     {t.month ? t.month.substring(0, 3) : ""}
                   </span>
                 </div>
               )
             }) : (
               <div style={{ width: "100%", textAlign: "center", color: "#9ca3af", alignSelf: "center" }}>No trend data</div>
             )}
           </div>
           <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px", fontSize: "12px", color: "#4b5563" }}>
             <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }}/> Approved</span>
             <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }}/> Pending</span>
             <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626" }}/> Rejected</span>
           </div>
        </div>

        {/* Breakdown Chart (Simple CSS Stacked Bars) */}
        <div className="hrl-table-card" style={{ marginBottom: 0, display: "flex", flexDirection: "column" }}>
           <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "#111827", fontWeight: "700" }}>{stats?.date_range?.label || "Period"} Breakdown</h2>
           <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "16px", height: "200px", marginTop: "10px" }}>
             {stats?.daily_breakdown && stats.daily_breakdown.length > 0 ? stats.daily_breakdown.map((d, i) => {
               const max = Math.max(...stats.daily_breakdown.map(x => x.total || 1));
               const hApp = ((d.approved || 0) / max) * 100;
               const hPen = ((d.pending || 0) / max) * 100;
               const hRej = ((d.rejected || 0) / max) * 100;
               const label = range === "daily" ? d.day_name : (d.date ? d.date.substring(5) : "");
               
               return (
                 <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                   <div style={{ height: "150px", width: "100%", display: "flex", flexDirection: "column-reverse", background: "#f9fafb", borderRadius: "6px", overflow: "hidden" }}>
                     <div style={{ width: "100%", background: "#059669", height: `${hApp}%`, transition: "height 0.5s ease" }} title={`Approved: ${d.approved}`} />
                     <div style={{ width: "100%", background: "#f59e0b", height: `${hPen}%`, transition: "height 0.5s ease" }} title={`Pending: ${d.pending}`} />
                     <div style={{ width: "100%", background: "#dc2626", height: `${hRej}%`, transition: "height 0.5s ease" }} title={`Rejected: ${d.rejected}`} />
                   </div>
                   <span style={{ fontSize: "11px", color: "#6b7280" }}>{label}</span>
                 </div>
               )
             }) : (
               <div style={{ width: "100%", textAlign: "center", color: "#9ca3af", alignSelf: "center" }}>No breakdown data</div>
             )}
           </div>
           <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "14px", fontSize: "12px", color: "#4b5563" }}>
             <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }}/> Approved</span>
             <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }}/> Pending</span>
             <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626" }}/> Rejected</span>
           </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="hrl-table-card">
        <div className="hrl-table-header">
          <h2>Leave Requests Log</h2>
          {pendingLeaves.length > 0 && (
            <span className="hrl-awaiting-badge">
              {pendingLeaves.length} Request{pendingLeaves.length !== 1 ? "s" : ""} Awaiting Action
            </span>
          )}
        </div>

        {loading ? (
          <div className="hrl-spinner" />
        ) : leaves.length === 0 ? (
          <div className="hrl-empty">No leave requests found.</div>
        ) : (
          <>
            <table className="hrl-table">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>EMPLOYEE</th>
                  <th>LEAVE TYPE</th>
                  <th>FROM</th>
                  <th>TO</th>
                  <th>DAYS</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((leave, idx) => {
                  const name = leave.employee_name || leave.doctor_name || "Employee";
                  const role = leave.role || leave.designation || leave.department || "";
                  const isPending = (leave.status || "").toUpperCase() === "PENDING";
                  const isActing = actionLoading === leave.id;
                  const statusDisplay = leave.status_display || leave.status || "Pending";

                  return (
                    <tr key={leave.id}>
                      <td style={{ fontWeight: 600, color: "#6b7280" }}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td>
                        <div className="hrl-emp-cell">
                          <div
                            className="hrl-emp-avatar"
                            style={{ background: avatarColor(name) }}
                          >
                            {getInitials(name)}
                          </div>
                          <div>
                            <div className="hrl-emp-name">{name}</div>
                            {role && <div className="hrl-emp-role">{role}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`hrl-type-badge ${typeClass(leave.leave_type)}`}>
                          {typeLabel(leave.leave_type)}
                        </span>
                      </td>
                      <td className="hrl-date">{fmtDate(leave.start_date)}</td>
                      <td className="hrl-date">{fmtDate(leave.end_date)}</td>
                      <td style={{ fontWeight: 700, color: "#111827" }}>
                        {leave.days ?? "—"}
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "4px 10px", borderRadius: "20px", fontSize: 11, fontWeight: 700,
                          background: isPending ? "#fef9c3"
                            : statusDisplay.toLowerCase() === "approved" ? "#d1fae5" : "#fee2e2",
                          color: isPending ? "#a16207"
                            : statusDisplay.toLowerCase() === "approved" ? "#065f46" : "#991b1b",
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block",
                          }} />
                          {statusDisplay.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="hrl-actions">
                          {/* Approve */}
                          <button
                            className="hrl-action-btn approve"
                            title="Approve"
                            disabled={!isPending || isActing}
                            onClick={() => handleApprove(leave)}
                          >
                            {isActing ? "…" : <CheckCircle size={16} />}
                          </button>
                          {/* Reject */}
                          <button
                            className="hrl-action-btn reject"
                            title="Reject"
                            disabled={!isPending || isActing}
                            onClick={() => setRejectTarget(leave)}
                          >
                            <XCircle size={16} />
                          </button>
                          {/* View */}
                          <button
                            className="hrl-action-btn view"
                            title="View Details"
                            onClick={() => setDetailTarget(leave)}
                          >
                            <EyeIcon size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="hrl-table-footer">
              <span className="hrl-showing">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–
                {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} requests
              </span>
              <div className="hrl-pag">
                <button
                  className="hrl-pag-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >Previous</button>
                <button
                  className="hrl-pag-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Reject modal ── */}
      {rejectTarget && (
        <RejectModal
          leave={rejectTarget}
          loading={actionLoading === rejectTarget?.id}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* ── Detail modal ── */}
      {detailTarget && (
        <DetailModal
          leave={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
