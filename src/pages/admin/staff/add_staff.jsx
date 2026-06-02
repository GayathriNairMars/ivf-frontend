import { useEffect, useState } from "react";
import adminApi from "../../../api/adminApi";
import { ROLES, ROLE_PERMISSIONS, ROLE_DEFAULT_DEPT_CODE } from "../../../constants/constants";
import { useNavigate } from "react-router-dom";
import { ROLE_SECONDARY_DEPTS, DEPARTMENT_UNITS } from "../../../constants/constants";
import "./staff.css";

function FormField({ label, error, children }) {
  return (
    <div className="form-field" style={{ marginBottom: "16px" }}>
      <label className="form-label" style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155", fontSize: "14px" }}>
        {label}
      </label>
      {children}
      {error && <span className="field-error" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{error}</span>}
    </div>
  );
}

function ToggleRow({ label, name, checked, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: "14px", color: "#334155" }}>{label}</span>
      <label className="toggle-switch">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(name, e.target.checked)}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
}

export default function AddStaff() {
  const [form, setForm] = useState({
    full_name: "", email: "", role: "HRM", password: "", is_active: true, secondary_department_id: "", secondary_unit: "", date_of_birth: "", employee_id: ""
  });

  const [permissions, setPermissions] = useState({});
  const [departments, setDepartments] = useState([]);
  const [primaryDept, setPrimaryDept] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.getDepartments()
      .then((data) => {
        setDepartments(Array.isArray(data) ? data : (data.results || []));
      }).catch(() => {});
  }, []);

  useEffect(() => {
    const defaultCode = ROLE_DEFAULT_DEPT_CODE[form.role];
    if (defaultCode && departments.length > 0) {
      const match = departments.find(d => d.code === defaultCode);
      setPrimaryDept(match || null);
    } else {
      setPrimaryDept(null);
    }
    
    // Set default permissions to true for demo based on screenshots
    const rolePerms = ROLE_PERMISSIONS[form.role] || [];
    const initialPerms = {};
    rolePerms.forEach(p => {
      // randomly check some for realistic default, or leave false. Let's start false
      initialPerms[p.name] = false;
    });
    setPermissions(initialPerms);
  }, [form.role, departments]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handlePermission = (name, checked) => {
    setPermissions(prev => ({ ...prev, [name]: checked }));
  };

  const resetPermissions = () => {
    const rolePerms = ROLE_PERMISSIONS[form.role] || [];
    const reset = {};
    rolePerms.forEach(p => reset[p.name] = false);
    setPermissions(reset);
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = "Required.";
    if (!form.email.trim()) errs.email = "Required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email.";
    if (!form.password) errs.password = "Required";
    else if (form.password.length < 6) errs.password = "Min 6 chars";
    if (!form.role) errs.role = "Required.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) {
          if (typeof v === "boolean") {
            payload.append(k, v ? "on" : "");
          } else {
            payload.append(k, v);
          }
        }
      });
      Object.entries(permissions).forEach(([k, v]) => {
        payload.append(k, v ? "on" : "");
      });
      await adminApi.createStaff(payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setTimeout(() => navigate("/superadmin/staff"), 1500);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const fieldErrors = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrors[k] = Array.isArray(v) ? v[0] : v;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: "Failed to create staff. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const rolePermissions = ROLE_PERMISSIONS[form.role];
  const roleLabel = ROLES.find(r => r.value === form.role)?.label || "Staff";

  return (
    <div className="add-staff-container" style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#0f172a", margin: "0 0 8px 0" }}>Add staff</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Create staff accounts and assign a role within the hospital system.</p>
      </div>

      {success && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px", fontWeight: "500" }}>
          Staff member created successfully! Redirecting...
        </div>
      )}

      {errors.general && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px" }}>{errors.general}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* Role Selection */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>Staff role</label>
          <div style={{ position: "relative" }}>
            <select 
              name="role" 
              value={form.role} 
              onChange={handleChange}
              style={{ width: "100%", padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", color: "#334155", appearance: "none", outline: "none", cursor: "pointer" }}
            >
              {ROLES.filter(r => r.value !== "").map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</span>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginBottom: "80px" }}>
          
          {/* Basic Information */}
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginBottom: "20px", marginTop: 0 }}>Basic Information</h3>
            
            <FormField label="Full Name" error={errors.full_name}>
              <input
                name="full_name"
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={form.full_name}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px" }}
              />
            </FormField>

            <FormField label="Email Address" error={errors.email}>
              <input
                name="email"
                type="email"
                placeholder="s.jenkins@fertilitypro.com"
                value={form.email}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px" }}
              />
            </FormField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FormField label="Date of Birth" error={errors.date_of_birth}>
                <div style={{ position: "relative" }}>
                  <input
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px", color: form.date_of_birth ? "#0f172a" : "#94a3b8" }}
                  />
                </div>
              </FormField>

              <FormField label="Employee ID" error={errors.employee_id}>
                <input
                  name="employee_id"
                  type="text"
                  placeholder="HR-2024-042"
                  value={form.employee_id}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", borderRadius: "8px", outline: "none", fontSize: "14px", color: "#64748b" }}
                />
              </FormField>
            </div>

            <FormField label="Password" error={errors.password}>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px" }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </FormField>
          </div>

          {/* Permissions */}
          {rolePermissions && (
            <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  {roleLabel} Permissions
                </h3>
                <button 
                  type="button" 
                  onClick={resetPermissions}
                  style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}
                >
                  Reset to Default
                </button>
              </div>

              <div>
                {rolePermissions.map(p => (
                  <ToggleRow
                    key={p.name}
                    name={p.name}
                    label={p.label}
                    checked={!!permissions[p.name]}
                    onChange={handlePermission}
                  />
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Actions */}
        <div style={{ position: "fixed", bottom: 0, left: "260px", right: 0, background: "white", borderTop: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <button 
            type="button" 
            onClick={() => navigate("/superadmin/staff")}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#64748b", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}
          >
            ✕ Discard Entry
          </button>
          
          <div style={{ display: "flex", gap: "16px" }}>
            <button 
              type="button"
              style={{ padding: "10px 24px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#3b82f6", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}
            >
              Save as Draft
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ padding: "10px 32px", background: "#3b82f6", border: "none", borderRadius: "8px", color: "white", fontSize: "14px", fontWeight: "500", cursor: submitting ? "not-allowed" : "pointer" }}
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}