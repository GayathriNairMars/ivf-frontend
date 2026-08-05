// Receptionist Dashboard – layout with modern HIMS sidebar nav + Tickets group
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
import LabOrders from "./lab_orders";
import LabOrderCreate from "./lab_order_create";
import LabOrderDetail from "./lab_order_detail";
import LabOrderOpticket from "./lab_order_opticket";
import StaffDirectory from "./staff_directory";
import StaffProfile from "./staff_profile";
import Icon from "../../components/Icons";
import { IoNotificationsOutline } from "react-icons/io5";
import { 
  ChevronDown, 
  Search, 
  LogOut, 
  User as UserIcon, 
  Building2, 
  Menu,
  Sparkles,
  Ticket as TicketIcon,
  PlusCircle,
  Activity,
  FlaskConical,
  Plus as PlusIcon,
  List,
  Users
} from "lucide-react";
import "./receptionist.css";

const NAV_TOP = [
  { key: "dashboard",        label: "Dashboard",        icon: "dashboard"    },
  { key: "appointments",    label: "Appointments",     icon: "appointments" },
  { key: "directory",       label: "Patient Directory",icon: "staff"        },
  { key: "staff_directory", label: "Staff Directory",  icon: "staff"        },
];

const TICKETS_CHILDREN = [
  { key: "ticket", label: "Add Ticket",   icon: "add"      },
  { key: "queue",  label: "Today's Queue", icon: "activity" },
];

const LAB_CHILDREN = [
  { key: "lab_orders",       label: "All Orders",    icon: "list"   },
  { key: "lab_order_create", label: "Add New Test",  icon: "add"    },
];

const ROLE_LABELS = {
  receptionist: "Senior Receptionist",
  doctor:       "Doctor",
  admin:        "Administrator"
};

function SubIcon({ iconKey }) {
  if (iconKey === "ticket")           return <PlusCircle size={15} />;
  if (iconKey === "lab_order_create") return <PlusIcon size={15} />;
  if (iconKey === "lab_orders")       return <List size={15} />;
  return <Activity size={15} />;
}

