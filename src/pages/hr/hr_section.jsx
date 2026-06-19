import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import HRLeaveManagement from "./hr_leave";
import HRSettings from "./hr_settings";
import HRStaffManagement from "./hr_staff_management";
import AddStaffHR from "./add_staff";
import HRDashboard from "./hr_dashboard";
import "./hr_section.css";
import HRDepartmentSection from "./hr_departments";
import HRAttendance from "./hr_attendance";
import { Building2, Users, UserPlus, ChevronDown } from "lucide-react";
import arathyAvatar from "../../assets/arathy_avatar.png";
import { IoNotificationsOutline } from "react-icons/io5";
import { ROLE_LABELS } from "../../constants/constants";
import HRShiftTypes from "./shifts/hr_shift_types";
import HRShiftSwaps from "./shifts/hr_shift_swaps";
import HRAssignShifts from "./shifts/hr_assign_shifts";
import { Calendar, Clock, RefreshCw, ClipboardCheck, FileText } from "lucide-react";
import Icon from "../../components/Icons";
import HRAttendance from "./attendance/hr_attendance";
import ViewAllAttendance from "./attendance/ViewAllAttendance";

/* ── Nav items ── */
const NAV = [
  {
    key: "dashboard", 
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    key: "employees", 
    label: "Employee Directory",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    subItems: [
      { key: "manage_staff", label: "Manage staff", icon: Users },
      { key: "add_staff", label: "Add Staff", icon: UserPlus },
    ],
  },
  {
    key: "leave", 
    label: "Leave Management",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    key: "departments", 
    label: "Departments",
    icon: <Building2 size={16} />,
  },
  {
    key: "shifts", 
    label: "Shift Management",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    subItems: [
      { key: "shift_calendar", label: "Shift Calendar", icon: Calendar },
      { key: "shift_types", label: "Shift Types", icon: Clock },
      { key: "assign_shifts", label: "Assign Shifts", icon: UserPlus },
      { key: "shift_swaps", label: "Shift Swaps", icon: RefreshCw },
      { key: "shift_reports", label: "Reports", icon: FileText },
    ],
  },
  {key:"myattendance",label:"My Attendance",icon: <ClipboardCheck size={17} />},
  {
    key: "attendance_management", 
    label: "Attendance Management",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    subItems: [
      { key: "attendance", label: "Dashboard", icon: Calendar },
      { key: "all_attendance", label: "All Attendance", icon: ClipboardCheck },
    ],
  },
  {
    key: "settings", 
    label: "Settings",
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState("employees");
  const [departmentTarget, setDepartmentTarget] = useState(null);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/hr-login";
  };
  const handleViewDepartment = (dept) => {
    setDepartmentTarget(dept);
    setActive("departments");
    setExpandedNav(null);
  };
  // Map subitem keys -> their parent's key, so we know which parent to highlight/expand
  const parentOf = (childKey) => {
    for (const item of NAV) {
      if (item.subItems?.some((s) => s.key === childKey)) return item.key;
    }
    return null;
  };

  const handleNavClick = (item) => {
    if (item.subItems) {
      // Toggle expand; if collapsing the currently-active group, keep active as-is
      setExpandedNav((prev) => (prev === item.key ? null : item.key));
      // If no sub-page is active under this parent yet, jump to the first sub item
      if (!item.subItems.some((s) => s.key === active)) {
        setActive(item.subItems[0].key);
      }
    } else {
      setActive(item.key);
      setExpandedNav(null);
    }
    setDepartmentTarget(null);
  };

  const content = (() => {
    switch (active) {
      default:          
        return <HRDashboard />;
      case "dashboard":    
        return <HRDashboard />;
      case "manage_staff": 
        return <HRStaffManagement onAddStaff={() => setActive("add_staff")} />;
      case "add_staff":    
        return <AddStaffHR onDone={() => setActive("manage_staff")} />;
      case "departments":  
        return <HRDepartmentSection title="Departments" />;
      case "shift_types":  
        return <HRShiftTypes />;
      case "shift_calendar": 
        return <ComingSoon title="Shift Calendar" />;
      case "assign_shifts": 
        return <HRAssignShifts />;
      case "shift_swaps":  
        return <HRShiftSwaps />;
      case "attendance":   
        return <HRAttendance />;
      case "all_attendance": 
        return <ViewAllAttendance onClose={() => setActive("attendance")} />;
      case "shift_reports": 
        return <ComingSoon title="Reports" />;
      case "leave":     
        return <HRLeaveManagement />;
      case "settings":  
        return <HRSettings />;
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

        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const isParentActive =
              active === item.key || parentOf(active) === item.key;
            const isExpanded = expandedNav === item.key;

            return (
              <div key={item.key} className="nav-group">
                <button
                  className={`nav-item ${isParentActive ? "nav-item-active" : ""}`}
                  onClick={() => handleNavClick(item)}
                >
                  <div className="icon">{item.icon}</div>
                  <span>{item.label}</span>
                  {item.subItems ? (
                    <ChevronDown
                      size={14}
                      className={`nav-chevron ${isExpanded ? "open" : ""}`}
                    />
                  ) : (
                    isParentActive && <div className="nav-indicator" />
                  )}
                </button>

                {item.subItems && isExpanded && (
                  <div className="sub-nav">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = active === sub.key;
                      return (
                        <button
                          key={sub.key}
                          onClick={() => setActive(sub.key)}
                          className={`sub-nav-item ${isSubActive ? "active" : ""}`}
                        >
                          {isSubActive && <span className="sub-nav-indicator" />}
                          <SubIcon size={15} />
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
          <div className="user-area">
            <button className="notification-btn-square">
              <IoNotificationsOutline size={17} />
              <span className="dot-red" />
            </button>
            <div className="topbar-profile-container">
              <div className="topbar-profile" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="profile-details">
                  <span className="profile-name">
                    {user?.full_name || "Arathy Sreekumar"}
                  </span>
                  <span className="profile-role">
                    {ROLE_LABELS[user?.role] || user?.role || "System Administrator"}
                  </span>
                </div>

                <img src={arathyAvatar} alt="Profile" className="profile-img" />
              </div>

              {profileOpen && (
                <div className="topbar-dropdown">
                  <div className="dropdown-user-info">
                    <img src={arathyAvatar} alt="Profile" className="dropdown-avatar" />
                    <h4>{user?.full_name}</h4>
                    <p>{ROLE_LABELS[user?.role] || user?.role}</p>
                  </div>

                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="hr-body">{content}</main>
      </div>
    </div>
  );
}
