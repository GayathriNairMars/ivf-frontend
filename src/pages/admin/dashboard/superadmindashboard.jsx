import { Outlet,useNavigate,useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useState,useEffect } from "react";
import adminApi from "../../../api/adminApi";
import "./superadmin.css";
import { ROLE_LABELS } from "../../../constants/constants";
import arathyAvatar from "../../../assets/arathy_avatar.png";
import { IoNotificationsOutline } from "react-icons/io5";
import {
  LayoutGrid,
  Building2,
  FolderOpen,
  FileSearch,
  UserRound,
  ClipboardList,
  BriefcaseMedical,
  User
} from "lucide-react";

const NAV=[
  {id:"dashboard",label:"Dashboard",icon:LayoutGrid, path:"/superadmin/"},
  {id:"department",label:"Departments",icon:Building2,path:"/superadmin/department/"},
  {id:"emr",label:"EMR",icon:FolderOpen,path:"/superadmin/emr/", subItems: [
    {id: "emr-overview", label: "Overview", icon:FileSearch, path: "/superadmin/emr/"},
    {id: "emr-patients", label: "Patient records", icon:UserRound, path: "/superadmin/emr/patients"},
    {id: "emr-records", label: "Record management", icon:ClipboardList, path: "/superadmin/emr/records"}
  ]},
  {id:"staff",label:"Staff Management",icon: BriefcaseMedical ,path:"/superadmin/staff/"},
  {id:"patients",label:"Patient Directory",icon:User,path:"/superadmin/patients/"},
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
      window.location.href="login";
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
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id}>
                <button
                  className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  <div className="icon">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <span>{item.label}</span>
                  {isActive(item.path) && <div className="nav-indicator" />}
                </button>
            
                {item.subItems && isActive(item.path) && (
                  <div className="sub-nav">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive =
                        location.pathname === sub.path ||
                        location.pathname === `${sub.path}/`;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => navigate(sub.path)}
                          className={`sub-nav-item ${isSubActive ? "active" : ""}`}
                        >
                          {isSubActive && <span className="sub-nav-indicator" />}
                          <SubIcon size={15} />
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
