import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, FileText, Eye, CheckCircle, RefreshCw, X, Download } from "lucide-react";
import labApi from "../../api/labApi";
import patientApi from "../../api/patientApi";
import "./records.css";
import "../admin/lab/lab.css";

export default function AllRecords({ testTypes = [], onViewRecord }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Create record modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formPatientId, setFormPatientId] = useState(""); // stores selected patient's id
  const [formStatus, setFormStatus] = useState("COMPLETED");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Test type (with field schema) state — fetched from /test-types/ when the modal opens
  const [modalTestTypes, setModalTestTypes] = useState([]);
  const [modalTestTypesLoading, setModalTestTypesLoading] = useState(false);
  const [modalTestTypesError, setModalTestTypesError] = useState(null);
  const [formType, setFormType] = useState(""); // selected test type id
  const [selectedTestType, setSelectedTestType] = useState(null); // full object incl. fields
  const [fieldValues, setFieldValues] = useState({}); // { field_key: value }
  const [fieldErrors, setFieldErrors] = useState({}); // { field_key: error message }

  // Patient search/select state
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientFieldRef = useRef(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedType !== "all") params.test_type = selectedType;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await labApi.getRecords(params);
      if (res && res.success) {
        setRecords(res.records || []);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("Error loading records", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedType, selectedStatus, startDate, endDate]);

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

  const handleApply = () => {
    fetchRecords();
  };

  const handleReset = () => {
    setSelectedType("all");
    setSelectedStatus("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    fetchRecords();
  };

  const getInitials = (name) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getPatientDisplayName = (p) =>
    p.name || p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.patient_name || "Unknown";

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

  // ---- Test type / dynamic field handling -------------------------------

  // Fetches /test-types/ (full objects, including each field's schema) so the
  // form can be built dynamically once a test type is picked.
  const loadModalTestTypes = async () => {
    try {
      setModalTestTypesLoading(true);
      setModalTestTypesError(null);
      const res = await labApi.getTestTypes();
      const list = res?.test_types || res?.data || (Array.isArray(res) ? res : []);
      setModalTestTypes(list || []);
    } catch (err) {
      console.error("Failed to load test types", err);
      setModalTestTypesError("Couldn't load test types. Please try again.");
      setModalTestTypes([]);
    } finally {
      setModalTestTypesLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsModalOpen(true);
    loadModalTestTypes();
  };

  const defaultValueFor = (field) => {
    if (field.field_type === "boolean") {
      return field.default_value === true || field.default_value === "true";
    }
    return field.default_value ?? "";
  };

  const handleTestTypeChange = (e) => {
    const id = e.target.value;
    setFormType(id);

    const tt = modalTestTypes.find((t) => String(t.id) === String(id)) || null;
    setSelectedTestType(tt);

    const defaults = {};
    (tt?.fields || []).forEach((f) => {
      defaults[f.field_key] = defaultValueFor(f);
    });
    setFieldValues(defaults);
    setFieldErrors({});
  };

  const handleFieldChange = (key, value) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validateField = (field, rawValue) => {
    const value = rawValue ?? "";
    const isEmpty = field.field_type === "boolean" ? false : value === "" || value === null || value === undefined;

    if (field.is_required && isEmpty) {
      return `${field.label} is required.`;
    }

    if (!isEmpty && (field.field_type === "decimal" || field.field_type === "integer" || field.field_type === "number")) {
      const num = Number(value);
      if (Number.isNaN(num)) {
        return `${field.label} must be a number.`;
      }
      if (field.min_value !== null && field.min_value !== undefined && num < parseFloat(field.min_value)) {
        return `${field.label} must be at least ${field.min_value}.`;
      }
      if (field.max_value !== null && field.max_value !== undefined && num > parseFloat(field.max_value)) {
        return `${field.label} must be at most ${field.max_value}.`;
      }
    }

    if (!isEmpty && field.field_type === "text") {
      if (field.min_length && String(value).length < field.min_length) {
        return `${field.label} must be at least ${field.min_length} characters.`;
      }
      if (field.max_length && String(value).length > field.max_length) {
        return `${field.label} must be at most ${field.max_length} characters.`;
      }
    }

    return null;
  };

  const resetForm = () => {
    setFormPatientId("");
    setPatientQuery("");
    setPatientResults([]);
    setFormType("");
    setSelectedTestType(null);
    setFieldValues({});
    setFieldErrors({});
    setFormStatus("COMPLETED");
    setFormNotes("");
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();

    if (!formPatientId) {
      alert("Please select a patient from the list.");
      return;
    }
    if (!selectedTestType) {
      alert("Please choose a test type.");
      return;
    }

    const fields = selectedTestType.fields || [];
    const errors = {};
    fields.forEach((f) => {
      const err = validateField(f, fieldValues[f.field_key]);
      if (err) errors[f.field_key] = err;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);

      // Human-readable summary used for the table's "Value" column / legacy `result` field.
      const resultSummary = fields
        .map((f) => `${f.label}: ${fieldValues[f.field_key]}`)
        .join(", ");

      const payload = {
        patient: formPatientId,
        test_type: selectedTestType.id,
        result: resultSummary,
        status: formStatus,
        notes: formNotes,
        field_values: fieldValues,
      };

      await labApi.createRecord(payload);
      setIsModalOpen(false);
      resetForm();
      fetchRecords();
    } catch (err) {
      console.error("Failed to create record", err);
      alert("Failed to create record. Please check the form and try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderDynamicField = (field) => {
    const value = fieldValues[field.field_key] ?? (field.field_type === "boolean" ? false : "");
    const error = fieldErrors[field.field_key];

    if (field.field_type === "boolean") {
      return (
        <div className="form-group-lab" key={field.id}>
          <label className="checkbox-lbl-lab">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFieldChange(field.field_key, e.target.checked)}
            />
            {field.label}
            {field.is_required && <span style={{ color: "#ef4444" }}> *</span>}
          </label>
          {field.help_text && <span style={{ fontSize: "12px", color: "#6b7280", display: "block" }}>{field.help_text}</span>}
          {error && <span style={{ fontSize: "12px", color: "#ef4444", display: "block" }}>{error}</span>}
        </div>
      );
    }

    let input;
    switch (field.field_type) {
      case "select":
      case "choice":
        input = (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
          >
            <option value="">-- Select --</option>
            {(field.options_list || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
        break;
      case "textarea":
        input = (
          <textarea
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            style={{ height: "70px", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />
        );
        break;
      case "date":
        input = (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
          />
        );
        break;
      case "integer":
        input = (
          <input
            type="number"
            step="1"
            min={field.min_value ?? undefined}
            max={field.max_value ?? undefined}
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
          />
        );
        break;
      case "decimal":
      case "number":
        input = (
          <input
            type="number"
            step="0.01"
            min={field.min_value ?? undefined}
            max={field.max_value ?? undefined}
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
          />
        );
        break;
      default:
        input = (
          <input
            type="text"
            maxLength={field.max_length ?? undefined}
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
          />
        );
    }

    return (
      <div className="form-group-lab" key={field.id}>
        <label>
          {field.label}
          {field.is_required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
        {input}
        {field.help_text && <span style={{ fontSize: "12px", color: "#6b7280" }}>{field.help_text}</span>}
        {error && <span style={{ fontSize: "12px", color: "#ef4444" }}>{error}</span>}
      </div>
    );
  };

  // -------------------------------------------------------------------------

  const filteredRecords = records.filter((rec) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      rec.patient_name?.toLowerCase().includes(q) ||
      rec.test_type_name?.toLowerCase().includes(q) ||
      rec.id?.toString().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    if (status === "COMPLETED") return "active";
    if (status === "PENDING") return "inactive";
    return "inactive";
  };

  const getStatusText = (status) => {
    if (status === "COMPLETED") return "NORMAL";
    if (status === "PENDING") return "HIGH";
    return "NORMAL";
  };

  return (
    <div className="lab-records-container">
      {/* Header */}
      <div className="lab-records-header">
        <div>
          <h2>All Lab Records</h2>
          <p>Manage and audit clinical laboratory results and patient diagnostics.</p>
        </div>
        <div className="header-buttons">
          <button className="btn-lab-outline" onClick={() => alert("CSV exported successfully!")}>
            <Download size={16} />
            Export CSV
          </button>
          <button className="btn-lab-primary" onClick={openCreateModal}>
            <Plus size={16} />
            New Record
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="lab-filter-card">
        <div className="lab-filters-grid">
          <div className="lab-filter-item">
            <label>Test Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ width: "200px" }}
            >
              <option value="all">All Types</option>
              {testTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lab-filter-item">
            <label>Date Range</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: "140px" }}
              />
              <span className="date-range-connector">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: "140px" }}
              />
            </div>
          </div>

          <div className="lab-filter-item">
            <label>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ width: "160px" }}
            >
              <option value="all">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div className="lab-filter-item">
            <label>Search Query</label>
            <input
              type="text"
              placeholder="Search by Patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "200px" }}
            />
          </div>

          <div className="lab-filter-actions">
            <button className="btn-apply-filters" onClick={handleApply}>
              Apply
            </button>
            <button className="btn-reset-filters" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="records-table-panel">
        <table className="records-table">
          <thead>
            <tr>
              <th style={{ width: "80px", textAlign: "center" }}>#</th>
              <th>Date</th>
              <th>Patient Name</th>
              <th>Test Type</th>
              <th>Value</th>
              <th>Status</th>
              <th style={{ width: "100px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                  Loading records...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                  No records match your filters.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id}>
                  <td style={{ textAlign: "center", fontWeight: "600", color: "#6b7280" }}>{rec.id}</td>
                  <td>{rec.test_date ? rec.test_date.substring(5) : "—"}</td>
                  <td>
                    <div className="patient-avatar-cell">
                      <div className="patient-avatar">{getInitials(rec.patient_name)}</div>
                      <span className="patient-name-text">{rec.patient_name}</span>
                    </div>
                  </td>
                  <td>{rec.test_type_name}</td>
                  <td>{rec.result || "—"}</td>
                  <td>
                    <span
                      className={`status-badge-new ${getStatusBadge(rec.status)}`}
                      style={{
                        background: rec.status === "COMPLETED" ? "#ecfdf3" : "#fef2f2",
                        color: rec.status === "COMPLETED" ? "#12b76a" : "#ef4444"
                      }}
                    >
                      <span
                        className="status-dot"
                        style={{ background: rec.status === "COMPLETED" ? "#12b76a" : "#ef4444" }}
                      ></span>
                      {getStatusText(rec.status)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <button
                        className="btn-more-actions"
                        style={{ color: "#0d9488" }}
                        onClick={() => onViewRecord(rec.id)}
                        title="View Record"
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

        <div className="pagination" style={{ borderTop: "1px solid #e5e7eb" }}>
          <div className="pagination-text">
            Showing <span>1-{filteredRecords.length}</span> of <span>{records.length}</span> records
          </div>
          <div className="pagination-controls">
            <button className="page-btn" disabled>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* New Record Modal */}
      {isModalOpen && (
        <div className="lab-modal-overlay">
          <div className="lab-modal-content">
            <div className="lab-modal-header">
              <h3>Create Lab Record</h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Patient search/select field */}
              <div className="form-group-lab" style={{ position: "relative" }} ref={patientFieldRef}>
                <label>Patient Name</label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Search patient by name..."
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

              {/* Test type — options + field schema come from /test-types/ */}
              <div className="form-group-lab">
                <label>Test Type</label>
                <select
                  required
                  value={formType}
                  onChange={handleTestTypeChange}
                  disabled={modalTestTypesLoading}
                >
                  <option value="">
                    {modalTestTypesLoading ? "Loading test types..." : "-- Select Test Type --"}
                  </option>
                  {modalTestTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {modalTestTypesError && (
                  <span style={{ fontSize: "12px", color: "#ef4444", display: "block", marginTop: "4px" }}>
                    {modalTestTypesError}{" "}
                    <button
                      type="button"
                      onClick={loadModalTestTypes}
                      style={{ color: "#0d9488", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Retry
                    </button>
                  </span>
                )}
              </div>

              {/* Dynamic fields for the selected test type */}
              {selectedTestType &&
                [...(selectedTestType.fields || [])]
                  .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                  .map((field) => renderDynamicField(field))}

              {selectedTestType && (selectedTestType.fields || []).length === 0 && (
                <p style={{ fontSize: "13px", color: "#6b7280" }}>
                  This test type has no configured fields yet.
                </p>
              )}

              <div className="form-group-lab">
                <label>Processing Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              <div className="form-group-lab">
                <label>Clinical Notes</label>
                <textarea
                  placeholder="Write clinical comments..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{ height: "80px", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn-lab-outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-lab-primary"
                  disabled={saving || !formPatientId || !selectedTestType}
                >
                  {saving ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}