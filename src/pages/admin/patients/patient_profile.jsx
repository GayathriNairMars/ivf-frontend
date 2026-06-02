import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import patientApi from "../../../api/patientApi";
import { STATUS_COLORS, PATIENT_STATUSES, TREATMENT_LABELS } from "../../../constants/constants";
import { Edit2, FileText, Plus, ChevronRight, Phone, MessageSquare } from "lucide-react";

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordTypeFilter, setRecordTypeFilter] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    Promise.all([
      patientApi.getPatientDetails(id),
      patientApi.getEmrRecords(id).catch(() => []),
    ]).then(([pat, recs]) => {
      setPatient(pat);
      const list = Array.isArray(recs) ? recs : (recs.results || []);
      setRecords(list);
    }).catch(() => navigate("/superadmin/patients"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await patientApi.updatePatientStatus(id, newStatus);
      setPatient(prev => ({ ...prev, status: newStatus }));
    } catch {
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "12px", color: "#64748b", fontSize: "14px" }}>
      <div style={{ width: "20px", height: "20px", border: "2px solid #e2e8f0", borderTop: "2px solid #3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Loading patient...
    </div>
  );
  if (!patient) return null;

  const name = patient.user?.full_name || "Patient";
  const sc = STATUS_COLORS[patient.status] || STATUS_COLORS.PEN;
  const treatmentLabel = TREATMENT_LABELS[patient.treatment_type] || patient.treatment_type || "-";
  const doctorName = patient.assigned_doctor?.full_name;
  const doctorRole = patient.assigned_doctor?.role_display || patient.assigned_doctor?.role;
  const avatarInitials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  // Calculate age from DOB
  const age = patient.date_of_birth
    ? Math.floor((new Date() - new Date(patient.date_of_birth)) / (365.25 * 24 * 3600 * 1000))
    : null;

  const dobDisplay = patient.date_of_birth
    ? new Date(patient.date_of_birth).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  const registeredDisplay = patient.registered_on
    ? new Date(patient.registered_on).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "-";

  // Filter records by type
  const filteredRecords = recordTypeFilter
    ? records.filter(r => r.record_type === recordTypeFilter || r.record_type_display === recordTypeFilter)
    : records;

  const uniqueTypes = [...new Set(records.map(r => r.record_type_display || r.record_type).filter(Boolean))];

  const infoCell = (label, value) => (
    <div style={{ padding: "12px 0" }}>
      <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500" }}>{value || "-"}</div>
    </div>
  );

  return (
    <div style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontSize: "13px", color: "#64748b" }}>
        <button onClick={() => navigate("/superadmin/patients")} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 0, fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
          Patient Directory
        </button>
        <ChevronRight size={14} />
        <button onClick={() => navigate("/superadmin/patients")} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 0, fontSize: "13px" }}>
          Manage patient
        </button>
        <ChevronRight size={14} />
        <span>Patient details</span>
      </div>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{name}</h1>
            <span style={{ background: "#eff6ff", color: "#3b82f6", padding: "3px 10px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", border: "1px solid #bfdbfe" }}>
              {patient.patient_id}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#64748b", fontSize: "14px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>💊</span> {treatmentLabel}
            </span>
            {patient.registered_on && (
              <>
                <span style={{ color: "#cbd5e1" }}>|</span>
                <span style={{ color: "#10b981", fontWeight: "500" }}>
                  Registered {registeredDisplay}
                </span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => navigate(`/superadmin/patients/${id}/edit`)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "white", color: "#334155", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}
          >
            <Edit2 size={16} /> Edit Details
          </button>
          <button
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", border: "none", borderRadius: "8px", background: "#3b82f6", color: "white", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}
          >
            <Plus size={16} /> Create EMR
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", marginBottom: "24px" }}>

        {/* ── Patient Information Card ── */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Patient Information</h2>
            <button
              onClick={() => navigate(`/superadmin/patients/${id}/edit`)}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
            >
              <Edit2 size={14} /> Edit Details
            </button>
          </div>

          <div style={{ padding: "8px 24px 24px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
              {infoCell("Patient ID", patient.patient_id)}
              {infoCell("Partner", patient.partner_info?.full_name)}
              {infoCell("Full Name", name)}
              {infoCell("Contact", patient.phone || patient.user?.phone || patient.contact_number)}
              {infoCell("Birth Details", age ? `${dobDisplay} (${age} Yrs)` : dobDisplay)}
              {infoCell("Address", patient.address)}
              {infoCell("Email", patient.user?.email)}
              {infoCell("Emergency", patient.emergency_contact_phone || patient.emergency_contact_name)}
            </div>

            {/* Status quick-change */}
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Treatment Status:</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: sc.bg, color: sc.color, padding: "4px 12px", borderRadius: "16px", fontSize: "12px", fontWeight: "600" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sc.color }}></span>
                {sc.label}
              </span>
              <select
                value={patient.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={updating}
                style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px", color: "#334155", background: "white", cursor: "pointer", outline: "none" }}
              >
                {PATIENT_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Assigned Doctor Card */}
          <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>Assigned doctor</div>

            {doctorName ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px", flexShrink: 0 }}>
                    {doctorName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>{doctorName}</div>
                    <div style={{ fontSize: "13px", color: "#3b82f6", fontWeight: "500" }}>{doctorRole || "Doctor"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontSize: "12px", color: "#64748b" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
                      Online
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "white", color: "#475569", fontSize: "13px", cursor: "pointer" }}>
                    <MessageSquare size={15} /> Message
                  </button>
                  <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px", border: "none", borderRadius: "8px", background: "#3b82f6", color: "white", fontSize: "13px", cursor: "pointer" }}>
                    <Phone size={15} /> Voice Call
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "12px 0" }}>
                No doctor assigned yet
              </div>
            )}
          </div>

          {/* Clinical Notes Card */}
          <div
            style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            onClick={() => navigate(`/superadmin/emr/patient/${id}`)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FileText size={18} color="#64748b" />
              <span style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>Clinical Notes</span>
              {records.length > 0 && (
                <span style={{ background: "#ef4444", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700" }}>
                  {records.length}
                </span>
              )}
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </div>

          {/* Notes snippet */}
          {patient.notes && (
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px 24px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</div>
              <p style={{ fontSize: "14px", color: "#334155", lineHeight: 1.6, margin: 0 }}>{patient.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Treatment Log Table ── */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Treatment Log</h2>
          <div style={{ position: "relative" }}>
            <select
              value={recordTypeFilter}
              onChange={e => setRecordTypeFilter(e.target.value)}
              style={{ padding: "8px 32px 8px 14px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", color: "#334155", background: "white", appearance: "none", cursor: "pointer", outline: "none" }}
            >
              <option value="">All types</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b", fontSize: "11px" }}>▼</span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Type", "Title", "Date", "Created by", ""].map(h => (
                  <th key={h} style={{ padding: "12px 24px", textAlign: "left", fontSize: "13px", fontWeight: "500", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? filteredRecords.map((r, idx) => (
                <tr key={r.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 24px", fontSize: "14px", color: "#475569" }}>
                    {r.record_type_display || r.record_type || "-"}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "14px", color: "#475569" }}>
                    {r.title || r.chief_complaint || "-"}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "14px", color: "#475569" }}>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "-"}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "14px", color: "#475569" }}>
                    {r.doctor_name || r.created_by?.full_name || "-"}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <button
                      onClick={() => navigate(`/superadmin/emr/patient/${id}`)}
                      style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 14px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", color: "#334155", fontSize: "13px", cursor: "pointer" }}
                    >
                      View ↗
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                    No treatment records found for this patient.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}