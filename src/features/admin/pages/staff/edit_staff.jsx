import { useState,useEffect } from "react";
import api from "../../../../services/Client";
import { ROLES,ROLE_COLORS,ROLE_PERMISSIONS,ROLE_SECONDARY_DEPTS,DEPARTMENT_UNITS } from "../../../../utils/constants";
import { useNavigate, useParams } from "react-router-dom";


function FormField({ label,error,children }) {
  return (
    <div className="form-field">
     <label className="form-label">{label}</label>
     {children}
     {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export default function EditStaff() {
  const {id} = useParams();
  const navigate =useNavigate();

  const [staff,setStaff] = useState(null);
  const [form,setForm] = useState({
    full_name:"", email: "", role: "REC", is_active: true,
  });
  const [permissions,setPermissions] = useState({});
  const [errors,setErrors] = useState({});
  const [submitting,setSubmitting] = useState(false);
  const [success,setSuccess] = useState(false);
  const [loading,setLoading] = useState(false);
  const [departments,setDepartments] = useState([]);
  const [currentAssignments,setCurrentAssignments] = useState([]);
  const [secondaryDeptId,setSecondaryDeptId] = useState("");
  const [secondaryUnit,setSecondaryUnit] = useState("");

  
  //Load staff
  useEffect(()=> {
    api.get(`/staff-management/${id}/`)
     .then(({data}) => {setStaff(data);
                        setForm({
                          full_name:data.full_name ||"",
                          email:data.email || "",
                          role:data.role ||"REC",
                          is_active:data.is_active?? true,
          });
          // Load Departments and Assignments
          api.get("/departments/")
             .then(({data:depts}) => {
              setDepartments(Array.isArray(depts) ? depts : (depts.results || []));
    
                api.get(`/staff-management/${data.id}/assignments/`)
                .then(({data:assignments}) => {
                  setCurrentAssignments(assignments);
                  const secondary = assignments.find(a => a.role_in_dept === 'SECONDARY' && a.is_active);
                  if (secondary) {
                    setSecondaryDeptId(String(secondary.department));
                    setSecondaryUnit(secondary.unit || "");
                    }
                  }).catch(() => {});
                  
              }).catch(() => {});
      })
     .catch((err) => {
        console.log("Edit staff fetch error:",err.response?.status,err.response?.data);
        navigate("/superadmin/staff");
      })
     .finally(() => setLoading(false));
  },[id]);
  

// Load permissions from already-fetched staff data
useEffect(() => {
  if (!staff) return;

  const profileKey = {
    REC: "receptionist_profile",
    CCO: "clinical_counsellor_profile",
    FCO: "financial_counsellor_profile",
    END: "endocrinologist_profile",
    GYN: "gynaec_profile",
    ANE: "anesth_profile",
    EMB: "embryologist_profile",
    NUR: "nurse_profile",
    PHA: "pharmacist_profile",
    TEC: "technician_profile",
    AND: "andrology_technician_profile",
    HRM: "hr_profile",
  }[staff.role];
  console.log("Profile key:", profileKey);
  console.log("Profile data:", staff[profileKey]);

  if (profileKey && staff[profileKey]) {
    const profile = staff[profileKey];
    const perms = {};
    (ROLE_PERMISSIONS[staff.role] || []).forEach(p => {
      perms[p.name] = !!profile[p.name];
    });
    setPermissions(perms);
    }
  }, [staff]);

  const handleChange = (e) => {
    const {name,value,type,checked} = e.target;
    setForm(prev => ({...prev,[name]:type==="checkbox" ? checked:value }));
    setErrors(prev => ({...prev,[name]: ""}));
    if (name==="role"){ 
      setPermissions({});
      setSecondaryDeptId("");
      setSecondaryUnit("");
    }
  };
  const handlePermission = (name,checked) =>{
    setPermissions(prev => ({ ...prev,[name]:checked}));
  };
  const handleSubmit = async(e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k,v]) => payload.append(k,v));
      Object.entries(permissions).forEach(([k,v])=>{
        payload.append(k,v ? "on": "");
      });
      if (secondaryDeptId) {
        payload.append("secondary_department_id", parseInt(secondaryDeptId));
        if (secondaryUnit) payload.append("secondary_unit", secondaryUnit);
      }
      await api.post(`/staff-management/${staff.id}/edit/`,payload, {
        headers:{"Content-Type":"multipart/form-data"},
      });
      setSuccess(true);
      setTimeout(()=>navigate("/superadmin/staff"),1500);
    } catch(err) {
      const data=err.response?.data;
      if (data && typeof data==="object") {
        const fieldErrors = {};
        Object.entries(data).forEach(([k,v]) => {
         fieldErrors[k] = Array.isArray(v) ? v[0]:v;
       });
       setErrors(fieldErrors);
      } else {
        setErrors({ general:"Failed to update staff. Please try again."});
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="staff-loading">Loading...</div>;
  if (!staff) return null;
  
  const roleColor=ROLE_COLORS[form.role] || "#64748b";
  const rolePermissions=ROLE_PERMISSIONS[form.role];
  const roleLabel=ROLES.find(r => r.value ===form.role)?.label ||form.role;
  const secondaryCodes = ROLE_SECONDARY_DEPTS[form.role] || [];
  const secondaryDepts = departments.filter(d => secondaryCodes.includes(d.code));
  const unitOptions = DEPARTMENT_UNITS[
        departments.find(d=> d.id === parseInt(secondaryDeptId))?.code
        ] || [];


  return (
    <div className="staff-form-page">
     {/* Header */}
     <div className="form-page-header">
      <button className="btn-back" onClick={() => navigate("/superadmin/staff")}>
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <polyline points="15,18 9,12 15,6" />
       </svg>
       Back To Staff List
      </button> 
     <div>
      <h2 className="form-page-title">Edit Staff Member</h2>
      <p className="form-page-sub">Update details for {staff.full_name}</p>
     </div>
    </div>

    {/* Staff identity card */}
    <div className="staff-identity-card" style={{"--rc":roleColor}}>
     <div className="identity-avatar" style={{background:roleColor}}>
      {staff.full_name?.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase()}
     </div>
     <div className="identity-info">
      <span className="identity-name">{staff.full_name}</span>
      <span className="identity-email">{staff.email}</span>
     </div>
     <span className="identity-role" style={{color:roleColor, borderColor:roleColor}}>
      {ROLES.find(r=>r.value ===staff.role)?.label ||staff.role}
     </span>
     <span className={`status-pill ${staff.is_active? "status-active":"status-inactive"}`}>
      {staff.is_active? "Active" : "Inactive"}
     </span>
    </div>
    {success && (
     <div className="success-banner"> Staff member updated successfully </div>
    )}
    <form onSubmit={handleSubmit} className="staff-form" noValidate>
     <div className="form-card">
      <h3 className="form-section-title">Basic Information</h3>
      <div className="form-grid">
       <FormField label="Full Name" error={errors.full_name}>
       <input className="form-input" name="full_name" type="text" value={form.full_name} onChange={handleChange} />
       </FormField>
       <FormField label="Email Address" error={errors.email}>
        <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} />
       </FormField>
       <FormField label="Role" error={errors.email}>
        <select className="form-input" name="role" value={form.role} onChange={handleChange}>
	      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
       </FormField>
      </div>
      <label className="checkbox-item" style={{ marginTop:"12px"}}>
       <input 
        type="checkbox"
        name="is_active"
        checked={form.is_active}
        onChange={handleChange} />
       <span>Account is active</span>
      </label>
     </div>
     {/* Department Assignment */}
     <div className="form-card">
      <h3 className="form-section-title">Department Assignment</h3>
      {/* Secondary Dept */}
      {secondaryDepts.length === 0 ?(
          <p className="field-hit">No additional Departments available for this role.</p>
        ):(
          <>
          <FormField label="Additional Department (Optional)">
            <select
             className="form-input"
             value={secondaryDeptId}
             onChange={(e) => {setSecondaryDeptId(e.target.value); setSecondaryUnit("") }}
             >
              <option value="">-- None --</option>
              {secondaryDepts.map(d => (
                <option key={d.id} value={String(d.id)}>{d.name}</option>
              ))}
             </select>
          </FormField>

          {secondaryDeptId && unitOptions.length>0 && (
            <FormField label="Unit">
              <select
               className="form-input"
               value={secondaryUnit}
               onChange={(e) => setSecondaryUnit(e.target.value)}
               >
                <option value="">-- Select Unit --</option>
                {unitOptions.map(u =>(
                  <option key={u} value={u}>{u}</option>
                ))}
               </select>
            </FormField>
          )}
          </>
        )
      }
     </div>

     {/* Role specific permissions */}
     {rolePermissions && (
       <div className="form-card">
        <h3 className="form-section-title">Permissions</h3>
         <div className="checkbox-grid">
          {rolePermissions.map(p => (
            <label key={p.name} className="checkbox-item">
              <input
                type="checkbox"
                name={p.name}
                checked={!!permissions[p.name]}
                onChange={(e) => handlePermission(p.name, e.target.checked)}
              />
              <span>{p.label}</span>
            </label>
          ))}
         </div>
       </div>
     )}
     {errors.general && <div className="error-banner">{errors.general}</div>}
     <div className="form-actions">
      <button type="button" className="btn-secondary"
      onClick={() => navigate("/superadmin/staff")}
      disabled={submitting}>
	Cancel
      </button>
      <button type="submit" className="btn-primary" disabled={submitting} >
       {submitting ? "Saving..." : "Save Changes"}
      </button>
     </div>
    </form>
   </div>
  );
}