export default function ReceptionistDashboardSection() {
  const { user, logout } = useAuth();
  const [active,       setActive]       = useState("dashboard");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [ticketsOpen,  setTicketsOpen]  = useState(false);
  const [labOpen,      setLabOpen]      = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Lab Orders sub-view state
  const [labView,      setLabView]      = useState("list"); // list | create | detail | opticket
  const [labOrderId,   setLabOrderId]   = useState(null);
  const [labOrderData, setLabOrderData] = useState(null);

  // Staff Directory sub-view state
  const [staffView,    setStaffView]    = useState("list"); // list | profile
  const [staffRecord,  setStaffRecord]  = useState(null);

  const rescheduleIdRef = useRef(null);
  const [, setRescheduleId] = useState(null);

  const handleLogout = async () => {
    await logout();
    setTimeout(() => { window.location.href = "/login"; }, 100);
  };

  const handleReschedule = (id) => {
    rescheduleIdRef.current = id;
    setRescheduleId(id);
    setActive("reschedule_appointment");
  };

  const ticketsGroupActive = active === "ticket" || active === "queue";
  const labGroupActive     = active === "lab_orders" || active === "lab_order_create";

  // ── Lab navigation helpers ───────────────────────────────────────────────
  const openLabOrders = () => { setLabView("list"); setLabOrderId(null); setLabOrderData(null); setActive("lab_orders"); setLabOpen(true); };
  const openLabCreate = () => { setLabView("create"); setActive("lab_orders"); setLabOpen(true); };

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

      // ── Staff Directory ────────────────────────────────────────────────
      case "staff_directory":
        if (staffView === "profile" && staffRecord) {
          return (
            <StaffProfile
              staff={staffRecord}
              onBack={() => { setStaffView("list"); setStaffRecord(null); }}
            />
          );
        }
        return (
          <StaffDirectory
            onView={(s) => { setStaffRecord(s); setStaffView("profile"); }}
          />
        );

      // ── Lab Orders ─────────────────────────────────────────────────────
      case "lab_orders":
      case "lab_order_create":
        if (labView === "create") {
          return (
            <LabOrderCreate
              onCancel={openLabOrders}
              onSuccess={(order) => {
                setLabOrderData(order);
                setLabOrderId(order?.id ?? null);
                setLabView("opticket");
                setActive("lab_orders");
              }}
            />
          );
        }
        if (labView === "detail") {
          return (
            <LabOrderDetail
              orderId={labOrderId}
              onBack={openLabOrders}
              onOpticket={(order) => { setLabOrderData(order); setLabView("opticket"); }}
            />
          );
        }
        if (labView === "opticket") {
          return (
            <LabOrderOpticket
              order={labOrderData}
              orderId={labOrderId}
              onBack={openLabOrders}
            />
          );
        }
        // default: list
        return (
          <LabOrders
            onCreate={() => { setLabView("create"); setActive("lab_order_create"); }}
            onView={(id) => { setLabOrderId(id); setLabView("detail"); setActive("lab_orders"); }}
            onOpticket={(order) => { setLabOrderData(order); setLabView("opticket"); setActive("lab_orders"); }}
          />
        );

      default:
        return <RecDashboardHome onNavigate={setActive} />;
    }
  };

  const handleNavClick = (key) => setActive(key);
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || "Sarath Krishna")}&background=4f46e5&color=fff&bold=true`;

  return (
    <div className={`sad-root ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>

      {/* ══ Sidebar ══════════════════════════════════════════════════════════ */}
      <aside className="sad-sidebar">

        <div className="sidebar-brand">
          <div className="brand-logo" onClick={() => setActive("dashboard")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="brand-info" onClick={() => setActive("dashboard")}>
              <span className="brand-name">IVF HIMS</span>
              <span className="brand-tag">Reception Portal</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">{sidebarOpen ? "MAIN MENU" : "•••"}</div>
          {NAV_TOP.map(item => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavClick(item.key)}
                title={!sidebarOpen ? item.label : ""}
              >
                {isActive && <div className="nav-active-bar" />}
                <div className="nav-icon-wrap">
                  {item.key === "staff_directory"
                    ? <Users size={18} />
                    : <Icon name={item.icon} />
                  }
                </div>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </button>
            );
          })}

          <div className="nav-section-label" style={{ marginTop: "12px" }}>
            {sidebarOpen ? "CLINIC QUEUE" : "•••"}
          </div>

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
              {ticketsGroupActive && <div className="nav-active-bar" />}
              <div className="nav-icon-wrap">
                <TicketIcon size={18} />
              </div>
              {sidebarOpen && (
                <>
                  <span className="nav-label" style={{ flex: 1, textAlign: "left" }}>OP Tickets</span>
                  <ChevronDown
                    size={14}
                    className="nav-chevron"
                    style={{
                      transform: ticketsOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      opacity: 0.7,
                      flexShrink: 0,
                    }}
                  />
                </>
              )}
            </button>

            {sidebarOpen && ticketsOpen && (
              <div className="nav-sub">
                {TICKETS_CHILDREN.map(sub => {
                  const isSubActive = active === sub.key;
                  return (
                    <button
                      key={sub.key}
                      className={`nav-item nav-sub-item ${isSubActive ? "active" : ""}`}
                      onClick={() => handleNavClick(sub.key)}
                    >
                      {isSubActive && <div className="nav-active-bar" />}
                      <div className="nav-icon-wrap">
                        <SubIcon iconKey={sub.key} />
                      </div>
                      <span className="nav-label">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!sidebarOpen && (
              <div className="nav-collapsed-sub">
                {TICKETS_CHILDREN.map(sub => {
                  const isSubActive = active === sub.key;
                  return (
                    <button
                      key={sub.key}
                      className={`nav-item ${isSubActive ? "active" : ""}`}
                      onClick={() => handleNavClick(sub.key)}
                      title={sub.label}
                    >
                      {isSubActive && <div className="nav-active-bar" />}
                      <SubIcon iconKey={sub.key} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Lab Orders nav group ──────────────────── */}
          <div className="nav-section-label" style={{ marginTop: "12px" }}>
            {sidebarOpen ? "LABORATORY" : "•••"}
          </div>

          <div className="nav-group">
            <button
              className={`nav-item nav-group-header ${labGroupActive ? "active" : ""}`}
              onClick={() => {
                if (sidebarOpen) {
                  setLabOpen(o => !o);
                } else {
                  setSidebarOpen(true);
                  setLabOpen(true);
                }
              }}
              title={!sidebarOpen ? "Lab Orders" : ""}
            >
              {labGroupActive && <div className="nav-active-bar" />}
              <div className="nav-icon-wrap">
                <FlaskConical size={18} />
              </div>
              {sidebarOpen && (
                <>
                  <span className="nav-label" style={{ flex: 1, textAlign: "left" }}>Lab Orders</span>
                  <ChevronDown
                    size={14}
                    className="nav-chevron"
                    style={{
                      transform: labOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      opacity: 0.7,
                      flexShrink: 0,
                    }}
                  />
                </>
              )}
            </button>

            {sidebarOpen && labOpen && (
              <div className="nav-sub">
                {LAB_CHILDREN.map(sub => {
                  const isSubActive =
                    (sub.key === "lab_orders"       && active === "lab_orders"       && labView === "list") ||
                    (sub.key === "lab_order_create" && (active === "lab_order_create" || labView === "create"));
                  return (
                    <button
                      key={sub.key}
                      className={`nav-item nav-sub-item ${isSubActive ? "active" : ""}`}
                      onClick={() => {
                        if (sub.key === "lab_order_create") openLabCreate();
                        else openLabOrders();
                      }}
                    >
                      {isSubActive && <div className="nav-active-bar" />}
                      <div className="nav-icon-wrap">
                        <SubIcon iconKey={sub.key} />
                      </div>
                      <span className="nav-label">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!sidebarOpen && (
              <div className="nav-collapsed-sub">
                {LAB_CHILDREN.map(sub => {
                  const isSubActive =
                    (sub.key === "lab_orders"       && active === "lab_orders"       && labView === "list") ||
                    (sub.key === "lab_order_create" && labView === "create");
                  return (
                    <button
                      key={sub.key}
                      className={`nav-item ${isSubActive ? "active" : ""}`}
                      onClick={() => sub.key === "lab_order_create" ? openLabCreate() : openLabOrders()}
                      title={sub.label}
                    >
                      {isSubActive && <div className="nav-active-bar" />}
                      <SubIcon iconKey={sub.key} />
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
                <span className="org-name">City General Hospital</span>
                <span className="org-district">Central Branch • OPD</span>
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
      <div className="sad-main">
        <header className="sad-topbar">
          <button 
            className="collapse-btn" 
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu size={18} />
          </button>

          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search patients, appointments, doctors, MRN..." 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            {globalSearch && (
              <button 
                className="search-clear-btn"
                onClick={() => setGlobalSearch("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="user-area">
            <button className="notification-btn-square" title="Notifications">
              <IoNotificationsOutline size={19} />
              <span className="dot-red" />
            </button>

            <div className="topbar-profile-container">
              <div className="topbar-profile" onClick={() => setProfileOpen(!profileOpen)}>
                <img src={avatarFallback} alt="Profile" className="profile-img" />
                <div className="profile-details">
                  <span className="profile-name">{user?.full_name || "Sarath Krishna"}</span>
                  <span className="profile-role">{ROLE_LABELS[user?.role] || user?.role || "Receptionist"}</span>
                </div>
                <ChevronDown size={14} className="profile-chevron" style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </div>

              {profileOpen && (
                <div className="topbar-dropdown">
                  <div className="dropdown-user-info">
                    <img src={avatarFallback} alt="Profile" className="dropdown-avatar" />
                    <h4>{user?.full_name || "Sarath Krishna"}</h4>
                    <p>{ROLE_LABELS[user?.role] || user?.role || "Receptionist"}</p>
                    <span className="dropdown-status-pill">
                      <span className="dot-green" /> Active Shift
                    </span>
                  </div>
                  <div className="dropdown-menu-list">
                    <button className="dropdown-item" onClick={() => { setProfileOpen(false); setActive("attendance"); }}>
                      <UserIcon size={15} /> Attendance
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

        <main className="sad-body">
          <div className={active === "directory" ? "full-bleed-page" : "section-content"}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
