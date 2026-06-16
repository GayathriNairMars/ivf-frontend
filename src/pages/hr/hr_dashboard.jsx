import React from "react";
import "./hr_dashboard.css";
import { 
  UserPlus, CalendarDays, Clock, Wallet, Contact, UserCheck, 
  MoreVertical, AlertTriangle, Landmark, HandCoins, CheckCircle2,
  Users
} from "lucide-react";

// Mock Data
const leaveRequests = [
  { id: 1, name: "Dr. Alan Smith", role: "Dept: Cardiology | Sick Leave", date: "Oct 24 - Oct 26", avatar: "https://i.pravatar.cc/150?u=1" },
  { id: 2, name: "Nurse Jane Doe", role: "Dept: Emergency | Annual Leave", date: "Nov 01 - Nov 05", avatar: "https://i.pravatar.cc/150?u=2" }
];

const attendanceIssues = [
  { id: 1, name: "Mark Wilson (ID: 402)", issue: "Unexcused Absence", date: "Oct 20" },
  { id: 2, name: "Sarah Connor (ID: 156)", issue: "Late Punch-in (45m)", date: "Oct 21" }
];

const complianceAlerts = [
  { id: 1, name: "Dr. Elena Rodriguez", alert: "Medical License Expiry", desc: "In 12 Days", btn: "RENEW" },
  { id: 2, name: "James Baker", alert: "Safety Training Overdue", desc: "Exp: Oct 15", btn: "NOTIFY" }
];

const recentCandidates = [
  { id: 1, initials: "RK", name: "Robert Kim", role: "Lead Embryologist", status: "INTERVIEWING", color: "bg-blue-100 text-blue-600" },
  { id: 2, initials: "MT", name: "Maria Theron", role: "Senior Lab Nurse", status: "OFFER SENT", color: "bg-indigo-100 text-indigo-600" }
];

const hrActivities = [
  { id: 1, title: "Payroll Validation Complete", desc: "HR Manager validated 156 base salaries for the October cycle.", meta: "2 hours ago • By Sarah Mitchell", icon: CheckCircle2, color: "green" },
  { id: 2, title: "New Staff Onboarded", desc: "David Chen joined as Senior Embryologist in the IVF Department.", meta: "5 hours ago • Automated System", icon: UserPlus, color: "blue" },
  { id: 3, title: "Contract Updated", desc: "Nurse Julia Vance's contract was updated for shift differential adjustments.", meta: "Yesterday at 4:15 PM • By Admin System", icon: FileTextIcon, color: "orange" }
];

function FileTextIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

// SVG Donut Chart component
const DonutChart = () => {
  return (
    <div className="hr-donut-container">
      <div className="hr-donut-chart">
        <svg viewBox="0 0 36 36" width="100%" height="100%">
          {/* Admin (8%) - Light Blue */}
          <circle stroke="#bae6fd" strokeWidth="6" fill="transparent" r="15" cx="18" cy="18"
            strokeDasharray="8 100" strokeDashoffset="25" />
          {/* Embryologists (15%) - Orange */}
          <circle stroke="#b45309" strokeWidth="6" fill="transparent" r="15" cx="18" cy="18"
            strokeDasharray="15 100" strokeDashoffset="17" />
          {/* Nurses (35%) - Green */}
          <circle stroke="#10b981" strokeWidth="6" fill="transparent" r="15" cx="18" cy="18"
            strokeDasharray="35 100" strokeDashoffset="2" />
          {/* Doctors (42%) - Blue */}
          <circle stroke="#1d4ed8" strokeWidth="6" fill="transparent" r="15" cx="18" cy="18"
            strokeDasharray="42 100" strokeDashoffset="67" />
        </svg>
        <div className="hr-donut-center">
          <h2>156</h2>
          <p>Total</p>
        </div>
      </div>
      <div className="hr-donut-legend">
        <div className="hr-legend-item"><div className="hr-legend-dot" style={{background: "#1d4ed8"}}></div>Doctors (42%)</div>
        <div className="hr-legend-item"><div className="hr-legend-dot" style={{background: "#10b981"}}></div>Nurses (35%)</div>
        <div className="hr-legend-item"><div className="hr-legend-dot" style={{background: "#b45309"}}></div>Embryologists (15%)</div>
        <div className="hr-legend-item"><div className="hr-legend-dot" style={{background: "#bae6fd"}}></div>Admin (8%)</div>
      </div>
    </div>
  );
};

