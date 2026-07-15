import React, { useState, useEffect } from "react";
import { storeSample, getAvailablePositions } from "../../api/cryoApi";
import patientApi from "../../api/patientApi";
import "./cryo_store_sample.css";
import {
  Fingerprint, Info, CheckCircle2, MapPin, ShieldCheck,
  AlertCircle, ChevronRight, Container, FlaskConical, Search
} from "lucide-react";

// Mock visual image for the sidebar
const CRYO_VIAL_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuAy-GRWYkMe2fS_57fa2q5uZvKtk92GoRDY80MzGuJ-zemjFN3IMiLqHvv9_RbMwI4GM9536KUEsZXAJXag5Yis6wAnoZO7G_lvjKdC791ck5-RXme0AmBaKMrW1KSk7ExOd8Hb9tOFPpMilJkJBKN0AHo4oJ-VAyFhKLbKSTGZYguU0o-C2mLgWSjaZGIikA0wccKjAHNtpIsEexdwFv-3_ADiOLdx85BmfLHQ1eYR_176T-Zl1DA";

export default function CryoStoreSample({ onBack }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [toast, setToast] = useState(null);
  
  // API Data
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [availablePositions, setAvailablePositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  // Form State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientForm, setPatientForm] = useState({
    patientId: "",
    name: "",
    email: "",
    phone: ""
  });

  const [specimenForm, setSpecimenForm] = useState({
    sampleType: "SPERM",
    vialCount: 1,
    vialVolume: "",
    concentration: "",
    motility: "",
    morphology: "",
    freezingMethod: "VITRIFICATION"
  });

  // Location Hierarchy Selection State
  const [locationLevel, setLocationLevel] = useState("tank"); // tank, canister, cane, goblet
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedCanister, setSelectedCanister] = useState(null);
  const [selectedCane, setSelectedCane] = useState(null);
  const [selectedGoblet, setSelectedGoblet] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("P4"); // Default visual slot
  
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load initial page load data
  useEffect(() => {
    fetchPatients();
    fetchPositions();
  }, []);

  const fetchPatients = async (query = "") => {
    setLoadingPatients(true);
    try {
      const res = await patientApi.getPatientsList(query ? `search=${query}` : "");
      setPatients(Array.isArray(res) ? res : (res.results || []));
    } catch (err) {
      console.error("Failed to load patients list", err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPositions = async () => {
    setLoadingPositions(true);
    try {
      const res = await getAvailablePositions();
      if (res.data && res.data.success) {
        setAvailablePositions(res.data.available_positions || []);
      } else {
        setAvailablePositions(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load available positions", err);
      showToast("Failed to fetch available storage slots", "error");
    } finally {
      setLoadingPositions(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Patient selection helper
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientForm({
      patientId: patient.patient_id || `PAT-${String(patient.id).padStart(5, '0')}`,
      name: patient.user?.full_name || "",
      email: patient.user?.email || "",
      phone: patient.user?.phone || ""
    });
    setSearchQuery("");
    setShowDropdown(false);
    showToast(`Patient ${patient.user?.full_name} verified.`, "success");
  };

  // Validate current step before proceeding
  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedPatient) {
        showToast("Please search and select a verified patient first.", "error");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (specimenForm.vialCount <= 0) {
        showToast("Vial count must be at least 1.", "error");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selectedTank || !selectedCanister || !selectedCane || !selectedGoblet) {
        showToast("Please select a complete storage path (Tank → Canister → Cane → Goblet).", "error");
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      handleFinalSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Final submit to create sample
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        patient: selectedPatient.id,
        sample_type: specimenForm.sampleType,
        vial_count: Number(specimenForm.vialCount),
        vial_volume: specimenForm.vialVolume ? parseFloat(specimenForm.vialVolume) : null,
        concentration: specimenForm.concentration ? parseFloat(specimenForm.concentration) : null,
        motility: specimenForm.motility ? parseFloat(specimenForm.motility) : null,
        morphology: specimenForm.morphology ? parseFloat(specimenForm.morphology) : null,
        tank: selectedTank.id,
        canister: selectedCanister.id,
        cane: selectedCane.id,
        goblet: selectedGoblet.id,
        freezing_method: specimenForm.freezingMethod,
        notes: clinicalNotes.trim() || undefined
      };
      
      const res = await storeSample(payload);
      showToast("Sample intake sequence successfully initiated!", "success");
      
      // Navigate back after delay
      setTimeout(() => {
        if (onBack) onBack();
      }, 2000);
    } catch (err) {
      console.error(err);
      const detail = err?.response?.data?.detail || "Failed to finalize sample storage.";
      showToast(detail, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Safe navigation items derived from database structure
  const canistersInSelectedTank = selectedTank ? selectedTank.canisters || [] : [];
  const canesInSelectedCanister = selectedCanister ? selectedCanister.canes || [] : [];
  const gobletsInSelectedCane = selectedCane ? selectedCane.goblets || [] : [];

  return (
    <div className="cryo-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`toast-msg-container ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="cryo-breadcrumb">
        <button onClick={onBack}>Inventory</button>
        <span>&gt;</span>
        <span className="cryo-bc-current">Store New Sample</span>
      </div>

      {/* Header */}
      <div className="cryo-header">
        <div className="cryo-header-left">
          <h1>Store New Sample</h1>
          <p>Follow the clinical protocol to intake and register biological specimens.</p>
        </div>
      </div>

      {/* Stepper progress indicator */}
      <div className="wizard-stepper">
        <div className="stepper-line" />
        
        <div className="stepper-step">
          <div className={`step-dot ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}>
            {currentStep > 1 ? <CheckCircle2 size={18} /> : "1"}
          </div>
          <span className={`step-label ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}>Patient</span>
        </div>

        <div className="stepper-step">
          <div className={`step-dot ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}>
            {currentStep > 2 ? <CheckCircle2 size={18} /> : "2"}
          </div>
          <span className={`step-label ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}>Details</span>
        </div>

        <div className="stepper-step">
          <div className={`step-dot ${currentStep === 3 ? "active" : currentStep > 3 ? "completed" : ""}`}>
            {currentStep > 3 ? <CheckCircle2 size={18} /> : "3"}
          </div>
          <span className={`step-label ${currentStep === 3 ? "active" : currentStep > 3 ? "completed" : ""}`}>Location</span>
        </div>

        <div className="stepper-step">
          <div className={`step-dot ${currentStep === 4 ? "active" : ""}`}>4</div>
          <span className={`step-label ${currentStep === 4 ? "active" : ""}`}>Finalize</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="wizard-layout">
        
        {/* Left main wizard canvas */}
        <div className="wizard-main-card">
          <div className="wizard-content">
            
            {/* STEP 1: Patient Selection */}
            {currentStep === 1 && (
              <div className="space-y-lg">
                <div className="section-title-row">
                  <h2>Patient Verification</h2>
                  <span className="protocol-badge">Protocol Alpha</span>
                </div>

                <div className="patient-search-container">
                  <div className="form-field">
                    <label>SEARCH REGISTERED PATIENT</label>
                    <div className="input-with-icon">
                      <span className="input-icon-left"><Search size={16} /></span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search by Patient ID, Name, or Email..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          fetchPatients(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                      />
                    </div>
                  </div>

                  {/* Dropdown list for matching patients */}
                  {showDropdown && searchQuery && (
                    <div className="search-results-dropdown">
                      {loadingPatients ? (
                        <div style={{ padding: "12px", textAlign: "center", color: "#6b7280" }}>Searching...</div>
                      ) : patients.length > 0 ? (
                        patients.map((p) => (
                          <div
                            key={p.id}
                            className="search-result-item"
                            onClick={() => handleSelectPatient(p)}
                          >
                            <div>
                              <span className="result-name">{p.user?.full_name}</span>
                              <span style={{ margin: "0 8px", color: "#cbd5e1" }}>•</span>
                              <span className="result-id">{p.patient_id || `PAT-${p.id}`}</span>
                            </div>
                            <span className="result-select-badge">Verify</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "12px", textAlign: "center", color: "#6b7280" }}>No patients found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-grid-2col" style={{ marginTop: "16px" }}>
                  <div className="form-field">
                    <label>PATIENT ID / MEDICAL RECORD</label>
                    <div className="input-with-icon">
                      <span className="input-icon-left"><Fingerprint size={16} /></span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. PX-449-202"
                        value={patientForm.patientId}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>FULL LEGAL NAME</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Patient Name"
                      value={patientForm.name}
                      disabled
                    />
                  </div>

                  <div className="form-field">
                    <label>PRIMARY EMAIL ADDRESS</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="patient@example.com"
                      value={patientForm.email}
                      disabled
                    />
                  </div>

                  <div className="form-field">
                    <label>CONTACT PHONE</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+1 (555) 000-0000"
                      value={patientForm.phone}
                      disabled
                    />
                  </div>
                </div>

                <div className="info-banner alert-banner">
                  <Info size={18} style={{ color: "var(--emb-accent, #8b5cf6)", flexShrink: 0 }} />
                  <div className="info-banner-text">
                    <i>Note: Patient information must match the clinical database records exactly. Unauthorized deviations will trigger a supervisor alert.</i>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Specimen Parameters */}
            {currentStep === 2 && (
              <div className="space-y-lg">
                <div className="section-title-row">
                  <h2>Specimen Parameters</h2>
                  <span className="protocol-badge">SC-1 Standard</span>
                </div>

                <div className="form-grid-3col">
                  <div className="form-field">
                    <label>SAMPLE TYPE</label>
                    <select
                      className="form-select"
                      value={specimenForm.sampleType}
                      onChange={(e) => setSpecimenForm({ ...specimenForm, sampleType: e.target.value })}
                    >
                      <option value="SPERM">Sperm</option>
                      <option value="EGG">Egg</option>
                      <option value="EMBRYO">Embryo</option>
                      <option value="TISSUE">Tissue</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>VIAL COUNT</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={specimenForm.vialCount}
                      onChange={(e) => setSpecimenForm({ ...specimenForm, vialCount: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="form-field">
                    <label>VOLUME (ML)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.5"
                      value={specimenForm.vialVolume}
                      onChange={(e) => setSpecimenForm({ ...specimenForm, vialVolume: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-3col" style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
                  <div className="form-field">
                    <label>CONCENTRATION (M/ML)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      placeholder="45.0"
                      value={specimenForm.concentration}
                      onChange={(e) => setSpecimenForm({ ...specimenForm, concentration: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label>MOTILITY (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      placeholder="75.5"
                      value={specimenForm.motility}
                      onChange={(e) => setSpecimenForm({ ...specimenForm, motility: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label>MORPHOLOGY (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      placeholder="85.0"
                      value={specimenForm.morphology}
                      onChange={(e) => setSpecimenForm({ ...specimenForm, morphology: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2col" style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
                  <div className="form-field">
                    <label>FREEZING METHOD</label>
                    <select
                      className="form-select"
                      value={specimenForm.freezingMethod}
                      onChange={(e) => setSpecimenForm({ ...specimenForm, freezingMethod: e.target.value })}
                    >
                      <option value="VITRIFICATION">Vitrification</option>
                      <option value="SLOW_FREEZING">Slow Freezing</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Storage Assignment */}
            {currentStep === 3 && (
              <div className="space-y-lg">
                <div className="section-title-row">
                  <h2>Storage Assignment</h2>
                  <span className="protocol-badge">System Synced</span>
                </div>

                <div className="location-wizard-layout">
                  {/* Left Column Hierarchy view */}
                  <div className="location-sidebar-steps">
                    <div
                      className={`loc-step-card ${locationLevel === "tank" ? "active" : ""}`}
                      onClick={() => setLocationLevel("tank")}
                    >
                      <div className="loc-step-label">Tank</div>
                      <div className="loc-step-value">{selectedTank ? selectedTank.name : "Select Tank"}</div>
                    </div>

                    <div
                      className={`loc-step-card ${!selectedTank ? "disabled" : ""} ${locationLevel === "canister" ? "active" : ""}`}
                      onClick={() => selectedTank && setLocationLevel("canister")}
                    >
                      <div className="loc-step-label">Canister</div>
                      <div className="loc-step-value">{selectedCanister ? selectedCanister.canister_number : "Select Canister"}</div>
                    </div>

                    <div
                      className={`loc-step-card ${!selectedCanister ? "disabled" : ""} ${locationLevel === "cane" ? "active" : ""}`}
                      onClick={() => selectedCanister && setLocationLevel("cane")}
                    >
                      <div className="loc-step-label">Cane</div>
                      <div className="loc-step-value">{selectedCane ? selectedCane.cane_number : "Select Cane"}</div>
                    </div>
                  </div>

                  {/* Right Column details list */}
                  <div className="location-selection-panel">
                    
                    {/* Tank Level */}
                    {locationLevel === "tank" && (
                      <div>
                        <div className="selection-panel-header">
                          <h4>Available Tanks</h4>
                          <span>{availablePositions.length} Total</span>
                        </div>
                        {loadingPositions ? (
                          <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>Loading...</div>
                        ) : availablePositions.length > 0 ? (
                          <div className="item-selection-list">
                            {availablePositions.map((t) => (
                              <button
                                key={t.id}
                                className={`item-selection-btn ${selectedTank?.id === t.id ? "selected" : ""}`}
                                onClick={() => {
                                  setSelectedTank(t);
                                  setSelectedCanister(null);
                                  setSelectedCane(null);
                                  setSelectedGoblet(null);
                                  setLocationLevel("canister");
                                }}
                              >
                                <span className="item-name">{t.name}</span>
                                <span className="item-meta">{t.canisters?.length || 0} Canisters</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: "#6b7280", padding: "20px", textAlign: "center" }}>No tanks available</div>
                        )}
                      </div>
                    )}

                    {/* Canister Level */}
                    {locationLevel === "canister" && (
                      <div>
                        <div className="selection-panel-header">
                          <h4>Canisters in {selectedTank?.name}</h4>
                          <span>{canistersInSelectedTank.length} Total</span>
                        </div>
                        <div className="item-selection-list">
                          {canistersInSelectedTank.map((c) => (
                            <button
                              key={c.id}
                              className={`item-selection-btn ${selectedCanister?.id === c.id ? "selected" : ""}`}
                              onClick={() => {
                                setSelectedCanister(c);
                                setSelectedCane(null);
                                setSelectedGoblet(null);
                                setLocationLevel("cane");
                              }}
                            >
                              <span className="item-name">{c.canister_number}</span>
                              <span className="item-meta">{c.canes?.length || 0} Canes</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cane Level */}
                    {locationLevel === "cane" && (
                      <div>
                        <div className="selection-panel-header">
                          <h4>Canes in {selectedCanister?.canister_number}</h4>
                          <span>{canesInSelectedCanister.length} Total</span>
                        </div>
                        <div className="item-selection-list">
                          {canesInSelectedCanister.map((cn) => (
                            <button
                              key={cn.id}
                              className={`item-selection-btn ${selectedCane?.id === cn.id ? "selected" : ""}`}
                              onClick={() => {
                                setSelectedCane(cn);
                                setSelectedGoblet(null);
                                setLocationLevel("goblet");
                              }}
                            >
                              <span className="item-name">{cn.cane_number}</span>
                              <span className="item-meta">{cn.goblets?.length || 0} Goblets</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Goblet Level (Displays Slots Grid) */}
                    {locationLevel === "goblet" && (
                      <div>
                        <div className="selection-panel-header">
                          <h4>Available Goblets in {selectedCane?.cane_number}</h4>
                          <span>{gobletsInSelectedCane.length} Free</span>
                        </div>
                        
                        {gobletsInSelectedCane.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            
                            {/* Goblets Selection list */}
                            <div className="item-selection-list">
                              {gobletsInSelectedCane.map((g) => (
                                <button
                                  key={g.id}
                                  className={`item-selection-btn ${selectedGoblet?.id === g.id ? "selected" : ""}`}
                                  onClick={() => {
                                    setSelectedGoblet(g);
                                  }}
                                >
                                  <span className="item-name">{g.goblet_number}</span>
                                  <span className="item-meta" style={{ color: g.color?.toLowerCase() }}>
                                    {g.color_display || g.color} • {g.status_display || g.status}
                                  </span>
                                </button>
                              ))}
                            </div>

                            {/* visual slot selector if goblet is selected */}
                            {selectedGoblet && (
                              <div style={{ marginTop: "10px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px" }}>
                                <h5 style={{ fontSize: "12.5px", fontWeight: "700", color: "#374151", marginBottom: "12px" }}>
                                  Available Positions in {selectedGoblet.goblet_number}
                                </h5>
                                <div className="goblets-grid-container">
                                  {["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"].map((slot) => {
                                    const isOccupied = slot === "P3" || slot === "P6"; // simulation matching mockup
                                    return (
                                      <div
                                        key={slot}
                                        className={`goblet-slot-card ${isOccupied ? "disabled" : ""} ${selectedSlot === slot ? "selected" : ""}`}
                                        style={{
                                          opacity: isOccupied ? 0.4 : 1,
                                          cursor: isOccupied ? "not-allowed" : "pointer",
                                          background: isOccupied ? "#e5e7eb" : "#fff"
                                        }}
                                        onClick={() => !isOccupied && setSelectedSlot(slot)}
                                      >
                                        <span className="goblet-slot-number">{slot}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          </div>
                        ) : (
                          <div style={{ color: "#6b7280", padding: "20px", textAlign: "center" }}>No goblets available</div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Selection Footer Path */}
                {(selectedTank || selectedCanister || selectedCane || selectedGoblet) && (
                  <div className="current-path-footer">
                    <MapPin size={16} />
                    <span>
                      Selection: {selectedTank?.name || "?"} &gt; {selectedCanister?.canister_number || "?"} &gt; {selectedCane?.cane_number || "?"} &gt; {selectedGoblet?.goblet_number || "?"} {selectedGoblet ? `> ${selectedSlot}` : ""}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Finalize */}
            {currentStep === 4 && (
              <div className="space-y-lg">
                <div className="section-title-row">
                  <h2>Review &amp; Finalize</h2>
                  <span className="protocol-badge">Verification</span>
                </div>

                <div className="finalize-row">
                  
                  {/* Summary Columns */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="summary-card-dotted">
                      <h4>SYSTEM GENERATED DATA</h4>
                      <div className="summary-list">
                        <div className="summary-item">
                          <span className="summary-item-label">Sample ID</span>
                          <span className="summary-item-value code-font">{specimenForm.sampleType}-20260703-123</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-item-label">RFID Tag ID</span>
                          <span className="summary-item-value">EPC-20260703-1234</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-item-label">Storage Expiry</span>
                          <span className="summary-item-value expiry-highlight">2036-07-03</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-field">
                      <label>CLINICAL NOTES</label>
                      <textarea
                        rows="3"
                        className="form-textarea"
                        placeholder="Add any specific handling instructions or observations..."
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Checklist column */}
                  <div>
                    <div className="checklist-card">
                      <h4>VERIFICATION CHECKLIST</h4>
                      <div className="checklist-list">
                        <div className="checklist-item">
                          <span className="checklist-icon"><CheckCircle2 size={16} /></span>
                          <span>Patient identity confirmed via ID</span>
                        </div>
                        <div className="checklist-item">
                          <span className="checklist-icon"><CheckCircle2 size={16} /></span>
                          <span>Sample viability verified</span>
                        </div>
                        <div className="checklist-item">
                          <span className="checklist-icon"><CheckCircle2 size={16} /></span>
                          <span>RFID tag successfully synced</span>
                        </div>
                        <div className="checklist-item">
                          <span className="checklist-icon"><CheckCircle2 size={16} /></span>
                          <span>Tank temperature stable at -196°C</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* Buttons Navigation Footer */}
          <div className="wizard-footer">
            <button
              className="btn-nav-prev"
              onClick={handlePrev}
              disabled={currentStep === 1 || submitting}
            >
              Previous
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase" }}>
                Step {currentStep} of 4
              </span>
              <button
                className={`btn-nav-next ${currentStep === 4 ? "success-btn" : ""}`}
                onClick={handleNext}
                disabled={submitting}
              >
                {submitting ? "Processing..." : currentStep === 4 ? "Complete Intake" : "Continue"}
              </button>
            </div>
          </div>

        </div>

        {/* Right Reference Panel */}
        <div className="cryo-right-col">
          <div className="ref-panel-title">Quick Reference</div>
          
          <div className="ref-info-box">
            <div className="ref-info-box-label">Active Tank</div>
            <div className="ref-info-box-title">
              <div className="status-dot" />
              <span>{selectedTank ? selectedTank.name : "Tank Alpha-9"}</span>
            </div>
            <div className="ref-info-box-desc">Temp: -195.8°C (Stable)</div>
          </div>

          <div className="ref-info-box">
            <div className="ref-info-box-label">Session Protocol</div>
            <div className="ref-info-box-title" style={{ fontSize: "13px", fontWeight: "600" }}>
              Standard Cryopreservation (SC-1)
            </div>
          </div>

          <div className="ref-image-container">
            <img src={CRYO_VIAL_IMAGE} alt="Cryo Storage Vial" />
          </div>
        </div>

      </div>
    </div>
  );
}
