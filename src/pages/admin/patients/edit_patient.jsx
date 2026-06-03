import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import patientApi from "../../../api/patientApi";
import { TREATMENT_TYPES, PATIENT_STATUSES } from "../../../constants/constants";
import { ClipboardList, BriefcaseMedical, Search, Users } from "lucide-react";
import "../staff/staff.css";

function FormField({ label, error, hint, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155", fontSize: "14px" }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ color: "#64748b", fontSize: "12px", marginTop: "4px", display: "block" }}>{hint}</span>}
      {error && <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{error}</span>}
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

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      patientApi.getPatientDetails(id),
      patientApi.getDoctors(),
      patientApi.getPatients(),
    ]).then(([pat, docs, allPats]) => {
      setPatient(pat);
      setForm({
        phone:                   pat.phone || pat.user?.phone || "",
        date_of_birth:           pat.date_of_birth || "",
        gender:                  pat.gender || "",
        blood_group:             pat.blood_group || "",
        partner_name:            pat.partner_name || "",
        insurance_policy_number: pat.insurance_policy_number || pat.insurance_police_number || "",
        contact_number:          pat.contact_number || "",
        address:                 pat.address || "",
        emergency_contact_name:  pat.emergency_contact_name || "",
        emergency_contact_phone: pat.emergency_contact_phone || "",
        treatment_type:          pat.treatment_type || "",
        status:                  pat.status || "PEN",
        assigned_doctor_id:      pat.assigned_doctor?.id || pat.assigned_doctor_id || "",
        notes:                   pat.notes || "",
      });
      setDoctors(docs);
      setAllPatients(Array.isArray(allPats) ? allPats.filter(p => p.id !== parseInt(id)) : (allPats.results || []).filter(p => p.id !== parseInt(id)));
    }).catch(() => navigate("/superadmin/patients"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.assigned_doctor_id) delete payload.assigned_doctor_id;
      if (!payload.date_of_birth) delete payload.date_of_birth;
      await patientApi.updatePatient(id, payload);
      setSuccess(true);
      setTimeout(() => navigate(`/superadmin/patients/${id}`), 1500);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const fieldErrors = {};
        Object.entries(data).forEach(([k, v]) => { fieldErrors[k] = Array.isArray(v) ? v[0] : v; });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: "Failed to update patient." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkPartner = async (partnerId) => {
    try {
      await patientApi.linkPartner(id, partnerId);
      const partner = allPatients.find(p => p.id === partnerId);
      setPatient(prev => ({
        ...prev,
        partner_info: {
          id: partnerId,
          patient_id: partner?.patient_id,
          full_name: partner?.user?.full_name,
          email: partner?.user?.email,
        }
      }));
      setPartnerSearch("");
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error;
      setErrors({ general: msg || "Failed to link partner." });
    }
  };

  const handleUnlinkPartner = async () => {
    try {
      await patientApi.unlinkPartner(id);
      setPatient(prev => ({ ...prev, partner_info: null }));
    } catch {
      alert("Failed to unlink partner.");
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "12px", color: "#64748b" }}>
      <div style={{ width: "20px", height: "20px", border: "2px solid #e2e8f0", borderTop: "2px solid #3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Loading patient data...
    </div>
  );
  if (!patient) return null;

  const filteredPartners = allPatients.filter(p => {
    if (!p.user) return false;
    if (!partnerSearch) return true;
    return (
      p.user?.full_name?.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      p.patient_id?.toLowerCase().includes(partnerSearch.toLowerCase())
    );
  }).slice(0, 8);

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px", boxSizing: "border-box", background: "white", color: "#334155" };
  const selectStyle = { ...inputStyle, appearance: "none", cursor: "pointer" };
  const phonePrefixStyle = { padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px", background: "white", color: "#334155", width: "80px", textAlign: "center", borderRight: "none", borderTopRightRadius: 0, borderBottomRightRadius: 0 };
  const phoneInputStyle = { ...inputStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 };

  const patientName = patient.user?.full_name || patient.full_name || "Patient";

  return (
    <div style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* Page Header */}
      <div style={{ marginBottom: "32px" }}>
        <button
          onClick={() => navigate("/superadmin/patients")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#64748b", fontSize: "14px", cursor: "pointer", padding: 0, marginBottom: "16px" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back To Patient List
        </button>
        <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#0f172a", margin: "0 0 8px 0" }}>Edit Patient</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
          Updating <strong>{patientName}</strong> — {patient.patient_id}
        </p>
      </div>

      {success && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px", fontWeight: "500" }}>
          ✅ Patient updated successfully! Redirecting...
        </div>
      )}
      {errors.general && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px" }}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px", marginBottom: "80px", alignItems: "start" }}>

          {/* ── Left Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Personal Information */}
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <SectionHeader icon={ClipboardList} title="Personal Information" />
              <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                {/* Phone */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Phone Number" error={errors.phone}>
                    <div style={{ display: "flex" }}>
                      <select style={phonePrefixStyle}><option>+91</option></select>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="98765 43210"
                        style={phoneInputStyle}
                      />
                    </div>
                  </FormField>
                </div>

                {/* Date of Birth */}
                <FormField label="Date of Birth">
                  <input
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </FormField>

                {/* Gender */}
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

                {/* Blood Group */}
                <FormField label="Blood Group">
                  <div style={{ position: "relative" }}>
                    <select name="blood_group" value={form.blood_group} onChange={handleChange} style={selectStyle}>
                      <option value="">-- Select --</option>
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</span>
                  </div>
                </FormField>

                {/* Partner Name */}
                <FormField label="Partner Name (Optional)">
                  <input name="partner_name" value={form.partner_name} onChange={handleChange} placeholder="Partner's full name" style={inputStyle} />
                </FormField>

                {/* Insurance */}
                <FormField label="Insurance Policy Number">
                  <input name="insurance_policy_number" value={form.insurance_policy_number} onChange={handleChange} placeholder="POL-12345678" style={inputStyle} />
                </FormField>

                {/* Contact Number */}
                <FormField label="Contact Number">
                  <input name="contact_number" value={form.contact_number} onChange={handleChange} placeholder="555-0123" style={inputStyle} />
                </FormField>

                {/* Emergency Contact Name */}
                <FormField label="Emergency Contact Name">
                  <input name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} style={inputStyle} />
                </FormField>

                {/* Address */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Residential Address" error={errors.address}>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Street name, City, State, ZIP"
                      style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                    />
                  </FormField>
                </div>

                {/* Emergency Contact Phone */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Emergency Contact Number">
                    <div style={{ display: "flex" }}>
                      <select style={phonePrefixStyle}><option>+91</option></select>
                      <input
                        name="emergency_contact_phone"
                        value={form.emergency_contact_phone}
                        onChange={handleChange}
                        placeholder="98765 43210"
                        style={phoneInputStyle}
                      />
                    </div>
                  </FormField>
                </div>

              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Treatment Details */}
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <SectionHeader icon={BriefcaseMedical} title="Treatment Details" />
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Treatment Type */}
                <FormField label="Treatment Type">
                  <div style={{ position: "relative" }}>
                    <select name="treatment_type" value={form.treatment_type} onChange={handleChange} style={selectStyle}>
                      <option value="">— Select Treatment —</option>
                      {TREATMENT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</span>
                  </div>
                </FormField>

                {/* Status */}
                <FormField label="Status">
                  <div style={{ position: "relative" }}>
                    <select name="status" value={form.status} onChange={handleChange} style={selectStyle}>
                      {PATIENT_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</span>
                  </div>
                </FormField>

                {/* Assigned Doctor */}
                <FormField label="Assigned Doctor">
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <select name="assigned_doctor_id" value={form.assigned_doctor_id} onChange={handleChange} style={{ ...selectStyle, paddingLeft: "36px" }}>
                      <option value="">— None —</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.full_name} ({d.role})</option>
                      ))}
                    </select>
                  </div>
                </FormField>

                {/* Notes */}
                <FormField label="Notes" hint={`${(form.notes || "").length}/500`}>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Add any clinical observations or patient preferences..."
                    style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
                    maxLength={500}
                  />
                </FormField>

              </div>
            </div>

            {/* Partner / Couple Linkage */}
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <SectionHeader icon={Users} title="Partner / Couple Linkage" />
              <div style={{ padding: "24px" }}>
                {patient.partner_info ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "600", fontSize: "13px" }}>
                        {patient.partner_info.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "14px" }}>{patient.partner_info.full_name}</div>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>{patient.partner_info.patient_id} · {patient.partner_info.email}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleUnlinkPartner}
                      style={{ padding: "6px 14px", border: "1px solid #fca5a5", borderRadius: "6px", background: "#fef2f2", color: "#dc2626", fontSize: "13px", cursor: "pointer" }}
                    >
                      Unlink
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "12px", marginTop: 0 }}>
                      Search and link a partner patient for couple treatment.
                    </p>
                    <div style={{ position: "relative", marginBottom: "12px" }}>
                      <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                      <input
                        type="text"
                        placeholder="Search by name or patient ID…"
                        value={partnerSearch}
                        onChange={e => setPartnerSearch(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: "36px" }}
                      />
                    </div>
                    {partnerSearch && (
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                        {filteredPartners.length === 0 ? (
                          <div style={{ padding: "16px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>No patients found.</div>
                        ) : filteredPartners.map(p => (
                          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "600", fontSize: "11px" }}>
                                {p.user?.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: "500", color: "#0f172a", fontSize: "13px" }}>{p.user?.full_name}</div>
                                <div style={{ color: "#94a3b8", fontSize: "12px" }}>{p.patient_id}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleLinkPartner(p.id)}
                              style={{ padding: "5px 12px", border: "1px solid #3b82f6", borderRadius: "6px", background: "#eff6ff", color: "#3b82f6", fontSize: "12px", cursor: "pointer" }}
                            >
                              Link
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div style={{ position: "fixed", bottom: 0, left: "260px", right: 0, background: "white", borderTop: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <button
            type="button"
            onClick={() => navigate("/superadmin/patients")}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#64748b", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}
          >
            ✕ Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ padding: "10px 32px", background: "#3b82f6", border: "none", borderRadius: "8px", color: "white", fontSize: "14px", fontWeight: "500", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}