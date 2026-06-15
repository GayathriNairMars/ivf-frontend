import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import HRLeaveManagement from "./hr_leave";
import HRStaffManagement from "./hr_staff_management";
import AddStaffHR from "./add_staff";
import "./hr_section.css";
import HRDepartmentSection from "./hr_departments";
import { Building2 } from "lucide-react";

/* ── Nav items ── */
const NAV = [
  {
    key: "dashboard", label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    key: "employees", label: "Employee Directory",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    key: "leave", label: "Leave Management",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    key: "departments", label: "Departments",
    icon: (
      <Building2 />
    ),
  },
  {
    key: "payroll", label: "Payroll",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    key: "settings", label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

/* ── Placeholder for unbuilt pages ── */
function ComingSoon({ title }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
      <h2 style={{ color: "#0f172a", marginBottom: 8 }}>{title}</h2>
      <p>This section is under construction.</p>
    </div>
  );
}

export default function HRDashboardSection() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState("leave");

  const handleLogout = async () => {
    await logout();
    window.location.href = "/hr-login";
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "HR";

  const content = (() => {
    switch (active) {
      case "leave":     return <HRLeaveManagement />;
      case "dashboard": return <ComingSoon title="Dashboard" />;
      case "employees": return <HRStaffManagement onAddStaff={() => setActive("add_staff")} />;
      case "add_staff": return <AddStaffHR onDone={() => setActive("employees")} />;
      case "departments": return <HRDepartmentSection title="Departments" />;
      case "payroll":   return <ComingSoon title="Payroll" />;
      case "settings":  return <ComingSoon title="Settings" />;
      default:          return <HRLeaveManagement />;
    }
  })();

  return (
    <div className="hr-root">
      {/* ── Sidebar ── */}
      <aside className="hr-sidebar">
        <div className="hr-brand">
          <h2>IVF Speciality Clinic</h2>
          <p>HR Administration Portal</p>
        </div>

        <nav className="hr-nav">
          {NAV.map(item => (
            <button
              key={item.key}
              className={`hr-nav-item ${active === item.key ? "active" : ""}`}
              onClick={() => setActive(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hr-sidebar-footer">
          <button className="hr-new-btn" onClick={() => setActive("leave")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={14} height={14}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Request
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="hr-main">
        {/* Topbar */}
        <header className="hr-topbar">
          <div className="hr-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search employee or leave request..." />
          </div>

          <div className="hr-topbar-right">
            {/* Bell */}
            <button className="hr-icon-btn" title="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={17} height={17}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            {/* Help */}
            <button className="hr-icon-btn" title="Help">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={17} height={17}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>

            {/* User */}
            <div className="hr-user">
              <div className="hr-user-info">
                <span className="hr-user-name">{user?.full_name || "Admin User"}</span>
                <span className="hr-user-role">HR ADMINISTRATOR</span>
              </div>
              <div className="hr-avatar" title="Logout" onClick={handleLogout} style={{ cursor: "pointer" }}>
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="hr-body">
          {content}
        </main>
      </div>
    </div>
  );
}
