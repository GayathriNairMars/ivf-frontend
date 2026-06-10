import React, { useState, useEffect } from "react";
import "./patient_detail.css";
import { FiChevronRight, FiEdit2, FiPrinter, FiFileText, FiPlusSquare, FiUser, FiActivity, FiLink, FiAlertTriangle, FiPlus } from "react-icons/fi";
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

  // Prescription Modal State
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [medications, setMedications] = useState([
    { id: 1, name: "Gonal-F 450 IU", dosage: "150 IU", frequency: "OD", duration: "10" },
    { id: 2, name: "Fertilaid 450", dosage: "150 IU", frequency: "OD", duration: "10" }
  ]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("2026-06-05");
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);

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
      // Assuming the API filters by patient ID using a query parameter
      const res = await api.get(`doctor/notes/?patient_id=${patientData.id}`);
      // Fallback logic in case the API doesn't support filtering and returns all notes
      let notes = res.data?.results || res.data?.notes || res.data || [];
      if (Array.isArray(notes)) {
        notes = notes.filter(n => n.patient === patientData.id || n.patient === patientData.patient_id);
      }
      setClinicalNotes(Array.isArray(notes) ? notes : []);
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
    setMedications(meds => [...meds, { id: Date.now(), name: "", dosage: "", frequency: "OD", duration: "" }]);
  };
  const removeMedication = (id) => {
    setMedications(meds => meds.filter(m => m.id !== id));
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
      setMedications([{ id: Date.now(), name: "", dosage: "", frequency: "OD", duration: "" }]);
      setPrescriptionNotes("");
      setNextFollowUp("");
    } catch (error) {
      console.error(error);
      alert("Failed to save prescription. Check fields and try again.");
    } finally {
      setIsSubmittingRx(false);
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
                    <div className="pd-note-card" key={note.id}>
                      <div className="pd-note-date">{note.date || "Unknown Date"}</div>
                      <div className="pd-note-section">
                        <strong>Subjective:</strong>
                        <p>{note.subjective}</p>
                      </div>
                      <div className="pd-note-section">
                        <strong>Objective:</strong>
                        <p>{note.objective}</p>
                      </div>
                      <div className="pd-note-section">
                        <strong>Assessment:</strong>
                        <p>{note.assessment}</p>
                      </div>
                      <div className="pd-note-section">
                        <strong>Plan:</strong>
                        <p>{note.plan}</p>
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
                        <td>
                          <input 
                            className="pd-rx-input" 
                            value={med.name} 
                            onChange={(e) => handleMedicationChange(med.id, 'name', e.target.value)} 
                            placeholder="Drug name"
                            required
                          />
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
    </div>
  );
}
