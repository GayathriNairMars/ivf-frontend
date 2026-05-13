import { Outlet,useNavigate,useLocation } from "react-router-dom";
import { useAuth } from "../../../../hooks/useAuth";
import { useState,useEffect } from "react";
import api from '../../../../services/Client';
import "./superadmin.css"
import StaffSection from "../staff/Staff_section";
import Icon from "../../../../components/Icons";
import { ROLE_LABELS } from "../../../../utils/constants";



//placeholder sections
function ComingSoon({title}){
  return(
    <div className="section-content coming-soon">
      <div className="coming-soon-inner">
        <div className="coming-soon-icon">🚧</div>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

//Main Dashboard
const NAV=[
  {id:"dashboard",label:"Dashboard",icon:"dashboard", path:"/superadmin/"},
  {id:"department",label:"Department",icon:"department",path:"/superadmin/department/"},
  {id:"emr",label:"EMR",icon:"emr",path:"/superadmin/emr/"},
  {id:"staff",label:"Staff",icon:"staff",path:"/superadmin/staff/"},
  {id:"patients",label:"Patients",icon:"patients",path:"/superadmin/patients/"},
]

export default function SuperAdminDashboard() {
   const { user,logout } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();
   const [active,setActive] =useState("dashboard")
   const [sidebarOpen,setSidebarOpen] =useState(true)
   const isActive = (path) =>{
    if (path === "/superadmin/") {
      return location.pathname ==="/superadmin/" || location.pathname==="/superadmin";
    }
    return location.pathname.startsWith(path);
   };

   const handleLogout = async()=>{
      await logout();
      setTimeout(()=>{
      window.location.href="/login";
   },100);
   };

	 useEffect(() => {
	 	const interval = setInterval(() => {
	 		api.post("/staff-management/heartbeat/").catch(() => {});
	 	}, 30000);
	 	api.post("/staff-management/heartbeat/").catch(() => {});
	 	return () => clearInterval(interval);
	 },[]);

   return (
     <div className={`sad-root ${sidebarOpen?"sidebar-open":"sidebar-collapsed"}`}>
     
     {/* Sidebar  */}
     <aside className="sad-sidebar">
       <div className="sidebar-brand">
         <div className="brand-logo">H</div>
         {sidebarOpen && <span className="brand-name">HIMS</span>}
     </div>
     <nav className="sidebar-nav">
       {NAV.map(item=>(
         <button
           key={item.id}
           className={`nav-item ${isActive(item.path) ? "active":""}`}
           onClick={()=>navigate(item.path)}
           title={!sidebarOpen? item.label:""}
           >
	          <Icon name={item.icon}/>
	          {sidebarOpen && <span>{item.label}</span>}
	          {isActive === item.id && <div className="nav-indicator" />}
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
          <button className="collapse-btn" onClick={() => setSidebarOpen(o => !o)} title="Toggle sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="topbar-title">
            {NAV.find(n => location.pathname.startsWith(n.path) && n.path !=="/superadmin/")?.label || (location.pathname === "/superadmin/"? "Dashboard" : "")}
          </div>
          <div className="topbar-user">
            <div className="user-avatar">{(user?.full_name || "A")[0]}</div>
            <div className="user-info">
              <span className="user-name">{user?.full_name}</span>
              <span className="user-role">{ROLE_LABELS[user?.role] || user?.role}</span>
            </div>
          </div>
        </header>
 
        {/* Page content */}
        <main className="sad-body">
          <Outlet />
        </main>
      </div>
     </div>
     
   );
}