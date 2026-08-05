// Create Lab Order — Receptionist Portal
import { useState, useEffect, useRef } from "react";
import { ChevronRight, FlaskConical, X, Search } from "lucide-react";
import receptionistApi from "../../api/receptionistApi";
import "./lab_orders.css";

const PRIORITY_OPTIONS = [
  { value: "ROUTINE", label: "Routine" },
  { value: "URGENT",  label: "Urgent"  },
  { value: "STAT",    label: "STAT"    },
];

export default function LabOrderCreate({ onCancel, onSuccess }) {
  // Patient search
  const [patientQuery, setPatientQuery] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearching, setPatientSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Test types
  const [tests, setTests] = useState([]);
  const [testQuery, setTestQuery] = useState("");
  const [selectedTest, setSelectedTest] = useState(null);
  const [showTestSugg, setShowTestSugg] = useState(false);

  // Form fields
  const [priority, setPriority] = useState("ROUTINE");
  const [notes, setNotes]       = useState("");

  // State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  const patientRef = useRef(null);
  const testRef    = useRef(null);

  // Fetch available tests on mount
  useEffect(() => {
    receptionistApi.getAvailableTests()
      .then(data => {
        const arr = Array.isArray(data)
          ? data
          : (data.test_types || data.results || []);
        setTests(arr);
      })
      .catch(() => {});
  }, []);

  // Patient search with debounce
  useEffect(() => {
    if (!patientQuery || patientQuery.length < 2) {
      setPatientSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      setPatientSearching(true);
      try {
        const data = await receptionistApi.searchPatients(`?search=${encodeURIComponent(patientQuery)}`);
        const arr = Array.isArray(data) ? data : (data.results || []);
        setPatientSuggestions(arr.slice(0, 8));
        setShowSuggestions(true);
      } catch {
        setPatientSuggestions([]);
      } finally {
        setPatientSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [patientQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (patientRef.current && !patientRef.current.contains(e.target)) setShowSuggestions(false);
      if (testRef.current    && !testRef.current.contains(e.target))    setShowTestSugg(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredTests = tests.filter(t =>
    testQuery === "" ||
    (t.name || "").toLowerCase().includes(testQuery.toLowerCase()) ||
    (t.code || "").toLowerCase().includes(testQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) { setError("Please select a patient."); return; }
    if (!selectedTest)    { setError("Please select a test type."); return; }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        patient_id:   selectedPatient.id,
        test_type_id: selectedTest.id,
        priority,
        notes,
      };
      const data  = await receptionistApi.createLabOrder(payload);
      const order = data.order || data;

      // Fill in any fields the create response might omit but the
      // OP ticket view relies on, using what we already know client-side.
      const orderForTicket = {
        ...order,
        patient_name: order.patient_name || selectedPatient.full_name,
        mrn:          order.mrn || selectedPatient.mrn,
        test_name:    order.test_name || order.test_type_name || selectedTest.name,
        test_code:    order.test_code || selectedTest.code,
        priority:     order.priority || priority,
        notes:        order.notes || notes,
      };

      // Redirect straight to the OP ticket instead of an inline success screen.
      onSuccess && onSuccess(orderForTicket);
    } catch (err) {
      const msg = err?.response?.data?.detail ||
                  err?.response?.data?.message ||
                  Object.values(err?.response?.data || {})?.[0]?.[0] ||
                  "Failed to create lab order. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div className="lab-page">
      {/* Breadcrumb */}
      <div className="lab-breadcrumb">
        <button onClick={onCancel}>Lab Orders</button>
        <ChevronRight size={13} />
        <span>Add New Test</span>
      </div>

      {/* Header */}
      <div className="lab-page-header">
        <div className="lab-page-header-text">
          <h2>Add New Lab Test</h2>
          <p>Create a new laboratory test order for a patient</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="lab-alert error">
          <X size={15} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Patient selection ─────────────────────── */}
        <div className="lab-form-card">
          <div className="lab-form-section-title">Patient Information</div>
          <div className="lab-form-grid">
            {/* Patient search */}
            <div className="lab-form-group full-width" ref={patientRef}>
              <label>Search Patient *</label>
              <div className="lab-search-wrap">
                {selectedPatient ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--rec-primary-light,#eef2ff)", border: "1.5px solid var(--rec-primary,#4f46e5)", borderRadius: 8, padding: "0 12px", height: 40 }}>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--rec-primary,#4f46e5)" }}>
                      {selectedPatient.full_name}
                      {selectedPatient.id ? ` — ID: ${selectedPatient.id}` : ""}
                      {selectedPatient.mrn ? ` — MRN: ${selectedPatient.mrn}` : ""}
                      {selectedPatient.phone ? ` · ${selectedPatient.phone}` : ""}
                    </span>
                    <button type="button" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => { setSelectedPatient(null); setPatientQuery(""); }}>
                      <X size={15} color="#4f46e5" />
                    </button>
                  </div>
                ) : (
                  <div className="lab-search-box" style={{ maxWidth: "100%", height: 40 }}>
                    <Search size={15} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Type patient name or MRN to search…"
                      value={patientQuery}
                      onChange={e => { setPatientQuery(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => patientSuggestions.length && setShowSuggestions(true)}
                      autoComplete="off"
                    />
                    {patientSearching && <span style={{ fontSize: 11, color: "#94a3b8" }}>…</span>}
                  </div>
                )}
                {showSuggestions && patientSuggestions.length > 0 && !selectedPatient && (
                  <div className="lab-patient-suggestions">
                    {patientSuggestions.map(p => (
                      <div key={p.id} className="lab-patient-suggestion-item"
                        onMouseDown={() => { setSelectedPatient(p); setPatientQuery(""); setShowSuggestions(false); }}>
                        <span className="sug-name">{p.full_name}</span>
                        <span className="sug-sub">
                          {p.mrn ? `MRN: ${p.mrn}` : ""}
                          {p.phone ? ` · ${p.phone}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {showSuggestions && patientQuery.length >= 2 && patientSuggestions.length === 0 && !patientSearching && !selectedPatient && (
                  <div className="lab-patient-suggestions">
                    <div className="lab-patient-suggestion-item" style={{ color: "var(--rec-text-muted)", cursor: "default" }}>
                      <span className="sug-name">No patients found</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Test & order details ──────────────────── */}
        <div className="lab-form-card">
          <div className="lab-form-section-title">Test Details</div>
          <div className="lab-form-grid">
            {/* Test type */}
            <div className="lab-form-group" ref={testRef} style={{ position: "relative" }}>
              <label>Test Type *</label>
              {selectedTest ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--rec-primary-light,#eef2ff)", border: "1.5px solid var(--rec-primary,#4f46e5)", borderRadius: 8, padding: "0 12px", height: 40 }}>
                  <FlaskConical size={14} color="#4f46e5" />
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--rec-primary,#4f46e5)" }}>
                    {selectedTest.name} {selectedTest.code ? `(${selectedTest.code})` : ""}
                  </span>
                  <button type="button" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => { setSelectedTest(null); setTestQuery(""); }}>
                    <X size={15} color="#4f46e5" />
                  </button>
                </div>
              ) : (
                <div className="lab-search-wrap">
                  <div className="lab-search-box" style={{ maxWidth: "100%", height: 40 }}>
                    <Search size={15} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Search test name or code…"
                      value={testQuery}
                      onChange={e => { setTestQuery(e.target.value); setShowTestSugg(true); }}
                      onFocus={() => setShowTestSugg(true)}
                      autoComplete="off"
                    />
                  </div>
                  {showTestSugg && filteredTests.length > 0 && (
                    <div className="lab-patient-suggestions">
                      {filteredTests.slice(0, 10).map(t => (
                        <div key={t.id} className="lab-patient-suggestion-item"
                          onMouseDown={() => { setSelectedTest(t); setTestQuery(""); setShowTestSugg(false); }}>
                          <span className="sug-name">{t.name}</span>
                          <span className="sug-sub">{t.code || ""}{t.category ? ` · ${t.category}` : ""}{t.price ? ` · ₹${t.price}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {showTestSugg && testQuery.length >= 1 && filteredTests.length === 0 && (
                    <div className="lab-patient-suggestions">
                      <div className="lab-patient-suggestion-item" style={{ cursor: "default" }}>
                        <span className="sug-name" style={{ color: "var(--rec-text-muted)" }}>No tests found</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="lab-form-group">
              <label>Priority *</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}>
                {PRIORITY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="lab-form-group full-width">
              <label>Clinical Notes</label>
              <textarea
                placeholder="Any special instructions or clinical context…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="lab-form-actions">
            <button type="submit" className="lab-btn-primary" disabled={submitting}>
              <FlaskConical size={15} />
              {submitting ? "Creating…" : "Create Lab Order"}
            </button>
            <button type="button" className="lab-btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}