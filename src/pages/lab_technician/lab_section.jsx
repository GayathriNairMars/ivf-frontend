import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./lab_section.css";
import { FlaskConical, Beaker, FileText, Activity, ChevronDown, ClipboardCheck, Settings, Users, Calendar, LayoutGrid, LogOut } from "lucide-react";
import { IoNotificationsOutline } from "react-icons/io5";
import { ROLE_LABELS } from "../../constants/constants";
import arathyAvatar from "../../assets/arathy_avatar.png";
import LabAttendance from "./lab_attendance";
import LabSettings from "./lab_settings";
import LabDashboard from "./lab_dashboard";
import AllRecords from "./all_records";
import RecordDetail from "./record_detail";
import TestTypeRecords from "./test_type_records";
import labApi from "../../api/labApi";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutGrid size={16} /> },
  { key: "records", label: "All Records", icon: <FileText size={16} /> },
  { key: "patients", label: "Patients", icon: <Users size={16} /> },
  { key: "schedule", label: "Lab Schedule", icon: <Calendar size={16} /> },
  { key: "inventory", label: "Inventory", icon: <Beaker size={16} /> },
  { key: "tests", label: "Test Types", icon: <FlaskConical size={16} /> },
  { key: "reports", label: "Analytics", icon: <Activity size={16} /> },
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
      case "records":       return <AllRecords testTypes={testTypes} onViewRecord={(id) => { setSelectedRecordId(id); setActive("record_detail"); }} />;
      case "record_detail": return <RecordDetail recordId={selectedRecordId} onBack={() => setActive("records")} />;
      case "patients":      return <ComingSoon title="Patients Directory" />;
      case "schedule":      return <ComingSoon title="Lab Schedule" />;
      case "tests":         return <ComingSoon title="Test Types" />;
      case "inventory":     return <ComingSoon title="Lab Inventory" />;
      case "attendance":    return <LabAttendance />;
      case "reports":       return <ComingSoon title="Analytics" />;
      case "settings":      return <LabSettings />;
      default:              return <LabDashboard testTypes={testTypes} onViewRecord={(id) => { setSelectedRecordId(id); setActive("record_detail"); }} />;
    }
  })();

  return (
    <div className="lab-root">
      <aside className="lab-sidebar">
        <div className="lab-brand" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "20px 16px" }}>
          <div style={{ background: "#0f172a", color: "#fff", padding: "8px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FlaskConical size={18} />
          </div>
          <div style={{ textAlign: "left" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", margin: 0 }}>IVF Clinical Lab</h2>
            <p style={{ fontSize: "10px", color: "#9ca3af", margin: 0 }}>Precision Management</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const isActiveItem = active === item.key;
            const isTestsParent = item.key === "tests";
            const isAnySubActive = active.startsWith("test_type_");

            return (
              <div key={item.key} className="nav-group">
                <button
                  className={`nav-item ${(isActiveItem || (isTestsParent && isAnySubActive)) ? "nav-item-active" : ""}`}
                  onClick={() => {
                    if (isTestsParent) {
                      if (testTypes.length > 0) {
                        setActive(`test_type_${testTypes[0].id}`);
                      } else {
                        setActive("tests");
                      }
                    } else {
                      setActive(item.key);
                    }
                  }}
                >
                  <div className="icon">{item.icon}</div>
                  <span>{item.label}</span>
                  {(isActiveItem || (isTestsParent && isAnySubActive)) && <div className="nav-indicator" />}
                </button>

                {/* Dynamic Test Types Nested Subitems */}
                {isTestsParent && (
                  <div className="sub-nav">
                    {testTypes.map((type) => {
                      const isTypeActive = active === `test_type_${type.id}`;
                      return (
                        <button 
                          key={type.id} 
                          className={`sub-nav-item ${isTypeActive ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActive(`test_type_${type.id}`);
                          }}
                        >
                          {isTypeActive && <span className="sub-nav-indicator" />}
                          <span>{type.name}</span>
                          <span style={{ 
                            fontSize: "10px", 
                            background: isTypeActive ? "#0d9488" : "#f3f4f6", 
                            color: isTypeActive ? "#fff" : "#6b7280", 
                            padding: "1px 6px", 
                            borderRadius: "10px", 
                            fontWeight: "600",
                            marginLeft: "auto"
                          }}>
                            {type.record_count ?? type.field_count ?? 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="lab-sidebar-footer" style={{ borderTop: "1px solid #f3f4f6", padding: "16px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* User profile row */}
          <div className="lab-user" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 6px" }}>
            <img src={arathyAvatar} alt="Profile" className="profile-img" style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1.5px solid #0d9488" }} />
            <div className="lab-user-info" style={{ textAlign: "left" }}>
              <span className="lab-user-name" style={{ fontSize: "12px", fontWeight: "700", color: "#1f2937" }}>
                {user?.full_name || "Lab Tech"}
              </span>
              <span className="lab-user-role" style={{ fontSize: "10px", color: "#9ca3af" }}>
                {user?.email || "dr.smith@ivfcenter.com"}
              </span>
            </div>
          </div>

          {/* Settings option */}
          <button 
            className={`nav-item ${active === "settings" ? "nav-item-active" : ""}`} 
            onClick={() => setActive("settings")}
            style={{ height: "36px", padding: "8px 12px" }}
          >
            <div className="icon"><Settings size={15} /></div>
            <span>Settings</span>
          </button>

          {/* Logout option */}
          <button 
            className="nav-item" 
            onClick={handleLogout}
            style={{ height: "36px", padding: "8px 12px", color: "#ef4444" }}
          >
            <div className="icon"><LogOut size={15} /></div>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="lab-main">
        <header className="lab-topbar">
          <div className="lab-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search patients, tests, or records..." />
          </div>
          <div className="user-area">
            <button className="notification-btn-square">
              <IoNotificationsOutline size={17} />
              <span className="dot-red" />
            </button>
            <button 
              className="btn-primary" 
              style={{ padding: "8px 16px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", height: "38px", background: "#0f172a", color: "#fff", border: "none", cursor: "pointer" }}
              onClick={() => setActive("tests")}
            >
              <span style={{ fontSize: "16px", fontWeight: "700" }}>+</span> New Lab Order
            </button>
          </div>
        </header>

        <main className="lab-body">{content}</main>
      </div>
    </div>
  );
}
