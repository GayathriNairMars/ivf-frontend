import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./section.css";
import { Activity, ChevronDown, AlertTriangle, ClipboardCheck } from "lucide-react";
import { IoNotificationsOutline } from "react-icons/io5";
import { ROLE_LABELS } from "../../constants/constants";
import andrologistAvatar from "../../assets/doctor_avatar.png";
import AndrologySettings from "./settings";
import MyAttendance from "./my_attendance";

/* ── Nav items — mirrors Nurse section structure ── */
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
    key: "semen_analysis",
    label: "Semen Analysis",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <path d="M9 2v6.5l-5 8.5a3 3 0 0 0 2.6 4.5h10.8a3 3 0 0 0 2.6-4.5l-5-8.5V2"/>
        <path d="M8.5 2h7"/>
        <path d="M6.5 14h11"/>
      </svg>
    ),
    subItems: [
      {
        key: "sample_collection",
        label: "Sample Collection",
        icon: (props) => (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={15} height={15}>
            <path d="M9 2v6.5l-5 8.5a3 3 0 0 0 2.6 4.5h10.8a3 3 0 0 0 2.6-4.5l-5-8.5V2"/>
          </svg>
        ),
      },
      {
        key: "test_results",
        label: "Test Results",
        icon: (props) => (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={15} height={15}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        ),
      },
    ],
  },
  { key: "attendance", label: "My Attendance", icon: <ClipboardCheck size={17} /> },
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

/* Base URL for API calls — swap for your existing axios instance/env var if you have one */
const API_BASE = import.meta.env.VITE_API_URL || "/api";

/* ── Placeholder for unbuilt pages ── */
function ComingSoon({ title }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
      <h2 style={{ color: "#0f172a", marginBottom: 8 }}>{title}</h2>
      <p>This section is under construction.</p>
    </div>
  );
}

export default function AndrologistDashboardSection() {
  const { user, logout } = useAuth();
  const [active, setActive]           = useState("sample_collection");
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState("semen_analysis");

  const handleLogout = async () => {
    await logout();
    window.location.href = "/andrologist-login";
  };

  /* ── Heartbeat — lets the backend know this session is active ── */
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_BASE}/andrology/heartbeat/`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error("Heartbeat failed:", err);
      }
    };

    sendHeartbeat(); // fire once on mount
    const intervalId = setInterval(sendHeartbeat, 60000); // then every 60s

    return () => clearInterval(intervalId);
  }, []);

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
      case "dashboard":         return <ComingSoon title="Andrologist Dashboard" />;
      case "search_patient":    return <ComingSoon title="Search Patient" />;
      case "patient_list":      return <ComingSoon title="Patient List" />;
      case "test_results":      return <ComingSoon title="Test Results" />;
      case "sample_collection":      return <ComingSoon title="Sample Collection" />;
      case "attendance":        return <MyAttendance />;
      case "settings":          return <AndrologySettings />;
      default:                  return <AndrologySettings />;
    }
  })();

  return (
    <div className="andro-root">
      {/* ── Sidebar ── */}
      <aside className="andro-sidebar">
        <div className="andro-brand">
          <h2>IVF Speciality Clinic</h2>
          <p>Andrologist Portal</p>
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

        <div className="andro-sidebar-footer">
          <button
            id="andro-critical-result-btn"
            className="andro-critical-btn"
            onClick={() => alert("Critical result flagged to clinical team!")}
          >
            <AlertTriangle size={14} />
            Flag Critical Result
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="andro-main">
        {/* Topbar */}
        <header className="andro-topbar">
          <div className="andro-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Quick Patient Search..." id="andro-topbar-search" />
          </div>

          <div className="user-area">
            <button className="notification-btn-square" id="andro-notifications-btn">
              <IoNotificationsOutline size={17} />
              <span className="dot-red" />
            </button>

            <div className="topbar-profile-container">
              <div className="topbar-profile" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="profile-details">
                  <span className="profile-name">
                    {user?.full_name || "Andrologist"}
                  </span>
                  <span className="profile-role">
                    {ROLE_LABELS[user?.role] || user?.role || "Andrologist"}
                  </span>
                </div>
                <img src={andrologistAvatar} alt="Profile" className="profile-img" />
              </div>

              {profileOpen && (
                <div className="topbar-dropdown">
                  <div className="dropdown-user-info">
                    <img src={andrologistAvatar} alt="Profile" className="dropdown-avatar" />
                    <h4>{user?.full_name || "Andrologist"}</h4>
                    <p>{ROLE_LABELS[user?.role] || user?.role || "Andrologist"}</p>
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
        <main className="andro-body">{content}</main>
      </div>
    </div>
  );
}