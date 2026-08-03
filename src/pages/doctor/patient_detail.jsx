import React, { useState, useEffect, useRef } from "react";
import "./patient_detail.css";
import { FiChevronRight, FiEdit2, FiPrinter, FiFileText, FiPlusSquare, FiUser, FiActivity, FiLink, FiAlertTriangle, FiPlus } from "react-icons/fi";
import { FaFlask } from "react-icons/fa";
import { doctorApi } from "../../api/doctorApi";
import api from "../../api/axios";

const getInitials = (name) => {
  if (!name) return "P";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function PatientDetail({ patientId, onBack }) {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Create Note Modal State
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteForm, setNoteForm] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });

  // View Notes Drawer State
  const [isNotesListOpen, setIsNotesListOpen] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isSelectedNoteModalOpen, setIsSelectedNoteModalOpen] = useState(false);


  // Prescription Modal State
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [medications, setMedications] = useState([
    { id: 1, name: "Gonal-F 450 IU", dosage: "150 IU", frequency: "OD", duration: "10", medicine_id: null },
    { id: 2, name: "Fertilaid 450", dosage: "150 IU", frequency: "OD", duration: "10", medicine_id: null }
  ]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("2026-06-05");
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);

  // Medicine Search (autocomplete) State
  const [medicineSearchState, setMedicineSearchState] = useState({
    activeMedId: null,
    query: "",
    results: [],
    loading: false,
    showDropdown: false,
  });
  const searchDebounceRef = useRef(null);

  // Order Lab Test Modal State
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [labFormData, setLabFormData] = useState({ test_type_id: "", priority: "ROUTINE", notes: "" });
  const [labTests, setLabTests] = useState([]);
  const [labTestsLoading, setLabTestsLoading] = useState(false);
  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [isSubmittingLab, setIsSubmittingLab] = useState(false);
  const [labError, setLabError] = useState("");

  const fetchPatientDetails = async () => {
    setLoading(true);
    try {
      let finalId = patientId;
      if (typeof patientId === 'string' && patientId.toUpperCase().startsWith('PAT')) {
        const searchRes = await api.get(`doctor/patients/?search=${patientId}`);
        if (searchRes.data?.success && searchRes.data.patients?.length > 0) {
          finalId = searchRes.data.patients[0].id;
        } else {
          throw new Error("Patient not found by MRN");
        }
      }

      const response = await api.get(`doctor/patients/${finalId}/`);
      if (response.data?.success) {
        setPatientData(response.data.patient);
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicalNotes = async () => {
    setIsNotesListOpen(true);
    setLoadingNotes(true);
    try {
      const res = await api.get(`doctor/notes/?patient_id=${patientData.id}`);
      let fetchedNotes = [];
      if (res.data?.success && Array.isArray(res.data.notes)) {
        fetchedNotes = res.data.notes;
      } else {
        fetchedNotes = res.data?.results || res.data || [];
      }
      setClinicalNotes(fetchedNotes);
    } catch (error) {
      console.error("Error fetching clinical notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  // Clean up any pending debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // Load available lab tests whenever the Order Lab Test modal opens
  useEffect(() => {
    if (!isLabModalOpen) return;
    setLabTestsLoading(true);
    doctorApi.getAvailableTests({})
      .then(res => setLabTests(res?.tests || []))
      .catch(() => setLabTests([]))
      .finally(() => setLabTestsLoading(false));
  }, [isLabModalOpen]);

  const handleNoteChange = (e) => {
    const { name, value } = e.target;
    setNoteForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNotesSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingNote(true);
    try {
      // Typically the API will expect the patient's ID (PK) or MRN
      const payload = {
        patient_id: patientData.id, 
        ...noteForm
      };
      const res = await api.post('doctor/notes/', payload);
      if (res.data?.success) {
        alert("Clinical note saved successfully");
        setIsNotesModalOpen(false);
        setNoteForm({ subjective: "", objective: "", assessment: "", plan: "" });
        // Optionally refresh the patient details to show the new note
        fetchPatientDetails();
      }
    } catch (error) {
      console.error("Failed to save clinical note:", error);
      alert("Failed to save note. Please try again.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleMedicationChange = (id, field, value) => {
    setMedications(meds => meds.map(m => m.id === id ? { ...m, [field]: value } : m));
  };
  const addMedication = () => {
    setMedications(meds => [...meds, { id: Date.now(), name: "", dosage: "", frequency: "OD", duration: "", medicine_id: null }]);
  };
  const removeMedication = (id) => {
    setMedications(meds => meds.filter(m => m.id !== id));
    // If the dropdown was open for this row, close it
    setMedicineSearchState(prev => prev.activeMedId === id ? { ...prev, activeMedId: null, showDropdown: false } : prev);
  };

  // ── Medicine search (autocomplete) ─────────────────────────────────────
  const searchMedicines = async (query) => {
    if (!query || query.trim().length < 2) {
      setMedicineSearchState(prev => ({ ...prev, results: [], loading: false }));
      return;
    }
    setMedicineSearchState(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.get(`doctor/medicines/?search=${encodeURIComponent(query.trim())}&status=AVAILABLE`);
      let results = [];
      if (res.data?.success) {
        results = res.data.data || res.data.medicines || res.data.results || [];
      } else {
        results = res.data?.results || res.data || [];
      }
      setMedicineSearchState(prev => ({ ...prev, results, loading: false }));
    } catch (error) {
      console.error("Error searching medicines:", error);
      setMedicineSearchState(prev => ({ ...prev, results: [], loading: false }));
    }
  };

  const handleDrugNameInput = (medId, value) => {
    // Clear any previously linked medicine_id since the user is typing freely
    setMedications(meds => meds.map(m => m.id === medId ? { ...m, name: value, medicine_id: null } : m));
    setMedicineSearchState(prev => ({ ...prev, activeMedId: medId, query: value, showDropdown: true }));

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchMedicines(value);
    }, 300);
  };

  const handleDrugNameFocus = (medId, currentValue) => {
    setMedicineSearchState(prev => ({ ...prev, activeMedId: medId, query: currentValue, showDropdown: true }));
    if (currentValue && currentValue.trim().length >= 2) {
      searchMedicines(currentValue);
    }
  };

  const handleSelectMedicine = (medId, medicine) => {
    setMedications(meds => meds.map(m =>
      m.id === medId
        ? {
            ...m,
            name: medicine.name,
            medicine_id: medicine.id || medicine.medication_id || null,
            // Only prefill dosage if the field is still empty
            dosage: m.dosage && m.dosage.trim() ? m.dosage : (medicine.strength || medicine.dosage || "")
          }
        : m
    ));
    setMedicineSearchState({ activeMedId: null, query: "", results: [], loading: false, showDropdown: false });
  };

  const closeDropdownDelayed = () => {
    // Delay so a click on a dropdown option registers before the input's onBlur closes it
    setTimeout(() => {
      setMedicineSearchState(prev => ({ ...prev, showDropdown: false }));
    }, 150);
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingRx(true);
    try {
      // The API expects single prescription records rather than a nested list.
      // We will loop through the medications and post each one.
      for (const med of medications) {
        if (!med.name) continue; // skip if empty
        const payload = {
          patient_id: patientData.id,
          medication_name: med.name,
          ...(med.medicine_id ? { medicine_id: med.medicine_id } : {}),
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          route: "Oral", // Required by API, default to Oral
          instructions: prescriptionNotes
        };
        await api.post('doctor/prescriptions/', payload);
      }
      
      alert("Prescription saved successfully");
      setIsPrescriptionModalOpen(false);
      // Reset form
      setMedications([{ id: Date.now(), name: "", dosage: "", frequency: "OD", duration: "", medicine_id: null }]);
      setPrescriptionNotes("");
      setNextFollowUp("");
    } catch (error) {
      console.error(error);
      alert("Failed to save prescription. Check fields and try again.");
    } finally {
      setIsSubmittingRx(false);
    }
  };

  // ── Order Lab Test ──────────────────────────────────────────────────────
  const handleLabTestChange = (e) => {
    const id = parseInt(e.target.value, 10);
    setLabFormData(f => ({ ...f, test_type_id: id }));
    setSelectedLabTest(labTests.find(t => t.id === id) || null);
  };

  const closeLabModal = () => {
    setIsLabModalOpen(false);
    setLabFormData({ test_type_id: "", priority: "ROUTINE", notes: "" });
    setSelectedLabTest(null);
    setLabError("");
  };

  const handleLabSubmit = async () => {
    setLabError("");
    if (!labFormData.test_type_id) {
      setLabError("Please select a test type.");
      return;
    }
    setIsSubmittingLab(true);
    try {
      await doctorApi.createLabOrder({
        patient_id: patientData.id,
        test_type_id: labFormData.test_type_id,
        priority: labFormData.priority,
        notes: labFormData.notes.trim() || undefined,
      });
      alert("Lab test ordered successfully");
      closeLabModal();
    } catch (error) {
      console.error("Failed to order lab test:", error);
      const msg = error?.response?.data?.message || error?.response?.data?.error || "Failed to place order. Please try again.";
      setLabError(msg);
    } finally {
      setIsSubmittingLab(false);
    }
  };

  if (loading) {
    return (
      <div className="doc-patient-detail-container loading">
        <div className="spinner"></div>
        <p>Loading patient details...</p>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="doc-patient-detail-container error">
        <button className="btn-secondary" onClick={onBack}>
          Back to Patients
        </button>
        <p>Failed to load patient details.</p>
      </div>
    );
  }

  // Determine current doctor from recent visits
  const currentDoctor = patientData.visit_history && patientData.visit_history.length > 0 
    ? patientData.visit_history[0].doctor 
    : "Not Assigned";

  return (
    <div className="pd-container">
      {/* Top Card: Breadcrumbs & Header Actions */}
      <div className="pd-header-card">
        <div className="pd-breadcrumbs">
          <span className="pd-breadcrumb-link" onClick={onBack}>Patient Records</span>
          <FiChevronRight className="pd-breadcrumb-icon" />
          <span className="pd-breadcrumb-current">Details</span>
        </div>

        <div className="pd-header-row">
          <div className="pd-header-left">
            <div className="pd-header-titles">
              <h2>{patientData.name}</h2>
              <span className="pd-status-badge">
                <span className="pd-status-dot"></span> In consultation
              </span>
            </div>
            <p className="pd-patient-id">{patientData.patient_id}</p>
          </div>
          
          <div className="pd-header-actions">
            <button className="pd-btn-outline-green" onClick={() => setIsPrescriptionModalOpen(true)}>
              <FiPlusSquare /> Create Prescription
            </button>
            <button className="pd-btn-outline-green" onClick={() => setIsLabModalOpen(true)}>
              <FaFlask size={14} /> Order Lab Test
            </button>
            <button className="pd-btn-outline" onClick={() => setIsNotesModalOpen(true)}>
              <FiFileText /> Add Notes
            </button>
            <button className="pd-btn-outline">
              <FiPrinter /> Print Summary
            </button>
          </div>
        </div>
      </div>

      {/* Top Grid: Info & Doctor/Notes */}
      <div className="pd-top-grid">
        {/* Left: Patient Information */}
        <div className="pd-card">
          <div className="pd-card-header">
            <h3>Patient Information</h3>
            <button className="pd-btn-text-green">
              <FiEdit2 /> Edit Details
            </button>
          </div>
          <div className="pd-info-grid">
            <div className="pd-info-item">
              <label>Patient ID</label>
              <p className="pd-info-val fw-bold">{patientData.patient_id}</p>
            </div>
            <div className="pd-info-item">
              <label>Partner</label>
              <p className="pd-info-val fw-medium">N/A</p>
            </div>
            <div className="pd-info-item">
              <label>Full Name</label>
              <p className="pd-info-val fw-bold">{patientData.name}</p>
            </div>
            <div className="pd-info-item">
              <label>Contact</label>
              <p className="pd-info-val fw-bold">{patientData.phone}</p>
            </div>
            <div className="pd-info-item">
              <label>Birth Details</label>
              <p className="pd-info-val fw-bold">{patientData.age ? `${patientData.age} Yrs` : "N/A"}</p>
            </div>
            <div className="pd-info-item">
              <label>Address</label>
              <p className="pd-info-val fw-bold">{patientData.address || "N/A"}</p>
            </div>
            <div className="pd-info-item">
              <label>Email</label>
              <p className="pd-info-val fw-bold">{patientData.email || "N/A"}</p>
            </div>
            <div className="pd-info-item">
              <label>Emergency</label>
              <p className="pd-info-val fw-bold">N/A</p>
            </div>
          </div>
        </div>

        {/* Right Stack: Assigned Doctor & Clinical Notes */}
        <div className="pd-right-stack">
          <div className="pd-card">
            <label className="pd-card-label">Assigned doctor</label>
            <div className="pd-doctor-info">
              <div className="pd-doctor-avatar">
                <FiUser size={24} color="#868e96" />
                <span className="pd-online-dot"></span>
              </div>
              <div className="pd-doctor-details">
                <h4>Dr. {currentDoctor}</h4>
                <p className="pd-doctor-role">Consulting Doctor</p>
                <p className="pd-doctor-meta">DOC-001 • <span className="text-green">Online</span></p>
              </div>
            </div>
          </div>

          <div className="pd-card pd-card-clickable" onClick={fetchClinicalNotes}>
            <div className="pd-clinical-notes-row">
              <h3>Clinical Notes</h3>
              <div className="pd-clinical-badge">{patientData.recent_emr_records?.length || 0}</div>
              <FiChevronRight className="pd-arrow-icon" />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Recent visits */}
      <div className="pd-card">
        <div className="pd-card-header">
          <h3>Recent visits</h3>
          <button className="pd-btn-text-green">View all visits <FiChevronRight size={14}/></button>
        </div>
        <div className="pd-table-wrapper">
          <table className="pd-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Token</th>
                <th>Doctor</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patientData.visit_history && patientData.visit_history.length > 0 ? (
                patientData.visit_history.map((visit, idx) => (
                  <tr key={idx}>
                    <td>{visit.date}</td>
                    <td>{visit.token}</td>
                    <td>Dr. {visit.doctor}</td>
                    <td>{visit.reason}</td>
                    <td><span className="pd-badge-completed">{visit.status_display}</span></td>
                    <td>
                      <div className="pd-action-icons">
                        <button className="pd-icon-btn text-green"><FiPlusSquare size={16}/></button>
                        <button className="pd-icon-btn"><FiFileText size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="pd-empty">No recent visits.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section: Medical history */}
      <div className="pd-history-section">
        <h3>Medical history</h3>
        
        <div className="pd-stats-grid">
          <div className="pd-stat-card">
            <div className="pd-stat-icon bg-light-green text-green"><FiActivity size={20} /></div>
            <div className="pd-stat-info">
              <label>Active conditions</label>
              <p>00</p>
            </div>
          </div>
          <div className="pd-stat-card">
            <div className="pd-stat-icon bg-light-blue text-blue"><FiLink size={20} /></div>
            <div className="pd-stat-info">
              <label>Current medications</label>
              <p>00</p>
            </div>
          </div>
          <div className="pd-stat-card">
            <div className="pd-stat-icon bg-light-red text-red"><FiAlertTriangle size={20} /></div>
            <div className="pd-stat-info">
              <label>Known allergies</label>
              <p>None</p>
            </div>
          </div>
        </div>

        <div className="pd-card no-padding">
          <div className="pd-table-wrapper">
            <table className="pd-table">
              <thead>
                <tr>
                  <th>Condition</th>
                  <th>Diagnosed date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Dummy data to match UI as API doesn't provide medical history yet */}
                <tr>
                  <td colSpan="5" className="pd-empty">No medical history recorded.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="pd-card-footer">
            <button className="pd-btn-solid-green">
              <FiPlus /> Record New Condition
            </button>
          </div>
        </div>
      </div>

      {/* Create Clinical Notes Modal */}
      {isNotesModalOpen && (
        <div className="pd-modal-overlay">
          <div className="pd-modal-content">
            <div className="pd-modal-header">
              <h2>Doctor Clinical Notes</h2>
              <p>Create and manage clinical notes (SOAP format)</p>
              <button className="pd-modal-close" onClick={() => setIsNotesModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleNotesSubmit} className="pd-modal-form">
              <div className="pd-form-group">
                <label>Subjective</label>
                <textarea 
                  name="subjective" 
                  value={noteForm.subjective} 
                  onChange={handleNoteChange} 
                  placeholder="Patient reports..."
                  required
                />
              </div>
              <div className="pd-form-group">
                <label>Objective</label>
                <textarea 
                  name="objective" 
                  value={noteForm.objective} 
                  onChange={handleNoteChange} 
                  placeholder="Examination findings..."
                  required
                />
              </div>
              <div className="pd-form-group">
                <label>Assessment</label>
                <textarea 
                  name="assessment" 
                  value={noteForm.assessment} 
                  onChange={handleNoteChange} 
                  placeholder="Diagnosis..."
                  required
                />
              </div>
              <div className="pd-form-group">
                <label>Plan</label>
                <textarea 
                  name="plan" 
                  value={noteForm.plan} 
                  onChange={handleNoteChange} 
                  placeholder="Treatment plan..."
                  required
                />
              </div>
              
              <div className="pd-modal-footer">
                <button type="button" className="pd-btn-outline" onClick={() => setIsNotesModalOpen(false)}>Cancel</button>
                <button type="submit" className="pd-btn-solid-green" disabled={isSubmittingNote}>
                  {isSubmittingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Clinical Notes Drawer */}
      {isNotesListOpen && (
        <div className="pd-drawer-overlay" onClick={() => setIsNotesListOpen(false)}>
          <div className="pd-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="pd-drawer-header">
              <h2>Clinical Notes History</h2>
              <button className="pd-modal-close" onClick={() => setIsNotesListOpen(false)}>&times;</button>
            </div>
            <div className="pd-drawer-body">
              {loadingNotes ? (
                <div className="loading"><div className="spinner"></div></div>
              ) : clinicalNotes.length > 0 ? (
                <div className="pd-notes-list">
                  {clinicalNotes.map(note => (
                    <div className="pd-note-card" key={note.id} onClick={() => { setSelectedNote(note); setIsSelectedNoteModalOpen(true); }} style={{ cursor: "pointer", transition: "all 0.2s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div className="pd-note-date" style={{ margin: 0 }}>{note.date || "Unknown Date"}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>Dr. {note.created_by}</div>
                      </div>
                      <h4 style={{ margin: "0 0 8px 0", color: "#1f2937", fontSize: "15px" }}>{note.title || "Consultation Note"}</h4>
                      <div style={{ fontSize: "13px", color: "#6b7280", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {note.subjective || "No additional details provided."}
                      </div>
                      <div style={{ marginTop: "12px", color: "#10b981", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                        View Details <FiChevronRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pd-empty">No clinical notes found for this patient.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Prescription Modal */}
      {isPrescriptionModalOpen && (
        <div className="pd-rx-modal-overlay">
          <div className="pd-rx-modal-content">
            <div className="pd-rx-modal-header-close">
              <button className="pd-modal-close" onClick={() => setIsPrescriptionModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handlePrescriptionSubmit} className="pd-rx-modal-form">
              <div className="pd-rx-section">
                <div className="pd-rx-section-header">
                  <h2>Medication Details</h2>
                  <button type="button" className="pd-btn-solid-blue" onClick={addMedication}>
                    <FiPlus /> Add Medication
                  </button>
                </div>
                
                <table className="pd-rx-table">
                  <thead>
                    <tr>
                      <th>Drug name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration <span style={{opacity: 0.7, fontWeight: 400}}>(Days)</span></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map(med => (
                      <tr key={med.id}>
                        <td style={{ position: 'relative' }}>
                          <input
                            className="pd-rx-input"
                            value={med.name}
                            onChange={(e) => handleDrugNameInput(med.id, e.target.value)}
                            onFocus={() => handleDrugNameFocus(med.id, med.name)}
                            onBlur={closeDropdownDelayed}
                            placeholder="Search drug name..."
                            autoComplete="off"
                            required
                          />
                          {med.medicine_id && (
                            <span
                              title="Linked to inventory medicine"
                              style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#10b981'
                              }}
                            />
                          )}
                          {medicineSearchState.activeMedId === med.id && medicineSearchState.showDropdown && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 50,
                                background: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                                maxHeight: '220px',
                                overflowY: 'auto',
                                marginTop: '4px',
                                textAlign: 'left'
                              }}
                            >
                              {medicineSearchState.loading ? (
                                <div style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280' }}>Searching...</div>
                              ) : medicineSearchState.results.length > 0 ? (
                                medicineSearchState.results.map((medicine) => (
                                  <div
                                    key={medicine.id || medicine.medication_id}
                                    onMouseDown={(e) => { e.preventDefault(); handleSelectMedicine(med.id, medicine); }}
                                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                                  >
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                      {medicine.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                                      {medicine.generic_name && <span>{medicine.generic_name}</span>}
                                      {medicine.medication_id && <span>• {medicine.medication_id}</span>}
                                      {medicine.status && (
                                        <span
                                          style={{
                                            color:
                                              medicine.status === 'AVAILABLE' ? '#10b981' :
                                              medicine.status === 'LOW_STOCK' ? '#f59e0b' : '#ef4444',
                                            fontWeight: 500
                                          }}
                                        >
                                          • {String(medicine.status).replace('_', ' ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : medicineSearchState.query.trim().length >= 2 ? (
                                <div style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280' }}>No medicines found</div>
                              ) : (
                                <div style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280' }}>Type at least 2 characters</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <input 
                            className="pd-rx-input" 
                            value={med.dosage} 
                            onChange={(e) => handleMedicationChange(med.id, 'dosage', e.target.value)} 
                            placeholder="e.g. 150 IU"
                            required
                          />
                        </td>
                        <td>
                          <div className="pd-rx-select-wrapper">
                            <select 
                              className="pd-rx-select"
                              value={med.frequency}
                              onChange={(e) => handleMedicationChange(med.id, 'frequency', e.target.value)}
                            >
                              <option value="OD">OD</option>
                              <option value="BD">BD</option>
                              <option value="TDS">TDS</option>
                              <option value="SOS">SOS</option>
                            </select>
                          </div>
                        </td>
                        <td>
                          <input 
                            className="pd-rx-input" 
                            type="number"
                            value={med.duration} 
                            onChange={(e) => handleMedicationChange(med.id, 'duration', e.target.value)} 
                            placeholder="10"
                            required
                          />
                        </td>
                        <td>
                          <button type="button" className="pd-rx-delete-btn" onClick={() => removeMedication(med.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pd-rx-section" style={{ marginTop: '24px' }}>
                <div className="pd-rx-section-header" style={{ marginBottom: '16px', padding: 0 }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <FiFileText color="#3b82f6" size={20} />
                    <h2 style={{margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827'}}>Clinical Notes & Instructions</h2>
                  </div>
                </div>
                <textarea 
                  className="pd-rx-textarea"
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="Enter patient-specific administration instructions, storage requirements, or cautionary notes..."
                ></textarea>
              </div>

              <div className="pd-rx-section" style={{ marginTop: '24px', width: '350px' }}>
                <div className="pd-rx-section-header" style={{ marginBottom: '16px', padding: 0 }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <h2 style={{margin: 0, fontSize: '16px', fontWeight: 500, color: '#6b7280'}}>Next follow up</h2>
                  </div>
                </div>
                <div className="pd-rx-date-input-wrapper">
                  <input 
                    type="date" 
                    className="pd-rx-input" 
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    style={{ background: '#f9fafb' }}
                  />
                </div>
              </div>
              
              <div className="pd-modal-footer">
                <button type="submit" className="pd-btn-solid-blue" disabled={isSubmittingRx}>
                  {isSubmittingRx ? "Saving..." : "Save Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Lab Test Modal */}
      {isLabModalOpen && (
        <div className="pd-modal-overlay">
          <div className="pd-modal-content" style={{ maxWidth: '560px', width: '90%' }}>
            <div className="pd-modal-header">
              <h2>Order Lab Test</h2>
              <p>Request a lab test for {patientData.name}</p>
              <button className="pd-modal-close" onClick={closeLabModal}>&times;</button>
            </div>

            <div className="pd-modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {labError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', fontSize: '13px' }}>
                  {labError}
                </div>
              )}

              <div className="pd-form-group">
                <label>Patient</label>
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '6px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                  {patientData.name} ({patientData.patient_id})
                </div>
              </div>

              <div className="pd-form-group">
                <label>Test Type *</label>
                {labTestsLoading ? (
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Loading tests…</div>
                ) : (
                  <select
                    value={labFormData.test_type_id}
                    onChange={handleLabTestChange}
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%' }}
                  >
                    <option value="">Select test type…</option>
                    {labTests.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pd-form-group">
                <label>Priority Level</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { key: 'URGENT', label: 'Urgent' },
                    { key: 'ROUTINE', label: 'Routine' },
                    { key: 'STAT', label: 'STAT' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setLabFormData(f => ({ ...f, priority: opt.key }))}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: '6px',
                        border: labFormData.priority === opt.key ? '1.5px solid #2563eb' : '1px solid #d1d5db',
                        background: labFormData.priority === opt.key ? '#eff6ff' : '#fff',
                        color: labFormData.priority === opt.key ? '#2563eb' : '#4b5563',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pd-form-group">
                <label>Clinical Notes</label>
                <textarea
                  rows={3}
                  value={labFormData.notes}
                  onChange={(e) => setLabFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Add clinical notes for the lab technician…"
                />
              </div>

              {selectedLabTest && selectedLabTest.fields && selectedLabTest.fields.length > 0 && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 14px', background: '#f9fafb' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                    Test Fields <span style={{ fontWeight: 400, color: '#6b7280' }}>(Will be filled by Lab)</span>
                  </div>
                  {selectedLabTest.fields.map((f, i) => (
                    <div key={f.id || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563', padding: '4px 0' }}>
                      <span>{i + 1}. {f.label}</span>
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Waiting for lab results</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pd-modal-footer">
                <button type="button" className="pd-btn-outline" onClick={closeLabModal}>Cancel</button>
                <button type="button" className="pd-btn-solid-green" onClick={handleLabSubmit} disabled={isSubmittingLab}>
                  {isSubmittingLab ? "Ordering…" : "Order Test"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Details Modal */}
      {isSelectedNoteModalOpen && selectedNote && (
        <div className="pd-modal-overlay">
          <div className="pd-modal-content" style={{maxWidth: '600px', width: '90%'}}>
            <div className="pd-modal-header" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', color: '#111827', margin: '0 0 8px 0' }}>{selectedNote.title || "Clinical Note Details"}</h2>
              <div style={{ display: 'flex', gap: '16px', color: '#6b7280', fontSize: '14px' }}>
                <span>Date: <strong>{selectedNote.date}</strong></span>
                <span>By: <strong>Dr. {selectedNote.created_by}</strong></span>
              </div>
              <button className="pd-modal-close" onClick={() => setIsSelectedNoteModalOpen(false)}>&times;</button>
            </div>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px'}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{fontWeight: '600', color: '#374151', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Subjective</label>
                <div style={{padding: '12px 16px', background: '#f9fafb', borderLeft: '4px solid #3b82f6', borderRadius: '4px', color: '#1f2937', fontSize: '15px', lineHeight: '1.5'}}>{selectedNote.subjective || "-"}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{fontWeight: '600', color: '#374151', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Objective</label>
                <div style={{padding: '12px 16px', background: '#f9fafb', borderLeft: '4px solid #10b981', borderRadius: '4px', color: '#1f2937', fontSize: '15px', lineHeight: '1.5'}}>{selectedNote.objective || "-"}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{fontWeight: '600', color: '#374151', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Assessment</label>
                <div style={{padding: '12px 16px', background: '#f9fafb', borderLeft: '4px solid #f59e0b', borderRadius: '4px', color: '#1f2937', fontSize: '15px', lineHeight: '1.5'}}>{selectedNote.assessment || "-"}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{fontWeight: '600', color: '#374151', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Plan</label>
                <div style={{padding: '12px 16px', background: '#f9fafb', borderLeft: '4px solid #8b5cf6', borderRadius: '4px', color: '#1f2937', fontSize: '15px', lineHeight: '1.5'}}>{selectedNote.plan || "-"}</div>
              </div>
            </div>
            
            <div className="pd-modal-footer" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button type="button" className="pd-btn-solid-blue" onClick={() => setIsSelectedNoteModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}