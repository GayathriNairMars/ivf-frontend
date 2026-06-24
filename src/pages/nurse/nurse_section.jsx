import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./nurse_section.css";
import { Activity, ChevronDown, AlertTriangle,ClipboardCheck } from "lucide-react";
import { IoNotificationsOutline } from "react-icons/io5";
import { ROLE_LABELS } from "../../constants/constants";
import arathyAvatar from "../../assets/arathy_avatar.png";
import VitalsEntry from "./vitals_entry";
import NurseAttendance from "./nurse_attendance";

/* ── Nav items — mirrors HR section structure ── */
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
    key: "patients",
    label: "Patients",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    subItems: [
      {
        key: "search_patient",
        label: "Search Patient",
        icon: (props) => (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={15} height={15}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        ),
      },
      {
        key: "patient_list",
        label: "Patient List",
        icon: (props) => (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={15} height={15}>
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        ),
      },
    ],
  },
  {
    key: "vitals",
    label: "Vitals",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    subItems: [
      {
        key: "vitals_entry",
        label: "Vitals Entry",
        icon: (props) => (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={15} height={15}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        ),
      },
    ],
  },
  {
    key: "medications",
    label: "Medications",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    ),
  },
  {
    key: "history",
    label: "History",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <polyline points="12 8 12 12 14 14"/>
        <path d="M3.05 11a9 9 0 1 0 .5-4.5"/>
        <polyline points="3 3 3 7 7 7"/>
      </svg>
    ),
  },
  {key:"attendance",label:"My Attendance", icon:<ClipboardCheck size={17} />},
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

export default function NurseDashboardSection() {
  const { user, logout } = useAuth();
  const [active, setActive]           = useState("vitals_entry");
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState("vitals");

  const handleLogout = async () => {
    await logout();
    window.location.href = "/nurse-login";
  };

  /* map sub-item key → parent key */
  const parentOf = (childKey) => {
    for (const item of NAV) {
      if (item.subItems?.some((s) => s.key === childKey)) return item.key;
    }
    return null;
  };

  const handleNavClick = (item) => {
    if (item.subItems) {
      setExpandedNav((prev) => (prev === item.key ? null : item.key));
      if (!item.subItems.some((s) => s.key === active)) {
        setActive(item.subItems[0].key);
      }
    } else {
      setActive(item.key);
      setExpandedNav(null);
    }
  };

  const content = (() => {
    switch (active) {
      case "vitals_entry":   return <VitalsEntry />;
      case "dashboard":      return <ComingSoon title="Nurse Dashboard" />;
      case "search_patient": return <ComingSoon title="Search Patient" />;
      case "patient_list":   return <ComingSoon title="Patient List" />;
      case "medications":    return <ComingSoon title="Medications" />;
      case "history":        return <ComingSoon title="History" />;
      case "attendance":        return <NurseAttendance />;
      case "settings":       return <ComingSoon title="Settings" />;
      default:               return <VitalsEntry />;
    }
  })();

  return (
    <div className="nur-root">
      {/* ── Sidebar ── */}
      <aside className="nur-sidebar">
        <div className="nur-brand">
          <h2>IVF Speciality Clinic</h2>
          <p>Nurse Portal</p>
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
                          <SubIcon />
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

        <div className="nur-sidebar-footer">
          <button
            id="nur-emergency-alert-btn"
            className="nur-emergency-btn"
            onClick={() => alert("Emergency Alert dispatched!")}
          >
            <AlertTriangle size={14} />
            Emergency Alert
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="nur-main">
        {/* Topbar */}
        <header className="nur-topbar">
          <div className="nur-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Quick Patient Search..." id="nur-topbar-search" />
          </div>

          <div className="user-area">
            <button className="notification-btn-square" id="nur-notifications-btn">
              <IoNotificationsOutline size={17} />
              <span className="dot-red" />
            </button>

            <div className="topbar-profile-container">
              <div className="topbar-profile" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="profile-details">
                  <span className="profile-name">
                    {user?.full_name || "Nurse"}
                  </span>
                  <span className="profile-role">
                    {ROLE_LABELS[user?.role] || user?.role || "Nurse"}
                  </span>
                </div>
                <img src={arathyAvatar} alt="Profile" className="profile-img" />
              </div>

              {profileOpen && (
                <div className="topbar-dropdown">
                  <div className="dropdown-user-info">
                    <img src={arathyAvatar} alt="Profile" className="dropdown-avatar" />
                    <h4>{user?.full_name || "Nurse"}</h4>
                    <p>{ROLE_LABELS[user?.role] || user?.role || "Nurse"}</p>
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
        <main className="nur-body">{content}</main>
      </div>
    </div>
  );
}
