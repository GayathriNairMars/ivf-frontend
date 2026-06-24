import React, { useState, useCallback, useRef } from "react";
import {
  Activity, Heart, Thermometer, Droplets, Wind, Scale,
  Search, User, AlertTriangle, CheckCircle, Clock,
  Clipboard, Pill, Save, RotateCcw, ChevronRight,
  Zap, TrendingUp, Eye
} from "lucide-react";
import { patientApi } from "../../api/patientApi";
import { nurseApi } from "../../api/nurseApi";
import "./vitals_entry.css";

/* ─── tiny debounce ─────────────────────────────────────────────── */
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

/* ─── status badge helper ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    STABLE: { bg: "#dcfce7", color: "#15803d", label: "STABLE" },
    CRITICAL: { bg: "#fee2e2", color: "#dc2626", label: "CRITICAL" },
    MONITORING: { bg: "#fef9c3", color: "#854d0e", label: "MONITORING" },
    ACTIVE: { bg: "#dbeafe", color: "#1d4ed8", label: "ACTIVE" },
  };
  const s = map[status] || map.STABLE;
  return (
    <span className="status-badge" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

/* ─── Vital Card ─────────────────────────────────────────────────── */
function VitalCard({ icon, label, unit, value, onChange, note, noteColor, inputId, isSpecial }) {
  return (
    <div className="vital-card">
      <div className="vital-card-header">
        <div className="vital-icon">{icon}</div>
        <span className="vital-unit">{unit}</span>
      </div>
      <label className="vital-label">{label}</label>
      {isSpecial ? (
        <div className="vital-bp-row">
          <input
            id={`${inputId}-sys`}
            type="number"
            className="vital-input"
            placeholder="120"
            value={value?.systolic ?? ""}
            onChange={e => onChange({ ...value, systolic: e.target.value })}
          />
          <span className="vital-bp-sep">/</span>
          <input
            id={`${inputId}-dia`}
            type="number"
            className="vital-input"
            placeholder="80"
            value={value?.diastolic ?? ""}
            onChange={e => onChange({ ...value, diastolic: e.target.value })}
          />
        </div>
      ) : (
        <input
          id={inputId}
          type="number"
          step="0.1"
          className="vital-input"
          value={value ?? ""}
          onChange={e => onChange(e.target.value)}
        />
      )}
      {note && (
        <span className="vital-note" style={{ color: noteColor || "#6b7280" }}>{note}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function VitalsEntry() {
  /* ── search state ──────────────────────────────────────────────── */
  const [query, setQuery]           = useState("");
  const [searchResults, setResults] = useState([]);
  const [searching, setSearching]   = useState(false);
  const [searchErr, setSearchErr]   = useState("");

  /* ── patient / vitals state ────────────────────────────────────── */
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [existingVital, setExistingVital]     = useState(null);  // raw API data
  const [loadingVital, setLoadingVital]       = useState(false);

  /* ── form fields ───────────────────────────────────────────────── */
  const [bp, setBp]                   = useState({ systolic: "", diastolic: "" });
  const [heartRate, setHeartRate]     = useState("");
  const [temp, setTemp]               = useState("");
  const [respRate, setRespRate]       = useState("");
  const [bloodSugar, setBloodSugar]   = useState("");
  const [weight, setWeight]           = useState("");
  const [height, setHeight]           = useState("");
  const [o2sat, setO2sat]             = useState("");
  const [painScore, setPainScore]     = useState("");
  const [notes, setNotes]             = useState("");
  const [medications, setMedications] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  /* ── pending meds list (demo) ──────────────────────────────────── */
  const [pendingMeds, setPendingMeds] = useState([
    { id: 1, name: "Folic Acid 5mg",  time: "20:00", done: true },
    { id: 2, name: "Progesterone",     time: "23:00", done: false },
    { id: 3, name: "Estradiol 2mg",    time: "23:00", done: false },
  ]);

  /* ── save state ────────────────────────────────────────────────── */
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  /* ─── search logic ─────────────────────────────────────────────── */
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    setSearchErr("");
    try {
      const data = await patientApi.getPatientsList(`search=${encodeURIComponent(q)}`);
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setResults(list);
    } catch {
      setSearchErr("Failed to search patients.");
    } finally {
      setSearching(false);
    }
  }, []);

  const debouncedSearch = useDebounce(doSearch, 400);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  /* ─── select patient ───────────────────────────────────────────── */
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setResults([]);
    setQuery(patient.full_name || patient.name || `Patient #${patient.id}`);
    resetForm();

    // Try to load existing vitals for this patient
    setLoadingVital(true);
    try {
      // Get latest vital for the patient
      const vitals = await nurseApi.getPatientVitals(patient.id);
      const list = Array.isArray(vitals) ? vitals : (vitals.results ?? []);
      if (list.length > 0) {
        const v = list[0]; // latest
        setExistingVital(v);
        populateForm(v);
      }
    } catch {
      // No existing vitals — form stays blank (new entry)
      setExistingVital(null);
    } finally {
      setLoadingVital(false);
    }
  };

  /* ─── populate form from vital API data ────────────────────────── */
  const populateForm = (v) => {
    if (v.blood_pressure) {
      const parts = v.blood_pressure.split("/");
      setBp({ systolic: parts[0] || "", diastolic: parts[1] || "" });
    }
    setHeartRate(v.heart_rate ?? "");
    setTemp(v.temperature ?? "");
    setBloodSugar(v.blood_sugar ?? "");
    setRespRate(v.respiratory_rate ?? "");
    setWeight(v.weight ?? "");
    setHeight(v.height ?? "");
    setO2sat(v.oxygen_saturation ?? "");
    setPainScore(v.pain_score ?? "");
    setNotes(v.notes ?? "");
    setMedications(v.medications_given ?? "");
    setIsEmergency(v.is_emergency ?? false);
  };

  /* ─── reset form ───────────────────────────────────────────────── */
  const resetForm = () => {
    setBp({ systolic: "", diastolic: "" });
    setHeartRate(""); setTemp(""); setRespRate(""); setBloodSugar("");
    setWeight(""); setHeight(""); setO2sat(""); setPainScore("");
    setNotes(""); setMedications(""); setIsEmergency(false);
    setExistingVital(null);
  };

  /* ─── save vitals ──────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!selectedPatient) return;
    setSaving(true);
    setSaveMsg("");

    const payload = {
      patient: selectedPatient.id,
      blood_pressure_systolic: Number(bp.systolic) || null,
      blood_pressure_diastolic: Number(bp.diastolic) || null,
      heart_rate: Number(heartRate) || null,
      respiratory_rate: Number(respRate) || null,
      temperature: parseFloat(temp) || null,
      blood_sugar: Number(bloodSugar) || null,
      weight: parseFloat(weight) || null,
      height: parseFloat(height) || null,
      oxygen_saturation: Number(o2sat) || null,
      pain_score: Number(painScore) || null,
      notes,
      medications_given: medications,
      is_emergency: isEmergency,
    };

    try {
      if (existingVital?.id) {
        await nurseApi.updateVital(existingVital.id, payload);
        setSaveMsg("Vitals updated successfully!");
      } else {
        await nurseApi.createVital(payload);
        setSaveMsg("Vitals saved successfully!");
      }
    } catch (err) {
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : "Failed to save vitals.";
      setSaveMsg("Error: " + msg);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  };

  /* ─── helpers ──────────────────────────────────────────────────── */
  const bpStr = bp.systolic && bp.diastolic ? `${bp.systolic}/${bp.diastolic}` : "—";
  const now   = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });

  /* ─── recent records (from API response or demo) ──────────────── */
  const recentRecords = existingVital
    ? [{ time: new Date(existingVital.recorded_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}),
         bp: existingVital.blood_pressure, hr: existingVital.heart_rate,
         temp: existingVital.temperature, staff: existingVital.nurse_name, ok: !existingVital.is_abnormal }]
    : [];

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ═════════════════════════════════════════════════════════════════ */
  return (
    <div className="ve-root">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="ve-page-header">
        <div className="ve-title-block">
          <h1 className="ve-title">Patient Vitals Recording</h1>
          <p className="ve-subtitle">
            <Clock size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
            Last updated: Today, {timeStr} &bull; Ward 4B
          </p>
        </div>
        <div className="ve-header-right">
          <div className="ve-date-chip">
            <span>{dateStr} {timeStr}</span>
          </div>
        </div>
      </div>

      {/* ── Active Ward Patients ──────────────────────────────────── */}
      <section className="ve-section">
        <h2 className="ve-section-title">ACTIVE WARD PATIENTS</h2>
        <div className="ve-search-row">
          <div className="ve-search-box">
            <Search size={16} className="ve-search-icon" />
            <input
              id="patient-search-input"
              type="text"
              className="ve-search-input"
              placeholder="Search patient name, ID or room number..."
              value={query}
              onChange={handleQueryChange}
            />
            {searching && <span className="ve-search-spinner" />}
          </div>
          <button className="ve-select-btn" onClick={() => doSearch(query)}>
            <User size={15} />
            Select Patient
          </button>
        </div>

        {/* Search error */}
        {searchErr && <p className="ve-search-err">{searchErr}</p>}

        {/* Dropdown results */}
        {searchResults.length > 0 && (
          <div className="ve-results-list">
            {searchResults.map(p => (
              <button
                key={p.id}
                className="ve-result-item"
                onClick={() => handleSelectPatient(p)}
              >
                <div className="ve-result-avatar">
                  <User size={18} />
                </div>
                <div className="ve-result-info">
                  <span className="ve-result-name">
                    {p.user.full_name || p.name || `Patient #${p.id}`}
                  </span>
                  <span className="ve-result-meta">
                    {p.patient_id && `ID: ${p.patient_id}`}
                    {p.room_number && ` · Room ${p.room_number}`}
                    {p.treatment_type && ` · ${p.treatment_type}`}
                  </span>
                </div>
                <ChevronRight size={16} className="ve-result-arrow" />
              </button>
            ))}
          </div>
        )}

        {/* Selected patient card */}
        {selectedPatient && (
          <div className="ve-patient-card selected">
            <div className="ve-patient-avatar">
              <User size={24} />
            </div>
            <div className="ve-patient-info">
              <div className="ve-patient-name-row">
                <span className="ve-patient-name">
                  {selectedPatient.user.full_name || selectedPatient.name || `Patient #${selectedPatient.id}`}
                </span>
                <StatusBadge status={selectedPatient.status || "STABLE"} />
              </div>
              <div className="ve-patient-meta">
                {selectedPatient.room_number && (
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={12} height={12}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
                    &nbsp;Room {selectedPatient.room_number}
                  </span>
                )}
                {selectedPatient.treatment_type && (
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={12} height={12}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                    &nbsp;{selectedPatient.treatment_type}
                  </span>
                )}
                {selectedPatient.patient_id && (
                  <span>ID: #{selectedPatient.patient_id || selectedPatient.id}</span>
                )}
              </div>
            </div>
            <div className="ve-patient-selected-badge">
              <span className="ve-dot-green" />
              CURRENTLY SELECTED
            </div>
          </div>
        )}
      </section>

      {/* ── Vitals Entry Form (only when patient is selected) ─────── */}
      {selectedPatient && (
        <>
          {loadingVital && (
            <div className="ve-loading-bar">
              <span className="ve-loading-spinner" /> Loading existing vitals…
            </div>
          )}

          <section className="ve-section">
            <div className="ve-vitals-header">
              <h2 className="ve-section-title">
                VITALS ENTRY: {(selectedPatient.user.full_name || selectedPatient.name || "PATIENT").toUpperCase()}
              </h2>
              <span className="ve-baseline-note">Baseline comparison enabled</span>
            </div>

            {/* 6-grid vital cards */}
            <div className="ve-vitals-grid">
              <VitalCard
                inputId="vital-bp"
                icon={<Activity size={18} style={{ color: "#6366f1" }} />}
                label="Blood Pressure"
                unit="mmHg"
                value={bp}
                onChange={setBp}
                note={bp.systolic ? "Within normal range" : ""}
                noteColor="#16a34a"
                isSpecial
              />
              <VitalCard
                inputId="vital-hr"
                icon={<Heart size={18} style={{ color: "#ef4444" }} />}
                label="Heart Rate"
                unit="bpm"
                value={heartRate}
                onChange={setHeartRate}
                note={heartRate ? `Prev: ${heartRate} bpm` : ""}
                noteColor="#6b7280"
              />
              <VitalCard
                inputId="vital-temp"
                icon={<Thermometer size={18} style={{ color: "#f59e0b" }} />}
                label="Temperature"
                unit="°F"
                value={temp}
                onChange={setTemp}
                note={temp ? "Afebrile" : ""}
                noteColor="#16a34a"
              />
              <VitalCard
                inputId="vital-rr"
                icon={<Wind size={18} style={{ color: "#10b981" }} />}
                label="Respiratory Rate"
                unit="br/min"
                value={respRate}
                onChange={setRespRate}
                note={respRate ? "Regular rhythm" : ""}
                noteColor="#6b7280"
              />
              <VitalCard
                inputId="vital-bs"
                icon={<Droplets size={18} style={{ color: "#3b82f6" }} />}
                label="Blood Sugar"
                unit="mg/dL"
                value={bloodSugar}
                onChange={setBloodSugar}
                note={bloodSugar ? "Post-prandial target" : ""}
                noteColor="#f59e0b"
              />
              <VitalCard
                inputId="vital-wt"
                icon={<Scale size={18} style={{ color: "#8b5cf6" }} />}
                label="Weight"
                unit="kg"
                value={weight}
                onChange={setWeight}
                note={weight ? "No change since adm." : ""}
                noteColor="#6b7280"
              />
            </div>

            {/* ── Additional fields row ─────────────────────────── */}
            <div className="ve-extra-row">
              <div className="ve-extra-field">
                <label htmlFor="vital-height">Height (cm)</label>
                <input id="vital-height" type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} placeholder="165" />
              </div>
              <div className="ve-extra-field">
                <label htmlFor="vital-o2">O₂ Saturation (%)</label>
                <input id="vital-o2" type="number" value={o2sat} onChange={e => setO2sat(e.target.value)} placeholder="98" />
              </div>
              <div className="ve-extra-field">
                <label htmlFor="vital-pain">Pain Score (0–10)</label>
                <input id="vital-pain" type="number" min="0" max="10" value={painScore} onChange={e => setPainScore(e.target.value)} placeholder="0" />
              </div>
              <div className="ve-extra-field ve-emergency-toggle">
                <label>Emergency Flag</label>
                <button
                  id="vital-emergency-btn"
                  className={`ve-emergency-btn ${isEmergency ? "active" : ""}`}
                  onClick={() => setIsEmergency(!isEmergency)}
                  type="button"
                >
                  <Zap size={14} />
                  {isEmergency ? "EMERGENCY" : "Normal"}
                </button>
              </div>
            </div>
          </section>

          {/* ── Clinical Notes + Pending Medications ─────────────── */}
          <div className="ve-bottom-grid">
            {/* Clinical notes */}
            <div className="ve-notes-card">
              <div className="ve-card-title">
                <Clipboard size={15} />
                CLINICAL NOTES
              </div>
              <textarea
                id="vital-notes"
                className="ve-notes-textarea"
                placeholder="Enter clinical observations, patient complaints, or nursing notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={6}
              />
              <div className="ve-notes-tags">
                <span className="ve-tag">Nausea</span>
                <span className="ve-tag">Stable Mood</span>
                <span className="ve-tag">Post-Op Check</span>
              </div>
            </div>

            {/* Pending medications */}
            <div className="ve-meds-card">
              <div className="ve-card-title">
                <Pill size={15} />
                PENDING MEDICATION
              </div>
              <div className="ve-meds-list">
                {pendingMeds.map(med => (
                  <div
                    key={med.id}
                    className={`ve-med-item ${med.done ? "done" : ""}`}
                    onClick={() => setPendingMeds(prev =>
                      prev.map(m => m.id === med.id ? { ...m, done: !m.done } : m)
                    )}
                  >
                    <div className={`ve-med-check ${med.done ? "checked" : ""}`}>
                      {med.done && <CheckCircle size={14} />}
                    </div>
                    <div className="ve-med-info">
                      <span className="ve-med-name">{med.name}</span>
                      <span className="ve-med-time">
                        {med.done ? `Administered ${med.time}` : `Next dose: ${med.time}`}
                      </span>
                    </div>
                    {!med.done && <span className="ve-med-emoji">🙂</span>}
                  </div>
                ))}
              </div>

              {/* Medications given field */}
              <div className="ve-meds-input-block">
                <label htmlFor="vital-meds">Medications Administered</label>
                <input
                  id="vital-meds"
                  type="text"
                  className="ve-meds-input"
                  placeholder="e.g. Folic Acid 5mg, Progesterone 200mg"
                  value={medications}
                  onChange={e => setMedications(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Recent Records ────────────────────────────────────── */}
          <section className="ve-section">
            <h2 className="ve-section-title">
              <TrendingUp size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
              RECENT RECORDS: LAST 24 HOURS
            </h2>
            {recentRecords.length > 0 ? (
              <table className="ve-records-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>BP</th>
                    <th>HR</th>
                    <th>Temp</th>
                    <th>Staff</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((r, i) => (
                    <tr key={i}>
                      <td>{r.time}</td>
                      <td>{r.bp}</td>
                      <td>{r.hr}</td>
                      <td>{r.temp}</td>
                      <td>{r.staff}</td>
                      <td><span className={`ve-status-dot ${r.ok ? "ok" : "warn"}`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="ve-no-records">
                <Eye size={28} style={{ color: "#d1d5db" }} />
                <p>No recent records found for this patient.</p>
              </div>
            )}
          </section>

          {/* ── Save / Reset Bar ──────────────────────────────────── */}
          <div className="ve-action-bar">
            {saveMsg && (
              <span className={`ve-save-msg ${saveMsg.startsWith("Error") ? "err" : "ok"}`}>
                {saveMsg}
              </span>
            )}
            <button
              id="save-vitals-btn"
              className="ve-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save Vitals Record"}
            </button>
            <button
              id="reset-form-btn"
              className="ve-reset-btn"
              onClick={resetForm}
            >
              <RotateCcw size={14} />
              Reset Form
            </button>
            <button
              id="view-history-btn"
              className="ve-history-btn"
            >
              View Full History
            </button>
          </div>
        </>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!selectedPatient && (
        <div className="ve-empty-state">
          <div className="ve-empty-icon">
            <Activity size={48} style={{ color: "#c7d2fe" }} />
          </div>
          <h3>Select a Patient to Begin</h3>
          <p>Search for a patient above to record or update their vitals.</p>
        </div>
      )}

      {/* ── Emergency Alert Floating ──────────────────────────────── */}
      {isEmergency && (
        <div className="ve-emergency-alert">
          <AlertTriangle size={16} />
          Emergency Alert Active
        </div>
      )}
    </div>
  );
}