export default function HRDashboard() {
  return (
    <div className="hr-dash-container">
      {/* Header */}
      <div className="hr-dash-header">
        <h1>HR Dashboard</h1>
        <p>Monitor workforce operations, employee activities, attendance, recruitment, and payroll from a centralized workspace.</p>
      </div>

      {/* Stats Row */}
      <div className="hr-stats-row">
        <div className="hr-stat-card">
          <span className="hr-stat-card-title">Total Employees</span>
          <span className="hr-stat-card-value">156</span>
          <span className="hr-stat-badge green">+2.4% ↗</span>
        </div>
        <div className="hr-stat-card">
          <span className="hr-stat-card-title">Present Today</span>
          <span className="hr-stat-card-value">142</span>
          <div style={{ position: "absolute", bottom: "20px", right: "20px", width: "40px", height: "4px", background: "#16a34a", borderRadius: "2px" }}></div>
        </div>
        <div className="hr-stat-card">
          <span className="hr-stat-card-title">On Leave</span>
          <span className="hr-stat-card-value">8</span>
          <span className="hr-stat-badge orange">PLANNED</span>
        </div>
        <div className="hr-stat-card">
          <span className="hr-stat-card-title">Pending Approvals</span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span className="hr-stat-card-value text-blue-600">12</span>
            <CalendarDays size={24} color="#3b82f6" style={{ marginBottom: "4px" }} />
          </div>
        </div>
        <div className="hr-stat-card">
          <span className="hr-stat-card-title">Open Positions</span>
          <span className="hr-stat-card-value">5</span>
          <span className="hr-stat-badge green">HIRING</span>
        </div>
        <div className="hr-stat-card">
          <span className="hr-stat-card-title">Payroll Pending</span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span className="hr-stat-card-value text-red-600">156</span>
            <Wallet size={24} color="#ef4444" style={{ marginBottom: "4px" }} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="hr-actions-section">
        <h3>Quick Actions</h3>
        <div className="hr-actions-grid">
          <div className="hr-action-btn">
            <div className="hr-action-icon"><UserPlus size={22} /></div>
            <span>Add Staff</span>
          </div>
          <div className="hr-action-btn">
            <div className="hr-action-icon"><CalendarDays size={22} /></div>
            <span>Leave Requests</span>
          </div>
          <div className="hr-action-btn">
            <div className="hr-action-icon"><Clock size={22} /></div>
            <span>Attendance</span>
          </div>
          <div className="hr-action-btn">
            <div className="hr-action-icon"><Wallet size={22} /></div>
            <span>Payroll</span>
          </div>
          <div className="hr-action-btn">
            <div className="hr-action-icon"><Contact size={22} /></div>
            <span>Staff Directory</span>
          </div>
          <div className="hr-action-btn">
            <div className="hr-action-icon"><UserCheck size={22} /></div>
            <span>Recruitment</span>
          </div>
        </div>
      </div>

      {/* Row 1: Charts & Tables */}
      <div className="hr-main-grid">
        <div className="hr-panel">
          <div className="hr-panel-header">
            <span className="hr-panel-title">Department Distribution</span>
            <span className="hr-panel-action">VIEW ALL</span>
          </div>
          <DonutChart />
        </div>

        <div className="hr-panel">
          <div className="hr-panel-header" style={{ marginBottom: "16px" }}>
            <span className="hr-panel-title">Department Summary</span>
            <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#64748b" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div className="hr-status-circle" style={{ color: "#16a34a" }}></div> Active</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div className="hr-status-circle" style={{ color: "#e2e8f0" }}></div> Required</span>
            </div>
          </div>
          <table className="hr-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Staff Ratio</th>
                <th>Attendance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Medical / Doctors</td>
                <td>
                  <div className="hr-progress-container">
                    <span style={{ width: "35px" }}>18/17</span>
                    <div className="hr-progress-bar"><div className="hr-progress-fill" style={{ width: "100%", background: "#1d4ed8" }}></div></div>
                  </div>
                </td>
                <td>100%</td>
                <td><span className="hr-status-badge optimal">OPTIMAL</span></td>
              </tr>
              <tr>
                <td>Nursing Staff</td>
                <td>
                  <div className="hr-progress-container">
                    <span style={{ width: "35px" }}>24/22</span>
                    <div className="hr-progress-bar"><div className="hr-progress-fill" style={{ width: "100%", background: "#1d4ed8" }}></div></div>
                  </div>
                </td>
                <td>92%</td>
                <td><span className="hr-status-badge optimal">OPTIMAL</span></td>
              </tr>
              <tr>
                <td>IVF / Embryology</td>
                <td>
                  <div className="hr-progress-container">
                    <span style={{ width: "35px" }}>08/10</span>
                    <div className="hr-progress-bar"><div className="hr-progress-fill" style={{ width: "80%", background: "#b45309" }}></div></div>
                  </div>
                </td>
                <td>100%</td>
                <td><span className="hr-status-badge understaffed">UNDERSTAFFED</span></td>
              </tr>
              <tr>
                <td>Lab Technicians</td>
                <td>
                  <div className="hr-progress-container">
                    <span style={{ width: "35px" }}>12/12</span>
                    <div className="hr-progress-bar"><div className="hr-progress-fill" style={{ width: "100%", background: "#1d4ed8" }}></div></div>
                  </div>
                </td>
                <td>88%</td>
                <td><span className="hr-status-badge optimal">OPTIMAL</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 2: Lists */}
      <div className="hr-main-grid">
        <div className="hr-panel">
          <div className="hr-panel-header">
            <span className="hr-panel-title">Pending Leave Requests</span>
            <span style={{ background: "#1e3a8a", color: "white", padding: "4px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "700" }}>12 PENDING</span>
          </div>
          <div className="hr-list">
            {leaveRequests.map(req => (
              <div key={req.id} className="hr-list-item">
                <div className="hr-list-item-left">
                  <img src={req.avatar} alt={req.name} className="hr-list-avatar" />
                  <div className="hr-list-info">
                    <h4>{req.name}</h4>
                    <p>{req.role}</p>
                  </div>
                </div>
                <div className="hr-list-right">
                  <span className="hr-list-date">{req.date}</span>
                  <div className="hr-list-actions">
                    <span className="hr-action-link approve">APPROVE</span>
                    <span className="hr-action-link reject">REJECT</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="hr-panel">
            <div className="hr-panel-header" style={{ marginBottom: "12px" }}>
              <span className="hr-panel-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><AlertTriangle size={18} color="#dc2626" /> Attendance Issues</span>
            </div>
            <div>
              {attendanceIssues.map(issue => (
                <div key={issue.id} className="hr-list-item-minimal">
                  <div style={{ flex: 1 }}>
                    <div className="hr-issue-text">{issue.name}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <span className="hr-issue-reason">{issue.issue}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className="hr-issue-date">{issue.date}</span>
                    <MoreVertical size={16} color="#94a3b8" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hr-panel">
            <div className="hr-panel-header" style={{ marginBottom: "12px" }}>
              <span className="hr-panel-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><AlertTriangle size={18} color="#b45309" /> Compliance Alerts</span>
            </div>
            <div>
              {complianceAlerts.map(alert => (
                <div key={alert.id} className="hr-list-item-minimal">
                  <div style={{ flex: 1 }} className="hr-issue-text">{alert.name}</div>
                  <div style={{ flex: 1 }}><span style={{ fontSize: "11px", fontWeight: "700", color: "#dc2626" }}>{alert.alert}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span className="hr-issue-date">{alert.desc}</span>
                    <button className="hr-btn-small">{alert.btn}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recruitment & Payroll */}
      <div className="hr-main-grid">
        <div className="hr-panel">
          <div className="hr-panel-header">
            <span className="hr-panel-title">Recruitment Pipeline</span>
            <button style={{ color: "#3b82f6", background: "#eff6ff", border: "none", padding: "6px 12px", borderRadius: "16px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>+ Post Job</button>
          </div>
          <div className="hr-stats-mini-row">
            <div className="hr-stat-mini blue">
              <h3>5</h3>
              <p>OPEN JOBS</p>
            </div>
            <div className="hr-stat-mini">
              <h3>124</h3>
              <p>APPS</p>
            </div>
            <div className="hr-stat-mini green">
              <h3>12</h3>
              <p>INTERVIEWS</p>
            </div>
            <div className="hr-stat-mini" style={{ opacity: 0.5 }}>
              <h3>3</h3>
              <p>OFFERS</p>
            </div>
          </div>
          <div className="hr-recruitment-label">RECENT CANDIDATES</div>
          <div className="hr-list">
            {recentCandidates.map(c => (
              <div key={c.id} className="hr-list-item-minimal">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                    {c.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{c.name}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{c.role}</div>
                  </div>
                </div>
                <div style={{ padding: "4px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", letterSpacing: "0.5px", background: c.id === 1 ? "#dcfce7" : "#e0e7ff", color: c.id === 1 ? "#16a34a" : "#4f46e5" }}>
                  {c.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hr-panel">
          <div className="hr-panel-header">
            <span className="hr-panel-title">Payroll Summary</span>
            <span className="hr-panel-action">Next Cycle: Oct 31</span>
          </div>
          <div className="hr-payroll-overview">
            <div className="hr-payroll-card" style={{ borderLeft: "4px solid #3b82f6" }}>
              <div className="hr-payroll-card-title">TOTAL LIABILITY</div>
              <div className="hr-payroll-card-value">$482,500</div>
            </div>
            <div className="hr-payroll-card">
              <div className="hr-payroll-card-title">STATUS</div>
              <div className="hr-payroll-status">
                <div className="hr-status-circle"></div>
                156 PENDING
              </div>
              <div className="hr-payroll-subtext">0 Processed this cycle</div>
            </div>
          </div>
          <div className="hr-recruitment-label">ACTION REQUIRED</div>
          <div className="hr-action-required-list">
            <div className="hr-action-required-item">
              <div className="hr-ari-left">
                <div className="hr-ari-icon"><Landmark size={18} /></div>
                <div className="hr-ari-info">
                  <h4>Missing Bank Details</h4>
                  <p>3 newly onboarded staff members</p>
                </div>
              </div>
              <button className="hr-ari-btn">RESOLVE</button>
            </div>
            <div className="hr-action-required-item">
              <div className="hr-ari-left">
                <div className="hr-ari-icon orange"><HandCoins size={18} /></div>
                <div className="hr-ari-info">
                  <h4>Salary Approval Pending</h4>
                  <p>12 overtime claims need HR validation</p>
                </div>
              </div>
              <button className="hr-ari-btn text-gray-600" style={{ color: "#475569" }}>REVIEW</button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Activities */}
      <div className="hr-panel">
        <div className="hr-panel-header">
          <span className="hr-panel-title">Recent HR Activities</span>
          <span style={{ color: "#94a3b8", cursor: "pointer" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg></span>
        </div>
        <div className="hr-timeline">
          {hrActivities.map(act => {
            const Icon = act.icon;
            return (
              <div key={act.id} className="hr-timeline-item">
                <div className={`hr-timeline-icon ${act.color}`}>
                  <Icon size={16} />
                </div>
                <div className="hr-timeline-content">
                  <h4>{act.title}</h4>
                  <p>{act.desc}</p>
                  <span>{act.meta}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
