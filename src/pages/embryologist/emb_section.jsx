import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./emb_section.css";
import {
  FlaskConical, Microscope, Dna, ClipboardList, BarChart2,
  Settings, ChevronDown, ClipboardCheck, Container,
} from "lucide-react";
import { IoNotificationsOutline } from "react-icons/io5";
import { ROLE_LABELS } from "../../constants/constants";
import arathyAvatar from "../../assets/arathy_avatar.png";
import CryoCreateTank from "./cryo_create_tank";
import CryoTanksList from "./cryo_tanks_list";
import CryoTankDetails from "./cryo_tank_details";
import CryoCanistersList from "./cryo_canisters_list";
import CryoCreateCanister from "./cryo_create_canister";
import CryoCanesList from "./cryo_canes_list";
import CryoCreateCane from "./cryo_create_cane";
import CryoCaneDetails from "./cryo_cane_details";
import EmbryologistSettings from "./settings";


const NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  { key: "embryos",     label: "Embryo Lab",       icon: <FlaskConical size={16} /> },
  { key: "procedures",  label: "Procedures",        icon: <Microscope size={16} /> },
  { key: "genetics",    label: "PGT / Genetics",   icon: <Dna size={16} /> },
  { key: "records",     label: "Patient Records",  icon: <ClipboardList size={16} /> },
  { key: "attendance",  label: "My Attendance",    icon: <ClipboardCheck size={16} /> },
  {
    key: "inventory",
    label: "Inventory",
    icon: <Container size={16} />,
    children: [
      { key: "cryo_canisters_list", label: "Canisters Management" },
      { key: "cryo_canes_list", label: "Canes Management" },
      { key: "cryo_tanks_list", label: "Tanks" },
    ],
  },
  { key: "reports",     label: "Reports",           icon: <BarChart2 size={16} /> },
  { key: "settings",    label: "Settings",          icon: <Settings size={16} /> },
];

function ComingSoon({ title }) {
  return (
    <div className="emb-coming-soon">
      <div className="emb-cs-icon">🧫</div>
      <h2>{title}</h2>
      <p>This section is under development.</p>
    </div>
  );
}

