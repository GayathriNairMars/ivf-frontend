import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./section.css";
import { FlaskConical, Beaker, FileText, Activity, ChevronDown, ClipboardCheck } from "lucide-react";
import { IoNotificationsOutline } from "react-icons/io5";
import { ROLE_LABELS } from "../../constants/constants";
import arathyAvatar from "../../assets/arathy_avatar.png";
import PharmacistAttendance from "./pharmacist_attendance";
import AddInventory from "./add_inventory";
import PharmacistInventory from "./pharmacist_inventory";
import PharmacistAlerts from "./pharmacist_alerts";
import PharmacistSettings from "./pharmacist_settings";
import StockAdjustment from "./stock_adjustment";
import PharmacistDashboard from "./pharmacist_dashboard";


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
    key: "billing", label: "Billing",
    icon: <FlaskConical size={16} />,
  },
  {
    key: "inventory", label: "Inventory",
    icon: <Beaker size={16} />,
    children: [
      { key: "inventory_dashboard", label: "Dashboard" },
      { key: "stock_alerts", label: "Stock Alerts" },
      { key: "inventory", label: "Add Inventory" },
      { key: "stock_adjustment", label: "Stock Adjustment" },
    ]
  },
  {
    key:"attendance", label:"My Attendance", icon: <ClipboardCheck size={16} />, 
  },
  {
    key: "settings", label: "Settings",
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

export default function PharmacistDashboardSection() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState(null);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/pharmacist-login";
  };

  const handleNavClick = (item) => {
    setActive(item.key);
    setExpandedNav(null);
  };

  const content = (() => {
    switch (active) {
      case "dashboard":  return <PharmacistDashboard />;
      case "billing":      return <ComingSoon title="Billing" />;
      case "inventory":  return <AddInventory />;
      case "inventory_dashboard":  return <PharmacistInventory />;
      case "stock_alerts": return <PharmacistAlerts />;
      case "stock_adjustment": return <StockAdjustment />;
      case "attendance": return <PharmacistAttendance />;
      case "settings":    return <PharmacistSettings />;
      default:           return <ComingSoon title="Pharmacy Dashboard" />;
    }
  })();

  return (
    <div className="lab-root">
      <aside className="lab-sidebar">
        <div className="lab-brand">
          <h2>HIMS</h2>
          <p>Pharmacist Portal</p>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const isParentActive = active === item.key || active.startsWith(item.key);
            const isExpanded = expandedNav === item.key || (item.children && isParentActive);

            return (
              <div key={item.key} className="nav-group">
                <button
                  className={`nav-item ${isParentActive && !item.children ? "nav-item-active" : ""}`}
                  onClick={() => {
                    if (item.children) {
                      setExpandedNav(isExpanded ? null : item.key);
                    } else {
                      handleNavClick(item);
                    }
                  }}
                >
                  <div className="icon">{item.icon}</div>
                  <span>{item.label}</span>
                  {item.children && (
                    <ChevronDown
                      size={16}
                      className={`nav-chevron ${isExpanded ? "expanded" : ""}`}
                      style={{ marginLeft: "auto", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}
                    />
                  )}
                  {isParentActive && !item.children && <div className="nav-indicator" />}
                </button>

                {item.children && isExpanded && (
                  <div className="nav-sub">
                    {item.children.map((child) => (
                      <button
                        key={child.key}
                        className={`nav-sub-item ${active === child.key ? "active" : ""}`}
                        onClick={() => handleNavClick(child)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
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
                    {user?.full_name || "Pharmacist"}
                  </span>
                  <span className="profile-role">
                    {ROLE_LABELS?.[user?.role] || user?.role || "Pharmacy"}
                  </span>
                </div>

                <img src={arathyAvatar} alt="Profile" className="profile-img" />
              </div>

              {profileOpen && (
                <div className="topbar-dropdown">
                  <div className="dropdown-user-info">
                    <img src={arathyAvatar} alt="Profile" className="dropdown-avatar" />
                    <h4>{user?.full_name || "Pharmacist"}</h4>
                    <p>{ROLE_LABELS?.[user?.role] || user?.role || "Pharmacy"}</p>
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
