//Receptionist Dashboard -layout with sidebar nav
import { useState,useMemo } from "react";
import {useAuth} from "../../hooks/useAuth";
import receptionistApi from "../../api/receptionistApi";
import RecDashboardHome from "./dashboard";
import OPQueue from "./opqueue";
import NewTicket from "./new_ticket";
<<<<<<< HEAD
import PatientDirectory from "./patient_directory";
=======
<<<<<<< HEAD
import AddPatient from "../admin/patients/add_patient";
=======
import PatientDirectory from "./patient_directory";
import Appointments from "./appointments";
>>>>>>> 39da530 (Update dashboard and receptionist UI)
>>>>>>> 3eb9a18 (Update dashboard and receptionist UI)
import Icon from "../../components/Icons";
import PatientHistory from "./patient_op_history";
import doctorAvatar from "../../assets/doctor_avatar.png";
import { ROLE_LABELS } from "../../constants/constants";
import { IoNotificationsOutline } from "react-icons/io5";


const NAV=[
	{key:"dashboard",label:"Dashboard",icon:"dashboard"},
	{
		key:"opticket",
		label:"OPTicket",
		icon:"emr",
		subItems: [
			{key:"ticket",label:"Add ticket",icon:"overview"},
			{key:"queue",label:"OP queue",icon:"activity"},
		]
	},
	{key:"appointments",label:"Appointments",icon:"appointments"},
	{key:"directory",label:"Patient Directory",icon:"staff"},
];

export default function ReceptionistDashboardSection() {
	const {user,logout} = useAuth();
	const [active,setActive] = useState("dashboard");
	const [sidebarOpen,setSidebarOpen] = useState(true);
	const [viewPatientId,setViewPatientId] = useState(null);
	const [profileOpen,setProfileOpen] = useState(false);

	const handleLogout = async () => {
		await logout();
		setTimeout(() => {window.location.href = "/login";},100);
	};
  const content = useMemo(() => {
    switch (active) {
      case "dashboard": return <RecDashboardHome />;
      case "queue": return <OPQueue onNewTicket={() => setActive("ticket")} />;
      case "ticket": return <NewTicket onSuccess={() => setActive("queue")} onCancel={() => setActive("queue")} />;
<<<<<<< HEAD
      case "directory": return <PatientDirectory />;
=======
<<<<<<< HEAD
      case "addpatient": return <AddPatient />;
=======
      case "directory": return <PatientDirectory />;
      case "appointments": return <Appointments />;
>>>>>>> 39da530 (Update dashboard and receptionist UI)
>>>>>>> 3eb9a18 (Update dashboard and receptionist UI)
      default: return <RecDashboardHome />;
    }
  }, [active, viewPatientId]);
  const handleNavClick = (key) => {
      if (key !== "patients") setViewPatientId(null);
      setActive(key);
  };

	//Title map
	const titles = {
		dashboard:"Dashboard",
<<<<<<< HEAD
		queue:"Today's Queue",
		patients:"Patients",
<<<<<<< HEAD
		ticket:"New Ticket",
		directory:"Patient Directory",
=======
		ticket:"Ticket",
		addpatient:"Register Patient",
=======
		queue:"OP queue",
		ticket:"OP tickets",
		directory:"Patient Directory",
		appointments:"Appointments",
>>>>>>> 39da530 (Update dashboard and receptionist UI)
>>>>>>> 3eb9a18 (Update dashboard and receptionist UI)
	};
	return(
		<div className={`sad-root ${sidebarOpen ? "sidebar-open":"sidebar-collapsed"}`}>
			{/* Sidebar */}
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
					{NAV.map(item => {
						const hasSubItems = !!item.subItems;
						const isParentActive = active === item.key || (hasSubItems && item.subItems.some(sub => sub.key === active));

						return (
							<div key={item.key}>
								<button
									className={`nav-item ${isParentActive ? "active" : ""}`}
									onClick={() => {
										if (hasSubItems) {
											handleNavClick(item.subItems[0].key);
										} else {
											handleNavClick(item.key);
										}
									}}
									title={!sidebarOpen ? item.label : ""}
								>
									<Icon name={item.icon} />
									{sidebarOpen && <span>{item.label}</span>}
									{hasSubItems && sidebarOpen && (
										<span style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
											<svg
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2.5"
												width="12"
												height="12"
												style={{
													transform: isParentActive ? "rotate(90deg)" : "rotate(0deg)",
													transition: "transform 0.2s ease",
													color: isParentActive ? "var(--accent)" : "inherit"
												}}
											>
												<polyline points="9 18 15 12 9 6" />
											</svg>
										</span>
									)}
									{isParentActive && !hasSubItems && <div className="nav-indicator" />}
								</button>

								{hasSubItems && isParentActive && sidebarOpen && (
									<div className="sub-nav" style={{ paddingLeft: "32px", display: "flex", flexDirection: "column", gap: "4px" }}>
										{item.subItems.map(sub => {
											const isSubActive = active === sub.key;
											return (
												<button
													key={sub.key}
													className={`sub-nav-item ${isSubActive ? "active" : ""}`}
													onClick={() => handleNavClick(sub.key)}
													style={{
														background: isSubActive ? "rgba(68, 116, 246, 0.08)" : "transparent",
														color: isSubActive ? "var(--accent)" : "var(--text-2)",
														padding: "8px 16px",
														borderRadius: "8px",
														border: "none",
														display: "flex",
														alignItems: "center",
														gap: "10px",
														fontSize: "0.85rem",
														fontWeight: isSubActive ? "600" : "500",
														cursor: "pointer",
														textAlign: "left",
														width: "100%",
														position: "relative"
													}}
												>
													{isSubActive && (
														<span
															className="sub-nav-indicator"
															style={{
																position: "absolute",
																left: "6px",
																top: "50%",
																transform: "translateY(-50%)",
																width: "3px",
																height: "16px",
																background: "var(--accent)",
																borderRadius: "99px"
															}}
														/>
													)}
													<Icon name={sub.icon} />
													<span>{sub.label}</span>
												</button>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</nav>
				<div className="sidebar-footer">
					{sidebarOpen ? (
						<div className="organization-info">
							<div className="org-avatar-container">
								<div className="org-avatar">
									<div className="org-icon">
										<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
											<path d="M12 5v14M5 12h14"/>
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
										<path d="M12 5v14M5 12h14"/>
									</svg>
								</div>
							</div>
						</div>
					)}
				</div>
			</aside>
			{/* Main */}
			<div className="sad-main">
				{/* Topbar */}
				<header className="sad-topbar">
					<button className="collapse-btn" onClick={() => setSidebarOpen(o => !o)} style={{ marginRight: "16px" }}>
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
										{user?.full_name || "Sarath Krishna"}
									</span>
									<span className="profile-role">
										{ROLE_LABELS[user?.role] || user?.role || "Receptionist"}
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
										<h4>{user?.full_name || "Sarath Krishna"}</h4>
										<p>{ROLE_LABELS[user?.role] || user?.role || "Receptionist"}</p>
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