export default function EmbryologistDashboardSection() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [selectedCaneId, setSelectedCaneId] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState(null);

  const handleLogout = async () => {
    await logout("embryology/logout/");
    window.location.href = "/embryologist-login";
  };

  const handleNavClick = (item) => {
    setActive(item.key);
    setExpandedNav(null);
    setProfileOpen(false);
  };

  const content = (() => {
    switch (active) {
      case "dashboard":  return <ComingSoon title="Embryology Dashboard" />;
      case "embryos":    return <ComingSoon title="Embryo Lab" />;
      case "procedures": return <ComingSoon title="Procedures" />;
      case "genetics":   return <ComingSoon title="PGT / Genetics" />;
      case "records":    return <ComingSoon title="Patient Records" />;
      case "attendance": return <ComingSoon title="My Attendance" />;
      case "cryo_tanks_list":
        return (
          <CryoTanksList
            onViewTank={(id) => {
              setSelectedTankId(id);
              setActive("cryo_tank_details");
            }}
            onCreateTank={() => setActive("cryo_create_tank")}
          />
        );
      case "cryo_create_tank":
        return <CryoCreateTank onBack={() => setActive("cryo_tanks_list")} />;
      case "cryo_tank_details":
        return (
          <CryoTankDetails
            tankId={selectedTankId}
            onBack={() => setActive("cryo_tanks_list")}
          />
        );
      case "cryo_canisters_list":
        return (
          <CryoCanistersList
            onViewCanister={(id) => {
              alert(`Viewing details of canister ID: ${id}`);
            }}
            onCreateCanister={() => setActive("cryo_create_canister")}
          />
        );
      case "cryo_create_canister":
        return <CryoCreateCanister onBack={() => setActive("cryo_canisters_list")} />;
      case "cryo_canes_list":
        return (
          <CryoCanesList
            onViewCane={(id) => {
              setSelectedCaneId(id);
              setActive("cryo_cane_details");
            }}
            onCreateCane={() => setActive("cryo_create_cane")}
          />
        );
      case "cryo_create_cane":
        return <CryoCreateCane onBack={() => setActive("cryo_canes_list")} />;
      case "cryo_cane_details":
        return (
          <CryoCaneDetails
            caneId={selectedCaneId}
            onBack={() => setActive("cryo_canes_list")}
          />
        );

      case "reports":    return <ComingSoon title="Reports" />;
      case "settings":   return <EmbryologistSettings />;
      default:           return <ComingSoon title="Embryology Dashboard" />;
    }
  })();

  return (
    <div className="emb-root">
      {/* ── Sidebar ── */}
      <aside className="emb-sidebar">
        <div className="emb-brand">
          <h2>HIMS</h2>
          <p>Embryology Portal</p>
        </div>

        <nav className="emb-sidebar-nav">
          {NAV.map((item) => {
            const isChildActive = item.children?.some(c => active === c.key) || (item.key === "inventory" && ["cryo_create_canister", "cryo_create_cane", "cryo_cane_details"].includes(active));
            const isActive = active === item.key || 
                             isChildActive || 
                             (item.key === "cryo_tanks_list" && (active === "cryo_create_tank" || active === "cryo_tank_details"));
            const isExpanded = expandedNav === item.key || isChildActive;


            return (
              <div key={item.key} className="emb-nav-group">
                <button
                  className={`emb-nav-item ${isActive ? "emb-nav-item-active" : ""}`}
                  onClick={() => {
                    if (item.children) {
                      setExpandedNav(isExpanded ? null : item.key);
                    } else {
                      handleNavClick(item);
                    }
                  }}
                >
                  <div className="emb-nav-icon">{item.icon}</div>
                  <span>{item.label}</span>
                  {item.children && (
                    <ChevronDown
                      size={14}
                      style={{
                        marginLeft: "auto",
                        transition: "transform 0.2s",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                      }}
                    />
                  )}
                  {isActive && !item.children && <div className="emb-nav-indicator" />}
                </button>

                {item.children && isExpanded && (
                  <div className="emb-nav-sub">
                    {item.children.map((child) => (
                      <button
                        key={child.key}
                        className={`emb-nav-sub-item ${active === child.key ? "active" : ""}`}
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

        <div className="emb-sidebar-footer">
          <button className="emb-new-btn" onClick={() => setActive("cryo_create_tank")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={14} height={14}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Tank Asset
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="emb-main">
        {/* Topbar */}
        <header className="emb-topbar">
          <div className="emb-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search embryos, patients..." />
          </div>

          <div className="emb-user-area">
            {/* Notification bell */}
            <button className="emb-icon-btn">
              <IoNotificationsOutline size={18} />
              <span className="emb-dot-red" />
            </button>

            {/* Settings shortcut */}
            <button
              className={`emb-icon-btn ${active === "settings" ? "emb-icon-btn-active" : ""}`}
              onClick={() => { setActive("settings"); setProfileOpen(false); }}
              title="Settings"
            >
              <Settings size={17} />
            </button>

            {/* Profile dropdown */}
            <div className="emb-profile-container">
              <div className="emb-profile" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="emb-profile-info">
                  <span className="emb-profile-name">{user?.full_name || "Embryologist"}</span>
                  <span className="emb-profile-role">
                    {ROLE_LABELS?.[user?.role] || user?.role || "Embryology"}
                  </span>
                </div>
                <img src={arathyAvatar} alt="Profile" className="emb-profile-img" />
              </div>

              {profileOpen && (
                <div className="emb-dropdown">
                  <div className="emb-dropdown-user">
                    <img src={arathyAvatar} alt="Profile" className="emb-dropdown-avatar" />
                    <h4>{user?.full_name || "Embryologist"}</h4>
                    <p>{ROLE_LABELS?.[user?.role] || "Embryology"}</p>
                  </div>

                  <button
                    className="emb-dropdown-link"
                    onClick={() => { setActive("settings"); setProfileOpen(false); }}
                  >
                    <Settings size={15} /> Settings
                  </button>

                  <button className="emb-dropdown-logout" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="emb-body">{content}</main>
      </div>
    </div>
  );
}
