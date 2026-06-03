import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import patientApi from "../../../api/patientApi";
import { STATUS_COLORS, TREATMENT_LABELS, PATIENT_STATUSES, TREATMENT_TYPES } from "../../../constants/constants";
import { Search, Edit, Eye, Filter } from "lucide-react";
import "./patient.css";
import "../staff/staff.css";

export default function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [treatment, setTreatment] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (treatment) params.append("treatment_type", treatment);
      
      const [pRes, sRes] = await Promise.all([
        patientApi.getPatientsList(params.toString()),
        patientApi.getPatientStats(),
      ]);
      setPatients(Array.isArray(pRes) ? pRes : (pRes.results || []));
      setStats(sRes);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, treatment]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Apply date filter locally as the backend may not support it yet
  const filteredByDate = patients.filter(p => {
    if (!dateFilter) return true;
    return p.registered_on?.startsWith(dateFilter);
  });

  const totalPages = Math.ceil(filteredByDate.length / PER_PAGE);
  const paginated = filteredByDate.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="manage-patient-container" style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#0f172a", margin: "0 0 8px 0" }}>Manage patient details</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Manage and register patient details.</p>
        </div>
        <button 
          onClick={() => navigate("/superadmin/patients/add")}
          style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <span>+</span> Register patient
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        {[
          { label: "Total patients", value: stats?.total || 0 },
          { label: "Active treatments", value: stats?.by_status?.ACT || 0 },
          { label: "Pending treatments", value: stats?.by_status?.PEN || 0 },
          { label: "Completed", value: stats?.by_status?.COM || 0 },
        ].map((stat, idx) => (
          <div key={idx} style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "500", marginBottom: "12px" }}>{stat.label}</div>
            <div style={{ color: "#0f172a", fontSize: "32px", fontWeight: "600" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search by name, MRN, or diagnosis code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <select 
          value={treatment}
          onChange={(e) => { setTreatment(e.target.value); setPage(1); }}
          style={{ padding: "10px 32px 10px 16px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", color: "#334155", appearance: "none", outline: "none", cursor: "pointer" }}
        >
          <option value="">Treatment (All)</option>
          {TREATMENT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select 
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: "10px 32px 10px 16px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", color: "#334155", appearance: "none", outline: "none", cursor: "pointer" }}
        >
          <option value="">Status (All)</option>
          {PATIENT_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div style={{ position: "relative" }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", color: dateFilter ? "#0f172a" : "#94a3b8", background: "white" }}
          />
        </div>

        <button 
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#3b82f6", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}
        >
          More filters
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading patients...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Patient ID</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Patient name</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Doctor</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Treatment</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Registered date</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Status</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? paginated.map((p) => {
                  const sc = STATUS_COLORS[p.status] || STATUS_COLORS.PEN;
                  
                  // Extract color for the dot badge based on the UI screenshot styling
                  // Green for Active, Blue for Completed, Yellow/Orange for Pending/On Hold
                  let dotColor = "#10b981"; // default green
                  let textColor = "#10b981";
                  let bgColor = "#ecfdf5"; // default light green
                  
                  if (p.status === "ACT") {
                    dotColor = "#10b981"; textColor = "#10b981"; bgColor = "#ecfdf5";
                  } else if (p.status === "COM") {
                    dotColor = "#3b82f6"; textColor = "#3b82f6"; bgColor = "#eff6ff";
                  } else if (p.status === "PEN" || p.status === "HOL") {
                    dotColor = "#f59e0b"; textColor = "#f59e0b"; bgColor = "#fffbeb";
                  } else if (p.status === "CAN") {
                    dotColor = "#ef4444"; textColor = "#ef4444"; bgColor = "#fef2f2";
                  }

                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0", background: "white" }}>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "#475569" }}>
                        {p.patient_id || `PAT-${String(p.id).padStart(5, '0')}`}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ color: "#0f172a", fontSize: "14px", fontWeight: "500" }}>{p.user?.full_name}</div>
                        <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>{p.user?.phone || "+91 98450 12345"}</div>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "#0f172a", fontWeight: "500" }}>
                        {p.assigned_doctor?.full_name || "-"}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "#475569" }}>
                        {TREATMENT_LABELS[p.treatment_type] || "-"}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "#475569" }}>
                        {p.registered_on ? new Date(p.registered_on).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: bgColor, color: textColor, padding: "4px 10px", borderRadius: "16px", fontSize: "12px", fontWeight: "500" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor }}></span>
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <button onClick={() => navigate(`/superadmin/patients/${p.id}/edit`)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }} title="Edit">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => navigate(`/superadmin/patients/${p.id}`)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }} title="View">
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                      No patients found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer / Pagination */}
        {!loading && filteredByDate.length > 0 && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white" }}>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              Showing {Math.min((page - 1) * PER_PAGE + 1, filteredByDate.length)} to {Math.min(page * PER_PAGE, filteredByDate.length)} of {filteredByDate.length} Patients
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", color: page === 1 ? "#cbd5e1" : "#64748b", cursor: page === 1 ? "not-allowed" : "pointer" }}
              >
                &lt;
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #3b82f6", borderRadius: "6px", background: "white", color: "#3b82f6", cursor: page === totalPages ? "not-allowed" : "pointer" }}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}