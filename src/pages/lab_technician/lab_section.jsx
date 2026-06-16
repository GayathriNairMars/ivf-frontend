import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./lab_section.css";
import { FlaskConical, Beaker, FileText, Activity, ChevronDown } from "lucide-react";
import { IoNotificationsOutline } from "react-icons/io5";
import { ROLE_LABELS } from "../../constants/constants";
import arathyAvatar from "../../assets/arathy_avatar.png";

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
    key: "tests", label: "Lab Tests",
    icon: <FlaskConical size={16} />,
  },
  {
    key: "results", label: "Results",
    icon: <FileText size={16} />,
  },
  {
    key: "inventory", label: "Inventory",
    icon: <Beaker size={16} />,
  },
  {
    key: "reports", label: "Reports",
    icon: <Activity size={16} />,
  },
];

function ComingSoon({ title }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
      <h2 style={{ color: "#0f172a", marginBottom: 8 }}>{title}</h2>
      <p>This section is under construction.</p>
    </div>
  );
}

export default function LabDashboardSection() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState(null);

  const handleLogout = async () => {
    await logout("lab/logout/");
    window.location.href = "/lab-login";
  };

  const handleNavClick = (item) => {
    setActive(item.key);
    setExpandedNav(null);
  };

  const content = (() => {
    switch (active) {
      case "dashboard":  return <ComingSoon title="Lab Dashboard" />;
      case "tests":      return <ComingSoon title="Lab Tests" />;
      case "results":    return <ComingSoon title="Test Results" />;
      case "inventory":  return <ComingSoon title="Lab Inventory" />;
      case "reports":    return <ComingSoon title="Reports" />;
      default:           return <ComingSoon title="Lab Dashboard" />;
    }
  })();

  return (
    <div className="lab-root">
      <aside className="lab-sidebar">
        <div className="lab-brand">
          <h2>HIMS</h2>
          <p>Lab Administration Portal</p>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const isParentActive = active === item.key;
            const isExpanded = expandedNav === item.key;

            return (
              <div key={item.key} className="nav-group">
                <button
                  className={`nav-item ${isParentActive ? "nav-item-active" : ""}`}
                  onClick={() => handleNavClick(item)}
                >
                  <div className="icon">{item.icon}</div>
                  <span>{item.label}</span>
                  {isParentActive && <div className="nav-indicator" />}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="lab-sidebar-footer">
          <button className="lab-new-btn" onClick={() => setActive("tests")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={14} height={14}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Test Entry
          </button>
        </div>
      </aside>

      <div className="lab-main">
        <header className="lab-topbar">
          <div className="lab-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search tests or patients..." />
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
                    {user?.full_name || "Lab Technician"}
                  </span>
                  <span className="profile-role">
                    {ROLE_LABELS?.[user?.role] || user?.role || "Laboratory"}
                  </span>
                </div>

                <img src={arathyAvatar} alt="Profile" className="profile-img" />
              </div>

              {profileOpen && (
                <div className="topbar-dropdown">
                  <div className="dropdown-user-info">
                    <img src={arathyAvatar} alt="Profile" className="dropdown-avatar" />
                    <h4>{user?.full_name || "Lab Technician"}</h4>
                    <p>{ROLE_LABELS?.[user?.role] || user?.role || "Laboratory"}</p>
                  </div>

                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="lab-body">{content}</main>
      </div>
    </div>
  );
}
