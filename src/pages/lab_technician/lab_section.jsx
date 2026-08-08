import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useHospital } from "../../context/HospitalContext";
import { HospitalBrand, HospitalLogo } from "../../components/HospitalBrand";
import "./lab_section.css";
import {
  FlaskConical,
  Beaker,
  FileText,
  Activity,
  ChevronDown,
  ClipboardCheck,
  Settings,
  Calendar,
  LayoutGrid,
  LogOut,
  Search,
  Menu,
  Building2,
} from "lucide-react";
import { IoNotificationsOutline } from "react-icons/io5";
import { ROLE_LABELS } from "../../constants/constants";
import arathyAvatar from "../../assets/arathy_avatar.png";
import LabAttendance from "./lab_attendance";
import LabSettings from "./lab_settings";
import LabDashboard from "./lab_dashboard";
import AllRecords from "./all_records";
import RecordDetail from "./record_detail";
import TestTypeRecords from "./test_type_records";
import LabOrders from "./lab_orders";
import labApi from "../../api/labApi";

const NAV_TOP = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutGrid size={18} /> },
  { key: "pending_tests", label: "Pending Tests", icon: <ClipboardCheck size={18} /> },
  { key: "in_progress", label: "In Progress", icon: <Beaker size={18} /> },
  { key: "completed", label: "Completed", icon: <FileText size={18} /> },
  { key: "attendance", label: "My Attendance", icon: <Calendar size={18} /> },
  { key: "reports", label: "Analytics", icon: <Activity size={18} /> },
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [testTypesOpen, setTestTypesOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [testTypes, setTestTypes] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  useEffect(() => {
    async function loadTestTypes() {
      try {
        const data = await labApi.getTestTypes();
        const list = Array.isArray(data) ? data : (data?.test_types || []);
        if (list.length > 0) {
          setTestTypes(list);
        } else {
          // Fallback mockup items
          setTestTypes([
            { id: 1, name: "Sugar Test", record_count: 12 },
            { id: 2, name: "Blood Pressure", record_count: 8 },
            { id: 3, name: "Lipid Profile", record_count: 5 },
            { id: 4, name: "Hormone Profile", record_count: 3 },
            { id: 5, name: "COVID-19", record_count: 0 }
          ]);
        }
      } catch (err) {
        console.error("Error loading test types", err);
        setTestTypes([
          { id: 1, name: "Sugar Test", record_count: 12 },
          { id: 2, name: "Blood Pressure", record_count: 8 },
          { id: 3, name: "Lipid Profile", record_count: 5 },
          { id: 4, name: "Hormone Profile", record_count: 3 },
          { id: 5, name: "COVID-19", record_count: 0 }
        ]);
      }
    }
    loadTestTypes();
  }, []);

  const handleLogout = async () => {
    await logout("lab/logout/");
    window.location.href = "/lab-login";
  };

  const handleNavClick = (key) => setActive(key);

  const testTypesGroupActive = active.startsWith("test_type_");
  const avatarSrc = arathyAvatar;

  const content = (() => {
    if (active.startsWith("test_type_")) {
      const typeId = parseInt(active.replace("test_type_", ""), 10);
      return (
        <TestTypeRecords
          testTypeId={typeId}
          onViewRecord={(id) => {
            setSelectedRecordId(id);
            setActive("record_detail");
          }}
        />
      );
    }

    switch (active) {
      case "dashboard":     return <LabDashboard testTypes={testTypes} onViewRecord={(id) => { setSelectedRecordId(id); setActive("record_detail"); }} />;
      case "pending_tests": return <LabOrders filterStatus="ORDERED" testTypes={testTypes} onViewRecord={(id) => { setSelectedRecordId(id); setActive("record_detail"); }} />;
      case "in_progress":   return <LabOrders filterStatus="IN_PROGRESS" testTypes={testTypes} onViewRecord={(id) => { setSelectedRecordId(id); setActive("record_detail"); }} />;
      case "completed":     return <LabOrders filterStatus="COMPLETED" testTypes={testTypes} onViewRecord={(id) => { setSelectedRecordId(id); setActive("record_detail"); }} />;
      case "records":       return <AllRecords testTypes={testTypes} onViewRecord={(id) => { setSelectedRecordId(id); setActive("record_detail"); }} />;
      case "record_detail": return <RecordDetail recordId={selectedRecordId} onBack={() => setActive("pending_tests")} />;
      case "attendance":    return <LabAttendance />;
      case "reports":       return <ComingSoon title="Analytics" />;
      case "settings":      return <LabSettings />;
      default:              return <LabDashboard testTypes={testTypes} onViewRecord={(id) => { setSelectedRecordId(id); setActive("record_detail"); }} />;
    }
  })();

  return (
    <div className={`lab-root ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>

      {/* ══ Sidebar ══════════════════════════════════════════════════════════ */}
      <aside className="lab-sidebar">

        <div className="lab-brand" style={{ cursor: "pointer" }} onClick={() => setActive("dashboard")}>
          <HospitalBrand portal="Laboratory Portal" logoSize={34} />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">{sidebarOpen ? "MAIN MENU" : "•••"}</div>
          {NAV_TOP.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavClick(item.key)}
                title={!sidebarOpen ? item.label : ""}
              >
                {isActive && <div className="nav-active-bar" />}
                <div className="nav-icon-wrap">{item.icon}</div>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </button>
            );
          })}

          <div className="nav-section-label" style={{ marginTop: "12px" }}>
            {sidebarOpen ? "TEST TYPES" : "•••"}
          </div>

          <div className="nav-group">
            <button
              className={`nav-item ${testTypesGroupActive ? "active" : ""}`}
              onClick={() => {
                if (sidebarOpen) {
                  setTestTypesOpen((o) => !o);
                } else {
                  setSidebarOpen(true);
                  setTestTypesOpen(true);
                }
              }}
              title={!sidebarOpen ? "Test Types" : ""}
            >
              {testTypesGroupActive && <div className="nav-active-bar" />}
              <div className="nav-icon-wrap">
                <Beaker size={18} />
              </div>
              {sidebarOpen && (
                <>
                  <span className="nav-label" style={{ flex: 1, textAlign: "left" }}>Test Types</span>
                  <ChevronDown
                    size={14}
                    className="nav-chevron"
                    style={{ transform: testTypesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </>
              )}
            </button>

            {sidebarOpen && testTypesOpen && (
              <div className="nav-sub">
                {testTypes.map((type) => {
                  const isTypeActive = active === `test_type_${type.id}`;
                  return (
                    <button
                      key={type.id}
                      className={`nav-sub-item ${isTypeActive ? "active" : ""}`}
                      onClick={() => handleNavClick(`test_type_${type.id}`)}
                    >
                      {isTypeActive && <div className="nav-active-bar" />}
                      <span>{type.name}</span>
                      <span className="nav-sub-count">
                        {type.record_count ?? type.field_count ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {!sidebarOpen && (
              <div className="nav-collapsed-sub">
                {testTypes.map((type) => {
                  const isTypeActive = active === `test_type_${type.id}`;
                  return (
                    <button
                      key={type.id}
                      className={`nav-item ${isTypeActive ? "active" : ""}`}
                      onClick={() => handleNavClick(`test_type_${type.id}`)}
                      title={type.name}
                    >
                      {isTypeActive && <div className="nav-active-bar" />}
                      <Beaker size={16} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen ? (
            <div className="organization-info">
              <div className="org-avatar">
                <Building2 size={16} color="#ffffff" />
              </div>
              <div className="org-text">
                <span className="org-name">IVF Fertility Center</span>
                <span className="org-district">Central Branch • Diagnostics Lab</span>
              </div>
            </div>
          ) : (
            <div className="org-avatar" style={{ margin: "0 auto" }}>
              <Building2 size={16} color="#ffffff" />
            </div>
          )}
        </div>
      </aside>

      {/* ══ Main area ════════════════════════════════════════════════════════ */}
      <div className="lab-main">
        <header className="lab-topbar">
          <button
            className="collapse-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu size={18} />
          </button>

          <div className="lab-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search patients, tests, or records..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch("")}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 12 }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="user-area">
            <button className="notification-btn-square" title="Notifications">
              <IoNotificationsOutline size={18} />
              <span className="dot-red" />
            </button>

            <div className="topbar-profile-container">
              <div className="topbar-profile" onClick={() => setProfileOpen(!profileOpen)}>
                <img src={avatarSrc} alt="Profile" className="profile-img" />
                <div className="profile-details">
                  <span className="profile-name">{user?.full_name || "Lab Tech"}</span>
                  <span className="profile-role">{ROLE_LABELS?.[user?.role] || "Lab Technician"}</span>
                </div>
                <ChevronDown
                  size={14}
                  className="profile-chevron"
                  style={{ transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </div>

              {profileOpen && (
                <div className="topbar-dropdown">
                  <div className="dropdown-user-info">
                    <img src={avatarSrc} alt="Profile" className="dropdown-avatar" />
                    <h4>{user?.full_name || "Lab Tech"}</h4>
                    <p>{user?.email || "dr.smith@ivfcenter.com"}</p>
                    <span className="dropdown-status-pill">
                      <span className="dot-green" /> On Duty
                    </span>
                  </div>
                  <div className="dropdown-menu-list">
                    <button className="dropdown-item" onClick={() => { setProfileOpen(false); setActive("attendance"); }}>
                      <Calendar size={15} /> My Attendance
                    </button>
                    <button className="dropdown-item" onClick={() => { setProfileOpen(false); setActive("settings"); }}>
                      <Settings size={15} /> Settings
                    </button>
                    <button className="dropdown-item logout-btn" onClick={handleLogout}>
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="lab-body">
          <div className="section-content">{content}</div>
        </main>
      </div>
    </div>
  );
}