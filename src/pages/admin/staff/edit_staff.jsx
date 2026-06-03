import { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";
import { ROLES, ROLE_COLORS, ROLE_PERMISSIONS, ROLE_SECONDARY_DEPTS, DEPARTMENT_UNITS } from "../../../constants/constants";
import { useNavigate, useParams } from "react-router-dom";
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

export default function EditStaff() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [form, setForm] = useState({
    full_name: "", email: "", role: "REC", is_active: true,
  });
  const [permissions, setPermissions] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [secondaryDeptId, setSecondaryDeptId] = useState("");
  const [secondaryUnit, setSecondaryUnit] = useState("");

  // Load staff
  useEffect(() => {
    adminApi.getStaffDetails(id)
      .then((data) => {
        setStaff(data);
        setForm({
          full_name: data.full_name || "",
          email: data.email || "",
          role: data.role || "REC",
          is_active: data.is_active ?? true,
        });
        // Load Departments and Assignments
        adminApi.getDepartments()
          .then((depts) => {
            setDepartments(Array.isArray(depts) ? depts : (depts.results || []));
            adminApi.getStaffAssignments(data.id)
              .then((assignments) => {
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
        console.log("Edit staff fetch error:", err.response?.status, err.response?.data);
        navigate("/superadmin/staff");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

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
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
    if (name === "role") {
      setPermissions({});
      setSecondaryDeptId("");
      setSecondaryUnit("");
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => payload.append(k, v));
      Object.entries(permissions).forEach(([k, v]) => {
        payload.append(k, v ? "on" : "");
      });
      if (secondaryDeptId) {
        payload.append("secondary_department_id", parseInt(secondaryDeptId));
        if (secondaryUnit) payload.append("secondary_unit", secondaryUnit);
      }
      await adminApi.updateStaff(staff.id, payload, {
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
        setErrors({ general: "Failed to update staff. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="staff-loading" style={{ padding: "32px", color: "#64748b" }}>Loading staff details...</div>;
  if (!staff) return null;

  const roleColor = ROLE_COLORS[form.role] || "#64748b";
  const rolePermissions = ROLE_PERMISSIONS[form.role];
  const roleLabel = ROLES.find(r => r.value === form.role)?.label || form.role;
  const secondaryCodes = ROLE_SECONDARY_DEPTS[form.role] || [];
  const secondaryDepts = departments.filter(d => secondaryCodes.includes(d.code));
  const unitOptions = DEPARTMENT_UNITS[
    departments.find(d => d.id === parseInt(secondaryDeptId))?.code
  ] || [];

  return (
    <div className="add-staff-container" style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <button 
          className="btn-back" 
          onClick={() => navigate("/superadmin/staff")}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px", fontWeight: "500", padding: 0 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back To Staff List
        </button>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#0f172a", margin: "0 0 8px 0" }}>Edit Staff Member</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Update details for {staff.full_name}</p>
        </div>
      </div>

      {/* Staff identity card */}
      <div className="staff-identity-card" style={{ "--rc": roleColor, background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div className="identity-avatar" style={{ background: roleColor, width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "600", fontSize: "18px" }}>
          {staff.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className="identity-info" style={{ flex: 1 }}>
          <div className="identity-name" style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>{staff.full_name}</div>
          <div className="identity-email" style={{ fontSize: "14px", color: "#64748b" }}>{staff.email}</div>
        </div>
        <span className="identity-role" style={{ color: roleColor, border: `1px solid ${roleColor}`, padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "500" }}>
          {ROLES.find(r => r.value === staff.role)?.label || staff.role}
        </span>
        <span className={`status-pill ${staff.is_active ? "status-active" : "status-inactive"}`} style={{ background: staff.is_active ? "#dcfce7" : "#fee2e2", color: staff.is_active ? "#15803d" : "#991b1b", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "500" }}>
          {staff.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {success && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px", fontWeight: "500" }}>
          Staff member updated successfully! Redirecting...
        </div>
      )}

      {errors.general && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px" }}>{errors.general}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginBottom: "80px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Basic Information */}
            <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginBottom: "20px", marginTop: 0 }}>Basic Information</h3>
              
              <FormField label="Full Name" error={errors.full_name}>
                <input
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
                />
              </FormField>

              <FormField label="Email Address" error={errors.email}>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
                />
              </FormField>

              <FormField label="Role" error={errors.role}>
                <div style={{ position: "relative" }}>
                  <select 
                    name="role" 
                    value={form.role} 
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", color: "#334155", appearance: "none", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                  >
                    {ROLES.filter(r => r.value !== "").map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</span>
                </div>
              </FormField>

              <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <label className="toggle-switch">
                  <input 
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span style={{ fontSize: "14px", color: "#334155", fontWeight: "500" }}>Account is active</span>
              </div>
            </div>

            {/* Department Assignment */}
            <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginBottom: "20px", marginTop: 0 }}>Department Assignment</h3>
              {secondaryDepts.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>No additional Departments available for this role.</p>
              ) : (
                <>
                  <FormField label="Additional Department (Optional)">
                    <div style={{ position: "relative" }}>
                      <select
                        value={secondaryDeptId}
                        onChange={(e) => { setSecondaryDeptId(e.target.value); setSecondaryUnit(""); }}
                        style={{ width: "100%", padding: "12px 16px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", color: "#334155", appearance: "none", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                      >
                        <option value="">-- None --</option>
                        {secondaryDepts.map(d => (
                          <option key={d.id} value={String(d.id)}>{d.name}</option>
                        ))}
                      </select>
                      <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</span>
                    </div>
                  </FormField>

                  {secondaryDeptId && unitOptions.length > 0 && (
                    <FormField label="Unit">
                      <div style={{ position: "relative" }}>
                        <select
                          value={secondaryUnit}
                          onChange={(e) => setSecondaryUnit(e.target.value)}
                          style={{ width: "100%", padding: "12px 16px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", color: "#334155", appearance: "none", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                        >
                          <option value="">-- Select Unit --</option>
                          {unitOptions.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                        <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</span>
                      </div>
                    </FormField>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Permissions */}
          {rolePermissions && (
            <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  Permissions
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
            ✕ Cancel
          </button>
          
          <div style={{ display: "flex", gap: "16px" }}>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ padding: "10px 32px", background: "#3b82f6", border: "none", borderRadius: "8px", color: "white", fontSize: "14px", fontWeight: "500", cursor: submitting ? "not-allowed" : "pointer" }}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}