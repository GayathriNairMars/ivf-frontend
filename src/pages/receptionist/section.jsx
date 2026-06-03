// Receptionist Dashboard – layout with sidebar nav + Tickets group
import { useState, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import RecDashboardHome from "./dashboard";
import OPQueue from "./opqueue";
import PatientSearch from "./patient_list";
import NewTicket from "./new_ticket";
import PatientDirectory from "./patient_directory";
import Icon from "../../components/Icons";
import PatientHistory from "./patient_op_history";
import "./receptionist.css";

// ── Navigation config ─────────────────────────────────────────────────────────
const NAV_TOP = [
  { key: "dashboard", label: "Dashboard",        icon: "dashboard" },
  { key: "patients",  label: "Patients",          icon: "patients"  },
  { key: "directory", label: "Patient Directory", icon: "staff"     },
];

const TICKETS_CHILDREN = [
  { key: "ticket", label: "Add Ticket",    icon: "add"      },
  { key: "queue",  label: "Today's Queue", icon: "activity" },
];

const TITLES = {
  dashboard: "Dashboard",
  patients:  "Patients",
  directory: "Patient Directory",
  ticket:    "Add Ticket",
  queue:     "Today's Queue",
};

// ── Inline icons for sub-items ─────────────────────────────────────────────────
function AddTicketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8"  y1="12" x2="16" y2="12" />
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

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ReceptionistDashboardSection() {
  const { user, logout } = useAuth();
  const [active,        setActive]        = useState("dashboard");
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [ticketsOpen,   setTicketsOpen]   = useState(false);
  const [viewPatientId, setViewPatientId] = useState(null);

  const handleLogout = async () => {
    await logout();
    setTimeout(() => { window.location.href = "/login"; }, 100);
  };

  // Whether the "Tickets" group is active
  const ticketsGroupActive = active === "ticket" || active === "queue";

  // ── Content router ─────────────────────────────────────────────────────────
  const content = useMemo(() => {
    switch (active) {
      case "dashboard":
        return <RecDashboardHome />;
      case "queue":
        return (
          <OPQueue
            onNewTicket={() => { setActive("ticket"); setTicketsOpen(true); }}
          />
        );
      case "patients":
        return viewPatientId
          ? <PatientHistory patientId={viewPatientId} onBack={() => setViewPatientId(null)} />
          : <PatientSearch onViewHistory={(p) => setViewPatientId(p.id)} />;
      case "ticket":
        return (
          <NewTicket
            onSuccess={() => { setActive("queue"); setTicketsOpen(true); }}
            onCancel={() => { setActive("queue"); setTicketsOpen(true); }}
          />
        );
      case "directory":
        return <PatientDirectory />;
      default:
        return <RecDashboardHome />;
    }
  }, [active, viewPatientId]);

  const handleNavClick = (key) => {
    if (key !== "patients") setViewPatientId(null);
    setActive(key);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`sad-root ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>

      {/* ══ Sidebar ══════════════════════════════════════════════════════════ */}
      <aside className="sad-sidebar">

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo">H</div>
          {sidebarOpen && <span className="brand-name">HIMS</span>}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">

          {/* ── Top-level items ──────────────────────────────────────── */}
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

          {/* ── Tickets group (collapsible) ───────────────────────────── */}
          <div className="nav-group">

            {/* Group toggle button */}
            <button
              className={`nav-item nav-group-header ${ticketsGroupActive ? "active" : ""}`}
              onClick={() => {
                if (sidebarOpen) {
                  setTicketsOpen(o => !o);
                } else {
                  // In collapsed mode, expand sidebar & open group
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

            {/* Sub-items – shown when sidebar open & group expanded */}
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

            {/* Collapsed sidebar – show sub icons stacked */}
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

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            className="nav-item logout-item"
            onClick={handleLogout}
            title={!sidebarOpen ? "Sign out" : ""}
          >
            <Icon name="logout" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ══ Main area ════════════════════════════════════════════════════════ */}
      <div className="sad-main">

        {/* Topbar */}
        <header className="sad-topbar">
          <button className="collapse-btn" onClick={() => setSidebarOpen(o => !o)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="3"  y1="6"  x2="21" y2="6"  />
              <line x1="3"  y1="12" x2="21" y2="12" />
              <line x1="3"  y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="topbar-title">{TITLES[active] || "Dashboard"}</div>
          <div className="topbar-user">
            <div className="user-avatar">{(user?.full_name || "R")[0]}</div>
            <div className="user-info">
              <span className="user-name">{user?.full_name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="sad-body">
          <div className="section-content">{content}</div>
        </main>
      </div>
    </div>
  );
}