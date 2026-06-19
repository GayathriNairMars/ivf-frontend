// Receptionist Dashboard – layout with sidebar nav + Tickets group
import { useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import RecDashboardHome from "./dashboard";
import Appointments from "./appointments";
import BookAppointment from "./book_appointment";
import RescheduleAppointment from "./reschedule_appointment";
import OPQueue from "./opqueue";
import NewTicket from "./new_ticket";
import PatientDirectory from "./patient_directory";
import PhysicianCalendar from "./PhysicianCalendar";
import ReceptionistAttendance from "./receptionist_attendance";
import Icon from "../../components/Icons";
import { IoNotificationsOutline } from "react-icons/io5";
import "./receptionist.css";

const NAV_TOP = [
  { key: "dashboard",  label: "Dashboard",        icon: "dashboard"    },
  { key: "appointments", label: "Appointments",    icon: "appointments" },
  { key: "directory", label: "Patient Directory",  icon: "staff"        },
  { key: "attendance", label: "My Attendance",  icon: "attendance"        },
];

const TICKETS_CHILDREN = [
  { key: "ticket", label: "Add Ticket",   icon: "add"      },
  { key: "queue",  label: "Today's Queue", icon: "activity" },
];

const ROLE_LABELS = {
  receptionist: "Receptionist",
  doctor:       "Doctor",
  admin:        "Administrator"
};

function AddTicketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function TicketsGroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9"  y1="15" x2="15" y2="15"/>
    </svg>
  );
}

function SubIcon({ iconKey }) {
  if (iconKey === "ticket") return <AddTicketIcon />;
  return <QueueIcon />;
}

export default function ReceptionistDashboardSection() {
  const { user, logout } = useAuth();
  const [active,       setActive]       = useState("dashboard");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [ticketsOpen,  setTicketsOpen]  = useState(true);
  const [profileOpen,  setProfileOpen]  = useState(false);

  // useRef so the value is always current inside the memoised content
  const rescheduleIdRef = useRef(null);
  // Also keep state so navigation re-renders work correctly
  const [rescheduleId,  setRescheduleId] = useState(null);

  const handleLogout = async () => {
    await logout();
    setTimeout(() => { window.location.href = "/login"; }, 100);
  };

  const handleReschedule = (id) => {
    rescheduleIdRef.current = id;   // always in sync, no batching issues
    setRescheduleId(id);
    setActive("reschedule_appointment");
  };

  const ticketsGroupActive = active === "ticket" || active === "queue";

  // ── Content router ─────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return <RecDashboardHome onNavigate={setActive} />;

      case "appointments":
        return (
          <Appointments
            onBook={() => setActive("book_appointment")}
            onReschedule={handleReschedule}
            onCalendar={() => setActive("physician_calendar")}
          />
        );

      case "physician_calendar":
        return <PhysicianCalendar onBack={() => setActive("appointments")} />;

      case "book_appointment":
        return <BookAppointment onCancel={() => setActive("appointments")} />;

      case "reschedule_appointment":
        return (
          <RescheduleAppointment
            appointmentId={rescheduleIdRef.current}
            onCancel={() => setActive("appointments")}
          />
        );

      case "queue":
        return (
          <OPQueue
            onNewTicket={() => { setActive("ticket"); setTicketsOpen(true); }}
          />
        );

      case "ticket":
        return (
          <NewTicket
            onSuccess={() => { setActive("queue"); setTicketsOpen(true); }}
            onCancel={()  => { setActive("queue"); setTicketsOpen(true); }}
          />
        );

      case "directory":
        return <PatientDirectory />;
      case "attendance":
        return <ReceptionistAttendance />;

      default:
        return <RecDashboardHome onNavigate={setActive} />;
    }
  };

  const handleNavClick = (key) => setActive(key);
  const doctorAvatar = "https://via.placeholder.com/40";

  return (
    <div className={`sad-root ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>

      {/* ══ Sidebar ══════════════════════════════════════════════════════════ */}
      <aside className="sad-sidebar">

        <div className="sidebar-brand">
          <div className="brand-logo" style={{ cursor: "pointer" }} onClick={() => setActive("dashboard")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          {sidebarOpen && <span className="brand-name" style={{ cursor: "pointer" }} onClick={() => setActive("dashboard")}>HIMS</span>}
        </div>

        <nav className="sidebar-nav">
          {NAV_TOP.map(item => (
            <button
              key={item.key}
              className={`nav-item ${active === item.key ? "active" : ""}`}
              onClick={() => handleNavClick(item.key)}
              title={!sidebarOpen ? item.label : ""}
            >
              <Icon name={item.icon} />
              {sidebarOpen && <span>{item.label}</span>}
              {active === item.key && <div className="nav-indicator" />}
            </button>
          ))}

          <div className="nav-group">
            <button
              className={`nav-item nav-group-header ${ticketsGroupActive ? "active" : ""}`}
              onClick={() => {
                if (sidebarOpen) {
                  setTicketsOpen(o => !o);
                } else {
                  setSidebarOpen(true);
                  setTicketsOpen(true);
                }
              }}
              title={!sidebarOpen ? "Tickets" : ""}
            >
              <TicketsGroupIcon />
              {sidebarOpen && (
                <>
                  <span style={{ flex: 1, textAlign: "left" }}>Tickets</span>
                  <svg
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" width="13" height="13"
                    style={{
                      transform: ticketsOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      opacity: 0.55,
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </>
              )}
              {ticketsGroupActive && !sidebarOpen && <div className="nav-indicator" />}
            </button>

            {sidebarOpen && ticketsOpen && (
              <div className="nav-sub">
                {TICKETS_CHILDREN.map(sub => (
                  <button
                    key={sub.key}
                    className={`nav-item nav-sub-item ${active === sub.key ? "active" : ""}`}
                    onClick={() => handleNavClick(sub.key)}
                  >
                    <SubIcon iconKey={sub.key} />
                    <span>{sub.label}</span>
                    {active === sub.key && <div className="nav-indicator" />}
                  </button>
                ))}
              </div>
            )}

            {!sidebarOpen && (
              <div className="nav-collapsed-sub">
                {TICKETS_CHILDREN.map(sub => (
                  <button
                    key={sub.key}
                    className={`nav-item ${active === sub.key ? "active" : ""}`}
                    onClick={() => handleNavClick(sub.key)}
                    title={sub.label}
                  >
                    <SubIcon iconKey={sub.key} />
                    {active === sub.key && <div className="nav-indicator" />}
                  </button>
                ))}
              </div>
            )}
          </div>
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

      {/* ══ Main area ════════════════════════════════════════════════════════ */}
      <div className="sad-main">
        <header className="sad-topbar">
          <button className="collapse-btn" onClick={() => setSidebarOpen(o => !o)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="search-bar">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
              <div className="topbar-profile" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="profile-details">
                  <span className="profile-name">{user?.full_name || "Sarath Krishna"}</span>
                  <span className="profile-role">{ROLE_LABELS[user?.role] || user?.role || "Receptionist"}</span>
                </div>
                <img src={doctorAvatar} alt="Profile" className="profile-img" />
              </div>

              {profileOpen && (
                <div className="topbar-dropdown">
                  <div className="dropdown-user-info">
                    <img src={doctorAvatar} alt="Profile" className="dropdown-avatar" />
                    <h4>{user?.full_name || "Sarath Krishna"}</h4>
                    <p>{ROLE_LABELS[user?.role] || user?.role || "Receptionist"}</p>
                  </div>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="sad-body">
          <div className={active === "directory" ? "full-bleed-page" : "section-content"}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}