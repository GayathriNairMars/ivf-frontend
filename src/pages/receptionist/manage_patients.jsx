import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import patientApi from "../../api/patientApi";
import { STATUS_COLORS, TREATMENT_LABELS, PATIENT_STATUSES, TREATMENT_TYPES } from "../../constants/constants";
import { Search, Edit, Eye, Filter, Trash2 } from "lucide-react";
import PatientEditModal from "./patient_edit";
import PatientView from "./patient_view";
import "../admin/patients/patient.css";
import "../admin/staff/staff.css";

export default function ManagePatients({ onAddPatient }) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [viewingPatient, setViewingPatient] = useState(null);

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

  if (viewingPatient) {
    return (
      <PatientView 
        patient={viewingPatient} 
        onBack={() => setViewingPatient(null)} 
        onEditDetails={() => setEditingPatient(viewingPatient)}
      />
    );
  }

  return (
    <div className="manage-patient-container" style={{ padding: "28px", background: "var(--rec-bg, #f8fafc)", minHeight: "100%" }}>

      {/* Page Header */}
      <div className="rec-page-header">
        <div className="rec-page-header-text">
          <h2>Patient Directory</h2>
          <p>Search, manage, and register patient medical records and treatment profiles.</p>
        </div>
        <button className="btn-primary" onClick={onAddPatient}>
          <span>+</span> Register New Patient
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="rec-stat-card">
          <div className="rec-stat-icon-box indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="rec-stat-info">
            <span className="rec-stat-value">{stats?.total || 0}</span>
            <span className="rec-stat-label">Total Registered Patients</span>
          </div>
        </div>

        <div className="rec-stat-card">
          <div className="rec-stat-icon-box emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div className="rec-stat-info">
            <span className="rec-stat-value" style={{ color: "#059669" }}>{stats?.by_status?.ACT || 0}</span>
            <span className="rec-stat-label">Active Treatments</span>
          </div>
        </div>

        <div className="rec-stat-card">
          <div className="rec-stat-icon-box amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="rec-stat-info">
            <span className="rec-stat-value" style={{ color: "#d97706" }}>{stats?.by_status?.PEN || 0}</span>
            <span className="rec-stat-label">Pending Consultations</span>
          </div>
        </div>

        <div className="rec-stat-card">
          <div className="rec-stat-icon-box blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="rec-stat-info">
            <span className="rec-stat-value" style={{ color: "#2563eb" }}>{stats?.by_status?.COM || 0}</span>
            <span className="rec-stat-label">Completed Cycles</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="rec-toolbar">
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--rec-text-muted)" }} />
          <input
            type="text"
            className="rec-toolbar-input"
            placeholder="Search patient by name, MRN, phone, diagnosis..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: "100%", paddingLeft: "38px" }}
          />
        </div>

        <select
          className="rec-toolbar-select"
          value={treatment}
          onChange={(e) => { setTreatment(e.target.value); setPage(1); }}
        >
          <option value="">Treatment Type (All)</option>
          {TREATMENT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          className="rec-toolbar-select"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">Status (All)</option>
          {PATIENT_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <input
          type="date"
          className="rec-toolbar-input"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          style={{ color: dateFilter ? "var(--rec-text-main)" : "var(--rec-text-muted)" }}
        />

        {(search || treatment || status || dateFilter) && (
          <button
            onClick={() => { setSearch(""); setTreatment(""); setStatus(""); setDateFilter(""); setPage(1); }}
            className="btn-secondary"
            style={{ padding: "8px 14px", fontSize: "12.5px" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Panel */}
      <div className="rec-table-card">
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--rec-text-muted)" }}>Loading patients...</div>
        ) : (
          <div className="rec-table-wrap">
            <table className="rec-table">
              <thead>
                <tr>
                  <th>Patient ID / MRN</th>
                  <th>Patient Name</th>
                  <th>Assigned Doctor</th>
                  <th>Treatment Type</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? paginated.map((p) => {
                  const sc = STATUS_COLORS[p.status] || STATUS_COLORS.PEN;

                  let statusClass = "waiting";
                  if (p.status === "ACT") statusClass = "completed";
                  else if (p.status === "COM") statusClass = "consulting";
                  else if (p.status === "PEN" || p.status === "HOL") statusClass = "waiting";
                  else if (p.status === "CAN") statusClass = "cancelled";

                  return (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: "var(--rec-primary)" }}>
                          {p.patient_id || `PAT-${String(p.id).padStart(5, '0')}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ color: "var(--rec-text-main)", fontSize: "14px", fontWeight: 600 }}>{p.user?.full_name}</div>
                        <div style={{ color: "var(--rec-text-muted)", fontSize: "11.5px", marginTop: "2px" }}>{p.user?.phone || "+91 98450 12345"}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--rec-text-main)" }}>
                          {p.assigned_doctor?.full_name ? `Dr. ${p.assigned_doctor.full_name}` : "Unassigned"}
                        </div>
                      </td>
                      <td style={{ color: "var(--rec-text-sub)" }}>
                        {TREATMENT_LABELS[p.treatment_type] || "General Consultation"}
                      </td>
                      <td style={{ color: "var(--rec-text-sub)" }}>
                        {p.registered_on ? new Date(p.registered_on).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                      </td>
                      <td>
                        <span className={`status-pill ${statusClass}`}>
                          <span className="status-pill-dot"></span>
                          {sc.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button 
                            className="rec-action-btn"
                            onClick={() => setViewingPatient(p)} 
                            title="View Patient Record"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="rec-action-btn"
                            onClick={() => setEditingPatient(p)} 
                            title="Edit Patient Details"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="rec-action-btn delete"
                            onClick={() => alert("Delete patient feature will be configured by administrator")} 
                            title="Delete Patient"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" style={{ padding: "60px", textAlign: "center", color: "var(--rec-text-muted)" }}>
                      No patients found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer / Pagination */}
        {!loading && filteredByDate.length > 0 && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--rec-border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff" }}>
            <div style={{ fontSize: "13px", color: "var(--rec-text-muted)" }}>
              Showing <strong>{Math.min((page - 1) * PER_PAGE + 1, filteredByDate.length)}</strong> to <strong>{Math.min(page * PER_PAGE, filteredByDate.length)}</strong> of <strong>{filteredByDate.length}</strong> Patients
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className="rec-action-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? "not-allowed" : "pointer" }}
              >
                &lt;
              </button>
              <button
                className="rec-action-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? "not-allowed" : "pointer" }}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
      {editingPatient && (
        <PatientEditModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSaved={() => {
            setEditingPatient(null);
            fetchPatients();
          }}
        />
      )}
    </div>
  );
}