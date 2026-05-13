import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StaffList from "./staff_list";
import AddStaff from "./add_staff";
import EditStaff from "./edit_staff";
import "./staff.css";

export default function StaffSection(){
  const [view,setView] = useState("list"); //list,add,edit
  const [editingStaff, setEditingStaff] = useState(null);
  const navigate = useNavigate();
  // const handleEdit = (staff) => {
	// setEditingStaff(staff);
	// setView("edit");
  // };

  const handleBack = () => {
	setEditingStaff(null);
	setView("list");
  };
  return(
    <div className="staff-section">
      <p style={{color:"red", fontSize:"20px"}}>CURRENT VIEW: {view}</p>
     {/* Sub-nav */}
     {view ==="list" &&(
       <div className="staff-subnav">
        <div className="subnav-left">
         <h2 className="staff-title">Staff Management</h2>
         <p className="staff-subtitle">Manage all clinic staff members</p>
        </div>
        <button className="btn-add-staff" onClick={()=> setView('add')}>
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
         </svg>
         Add Staff
        </button>
       </div>
     )}
     {view ==="list" && (
      <StaffList onEdit={(staff) => navigate(`/superadmin/staff/edit/${staff.id}`)} />
     )}
     {view ==="add" && (
      <AddStaff onBack={handleBack} onSuccess={handleBack} />
     )}
     {view ==="edit" && editingStaff && (
      <EditStaff staff={editingStaff} onBack={handleBack} onsuccess={handleBack} />
     )}
    </div>
  );
}