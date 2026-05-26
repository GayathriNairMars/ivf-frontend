import { useEffect, useState } from "react";
import adminApi from "../../../api/adminApi";
import { ROLES,ROLE_PERMISSIONS,ROLE_DEFAULT_DEPT_CODE } from "../../../constants/constants";
import { useNavigate } from "react-router-dom";
import { ROLE_SECONDARY_DEPTS,DEPARTMENT_UNITS } from "../../../constants/constants";


function FormField({label,error,children}) {
  return (
    <div className="form-field">
     <label className="form-label">{label}</label>
     {children}
     {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function CheckboxGroup({ permissions,values,onChange }){
  if (!permissions) return null;
  return (
    <div className="checkbox-group">
     <p className="checkbox-froup-label">Permissions</p>
     <div className="checkbox-grid">
      {permissions.map(p =>(
       <label key={p.name} className="checkbox-item">
        <input
         type="checkbox"
         name={p.name}
         checked={!!values[p.name]}
         onChange={(e)=> onChange(p.name, e.target.checked)}
         />
         <span>{p.label}</span>
       </label>
      ))}
     </div>
    </div>
  );
}

export default function AddStaff() {
  const [form,setForm] = useState({
    full_name:"",email:"",role:"REC",password:"",is_active:true, secondary_department_id:"", secondary_unit: "", 
  });

  const [permissions,setPermissions] =useState({});
  const [departments,setDepartments] = useState([]);
  const [primaryDept,setPrimaryDept] = useState(null);
  const [errors,setErrors] = useState({});
  const [submitting,setSubmitting] = useState(false);
  const [success,setSuccess] = useState(false);
  const navigate=useNavigate();

  useEffect(()=> {
    adminApi.getDepartments()
    .then((data) =>{
      console.log("departments response:", data);  // ← check this in console
      setDepartments(Array.isArray(data) ? data : (data.results || []));
    }).catch(() => {});
  },[]);

  useEffect(() => {
    const defaultCode = ROLE_DEFAULT_DEPT_CODE[form.role];
    if (defaultCode && departments.length>0) {
      const match = departments.find(d => d.code === defaultCode);
      setPrimaryDept(match || null);
    } else {
      setPrimaryDept(null);
    }
    setPermissions({});
  },[form.role,departments]);

  const handleChange = (e) => {
   const {name,value,type,checked} = e.target;
   setForm(prev=> ({...prev,[name]:type=="checkbox"? checked:value }));
   setErrors(prev => ({...prev,[name]:""}));
   //Reset permissions when role changes
   if (name === "role") setPermissions({});
  };
  const handlePermission = (name,checked) => {
    setPermissions(prev => ({...prev, [name]:checked}));
  };

  const validate = () =>{
    const errs = {};
    if (!form.full_name.trim()) errs.full_name="Full Name is required.";
    if (!form.email.trim()) errs.email="Email is required,";
    else if(!/\S+@\S+\.\S+/.test(form.email)) errs.email="Enter a valid email.";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Minimum 6 characters";
    if (!form.role) errs.role = "Role is required.";
    return errs;
  };
  const handleSubmit = async(e) => {
    e.preventDefault();
    const errs=validate();
    if (Object.keys(errs).length>0) {setErrors(errs); return;}
    setSubmitting(true);
    try{
    //convert permissions checkboxes to "on" for Djangos is_checked
    const payload = new FormData();
    Object.entries(form).forEach(([k,v]) => {
      if (v!== "" && v!==null && v!==undefined){
        if (typeof v ==="boolean") {
          payload.append(k,v ? "on" : "");
        } else {
          payload.append(k,v);
        }
      }
    });
    Object.entries(permissions).forEach(([k,v]) => {
      payload.append(k, v ? "on" : "");
      });
    await adminApi.createStaff(payload,{
      headers:{"Content-Type":"multipart/form-data"},
    });

    setSuccess(true);
    setTimeout(()=> navigate("/superadmin/staff"),1500);
    } catch (err) {
    const data = err.response?.data;
    if (data && typeof data === "object") {
      const fieldErrors={};
      Object.entries(data).forEach(([k,v])=>{
	    fieldErrors[k] =Array.isArray(v)? v[0] : v;
      });
      setErrors(fieldErrors);
      } else {
      setErrors({general: "Failed to create staff. Please try again."});
      }
    } finally {
      setSubmitting(false);
    }
   };

   const rolePermissions = ROLE_PERMISSIONS[form.role];
   const secondaryDeptCodes = ROLE_SECONDARY_DEPTS[form.role] || [];
   const secondaryDepts = departments.filter(d => secondaryDeptCodes.includes(d.code));
   const unitOptions = DEPARTMENT_UNITS[
  departments.find(d => d.id === parseInt(form.secondary_department_id))?.code
] || [];

console.log("form.role:", form.role);
console.log("secondaryDeptCodes:", secondaryDeptCodes);
console.log("departments from API:", departments);
console.log("secondaryDepts matched:", secondaryDepts);
  return (
    <div className="staff-form-page">
      {/* Header */}
      <div className="form-page-header">
       <button className="btn-back" onClick={()=> navigate("/superadmin/staff")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
	<polyline points="15,18 9,12 15,6" />
        </svg>
        Back to Staff list
       </button>
       <div className="form-page-titles">
        <h2 className="form-page-title">Add New Staff</h2>
        <p className="form-page-sub">Fill in the details to onboard a new staff member</p>
       </div>
      </div>
      {success && (
       <div className="success-banner">
          Staff member created successfully! Redirecting..
       </div>
      )}

      <form onSubmit={handleSubmit} className="staff-form" noValidate>
       <div className="form-card">
        <h3 className="form-section-title">Basic Information</h3>
        <div className="form-grid">
         <FormField label="Full Name *" error={errors.full_name}>
	<input
	 className="form-input"
	 name="full_name"
	 type="text"
	 placeholder="e.g. Dr. Anjali Nair" 
	 value={form.full_name}
	 onChange={handleChange} />
         </FormField>
         <FormField label="Email Address *" error={errors.email} > 
          <input
           className="form-input"
           name="email"
           type="email"
           placeholder="staff@hospital.com"
           value={form.email} onChange={handleChange} />
         </FormField>
         <FormField label="Role *" error={errors.role}>
	        <select className="form-input" name="role" value={form.role} onChange={handleChange}>
	        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        	</select>
         </FormField>
         <FormField label="Temporary Password *" error={errors.password}>
	<input 
	className="form-input" 
	name="password" 
	type="password" 
	placeholder="Min. 6 characters" 
	value={form.password} 
	onChange={handleChange} />
         </FormField>
        </div>
        <label className="checkbox-item" style={{marginTop: "12px"}}>
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
        {/* Primary dept -auto assigned, read only */}
      

        {/* Optional Secondary Dept */}
        {secondaryDepts.length > 0 ? (
    <>
      <FormField label="Additional Department (Optional)" error={errors.secondary_department_id}>
        <select
          className="form-input"
          name="secondary_department_id"
          value={form.secondary_department_id}
          onChange={handleChange}
        >
          <option value="">— None —</option>
          {secondaryDepts.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <span className="field-hint">
          Assign if this staff works across departments.
        </span>
      </FormField>

      {form.secondary_department_id && unitOptions.length > 0 && (
        <FormField label="Unit" error={errors.secondary_unit}>
          <select
            className="form-input"
            name="secondary_unit"
            value={form.secondary_unit}
            onChange={handleChange}
          >
            <option value="">— Select Unit —</option>
            {unitOptions.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </FormField>
      )}
    </>
  ) : (
    <p className="field-hint">
      No additional departments available for this role.
    </p>
  )}
</div>
       {/* Role-specific permissions */}
       {rolePermissions && (
         <div className="form-card">
          <h3 className="form-section-title">
	        {ROLES.find(r => r.value === form.role)?.label} Permissions
          </h3>
          <CheckboxGroup
            permissions={rolePermissions} 
            values={permissions} 
            onChange={handlePermission}
	        />
         </div>
       )}
       {errors.general && <div className="error-banner">{errors.general}</div>}
       <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={()=> navigate("/superadmin/staff")} disabled={submitting}>
	Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
	{submitting? "Creating..":"Create Staff Member"}
        </button>
       </div>
      </form>
    </div>
   );
}