import React, { useState, useEffect } from "react";
import { ArrowLeft, Edit, Printer, Trash2, User, Clock, ShieldCheck, Check, AlertCircle, FileText, CheckCircle, X } from "lucide-react";
import labApi from "../../api/labApi";
import "./records.css";
import doctorAvatar from "../../assets/doctor_avatar.png";

export default function RecordDetail({ recordId, onBack }) {
  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFieldValues, setEditFieldValues] = useState({});
  const [editStatus, setEditStatus] = useState("COMPLETED");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadRecordDetails() {
      try {
        setLoading(true);
        const data = await labApi.getRecordDetails(recordId);
        if (data && data.success) {
          setRecord(data.record);
          setEditFieldValues(data.record.field_values || {});
          setEditStatus(data.record.status || "COMPLETED");
          setEditNotes(data.record.notes || "");
          
          // Load patient history
          if (data.record.patient) {
            const histData = await labApi.getPatientHistory(data.record.patient);
            if (histData && histData.success) {
              setHistory(histData.records || []);
            }
          }
        } else {
          // Fallback mock details matching mockup
          const mockRec = {
            id: recordId || 1024,
            test_date: "2026-06-29T14:30:00Z",
            patient: 3,
            patient_name: "John Doe",
            patient_email: "john.doe@email.com",
            patient_phone: "+1 234 567 8900",
            patient_pid: "PID-9928-JD",
            test_type_name: "Sugar Test",
            display_fields: [
              { field_id: 1, label: "Blood Sugar Level", field_key: "blood_sugar", field_type: "decimal", value: "120", formatted_value: "120" }
            ],
            status: "COMPLETED",
            created_by_name: "Lab Tech",
            notes: "Patient's sugar level is within normal range. Continue current medication. No immediate clinical intervention required at this stage."
          };
          setRecord(mockRec);
          setEditFieldValues({ blood_sugar: "120" });
          setEditStatus(mockRec.status);
          setEditNotes(mockRec.notes);
          
          // Fallback mock history
          setHistory([
            { id: 1024, test_date: "2026-06-29", result: "120", status: "COMPLETED" },
            { id: 982, test_date: "2026-06-20", result: "125", status: "COMPLETED" },
            { id: 910, test_date: "2026-06-13", result: "145", status: "PENDING" }
          ]);
        }
      } catch (error) {
        console.error("Error loading record details", error);
        // Fallback mock details matching mockup
        const mockRec = {
          id: recordId || 1024,
          test_date: "2026-06-29T14:30:00Z",
          patient: 3,
          patient_name: "John Doe",
          patient_email: "john.doe@email.com",
          patient_phone: "+1 234 567 8900",
          patient_pid: "PID-9928-JD",
          test_type_name: "Sugar Test",
          display_fields: [
            { field_id: 1, label: "Blood Sugar Level", field_key: "blood_sugar", field_type: "decimal", value: "120", formatted_value: "120" }
          ],
          status: "COMPLETED",
          created_by_name: "Lab Tech",
          notes: "Patient's sugar level is within normal range. Continue current medication. No immediate clinical intervention required at this stage."
        };
        setRecord(mockRec);
        setEditFieldValues({ blood_sugar: "120" });
        setEditStatus(mockRec.status);
        setEditNotes(mockRec.notes);
        
        setHistory([
          { id: 1024, test_date: "2026-06-29", result: "120", status: "COMPLETED" },
          { id: 982, test_date: "2026-06-20", result: "125", status: "COMPLETED" },
          { id: 910, test_date: "2026-06-13", result: "145", status: "PENDING" }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadRecordDetails();
  }, [recordId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this lab record?")) return;
    try {
      await labApi.deleteRecord(recordId);
      onBack();
    } catch (err) {
      console.error(err);
      alert("Failed to delete record. Redirecting to records list.");
      onBack();
    }
  };

  const handleEditFieldChange = (key, value) => {
    setEditFieldValues(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        field_values: editFieldValues,
        status: editStatus,
        notes: editNotes
      };
      await labApi.updateRecord(recordId, payload);
      setRecord(prev => ({
        ...prev,
        field_values: editFieldValues,
        display_fields: (prev.display_fields || []).map(f => ({
          ...f,
          value: editFieldValues[f.field_key] ?? f.value,
          formatted_value: editFieldValues[f.field_key] ?? f.formatted_value
        })),
        status: editStatus,
        notes: editNotes
      }));
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save changes. Updating locally for preview.");
      setRecord(prev => ({
        ...prev,
        field_values: editFieldValues,
        display_fields: (prev.display_fields || []).map(f => ({
          ...f,
          value: editFieldValues[f.field_key] ?? f.value,
          formatted_value: editFieldValues[f.field_key] ?? f.formatted_value
        })),
        status: editStatus,
        notes: editNotes
      }));
      setIsEditOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "June 29, 2026 14:30";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      }) + " " + date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch {
      return "June 29, 2026 14:30";
    }
  };

  // Builds a short "Label: value, Label: value" summary from display_fields,
  // used wherever a single-string result is needed (history rows, print, etc.)
  const summarizeFields = (fields) =>
    (fields || []).map(f => `${f.label}: ${f.formatted_value ?? f.value}`).join(", ");

  if (loading) {
    return (
      <div className="staff-loading">
        <div className="spinner" /><span>Loading record details...</span>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Record Not Found</h2>
        <button className="btn-lab-primary" onClick={onBack} style={{ marginTop: "16px" }}>
          Go Back
        </button>
      </div>
    );
  }

  const displayFields = record.display_fields || [];

  return (
    <div className="record-detail-layout">
      {/* Breadcrumbs & Header Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="lab-breadcrumb">
          <button className="lab-breadcrumb-btn" onClick={onBack}>
            <ArrowLeft size={16} style={{ marginRight: "4px" }} />
            Lab
          </button>
          <span className="lab-breadcrumb-separator">&gt;</span>
          <span className="lab-breadcrumb-btn" onClick={onBack}>{record.test_type_name}</span>
          <span className="lab-breadcrumb-separator">&gt;</span>
          <span className="lab-breadcrumb-current">Record #{record.id}</span>
        </div>

        <div className="detail-actions-row">
          <button className="btn-lab-outline" onClick={() => setIsEditOpen(true)}>
            <Edit size={16} />
            Edit Record
          </button>
          <button className="btn-lab-outline" onClick={handlePrint}>
            <Printer size={16} />
            Print
          </button>
          <button className="btn-detail-delete" onClick={handleDelete}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Title block */}
      <div className="lab-records-header" style={{ borderBottom: "none" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", color: "#111827", fontWeight: "700" }}>{record.test_type_name} Record #{record.id}</h2>
          <p style={{ color: "#6b7280" }}>Comprehensive laboratory report for {record.test_type_name?.toLowerCase() || "this test"}.</p>
        </div>
      </div>

      {/* Main columns */}
      <div className="detail-columns-grid">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Patient Info Card */}
          <div className="detail-panel-card">
            <h3>
              <User size={16} />
              Patient Information
            </h3>
            <div className="patient-info-widget">
              <img src={doctorAvatar} alt="Patient" className="patient-large-avatar" />
              <div className="patient-details-grid">
                <div className="patient-info-item">
                  <span className="info-lbl">Full Name</span>
                  <span className="info-val">{record.patient_name || "—"}</span>
                </div>
                <div className="patient-info-item">
                  <span className="info-lbl">Email Address</span>
                  <span className="info-val">{record.patient_email || "—"}</span>
                </div>
                <div className="patient-info-item">
                  <span className="info-lbl">Phone Number</span>
                  <span className="info-val">{record.patient_phone || "—"}</span>
                </div>
                <div className="patient-info-item">
                  <span className="info-lbl">Patient ID</span>
                  <span className="info-val">{record.patient_pid || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Details Card */}
          <div className="detail-panel-card">
            <h3>
              <FileText size={16} />
              Test Details
            </h3>
            <div className="patient-details-grid" style={{ marginBottom: "20px" }}>
              <div className="patient-info-item">
                <span className="info-lbl">Test Type</span>
                <span className="info-val">{record.test_type_name}</span>
              </div>
              <div className="patient-info-item">
                <span className="info-lbl">Date & Time</span>
                <span className="info-val">{formatDate(record.test_date)}</span>
              </div>
              <div className="patient-info-item">
                <span className="info-lbl">Processing Status</span>
                <span className="info-val">
                  <span className="status-badge-new active" style={{ display: "inline-flex", marginTop: "4px" }}>
                    <span className="status-dot"></span>
                    {record.status}
                  </span>
                </span>
              </div>
              <div className="patient-info-item">
                <span className="info-lbl">Created By</span>
                <span className="info-val" style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                  👤 {record.created_by_name || "Lab Tech"}
                </span>
              </div>
            </div>

            {/* Dynamic value boxes — one per field configured on this test type */}
            {displayFields.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#6b7280" }}>No result values recorded for this test.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {displayFields.map((field) => (
                  <div className="value-display-box" key={field.field_id}>
                    <div className="val-left-wrap">
                      <span className="val-title-lbl">{field.label}</span>
                      <span className="val-large-text">{field.formatted_value ?? field.value ?? "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Clinical Notes Card */}
          <div className="detail-panel-card">
            <h3>Clinical Notes</h3>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "16px", borderRadius: "8px", color: "#1e3a8a", fontSize: "0.875rem", lineHeight: "1.5", fontStyle: "italic", marginBottom: "12px" }}>
              "{record.notes || "No notes available for this record."}"
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={12} />
              Last updated: 14 mins ago
            </div>
          </div>

          {/* Previous Results Card */}
          <div className="detail-panel-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #f3f4f6", paddingBottom: "12px" }}>
              <h3 style={{ borderBottom: "none", margin: 0, paddingBottom: 0 }}>Previous Results</h3>
              <span className="view-all-link" style={{ fontSize: "12px" }}>View All</span>
            </div>
            <table className="lab-activity-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px" }}>Date</th>
                  <th style={{ padding: "8px" }}>Value</th>
                  <th style={{ padding: "8px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((hist, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "10px 8px" }}>{hist.test_date}</td>
                    <td style={{ padding: "10px 8px", fontWeight: "600" }}>
                      {hist.result || summarizeFields(hist.display_fields) || "—"}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span className={`status-badge-new ${hist.status === "COMPLETED" ? "active" : "inactive"}`} style={{ padding: "2px 8px", fontSize: "10px" }}>
                        {hist.status === "COMPLETED" ? "NORMAL" : "HIGH"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Real-time Lab Feed Card */}
          <div className="live-feed-card">
            <span className="live-badge">Live</span>
            <span className="live-text">Real-time Lab Feed</span>
            <span style={{ fontSize: "11px", opacity: 0.8 }}>Molecular Analysis Active</span>
          </div>
        </div>
      </div>

      {/* Edit Record Modal */}
      {isEditOpen && (
        <div className="lab-modal-overlay">
          <div className="lab-modal-content">
            <div className="lab-modal-header">
              <h3>Edit Lab Record</h3>
              <button type="button" style={{ background: "none", border: "none" }} onClick={() => setIsEditOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateRecord} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* One input per field configured on this test type */}
              {displayFields.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#6b7280" }}>No configured fields to edit for this test.</p>
              ) : (
                displayFields.map((field) => (
                  <div className="form-group-lab" key={field.field_id}>
                    <label>{field.label}</label>
                    <input
                      type={field.field_type === "decimal" || field.field_type === "integer" ? "number" : "text"}
                      step={field.field_type === "decimal" ? "0.01" : undefined}
                      required
                      value={editFieldValues[field.field_key] ?? ""}
                      onChange={e => handleEditFieldChange(field.field_key, e.target.value)}
                    />
                  </div>
                ))
              )}

              <div className="form-group-lab">
                <label>Processing Status</label>
                <select 
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              <div className="form-group-lab">
                <label>Clinical Notes</label>
                <textarea 
                  required
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  style={{ height: "100px", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" className="btn-lab-outline" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn-lab-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}