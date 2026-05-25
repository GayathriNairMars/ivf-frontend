//Receptionist Dashboard -layout with sidebar nav
import { useState,useMemo } from "react";
import {useAuth} from "../../../hooks/useAuth";
import api from "../../../services/Client";
import RecDashboardHome from "./dashboard";
import OPQueue from "./opqueue";
import PatientSearch from "./patient_list";
import NewTicket from "./new_ticket";
import AddPatient from "../../admin/pages/patients/add_patient";
import Icon from "../../../components/Icons";
import PatientHistory from "./patient_op_history";

const NAV=[
	{key:"dashboard",label:"Dashboard",icon:"dashboard"},
	{key:"queue",label:"Today's Queue",icon:"activity"},
	{key:"patients",label:"Patients",icon:"patients"},
	{key:"ticket",label:"New Ticket",icon:"emr"},
	{key:"addpatient",label:"Add Patient",icon:"staff"},
];

export default function ReceptionistDashboardSection() {
	const {user,logout} = useAuth();
	const [active,setActive] = useState("dashboard");
	const [sidebarOpen,setSidebarOpen] = useState(true);
	const [viewPatientId,setViewPatientId] = useState(null);

	const handleLogout = async () => {
		await logout();
		setTimeout(() => {window.location.href = "/login";},100);
	};
  const content = useMemo(() => {
    switch (active) {
      case "dashboard": return <RecDashboardHome />;
      case "queue": return <OPQueue onNewTicket={() => setActive("ticket")} />;
      case "patients":
        return viewPatientId
          ? <PatientHistory
              patientId={viewPatientId}
              onBack={() => setViewPatientId(null)}
            />
          : <PatientSearch
              onViewHistory={(p) => setViewPatientId(p.id)}
            />;
      case "ticket": return <NewTicket onSuccess={() => setActive("queue")} onCancel={() => setActive("queue")} />;
      case "addpatient": return <AddPatient />;
      default: return <RecDashboardHome />;
    }
  }, [active, viewPatientId]); // ← add viewPatientId
  // Reset viewPatientId when switching away from patients
  const handleNavClick = (key) => {
      if (key !== "patients") setViewPatientId(null);
      setActive(key);
  };

	//Title map
	const titles = {
		dashboard:"Dashboard",
		queue:"Today's Queue",
		patients:"Patients",
		ticket:"Ticket",
		addpatient:"Register Patient",
	};
	return(
		<div className={`sad-root ${sidebarOpen ? "sidebar-open":"sidebar-collapsed"}`}>
			{/* Sidebar */}
			<aside className="sad-sidebar">
				<div className="sidebar-brand">
					<div className="brand-logo">H</div>
					{sidebarOpen && <span className="brand-name">HIMS</span>}
				</div>
				<nav className="sidebar-nav">
					{NAV.map(item => (
						<button
						key={item.key}
						className={`nav-item ${active===item.key?"active":""}`}
						onClick={() => setActive(item.key)}
						title={!sidebarOpen ? item.label : ""}>
							<Icon name={item.icon} />
							{sidebarOpen && <span>{item.label}</span>}
							{active === item.key && <div className="nav-indicator" />}
						</button>
					))}
				</nav>
				<div className="sidebar-footer">
					<button className="nav-item logout-item" onClick={handleLogout} title={!sidebarOpen ? "Sign out" : ""}>
						<Icon name="logout" />
						{sidebarOpen && <span>Sign out</span>}
					</button>
				</div>
			</aside>
			{/* Main */}
			<div className="sad-main">
				{/* Topbar */}
				<header className="sad-topbar">
					<button className="collapse-btn" onClick={() => setSidebarOpen(o => !o)}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
							<line x1="3" y1="6" x2="21" y2="6" /> 
							<line x1="3" y1="12" x2="21" y2="12" /> 
							<line x1="3" y1="18" x2="21" y2="18" /> 
						</svg>
					</button>
					<div className="topbar-title">{titles[active]}</div>
					<div className="topbar-user">
						<div className="user-avatar">{(user?.full_name || "R")[0]}</div>
						<div className="user-info">
							<span className="user-name">{user?.full_name}</span>
							<span className="user-role">{user?.role}</span>
						</div>
					</div>
				</header>
				{/* Content */}
				<main className="sad-body">
					<div className="section-content">
						{content}
					</div>
				</main>
			</div>
		</div>
	);
}