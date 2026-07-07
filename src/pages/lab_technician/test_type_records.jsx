import React, { useState, useEffect, useRef } from "react";
import { Search, Calendar, FileText, ChevronDown, CheckCircle, AlertTriangle, ArrowLeft, Info, HelpCircle, MoreVertical, Eye, Printer, Shield, Activity, Plus } from "lucide-react";
import labApi from "../../api/labApi";
import patientApi from "../../api/patientApi";
import "./records.css";

export default function TestTypeRecords({ testTypeId, onViewRecord }) {
  const [view, setView] = useState("list"); // "list" or "new_record"
  const [testType, setTestType] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // New Record Form States
  const [formPatientId, setFormPatientId] = useState(""); // selected patient's actual id (FK)
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formTime, setFormTime] = useState(new Date().toTimeString().slice(0, 5));
  const [fieldValues, setFieldValues] = useState({});
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [recordStatus, setRecordStatus] = useState("COMPLETED");
  const [saving, setSaving] = useState(false);

  // Patient search/select state
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientFieldRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [typeData, recData] = await Promise.all([
        labApi.getRecordDetails 
          ? labApi.getTestTypes().then(res => {
              const list = Array.isArray(res) ? res : (res?.test_types || []);
              return list.find(t => t.id === testTypeId);
            }).catch(() => null)
          : null,
        labApi.getRecords({ test_type: testTypeId }).catch(() => null)
      ]);

      if (typeData) {
        setTestType(typeData);
      } else {
        // Mock fallback test type details
        if (testTypeId === 1) {
          setTestType({
            id: 1,
            name: "Sugar Test",
            code: "SUGAR",
            icon: "fa-droplet",
            color: "#EF4444",
            description: "Blood glucose level monitoring for diabetes screening and prenatal care.",
            fields: [
              { id: 10, label: "Blood Sugar Level", field_key: "blood_sugar", field_type: "decimal", is_required: true, min_value: 0, max_value: 500, unit: "mg/dL" },
              { id: 11, label: "Fasting Status", field_key: "fasting", field_type: "select", is_required: true, options: ["Fasting", "Post-meal", "Random"] }
            ]
          });
        } else if (testTypeId === 2) {
          setTestType({
            id: 2,
            name: "Blood Pressure",
            code: "BP",
            icon: "fa-heart",
            color: "#F43F5E",
            description: "Cardiovascular risk and hypertension screening.",
            fields: [
              { id: 20, label: "Systolic", field_key: "systolic", field_type: "integer", is_required: true, min_value: 50, max_value: 250, unit: "mmHg" },
              { id: 21, label: "Diastolic", field_key: "diastolic", field_type: "integer", is_required: true, min_value: 30, max_value: 150, unit: "mmHg" }
            ]
          });
        } else {
          setTestType({
            id: testTypeId,
            name: "Lipid Profile",
            code: "LIPID",
            icon: "fa-flask",
            color: "#8B5CF6",
            fields: [
              { id: 30, label: "Total Cholesterol", field_key: "total_cholesterol", field_type: "decimal", is_required: true, min_value: 0, max_value: 500, unit: "mg/dL" }
            ]
          });
        }
      }

      if (recData && recData.success) {
        setRecords(recData.records || []);
      } else {
        // Fallback mock records matching Sugar Test or other types
        if (testTypeId === 1) {
          setRecords([
            { id: 1024, test_date: "2026-06-29", patient_name: "John Doe", result: "120", fasting: "YES", status: "COMPLETED" },
            { id: 1023, test_date: "2026-06-29", patient_name: "Jane S.", result: "180", fasting: "NO", status: "PENDING" },
            { id: 1022, test_date: "2026-06-28", patient_name: "Bob B.", result: "95", fasting: "YES", status: "COMPLETED" },
            { id: 1021, test_date: "2026-06-28", patient_name: "Alice L.", result: "220", fasting: "NO", status: "PENDING" }
          ]);
        } else {
          setRecords([
            { id: 1024, test_date: "2026-06-29", patient_name: "John Doe", result: "140/90", status: "COMPLETED" },
            { id: 1023, test_date: "2026-06-29", patient_name: "Jane S.", result: "120/80", status: "COMPLETED" }
          ]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setView("list");
  }, [testTypeId]);

  // Close patient dropdown when clicking outside the field
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (patientFieldRef.current && !patientFieldRef.current.contains(e.target)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced patient search
  useEffect(() => {
    if (!patientQuery || patientQuery.length < 2) {
      setPatientResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setPatientSearchLoading(true);

        const res = await patientApi.getPatientsList(
          `search=${encodeURIComponent(patientQuery)}`
        );

        const list =
          res?.patients ||
          res?.results ||
          res?.data ||
          (Array.isArray(res) ? res : []) ||
          [];

        setPatientResults(list);
      } catch (err) {
        console.error("Patient search failed", err);
        setPatientResults([]);
      } finally {
        setPatientSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientQuery]);

  const getPatientDisplayName = (p) =>
    p.name || p.user.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.patient_name || "Unknown";

  const handleSelectPatient = (patient) => {
    setFormPatientId(patient.id);
    setPatientQuery(getPatientDisplayName(patient));
    setShowPatientDropdown(false);
  };

  const handlePatientInputChange = (e) => {
    const value = e.target.value;
    setPatientQuery(value);
    setFormPatientId(""); // clear selection until a result is chosen again
    setShowPatientDropdown(true);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
  };

  const getInitials = (name) => {
    if (!name) return "JD";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const handleFieldChange = (key, val) => {
    setFieldValues(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const resetFormState = () => {
    setFormPatientId("");
    setPatientQuery("");
    setPatientResults([]);
    setClinicalNotes("");
    setFieldValues({});
    setRecordStatus("COMPLETED");
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (!formPatientId) {
      alert("Please select a patient from the list.");
      return;
    }

    try {
      setSaving(true);
      
      // Calculate string result value dynamically from fields
      let resultString = "";
      if (testTypeId === 1) {
        resultString = fieldValues.blood_sugar || "";
      } else if (testTypeId === 2) {
        resultString = `${fieldValues.systolic || ""}/${fieldValues.diastolic || ""}`;
      } else {
        resultString = Object.values(fieldValues).join(", ");
      }

      const payload = {
        patient: formPatientId,
        test_type: testTypeId,
        test_date: formDate + "T" + formTime + ":00Z",
        result: resultString,
        status: recordStatus,
        notes: clinicalNotes,
        field_values: fieldValues
      };

      await labApi.createRecord(payload);
      
      // Clear form
      resetFormState();
      
      await loadData();
      setView("list");
    } catch (err) {
      console.error(err);
      alert("Failed to submit record. Saving mockup locally for preview.");
      
      // Add mockup locally
      let resultString = "";
      if (testTypeId === 1) {
        resultString = fieldValues.blood_sugar || "120";
      } else if (testTypeId === 2) {
        resultString = `${fieldValues.systolic || "120"}/${fieldValues.diastolic || "80"}`;
      } else {
        resultString = "210";
      }

      const mockNew = {
        id: Math.floor(Math.random() * 900) + 1000,
        test_date: formDate,
        patient_name: patientQuery || "Unknown",
        result: resultString,
        fasting: fieldValues.fasting === "Fasting" ? "YES" : "NO",
        status: recordStatus
      };

      setRecords(prev => [mockNew, ...prev]);
      resetFormState();
      setView("list");
    } finally {
      setSaving(false);
    }
  };

  // Helper formatting for Table
  const getFastingDisplay = (rec) => {
    if (rec.fasting) return rec.fasting;
    if (rec.field_values?.fasting) {
      return rec.field_values.fasting === "Fasting" ? "YES" : "NO";
    }
    return "YES";
  };

  const getStatusLabel = (rec) => {
    if (rec.status === "COMPLETED") return "Normal";
    if (rec.status === "PENDING") return "High";
    return "Normal";
  };

  const getStatusBadgeColor = (rec) => {
    const label = getStatusLabel(rec);
    if (label === "Normal") {
      return { background: "#ecfdf3", color: "#12b76a" };
    }
    return { background: "#fef2f2", color: "#ef4444" };
  };

  // Count summaries
  const totalCount = records.length;
  const highCount = records.filter(r => getStatusLabel(r) === "High").length;
  const normalCount = totalCount - highCount;

  // Filter local rows
  const filteredRecords = records.filter(rec => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!rec.patient_name?.toLowerCase().includes(q)) return false;
    }
    if (startDate && rec.test_date < startDate) return false;
    if (endDate && rec.test_date > endDate) return false;
    if (statusFilter !== "all") {
      const statusLabel = getStatusLabel(rec).toLowerCase();
      if (statusFilter === "normal" && statusLabel !== "normal") return false;
      if (statusFilter === "high" && statusLabel !== "high") return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="staff-loading">
        <div className="spinner" /><span>Loading test type records...</span>
      </div>
    );
  }

  if (view === "new_record" && testType) {
    return (
      <div className="lab-records-container" style={{ textAlign: "left" }}>
        {/* Breadcrumb */}
        <div className="lab-breadcrumb">
          <button className="lab-breadcrumb-btn" onClick={() => { setView("list"); resetFormState(); }}>
            <ArrowLeft size={16} style={{ marginRight: "4px" }} />
            {testType.name}
          </button>
          <span className="lab-breadcrumb-separator">/</span>
          <span className="lab-breadcrumb-current">New Record</span>
        </div>

        {/* Title */}
        <div className="lab-records-header">
          <div>
            <h2>New {testType.name} Entry</h2>
            <p>Carefully enter the glucose monitoring data for the patient below.</p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSaveRecord} className="lab-filter-card" style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "16px" }}>
          {/* Row 1: Patient Selection, Date & Time */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "20px" }}>
            <div className="form-group-lab" style={{ position: "relative" }} ref={patientFieldRef}>
              <label>Patient Selection <span style={{ color: "#ef4444" }}>*</span></label>
              <input 
                type="text" 
                required 
                autoComplete="off"
                placeholder="Search and select patient" 
                value={patientQuery}
                onChange={handlePatientInputChange}
                onFocus={() => patientQuery.length >= 2 && setShowPatientDropdown(true)}
              />

              {showPatientDropdown && patientQuery.length >= 2 && (
                <ul
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    maxHeight: "180px",
                    overflowY: "auto",
                    zIndex: 10,
                    listStyle: "none",
                    margin: "4px 0 0",
                    padding: "4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                  }}
                >
                  {patientSearchLoading ? (
                    <li style={{ padding: "8px 10px", color: "#6b7280" }}>Searching...</li>
                  ) : patientResults.length === 0 ? (
                    <li style={{ padding: "8px 10px", color: "#6b7280" }}>No patients found.</li>
                  ) : (
                    patientResults.map((p) => (
                      <li
                        key={p.id}
                        style={{ padding: "8px 10px", cursor: "pointer", borderRadius: "6px" }}
                        onMouseDown={() => handleSelectPatient(p)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {getPatientDisplayName(p)}
                        {p.patient_id || p.code ? (
                          <span style={{ color: "#9ca3af", fontSize: "12px", marginLeft: "6px" }}>
                            ({p.patient_id || p.code})
                          </span>
                        ) : null}
                      </li>
                    ))
                  )}
                </ul>
              )}

              {!formPatientId && patientQuery.length > 0 && (
                <span style={{ fontSize: "12px", color: "#f59e0b", marginTop: "4px", display: "block" }}>
                  Please select a patient from the dropdown list.
                </span>
              )}
            </div>
            <div className="form-group-lab">
              <label>Test Date <span style={{ color: "#ef4444" }}>*</span></label>
              <input 
                type="date" 
                required 
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
              />
            </div>
            <div className="form-group-lab">
              <label>Test Time <span style={{ color: "#ef4444" }}>*</span></label>
              <input 
                type="time" 
                required 
                value={formTime}
                onChange={e => setFormTime(e.target.value)}
              />
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e2e8f0" }} />

          {/* Dynamic Configuration Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {testType.fields?.map((field) => {
              if (field.field_type === "select") {
                const options = Array.isArray(field.options) ? field.options : field.options?.split(",") || [];
                const activeVal = fieldValues[field.field_key] || options[0];
                
                // Initialize default pill option if not set
                if (!fieldValues[field.field_key] && options.length > 0) {
                  handleFieldChange(field.field_key, options[0]);
                }

                return (
                  <div className="form-group-lab" key={field.id}>
                    <label>{field.label} <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="pill-option-group">
                      {options.map((opt, oIdx) => (
                        <button
                          type="button"
                          key={oIdx}
                          className={`pill-option-btn ${activeVal === opt ? "active" : ""}`}
                          onClick={() => handleFieldChange(field.field_key, opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="form-group-lab" key={field.id}>
                    <label>{field.label} <span style={{ color: "#ef4444" }}>*</span></label>
                    <div style={{ display: "flex", width: "100%" }}>
                      <input 
                        type="number" 
                        required={field.is_required}
                        placeholder="e.g., 95"
                        value={fieldValues[field.field_key] || ""}
                        onChange={e => handleFieldChange(field.field_key, e.target.value)}
                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, flex: 1 }}
                      />
                      <span 
                        style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          padding: "0 16px", 
                          background: "#f1f5f9", 
                          border: "1px solid #cbd5e1", 
                          borderLeft: "none",
                          borderTopRightRadius: "8px", 
                          borderBottomRightRadius: "8px",
                          fontSize: "0.875rem",
                          color: "#64748b" 
                        }}
                      >
                        {field.unit || "mg/dL"}
                      </span>
                    </div>
                    <span className="help-text-small">
                      Safe clinical range: {field.min_value} - {field.max_value} {field.unit}
                    </span>
                  </div>
                );
              }
            })}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e2e8f0" }} />

          {/* Clinical Notes */}
          <div className="form-group-lab">
            <label>Clinical Notes</label>
            <textarea 
              placeholder="Enter patient observations, medication history at time of test, or lab irregularities..."
              value={clinicalNotes}
              onChange={e => setClinicalNotes(e.target.value)}
              style={{ height: "100px", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "vertical" }}
            />
          </div>

          {/* Record Status Selector */}
          <div className="form-group-lab">
            <label>Record Status <span style={{ color: "#ef4444" }}>*</span></label>
            <div style={{ display: "flex", gap: "24px", marginTop: "4px" }}>
              <label className="checkbox-lbl-lab" style={{ fontSize: "14px" }}>
                <input 
                  type="radio" 
                  name="record_status" 
                  checked={recordStatus === "COMPLETED"} 
                  onChange={() => setRecordStatus("COMPLETED")} 
                />
                Completed <span style={{ fontSize: "10px", background: "#ecfdf3", color: "#12b76a", padding: "2px 8px", borderRadius: "4px", fontWeight: "700", marginLeft: "4px" }}>FINAL</span>
              </label>
              
              <label className="checkbox-lbl-lab" style={{ fontSize: "14px" }}>
                <input 
                  type="radio" 
                  name="record_status" 
                  checked={recordStatus === "PENDING"} 
                  onChange={() => setRecordStatus("PENDING")} 
                />
                Pending Review <span style={{ fontSize: "10px", background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: "4px", fontWeight: "700", marginLeft: "4px" }}>WAIT</span>
              </label>

              <label className="checkbox-lbl-lab" style={{ fontSize: "14px" }}>
                <input 
                  type="radio" 
                  name="record_status" 
                  checked={recordStatus === "DRAFT"} 
                  onChange={() => setRecordStatus("DRAFT")} 
                />
                Draft Only <span style={{ fontSize: "10px", background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: "4px", fontWeight: "700", marginLeft: "4px" }}>SAVED</span>
              </label>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
            <button type="button" className="btn-lab-outline" onClick={() => { setView("list"); resetFormState(); }}>Cancel</button>
            <button type="submit" className="btn-lab-primary" style={{ background: "#000", borderColor: "#000" }} disabled={saving || !formPatientId}>
              {saving ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>

        {/* Compliance Warning Cards */}
        <div className="compliance-info-row">
          <div className="compliance-info-card">
            <div className="compliance-info-card-icon">
              <Shield size={18} />
            </div>
            <div className="compliance-info-card-details">
              <h4>Double Verification</h4>
              <p>All clinical records are timestamped and linked to your Lab Tech ID for audit compliance.</p>
            </div>
          </div>

          <div className="compliance-info-card">
            <div className="compliance-info-card-icon" style={{ background: "rgba(239, 68, 68, 0.08)", color: "#ef4444" }}>
              <AlertTriangle size={18} />
            </div>
            <div className="compliance-info-card-details">
              <h4>Abnormal Result Alert</h4>
              <p>Values exceeding 140 mg/dL (fasting) or 200 mg/dL (post-meal) will trigger an immediate alert.</p>
            </div>
          </div>

          <div className="compliance-info-card">
            <div className="compliance-info-card-icon" style={{ background: "rgba(68, 116, 246, 0.08)", color: "#4474f6" }}>
              <CheckCircle size={18} />
            </div>
            <div className="compliance-info-card-details">
              <h4>Auto-Sync</h4>
              <p>This entry will automatically sync with the patient's global health record and IVF timeline.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW STATE
  return (
    <div className="lab-records-container">
      {/* Header */}
      <div className="lab-records-header">
        <div>
          <h2>{testType?.name || "Sugar Test"} Records</h2>
        </div>
        <div className="header-buttons">
          <button className="btn-lab-outline" onClick={() => alert("Stats View Mode")}>
            <Activity size={16} />
            View Stats
          </button>
          <button className="btn-lab-primary" style={{ background: "#000", borderColor: "#000" }} onClick={() => setView("new_record")}>
            <Plus size={16} />
            New Record
          </button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="stats-kpi-row">
        <div className="kpi-card">
          <div className="kpi-left">
            <span className="kpi-label">TOTAL TESTS</span>
            <span className="kpi-value">{totalCount}</span>
          </div>
          <div className="kpi-icon-wrap" style={{ background: "rgba(15, 23, 42, 0.08)", color: "#0f172a" }}>
            <FileText size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-left">
            <span className="kpi-label">NORMAL</span>
            <span className="kpi-value" style={{ color: "#12b76a" }}>
              {normalCount < 10 ? `0${normalCount}` : normalCount}
            </span>
          </div>
          <div className="kpi-icon-wrap" style={{ background: "rgba(18, 183, 106, 0.08)", color: "#12b76a" }}>
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-left">
            <span className="kpi-label">HIGH</span>
            <span className="kpi-value" style={{ color: "#ef4444" }}>
              {highCount < 10 ? `0${highCount}` : highCount}
            </span>
          </div>
          <div className="kpi-icon-wrap" style={{ background: "rgba(239, 68, 68, 0.08)", color: "#ef4444" }}>
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="lab-filter-card">
        <div className="lab-filters-grid">
          <div className="lab-filter-item">
            <label>Patient Search</label>
            <div className="search-wrapper-lab" style={{ width: "220px" }}>
              <Search className="search-icon-lab" size={16} />
              <input 
                type="text" 
                placeholder="Search name or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="lab-filter-item">
            <label>Date From</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              style={{ width: "160px" }}
            />
          </div>

          <div className="lab-filter-item">
            <label>Date To</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              style={{ width: "160px" }}
            />
          </div>

          <div className="lab-filter-item">
            <label>Status</label>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: "160px" }}
            >
              <option value="all">All Status</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="lab-filter-actions">
            <button className="btn-reset-filters" onClick={handleResetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="records-table-panel">
        <table className="records-table">
          <thead>
            <tr>
              <th style={{ width: "100px", textAlign: "left" }}># ID</th>
              <th>Date</th>
              <th>Patient Name</th>
              <th>Value ({testType?.fields?.[0]?.unit || "mg/dL"})</th>
              <th>Fasting</th>
              <th>Status</th>
              <th style={{ width: "100px", textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                  No records matching your search/filters.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id}>
                  <td style={{ fontWeight: "600", color: "#6b7280" }}>#{rec.id}</td>
                  <td>{rec.test_date}</td>
                  <td>
                    <div className="patient-avatar-cell">
                      <div className="patient-avatar">{getInitials(rec.patient_name)}</div>
                      <span className="patient-name-text">{rec.patient_name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: "700" }}>{rec.result}</td>
                  <td>
                    <span 
                      style={{ 
                        background: getFastingDisplay(rec) === "YES" ? "#dbeafe" : "#f3f4f6", 
                        color: getFastingDisplay(rec) === "YES" ? "#1e40af" : "#4b5563",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "4px"
                      }}
                    >
                      {getFastingDisplay(rec)}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="status-badge-new active"
                      style={getStatusBadgeColor(rec)}
                    >
                      <span className="status-dot" style={{ background: getStatusBadgeColor(rec).color }}></span>
                      {getStatusLabel(rec)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <button 
                        className="btn-more-actions"
                        style={{ color: "#0d9488" }}
                        onClick={() => onViewRecord(rec.id)}
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination footer */}
        <div className="pagination" style={{ borderTop: "1px solid #e5e7eb" }}>
          <div className="pagination-text">
            Showing <span>1-{filteredRecords.length}</span> of <span>{records.length}</span> records
          </div>
          <div className="pagination-controls">
            <button className="page-btn" disabled>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}