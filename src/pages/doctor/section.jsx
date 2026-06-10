import React, { useState, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import TodaysQueue from "./todays_queue";
import PatientsList from "./patients";
import PatientDetail from "./patient_detail";
import Icon from "../../components/Icons";
import { IoNotificationsOutline } from "react-icons/io5";
import "../receptionist/receptionist.css"; // Reuse the layout CSS

const NAV_TOP = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "departments", label: "Departments", icon: "departments" }, // Assuming you have these icons or fallback
  { key: "patients", label: "Patients", icon: "users" },
];

const DOCTOR_CHILDREN = [
  { key: "queue", label: "Today's Queue", icon: "activity" },
];

const ROLE_LABELS = {
  gyn: "Gynaecologist",
  end: "Endocrinologist",
  ane: "Anesthesiologist",
  doctor: "Doctor"
};

function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export default function DoctorDashboardSection() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState("queue"); // Default to queue
  const [previousActive, setPreviousActive] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setTimeout(() => { window.location.href = "/login"; }, 100);
  };

  const handleViewPatient = (id) => {
    setSelectedPatientId(id);
    setPreviousActive(active);
    setActive("patient_detail");
  };

  const handleBackToPatients = () => {
    setSelectedPatientId(null);
    setActive(previousActive || "patients");
  };

  const content = useMemo(() => {
    switch (active) {
      case "queue":
        return <TodaysQueue onViewPatient={handleViewPatient} />;
      case "patients":
        return <PatientsList onViewPatient={handleViewPatient} />;
      case "patient_detail":
        return <PatientDetail patientId={selectedPatientId} onBack={handleBackToPatients} />;
      default:
        return <div style={{ padding: '24px' }}><h2>{active} View</h2><p>This section is under construction.</p></div>;
    }
  }, [active, selectedPatientId]);

  const handleNavClick = (key) => {
    setActive(key);
  };

  const doctorAvatar = "https://via.placeholder.com/40";
  const userRole = user?.role ? user.role.toLowerCase() : "doctor";

  return (
    <div className={`sad-root ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <aside className="sad-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo" style={{ cursor: "pointer" }} onClick={() => setActive("queue")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          {sidebarOpen && <span className="brand-name" style={{ cursor: "pointer" }} onClick={() => setActive("queue")}>HIMS</span>}
        </div>

        <nav className="sidebar-nav">
          {NAV_TOP.map(item => (
            <button
              key={item.key}
              className={`nav-item ${active === item.key ? "active" : ""}`}
              onClick={() => handleNavClick(item.key)}
              title={!sidebarOpen ? item.label : ""}
            >
              <Icon name={item.icon} fallback={<QueueIcon />} />
              {sidebarOpen && <span>{item.label}</span>}
              {active === item.key && <div className="nav-indicator" />}
            </button>
          ))}
          
          <button
              className={`nav-item ${active === 'queue' ? "active" : ""}`}
              onClick={() => handleNavClick('queue')}
              title={!sidebarOpen ? "Today's Queue" : ""}
            >
              <QueueIcon />
              {sidebarOpen && <span>Today's Queue</span>}
              {active === 'queue' && <div className="nav-indicator" />}
          </button>
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen ? (
            <div className="organization-info">
              <div className="org-avatar-container">
                <div className="org-avatar">
                  <div className="org-icon">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="org-text">
                <span className="org-name">City General</span>
                <span className="org-district">Central District</span>
              </div>
            </div>
          ) : (
            <div className="org-avatar-container" style={{ margin: "0 auto" }}>
              <div className="org-avatar">
                <div className="org-icon">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="sad-main">
        <header className="sad-topbar">
          <button className="collapse-btn" onClick={() => setSidebarOpen(o => !o)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="search-bar">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input type="text" placeholder="Search hospital database" />
          </div>

          <div className="user-area">
            <button className="notification-btn-square">
              <IoNotificationsOutline size={17} />
              <span className="dot-red" />
            </button>

            <div className="topbar-profile-container">
              <div
                className="topbar-profile"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="profile-details">
                  <span className="profile-name">
                    {user?.full_name || "Doctor Name"}
                  </span>
                  <span className="profile-role">
                    {ROLE_LABELS[userRole] || user?.role || "Doctor"}
                  </span>
                </div>

                <img
                  src={doctorAvatar}
                  alt="Profile"
                  className="profile-img"
                />
              </div>

              {profileOpen && (
                <div className="topbar-dropdown">
                  <div className="dropdown-user-info">
                    <img
                      src={doctorAvatar}
                      alt="Profile"
                      className="dropdown-avatar"
                    />
                    <h4>{user?.full_name || "Doctor Name"}</h4>
                    <p>{ROLE_LABELS[userRole] || user?.role || "Doctor"}</p>
                  </div>

                  <button
                    className="dropdown-item logout-btn"
                    onClick={handleLogout}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="sad-body">
          <div className="section-content">
            {content}
          </div>
        </main>
      </div>
    </div>
  );
}
