import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import patientApi from "../../../api/patientApi";
import { TREATMENT_TYPES } from "../../../constants/constants";
import { User, ClipboardList, BriefcaseMedical, Eye, EyeOff, Calendar, Search } from "lucide-react";
import "../staff/staff.css"; // Reuse staff styles for layout consistency

function FormField({ label, error, hint, children }) {
  return (
    <div className="form-field" style={{ marginBottom: "16px" }}>
      <label className="form-label" style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155", fontSize: "14px" }}>
        {label}
      </label>
      {children}
      {hint && <span className="field-hint" style={{ color: "#64748b", fontSize: "12px", marginTop: "4px", display: "block" }}>{hint}</span>}
      {error && <span className="field-error" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{error}</span>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ background: "#eff6ff", color: "#3b82f6", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: 0 }}>{title}</h3>
    </div>
  );
}

export default function AddPatient() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", phone: "", date_of_birth: "", gender: "", blood_group: "", partner_name: "", insurance_policy_number: "", contact_number: "", address: "", emergency_contact_name: "", emergency_contact_phone: "", treatment_type: "", status: "PEN", assigned_doctor_id: "", notes: "",
  });
  const [doctors, setDoctors] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuth();
  const destination = user?.role === 'REC' ? '/receptionist' : '/superadmin/patients';

  useEffect(() => {
    patientApi.getDoctors()
      .then((data) => setDoctors(data))
      .catch(() => {});
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "Minimum 6 characters.";
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.assigned_doctor_id) delete payload.assigned_doctor_id;
      if (!payload.date_of_birth) delete payload.date_of_birth;

      const data = await patientApi.createPatient(payload);
      setSuccess(true);
      setTimeout(() => navigate(destination), 1500);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const fieldErrors = {};
        Object.entries(data).forEach(([k, v]) => { fieldErrors[k] = Array.isArray(v) ? v[0] : v; });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: "Failed to register patient. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px", boxSizing: "border-box", background: "white", color: "#334155" };
  const selectStyle = { ...inputStyle, appearance: "none", cursor: "pointer" };
  const phonePrefixStyle = { padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px", background: "white", color: "#334155", width: "80px", textAlign: "center", borderRight: "none", borderTopRightRadius: 0, borderBottomRightRadius: 0 };
  const phoneInputStyle = { ...inputStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 };

  return (
    <div className="add-patient-container" style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#0f172a", margin: "0 0 8px 0" }}>Register patient</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Register a new patient and create a treatment-ready profile.</p>
      </div>

      {success && <div style={{ background: "#dcfce7", color: "#166534", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px", fontWeight: "500" }}>Patient registered successfully! Redirecting to profile...</div>}
      {errors.general && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px" }}>{errors.general}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px", marginBottom: "80px", alignItems: "start" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Account Details */}
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <SectionHeader icon={User} title="Account Details" />
              <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <FormField label="Full Name" error={errors.full_name}>
                  <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="e.g. Jane Doe" style={inputStyle} />
                </FormField>
                <FormField label="Email Address" error={errors.email}>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane.doe@example.com" style={inputStyle} />
                </FormField>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Password" error={errors.password}>
                    <div style={{ position: "relative" }}>
                      <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="••••••••" style={{ ...inputStyle, paddingRight: "40px", letterSpacing: showPassword ? "normal" : "2px" }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormField>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Phone Number" error={errors.phone}>
                    <div style={{ display: "flex" }}>
                      <select style={phonePrefixStyle}><option>+91</option></select>
                      <input name="phone" value={form.phone} onChange={handleChange} placeholder="98765 43210" style={phoneInputStyle} />
                    </div>
                  </FormField>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <SectionHeader icon={ClipboardList} title="Personal Information" />
              <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <FormField label="Date of Birth">
                  <div style={{ position: "relative" }}>
                    <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} style={inputStyle} />
                  </div>
                </FormField>
                <FormField label="Gender">
                  <div style={{ position: "relative" }}>
                    <select name="gender" value={form.gender} onChange={handleChange} style={selectStyle}>
                      <option value="">Select the gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</span>
                  </div>
                </FormField>
                <FormField label="Blood Group">
                  <div style={{ position: "relative" }}>
                    <select name="blood_group" value={form.blood_group} onChange={handleChange} style={selectStyle}>
                      <option value="">O+</option>
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</span>
                  </div>
                </FormField>
                <FormField label="Partner Name (Optional)">
                  <input name="partner_name" value={form.partner_name} onChange={handleChange} placeholder="Partner's full name" style={inputStyle} />
                </FormField>
                <FormField label="Insurance Policy Number">
                  <input name="insurance_policy_number" value={form.insurance_policy_number} onChange={handleChange} placeholder="POL-12345678" style={inputStyle} />
                </FormField>
                <FormField label="Contact Number">
                  <input name="contact_number" value={form.contact_number} onChange={handleChange} placeholder="555-0123" style={inputStyle} />
                </FormField>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Residential Address">
                    <textarea name="address" value={form.address} onChange={handleChange} placeholder="Street name, City, State, ZIP" style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} />
                  </FormField>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Emergency Contact Number">
                    <div style={{ display: "flex" }}>
                      <select style={phonePrefixStyle}><option>+91</option></select>
                      <input name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} placeholder="98765 43210" style={phoneInputStyle} />
                    </div>
                  </FormField>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Treatment Details */}
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <SectionHeader icon={BriefcaseMedical} title="Treatment Details" />
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <FormField label="Treatment Type">
                  <div style={{ position: "relative" }}>
                    <select name="treatment_type" value={form.treatment_type} onChange={handleChange} style={selectStyle}>
                      <option value="">IVF (In Vitro Fertilization)</option>
                      {TREATMENT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</span>
                  </div>
                </FormField>
                <FormField label="Initial Status">
                  <div style={{ position: "relative" }}>
                    <select name="status" value={form.status} onChange={handleChange} style={selectStyle}>
                      <option value="PEN">Consultation Scheduled</option>
                      <option value="ACT">Active Treatment</option>
                      <option value="HOL">On Hold</option>
                    </select>
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</span>
                  </div>
                </FormField>
                <FormField label="Assigned Doctor">
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <select name="assigned_doctor_id" value={form.assigned_doctor_id} onChange={handleChange} style={{ ...selectStyle, paddingLeft: "36px" }}>
                      <option value="">Dr. Julianne Smith (ID: FP-001)</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.full_name} ({d.role})</option>
                      ))}
                    </select>
                  </div>
                </FormField>
                <FormField label="Notes" hint={`${form.notes.length}/500`}>
                  <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Add any clinical observations or patient preferences..." style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }} maxLength={500} />
                </FormField>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Actions */}
        <div style={{ position: "fixed", bottom: 0, left: "260px", right: 0, background: "white", borderTop: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <button 
            type="button" 
            onClick={() => navigate(destination)}
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
              {submitting ? "Registering..." : "Register"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}