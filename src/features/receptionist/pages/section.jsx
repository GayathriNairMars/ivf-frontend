//Receptionist Dashboard -layout with sidebar nav
import { useState } from "react";
import {useAuth} from "../../../hooks/useAuth";
import api from "../../../services/Client";
import RecDashboardHome from "./RecDashboardHome";
import OPQueue from "./OPQueue";
import PatientSearch from "./PatientSearch";
import NewTicket from "./NewTicket";
import AddPatient from "../../admin/pages/patients/add_patient";
import Icon from "../../../components/Icons";

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

	const handleLogout = async () => {
		await logout();
		setTimeout(() => {window.location.href = "/login";},100);
	};
	const renderContent = () =>{
		switch(active) {
			case "dashboard": return <RecDashboardHome/>;
			case "queue": return <OPQueue onNewTicket={() => setActive("ticket")} />;
			case "patients": return <PatientSearch />;
			case "ticket": return <NewTicket onSuccess={() => setActive("queue")} onCancel={() => setActive("queue")} />;
			case "addpatient": return <AddPatient />;
			default: return <RecDashboardHome />;
		}
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
					{NAV.map(item =(
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
						<Icon name={logout} />
						{sidebarOpen && }
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
						{renderContent()}
					</div>
				</main>
			</div>
		</div>
	);
}