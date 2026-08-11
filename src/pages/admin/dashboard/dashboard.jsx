import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import { ROLE_LABELS, ROLE_COLORS } from "../../../constants/constants";
import { useHospital } from "../../../context/HospitalContext";
import {
  Users, Wifi, UserRound, Building2,
  UserPlus, FilePlus2, BarChart3,
  ArrowRight, Shield, CheckCircle, Clock,
  FolderPlus, CalendarDays
} from "lucide-react";
import "./dashboard_new.css";

/* ── Colour palette for donut / dept bars ─────────────────────── */
const ROLE_CHART_COLORS = [
  "#4474f6","#12b76a","#06b6d4","#7c3aed","#f97316",
  "#ec4899","#f59e0b","#84cc16","#fb7185","#a78bfa",
];

const DEPT_BAR_COLORS = [
  "#4474f6","#12b76a","#06b6d4","#7c3aed","#f97316",
  "#ec4899","#f59e0b","#84cc16","#fb7185","#0ea5e9",
];

/* ── SVG Donut Chart ──────────────────────────────────────────── */
function DonutChart({ data, total }) {
  const r = 68;
  const cx = 88;
  const cy = 88;
  const circ = 2 * Math.PI * r;
  let acc = 0;

  return (
    <svg width="176" height="176" viewBox="0 0 176 176" className="adm-donut-svg">
      {/* background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="24" />
      {/* segments */}
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {data.map((seg, i) => {
          const frac = total > 0 ? seg.count / total : 0;
          const dash = frac * circ;
          const offset = -(acc * circ);
          acc += frac;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="24"
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          );
        })}
      </g>
      {/* center text */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="26" fontWeight="700" fill="#101828">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#98a2b3">
        Total Staff
      </text>
    </svg>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */
function initials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
}

function now() {
  return new Date().toLocaleString("en-IN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

/* ── Badge colours for dept code ────────────────────────────────*/
const BADGE_PALETTE = [
  { bg: "#eef2ff", color: "#4474f6" },
  { bg: "#ecfdf3", color: "#166534" },
  { bg: "#fff7ed", color: "#92400e" },
  { bg: "#ede9fe", color: "#5b21b6" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#f0fdf4", color: "#15803d" },
];
function badgeStyle(idx) { return BADGE_PALETTE[idx % BADGE_PALETTE.length]; }

/* ═══════════════════════════════════════════════════════════════ */
export default function DashboardHome() {
  const navigate = useNavigate();
  const { hospital } = useHospital();

  const [stats,    setStats]    = useState(null);
  const [sessions, setSessions] = useState([]);
  const [staffList,setStaffList]= useState([]);
  const [depts,    setDepts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [clock,    setClock]    = useState(now());

  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setClock(now()), 30000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    try {
      const [dashData, staffData, deptData] = await Promise.allSettled([
        adminApi.getDashboardStats(),
        adminApi.getStaffList(),
        adminApi.getDepartments(),
      ]);
      if (dashData.status === "fulfilled") {
        setStats(dashData.value);
        setSessions(dashData.value.active_sessions || []);
      }
      if (staffData.status === "fulfilled") {
        setStaffList(Array.isArray(staffData.value) ? staffData.value : staffData.value?.results || []);
      }
      if (deptData.status === "fulfilled") {
        setDepts(Array.isArray(deptData.value) ? deptData.value : deptData.value?.results || []);
      }
    } catch {/* silent */}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  /* ── Derived data ─────────────────────────────────────────── */
  /* Role distribution for donut */
  const roleMap = {};
  staffList.forEach(s => {
    if (!s.role) return;
    roleMap[s.role] = (roleMap[s.role] || 0) + 1;
  });
  const roleData = Object.entries(roleMap)
    .sort((a, b) => b[1] - a[1])
    .map(([role, count], i) => ({
      role,
      label: ROLE_LABELS[role] || role,
      count,
      color: ROLE_CHART_COLORS[i % ROLE_CHART_COLORS.length],
    }));

  /* Top Departments by staff count */
  const deptsSorted = [...depts]
    .sort((a, b) => (b.staff_count || 0) - (a.staff_count || 0))
    .slice(0, 10);
  const maxDeptStaff = deptsSorted[0]?.staff_count || 1;

  /* Department heads (depts that have a head) */
  const deptsWithHead = depts.filter(d => d.head && (d.head.full_name || d.head.name));

  const totalStaff   = stats?.summary?.total_staff   ?? staffList.length ?? 0;
  const activeCount  = stats?.summary?.active_count  ?? sessions.length  ?? 0;
  const totalPatients= stats?.summary?.total_patients ?? 0;
  const totalHODs    = deptsWithHead.length || stats?.summary?.total_heads || 0;

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="dashboard-content">

      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <div className="adm-page-title">
            Admin Dashboard
            <Shield size={20} color="#4474f6" />
          </div>
          <p className="adm-page-sub">
            Welcome back! Here's what's happening in {hospital?.hospital_short_name || hospital?.hospital_name || "your hospital"} today.
          </p>
        </div>
        <div className="adm-date-badge">
          <CalendarDays size={18} color="#4474f6" />
          <div>
            <strong>{new Date().toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}</strong>
            {new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true })}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="adm-kpi-row">
        <div className="adm-kpi-card" onClick={() => navigate("/superadmin/staff/")}>
          <div className="adm-kpi-icon-wrap blue"><Users size={24} /></div>
          <div className="adm-kpi-body">
            <div className="adm-kpi-label">Total Staff</div>
            <div className="adm-kpi-value">{loading ? "—" : totalStaff}</div>
            <div className="adm-kpi-sub">
              <span className="green-txt">Active: {stats?.summary?.active_staff ?? totalStaff}</span>
              &nbsp;·&nbsp;Inactive: {stats?.summary?.inactive_staff ?? 0}
            </div>
          </div>
        </div>

        <div className="adm-kpi-card" onClick={() => navigate("/superadmin/staff/")}>
          <div className="adm-kpi-icon-wrap green"><Wifi size={24} /></div>
          <div className="adm-kpi-body">
            <div className="adm-kpi-label">Online Staff</div>
            <div className="adm-kpi-value">{loading ? "—" : activeCount}</div>
            <div className="adm-kpi-sub"><span className="green-txt">Currently Online</span></div>
          </div>
        </div>

        <div className="adm-kpi-card" onClick={() => navigate("/superadmin/patients/")}>
          <div className="adm-kpi-icon-wrap indigo"><UserRound size={24} /></div>
          <div className="adm-kpi-body">
            <div className="adm-kpi-label">Total Patients</div>
            <div className="adm-kpi-value">{loading ? "—" : totalPatients}</div>
            <div className="adm-kpi-sub">Today: {stats?.summary?.today_patients ?? 0}</div>
          </div>
        </div>

        <div className="adm-kpi-card" onClick={() => navigate("/superadmin/department/")}>
          <div className="adm-kpi-icon-wrap orange"><Building2 size={24} /></div>
          <div className="adm-kpi-body">
            <div className="adm-kpi-label">Total HODs</div>
            <div className="adm-kpi-value">{loading ? "—" : totalHODs}</div>
            <div className="adm-kpi-sub"><span className="orange-txt">Department Heads</span></div>
          </div>
        </div>
      </div>

      {/* Mid Grid: Donut | Dept Bars | Active Sessions */}
      <div className="adm-mid-grid">
        {/* Staff Distribution donut */}
        <div className="adm-panel" style={{ animationDelay: "0.1s" }}>
          <div className="adm-panel-header">
            <div><h3>Staff Distribution by Role</h3></div>
            <button className="adm-view-all" onClick={() => navigate("/superadmin/staff/")}>View All</button>
          </div>
          {loading ? (
            <div className="adm-panel-empty">Loading…</div>
          ) : roleData.length === 0 ? (
            <div className="adm-panel-empty">No staff data available.</div>
          ) : (
            <div className="adm-donut-wrap">
              <DonutChart data={roleData} total={totalStaff} />
              <div className="adm-donut-legend">
                {roleData.map((r, i) => (
                  <div className="adm-legend-row" key={r.role}>
                    <div className="adm-legend-left">
                      <div className="adm-legend-dot" style={{ background: r.color }} />
                      <span className="adm-legend-label">{r.label}</span>
                    </div>
                    <span className="adm-legend-count">
                      {r.count} ({Math.round((r.count / totalStaff) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Departments bar chart */}
        <div className="adm-panel" style={{ animationDelay: "0.15s" }}>
          <div className="adm-panel-header">
            <div><h3>Top Departments</h3></div>
            <button className="adm-view-all" onClick={() => navigate("/superadmin/department/")}>View All</button>
          </div>
          {loading ? (
            <div className="adm-panel-empty">Loading…</div>
          ) : deptsSorted.length === 0 ? (
            <div className="adm-panel-empty">No department data.</div>
          ) : (
            <div className="adm-dept-list">
              {deptsSorted.map((d, i) => (
                <div className="adm-dept-row" key={d.id ?? i}>
                  <span className="adm-dept-name">{d.name || d.code}</span>
                  <div className="adm-dept-bar-track">
                    <div
                      className="adm-dept-bar-fill"
                      style={{
                        width: `${((d.staff_count || 0) / maxDeptStaff) * 100}%`,
                        background: DEPT_BAR_COLORS[i % DEPT_BAR_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="adm-dept-count">{d.staff_count ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Sessions + Quick Actions + System */}
        <div className="adm-right-col">
          {/* Active Sessions */}
          <div className="adm-panel" style={{ animationDelay: "0.2s" }}>
            <div className="adm-panel-header">
              <div><h3>Active Sessions</h3></div>
              <span className="adm-session-live-badge">{sessions.length} Active</span>
            </div>
            <div className="adm-session-list">
              {loading ? (
                <div className="adm-panel-empty">Loading…</div>
              ) : sessions.length === 0 ? (
                <div className="adm-panel-empty">No active sessions.</div>
              ) : (
                sessions.slice(0, 3).map((s, i) => (
                  <div className="adm-session-item" key={i}>
                    <div className="adm-session-top">
                      <div className="adm-session-user">
                        <div className="adm-session-avatar">{initials(s.full_name)}</div>
                        <div>
                          <div className="adm-session-name">{s.full_name || "—"}</div>
                          <div className="adm-session-role">{ROLE_LABELS[s.role] || s.role}</div>
                        </div>
                      </div>
                      <div className="adm-online-dot" title="Online" />
                    </div>
                    <div className="adm-session-email">{s.email}</div>
                    {s.login_time && (
                      <div className="adm-session-meta-row">
                        <Clock size={11} />
                        Login: {new Date(s.login_time).toLocaleString("en-IN", { dateStyle:"short", timeStyle:"short" })}
                      </div>
                    )}
                  </div>
                ))
              )}
              <button
                className="adm-session-view-all-btn"
                onClick={() => navigate("/superadmin/staff/")}
              >
                View All Sessions
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="adm-panel" style={{ animationDelay: "0.25s" }}>
            <div className="adm-panel-header">
              <div><h3>Quick Actions</h3></div>
            </div>
            <div className="adm-quick-actions">
              {[
                { label: "Add New Staff",      icon: UserPlus,   path: "/superadmin/staff/add" },
                { label: "Add New Patient",    icon: FilePlus2,  path: "/superadmin/patients/add" },
                { label: "Create Department",  icon: FolderPlus, path: "/superadmin/department/" },
                { label: "Generate Report",    icon: BarChart3,  path: "/superadmin/finance/dashboard" },
              ].map(({ label, icon: Icon, path }) => (
                <button
                  key={label}
                  className="adm-action-btn"
                  onClick={() => navigate(path)}
                >
                  <div className="adm-action-icon"><Icon size={16} /></div>
                  <span className="adm-action-label">{label}</span>
                  <ArrowRight size={14} className="adm-action-arrow" />
                </button>
              ))}
            </div>
          </div>

          {/* System Overview */}
          <div className="adm-panel" style={{ animationDelay: "0.3s" }}>
            <div className="adm-panel-header">
              <div><h3>System Overview</h3></div>
            </div>
            <div className="adm-system-overview">
              <div className="adm-system-pulse">
                <CheckCircle size={22} color="#12b76a" />
              </div>
              <div>
                <div className="adm-system-ok-text">All systems operational</div>
                <div className="adm-system-ok-sub">All systems operational</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Heads */}
      <div className="adm-dept-heads-section adm-panel">
        <div className="adm-panel-header">
          <div>
            <h3>Department Heads</h3>
            <p>{deptsWithHead.length} Department Head{deptsWithHead.length !== 1 ? "s" : ""}</p>
          </div>
          <button className="adm-view-all" onClick={() => navigate("/superadmin/department/")}>
            View All
          </button>
        </div>
        {loading ? (
          <div className="adm-panel-empty">Loading departments…</div>
        ) : deptsWithHead.length === 0 ? (
          <div className="adm-panel-empty">No department heads assigned yet.</div>
        ) : (
          <div className="adm-dept-heads-grid">
            {deptsWithHead.map((dept, i) => {
              const head = dept.head || {};
              const badge = badgeStyle(i);
              return (
                <div
                  className="adm-dept-head-card"
                  key={dept.id ?? i}
                  style={{ animationDelay: `${0.05 * i}s` }}
                  onClick={() => navigate("/superadmin/department/")}
                >
                  <div className="adm-dept-head-top">
                    <span className="adm-dept-head-dept">{dept.name || dept.code}</span>
                    <span
                      className="adm-dept-badge"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {dept.code || dept.name?.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                  {head.full_name || head.name ? (
                    <div className="adm-dept-head-person">
                      <div className="adm-dept-head-avatar">
                        <UserRound size={18} />
                      </div>
                      <div className="adm-dept-head-info">
                        <div className="adm-dept-head-name">{head.full_name || head.name}</div>
                        <div className="adm-dept-head-role">
                          {ROLE_LABELS[head.role] || head.role || "—"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="adm-no-head">No head assigned</span>
                  )}
                  {(head.email) && (
                    <div className="adm-dept-head-email">{head.email}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}