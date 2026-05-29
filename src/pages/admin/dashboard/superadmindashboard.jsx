import { Outlet,useNavigate,useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useState,useEffect } from "react";
import adminApi from "../../../api/adminApi";
import "./superadmin.css"
import Icon from "../../../components/Icons";
import { ROLE_LABELS } from "../../../constants/constants";
import arathyAvatar from "../../../assets/arathy_avatar.png";

const NAV=[
  {id:"dashboard",label:"Dashboard",icon:"dashboard", path:"/superadmin/"},
  {id:"department",label:"Departments",icon:"department",path:"/superadmin/department/"},
  {id:"emr",label:"EMR",icon:"emr",path:"/superadmin/emr/", subItems: [
    {id: "emr-overview", label: "Overview", path: "/superadmin/emr/"},
    {id: "emr-patients", label: "Patient records", path: "/superadmin/emr/patients"},
    {id: "emr-records", label: "Record management", path: "/superadmin/emr/records"}
  ]},
  {id:"staff",label:"Staff Management",icon:"staff",path:"/superadmin/staff/"},
  {id:"patients",label:"Patient Directory",icon:"patients",path:"/superadmin/patients/"},
]

export default function SuperAdminDashboard() {
   const { user,logout } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();
   const [profileOpen, setProfileOpen] = useState(false);
   
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
	 		adminApi.sendHeartbeat().catch(() => {});
	 	}, 5 * 60 * 1000);
	 	adminApi.sendHeartbeat().catch(() => {});
	 	return () => clearInterval(interval);
	 },[]);

   return (
     <div className="sad-root">
       {/* Sidebar */}
       <aside className="sad-sidebar">
         <div className="sidebar-brand">
           <div className="brand-logo">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
             </svg>
           </div>
           <span className="brand-name">HIMS</span>
         </div>
         
         <nav className="sidebar-nav">
           {NAV.map(item=>(
             <div key={item.id}>
               <button
                 className={`nav-item ${isActive(item.path) ? "active":""}`}
                 onClick={()=>navigate(item.path)}
               >
                 <div className="icon"><Icon name={item.icon}/></div>
                 <span>{item.label}</span>
                 {isActive(item.path) && <div className="nav-indicator" />}
               </button>
               {item.subItems && isActive(item.path) && (
                  <div className="sub-nav" style={{ paddingLeft: "48px", display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px", marginBottom: "12px" }}>
                    {item.subItems.map(sub => {
                       // Custom active logic for exact matching
                       const isSubActive = location.pathname === sub.path || location.pathname === sub.path + "/";
                       return (
                       <button
                         key={sub.id}
                         style={{ background: "none", border: "none", color: isSubActive ? "#3b82f6" : "#64748b", textAlign: "left", cursor: "pointer", fontSize: "14px", fontWeight: isSubActive ? 600 : 400, display: "flex", alignItems: "center", gap: "8px", padding: 0 }}
                         onClick={() => navigate(sub.path)}
                       >
                         {isSubActive && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                         {!isSubActive && <span style={{width: 14}}></span>}
                         {sub.label}
                       </button>
                       );
                    })}
                  </div>
               )}
             </div>
           ))}
         </nav>

         <div className="sidebar-footer">
           <div className="organization-info" onClick={() => setProfileOpen(!profileOpen)}>
             <div className="org-avatar-container">
               <div className="org-avatar">
                 <div className="org-icon">
                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                 </div>
               </div>
             </div>
             <div className="org-text">
               <span className="org-name">City General</span>
               <span className="org-district">Central District</span>
             </div>
           </div>
           
           {profileOpen && (
             <div className="profile-dropdown-sidebar">
               <div className="dropdown-user-info">
                  <span className="user-name">{user?.full_name || "Arathy Sreekumar"}</span>
                  <span className="user-role">{ROLE_LABELS[user?.role] || user?.role || "System Administrator"}</span>
               </div>
               <hr className="dropdown-divider" />
               <button className="dropdown-item text-danger" onClick={handleLogout}>
                 <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                   <polyline points="16 17 21 12 16 7"></polyline>
                   <line x1="21" y1="12" x2="9" y2="12"></line>
                 </svg>
                 Sign out
               </button>
             </div>
           )}
         </div>
       </aside>

       {/* Main Area */}
       <div className="sad-main">
          <header className="sad-topbar">
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
              <div className="topbar-profile">
              <button className="notification-btn-square">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                  <path d="M9 12h6" />
                  <path d="M12 9v6" />
                </svg>
                <span className="dot-red"></span>
              </button>

                <div className="profile-details">
                  <span className="profile-name">{user?.full_name || "Arathy Sreekumar"}</span>
                  <span className="profile-role">{ROLE_LABELS[user?.role] || user?.role || "System Administrator"}</span>
                </div>
                <img src={arathyAvatar} alt="Arathy Sreekumar" className="profile-img" />
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