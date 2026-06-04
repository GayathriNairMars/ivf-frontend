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
  User,
  Users,
  UserPlus
} from "lucide-react";

const NAV=[
  {id:"dashboard",label:"Dashboard",icon:LayoutGrid, path:"/superadmin/"},
  {id:"department",label:"Departments",icon:Building2,path:"/superadmin/department/"},
  {id:"emr",label:"EMR",icon:FolderOpen,path:"/superadmin/emr/", subItems: [
    {id: "emr-overview", label: "Overview", icon:FileSearch, path: "/superadmin/emr/"},
    {id: "emr-patients", label: "Patient records", icon:UserRound, path: "/superadmin/emr/patients"},
    {id: "emr-records", label: "Record management", icon:ClipboardList, path: "/superadmin/emr/records"}
  ]},
  {id:"staff",label:"Staff Management",icon: BriefcaseMedical, path:"/superadmin/staff/", subItems: [
    {id: "staff-manage", label: "Manage staff", icon: Users, path: "/superadmin/staff/"},
    {id: "staff-add", label: "Add staff", icon: UserPlus, path: "/superadmin/staff/add"}
  ]},
  {id:"patients",label:"Patient Directory",icon:User,path:"/superadmin/patients/", subItems: [
    {id: "patients-manage", label: "Manage patient", icon: Users, path: "/superadmin/patients/"},
    {id: "patients-add", label: "Register patient", icon: UserPlus, path: "/superadmin/patients/add"}
  ]},
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
           <div className="organization-info" >
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
                      {user?.full_name || "Arathy Sreekumar"}
                    </span>
                    <span className="profile-role">
                      {ROLE_LABELS[user?.role] || user?.role || "System Administrator"}
                    </span>
                  </div>

                  <img
                    src={arathyAvatar}
                    alt="Profile"
                    className="profile-img"
                  />
                </div>

                {profileOpen && (
                  <div className="topbar-dropdown">
                    <div className="dropdown-user-info">
                      <img
                        src={arathyAvatar}
                        alt="Profile"
                        className="dropdown-avatar"
                      />

                      <h4>{user?.full_name}</h4>
                      <p>{ROLE_LABELS[user?.role] || user?.role}</p>
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

         {/* Page content */}
         <main className="sad-body">
           <Outlet />
         </main>
       </div>
     </div>
   );
}
