import React, { useState, useEffect, useRef } from 'react';
import { doctorApi } from '../../api/doctorApi';
import api from '../../api/axios';
import './doctor.css';
import { FiPlayCircle, FiEye, FiClock, FiFileText, FiPlus, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import { HiOutlineMail } from 'react-icons/hi';
import { IoDocumentTextOutline } from 'react-icons/io5';

// Shared inline-style tokens so the new panels visually match the rest
// of the app (same border/radius/font-size language as the filter inputs
// already used further down this file) without needing new CSS classes.
const fieldStyle = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  background: '#fff',
};

const labelStyle = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#6b7280',
  marginBottom: '4px',
  display: 'block',
};

export default function TodaysQueue({ onViewPatient }) {
  const [queueData, setQueueData] = useState({
    success: false,
    current_patient: null,
    waiting_queue: [],
    completed_count: 0,
    total_waiting: 0,
    completed_queue: []
  });
  const [completedPatients, setCompletedPatients] = useState([]);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter state for completed patients
  const [filterType, setFilterType] = useState('today');
  const [filterDate, setFilterDate] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // ── In-consultation workspace state ───────────────────────────────────
  // null | 'prescription' | 'notes' — which inline panel is open under the
  // current-consultation card. Nothing here navigates away from this page.
  const [activeConsultTab, setActiveConsultTab] = useState(null);

  // The numeric Patient PK, resolved on demand from the queue entry's MRN
  // (the queue payload only gives us patient_mrn / a display name).
  const [resolvedPatientId, setResolvedPatientId] = useState(null);
  const [resolvingPatient, setResolvingPatient] = useState(false);

  // Prescription panel
  const [rxMedications, setRxMedications] = useState([
    { id: Date.now(), name: '', dosage: '', frequency: 'OD', duration: '', medicine_id: null },
  ]);
  const [rxInstructions, setRxInstructions] = useState('');
  const [isSavingRx, setIsSavingRx] = useState(false);
  const [rxSavedFlash, setRxSavedFlash] = useState(false);

  // Medicine search (autocomplete) — same pattern used in the patient detail page
  const [medicineSearchState, setMedicineSearchState] = useState({
    activeMedId: null,
    query: '',
    results: [],
    loading: false,
    showDropdown: false,
  });
  const searchDebounceRef = useRef(null);

  // Clinical notes panel (SOAP)
  const [noteForm, setNoteForm] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedFlash, setNoteSavedFlash] = useState(false);

  const fetchCompletedPatients = async (currentPage, fetchFilters = null) => {
    try {
      const activeFilters = fetchFilters || {
        date: filterType === 'date' ? filterDate : '',
        start_date: filterType === 'range' ? filterStartDate : '',
        end_date: filterType === 'range' ? filterEndDate : ''
      };
      const filtersToPass = filterType === 'today' ? {} : activeFilters;

      const data = await doctorApi.getCompletedPatients(currentPage, filtersToPass);
      setCompletedPatients(data.completed_patients || []);
      setCompletedTotal(data.total_count || 0);
    } catch (error) {
      console.error("Failed to fetch completed patients", error);
    }
  };

  const fetchQueue = async () => {
    try {
      const data = await doctorApi.getQueue();
      setQueueData({
        ...data,
        completed_queue: data.completed_queue || []
      });
    } catch (error) {
      console.error("Failed to fetch doctor queue", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchCompletedPatients(page);
    const interval = setInterval(() => {
      fetchQueue();
      fetchCompletedPatients(page);
    }, 30000);
    return () => clearInterval(interval);
  }, [page]);

  // Reset the whole in-consultation workspace whenever the patient currently
  // being seen changes (new consultation started / previous one completed).
  useEffect(() => {
    setActiveConsultTab(null);
    setResolvedPatientId(null);
    setRxMedications([{ id: Date.now(), name: '', dosage: '', frequency: 'OD', duration: '', medicine_id: null }]);
    setRxInstructions('');
    setNoteForm({ subjective: '', objective: '', assessment: '', plan: '' });
    setRxSavedFlash(false);
    setNoteSavedFlash(false);
  }, [queueData.current_patient?.id]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, []);

  const handleStartConsultation = async (queueId) => {
    try {
      await doctorApi.startConsultation(queueId);
      fetchQueue();
    } catch (error) {
      console.error("Failed to start consultation", error);
      alert("Error starting consultation");
    }
  };

  const handleCompleteConsultation = async (queueId) => {
    try {
      await doctorApi.completeConsultation(queueId);
      fetchQueue();
      fetchCompletedPatients(page);
    } catch (error) {
      console.error("Failed to complete consultation", error);
      alert("Error completing consultation");
    }
  };

  const handleCallNext = () => {
    if (queueData.waiting_queue.length > 0) {
      handleStartConsultation(queueData.waiting_queue[0].id);
    } else {
      alert("No patients waiting.");
    }
  };

  // ── Resolve the numeric patient id for the person currently in consultation ──
  const resolvePatientId = async () => {
    const current = queueData.current_patient;
    if (!current || resolvedPatientId) return resolvedPatientId;
    // Some queue payloads already include the FK directly
    if (current.patient) {
      setResolvedPatientId(current.patient);
      return current.patient;
    }
    setResolvingPatient(true);
    try {
      const mrn = current.patient_mrn;
      const res = await api.get(`doctor/patients/?search=${encodeURIComponent(mrn)}`);
      if (res.data?.success && res.data.patients?.length > 0) {
        const id = res.data.patients[0].id;
        setResolvedPatientId(id);
        return id;
      }
    } catch (err) {
      console.error("Failed to resolve patient id", err);
    } finally {
      setResolvingPatient(false);
    }
    return null;
  };

  const openConsultTab = async (tab) => {
    setActiveConsultTab((prev) => (prev === tab ? null : tab));
    if (!resolvedPatientId) {
      await resolvePatientId();
    }
  };

  // ── Medicine search (autocomplete) ───────────────────────────────────
  const searchMedicines = async (query) => {
    if (!query || query.trim().length < 2) {
      setMedicineSearchState((prev) => ({ ...prev, results: [], loading: false }));
      return;
    }
    setMedicineSearchState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await api.get(`doctor/medicines/?search=${encodeURIComponent(query.trim())}&status=AVAILABLE`);
      let results = [];
      if (res.data?.success) {
        results = res.data.data || res.data.medicines || res.data.results || [];
      } else {
        results = res.data?.results || res.data || [];
      }
      setMedicineSearchState((prev) => ({ ...prev, results, loading: false }));
    } catch (error) {
      console.error("Error searching medicines:", error);
      setMedicineSearchState((prev) => ({ ...prev, results: [], loading: false }));
    }
  };

  const handleDrugNameInput = (medId, value) => {
    setRxMedications((meds) => meds.map((m) => (m.id === medId ? { ...m, name: value, medicine_id: null } : m)));
    setMedicineSearchState((prev) => ({ ...prev, activeMedId: medId, query: value, showDropdown: true }));
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => searchMedicines(value), 300);
  };

  const handleDrugNameFocus = (medId, currentValue) => {
    setMedicineSearchState((prev) => ({ ...prev, activeMedId: medId, query: currentValue, showDropdown: true }));
    if (currentValue && currentValue.trim().length >= 2) searchMedicines(currentValue);
  };

  const handleSelectMedicine = (medId, medicine) => {
    setRxMedications((meds) => meds.map((m) =>
      m.id === medId
        ? {
            ...m,
            name: medicine.name,
            medicine_id: medicine.id || medicine.medication_id || null,
            dosage: m.dosage && m.dosage.trim() ? m.dosage : (medicine.strength || medicine.dosage || ''),
          }
        : m
    ));
    setMedicineSearchState({ activeMedId: null, query: '', results: [], loading: false, showDropdown: false });
  };

  const closeDropdownDelayed = () => {
    setTimeout(() => setMedicineSearchState((prev) => ({ ...prev, showDropdown: false })), 150);
  };

  const handleMedicationChange = (id, field, value) => {
    setRxMedications((meds) => meds.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };
  const addMedicationRow = () => {
    setRxMedications((meds) => [...meds, { id: Date.now(), name: '', dosage: '', frequency: 'OD', duration: '', medicine_id: null }]);
  };
  const removeMedicationRow = (id) => {
    setRxMedications((meds) => meds.filter((m) => m.id !== id));
    setMedicineSearchState((prev) => (prev.activeMedId === id ? { ...prev, activeMedId: null, showDropdown: false } : prev));
  };

  const handleSaveRx = async () => {
    const patientId = resolvedPatientId || (await resolvePatientId());
    if (!patientId) {
      alert("Couldn't identify this patient's record. Try opening Full Profile instead.");
      return;
    }
    const validMeds = rxMedications.filter((m) => m.name.trim());
    if (validMeds.length === 0) {
      alert("Add at least one medicine.");
      return;
    }
    setIsSavingRx(true);
    try {
      for (const med of validMeds) {
        const payload = {
          patient_id: patientId,
          medication_name: med.name,
          ...(med.medicine_id ? { medicine_id: med.medicine_id } : {}),
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          route: 'Oral',
          instructions: rxInstructions,
        };
        await api.post('doctor/prescriptions/', payload);
      }
      setRxMedications([{ id: Date.now(), name: '', dosage: '', frequency: 'OD', duration: '', medicine_id: null }]);
      setRxInstructions('');
      setRxSavedFlash(true);
      setTimeout(() => setRxSavedFlash(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to save prescription. Please try again.');
    } finally {
      setIsSavingRx(false);
    }
  };

  // ── Clinical notes ────────────────────────────────────────────────────
  const handleNoteChange = (e) => {
    const { name, value } = e.target;
    setNoteForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveNote = async () => {
    const patientId = resolvedPatientId || (await resolvePatientId());
    if (!patientId) {
      alert("Couldn't identify this patient's record. Try opening Full Profile instead.");
      return;
    }
    if (!noteForm.subjective && !noteForm.objective && !noteForm.assessment && !noteForm.plan) {
      alert('Fill in at least one field before saving.');
      return;
    }
    setIsSavingNote(true);
    try {
      const payload = { patient_id: patientId, ...noteForm };
      const res = await api.post('doctor/notes/', payload);
      if (res.data?.success !== false) {
        setNoteForm({ subjective: '', objective: '', assessment: '', plan: '' });
        setNoteSavedFlash(true);
        setTimeout(() => setNoteSavedFlash(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save clinical note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setIsSavingNote(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading queue...</div>;
  }

  const { current_patient, waiting_queue, completed_count, total_waiting } = queueData;
  const totalPatients = total_waiting + completed_count + (current_patient ? 1 : 0);

  const totalPages = Math.ceil(completedTotal / 10) || 1;

  const tabBtnStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '8px 8px 0 0',
    border: '1px solid #e5e7eb',
    borderBottom: isActive ? '2px solid #fff' : '1px solid #e5e7eb',
    background: isActive ? '#fff' : '#f9fafb',
    color: isActive ? '#2563eb' : '#4b5563',
    cursor: 'pointer',
    marginBottom: '-1px',
  });

  return (
    <div className="todays-queue-container">
      <div className="queue-header-area">
        <div className="queue-title">
          <h2>Today's queue</h2>
          <p>Live monitoring consultation timers, and clinical workflow management.</p>
        </div>
        <div className="queue-actions">
          <button className="btn-outline">Generate Report</button>
          <button className="btn-primary">New Registration</button>
        </div>
      </div>

      <div className="queue-stats-grid">
        <div className="stat-card">
          <h3>Total patients today</h3>
          <p className="stat-value">{String(totalPatients).padStart(2, '0')}</p>
        </div>
        <div className="stat-card waiting">
          <h3>Patients waiting</h3>
          <p className="stat-value">{String(total_waiting).padStart(2, '0')}</p>
        </div>
        <div className="stat-card">
          <h3>Completed consultation</h3>
          <p className="stat-value">{String(completed_count).padStart(2, '0')}</p>
        </div>
      </div>

      {current_patient && (
        <div className="current-consultation">
          <h3>Currently in consultation</h3>
          <div className="current-card">
            <div className="current-card-header">
              <div className="patient-info-top">
                <span className="token-badge">Token #{current_patient.token_number}</span>
                <span className="patient-name-large">{current_patient.patient_name}</span>
              </div>
              <div className="started-time">
                <FiClock /> Started: {current_patient.arrival_time || 'Now'}
              </div>
            </div>

            <div className="current-card-body">
              <div style={{ flex: 1 }}>
                <div className="patient-details-grid">
                  <div className="detail-group">
                    <label>Patient ID</label>
                    <span>{current_patient.patient_mrn}</span>
                  </div>
                  <div className="detail-group">
                    <label>Phone number</label>
                    <span>{current_patient.patient_phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-group">
                  <label>Reason for visit</label>
                  <div className="reason-box">
                    <strong>{current_patient.visit_reason}: </strong>
                    {current_patient.notes || 'No notes provided.'}
                  </div>
                </div>

                {/* ── Inline consultation workspace tabs ─────────────────── */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '20px' }}>
                  <button type="button" style={tabBtnStyle(activeConsultTab === 'prescription')} onClick={() => openConsultTab('prescription')}>
                    <IoDocumentTextOutline size={15} /> Prescription
                    {rxMedications.some((m) => m.name.trim()) && (
                      <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '999px', fontSize: '10px', padding: '1px 6px', fontWeight: 700 }}>
                        {rxMedications.filter((m) => m.name.trim()).length}
                      </span>
                    )}
                  </button>
                  <button type="button" style={tabBtnStyle(activeConsultTab === 'notes')} onClick={() => openConsultTab('notes')}>
                    <FiFileText size={15} /> Clinical Notes
                  </button>
                </div>

                {/* ── Prescription panel ─────────────────────────────────── */}
                {activeConsultTab === 'prescription' && (
                  <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 8px 8px 8px', padding: '16px', background: '#fff' }}>
                    {resolvingPatient && !resolvedPatientId && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>Loading patient record…</div>
                    )}
                    {rxSavedFlash && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#d1fae5', color: '#047857', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
                        <FiCheck size={14} /> Prescription saved. You can add more or complete the consultation below.
                      </div>
                    )}
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Drug name', 'Dosage', 'Frequency', 'Days', ''].map((h) => (
                            <th key={h} style={{ textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', padding: '0 8px 8px 0' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rxMedications.map((med) => (
                          <tr key={med.id}>
                            <td style={{ position: 'relative', paddingBottom: '8px', paddingRight: '8px', width: '32%' }}>
                              <input
                                style={fieldStyle}
                                value={med.name}
                                onChange={(e) => handleDrugNameInput(med.id, e.target.value)}
                                onFocus={() => handleDrugNameFocus(med.id, med.name)}
                                onBlur={closeDropdownDelayed}
                                placeholder="Search drug name..."
                                autoComplete="off"
                              />
                              {medicineSearchState.activeMedId === med.id && medicineSearchState.showDropdown && (
                                <div style={{
                                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
                                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)', maxHeight: '200px', overflowY: 'auto', marginTop: '4px',
                                }}>
                                  {medicineSearchState.loading ? (
                                    <div style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280' }}>Searching...</div>
                                  ) : medicineSearchState.results.length > 0 ? (
                                    medicineSearchState.results.map((medicine) => (
                                      <div
                                        key={medicine.id || medicine.medication_id}
                                        onMouseDown={(e) => { e.preventDefault(); handleSelectMedicine(med.id, medicine); }}
                                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                                      >
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{medicine.name}</div>
                                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                          {medicine.generic_name || ''}{medicine.medication_id ? ` · ${medicine.medication_id}` : ''}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280' }}>
                                      {medicineSearchState.query.trim().length >= 2 ? 'No medicines found' : 'Type at least 2 characters'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td style={{ paddingBottom: '8px', paddingRight: '8px', width: '22%' }}>
                              <input style={fieldStyle} value={med.dosage} onChange={(e) => handleMedicationChange(med.id, 'dosage', e.target.value)} placeholder="e.g. 150 IU" />
                            </td>
                            <td style={{ paddingBottom: '8px', paddingRight: '8px', width: '16%' }}>
                              <select style={fieldStyle} value={med.frequency} onChange={(e) => handleMedicationChange(med.id, 'frequency', e.target.value)}>
                                <option value="OD">OD</option>
                                <option value="BD">BD</option>
                                <option value="TDS">TDS</option>
                                <option value="SOS">SOS</option>
                              </select>
                            </td>
                            <td style={{ paddingBottom: '8px', paddingRight: '8px', width: '14%' }}>
                              <input type="number" style={fieldStyle} value={med.duration} onChange={(e) => handleMedicationChange(med.id, 'duration', e.target.value)} placeholder="10" />
                            </td>
                            <td style={{ paddingBottom: '8px', textAlign: 'center' }}>
                              <button type="button" onClick={() => removeMedicationRow(med.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}>
                                <FiTrash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button type="button" onClick={addMedicationRow} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 12px' }}>
                      <FiPlus size={14} /> Add another medicine
                    </button>

                    <label style={labelStyle}>Instructions</label>
                    <textarea
                      style={{ ...fieldStyle, minHeight: '60px', resize: 'vertical', marginBottom: '12px' }}
                      value={rxInstructions}
                      onChange={(e) => setRxInstructions(e.target.value)}
                      placeholder="Administration instructions, storage requirements, cautionary notes..."
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-primary" onClick={handleSaveRx} disabled={isSavingRx} style={{ padding: '8px 20px', fontSize: '13px' }}>
                        {isSavingRx ? 'Saving…' : 'Save Prescription'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Clinical notes panel ───────────────────────────────── */}
                {activeConsultTab === 'notes' && (
                  <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 8px 8px 8px', padding: '16px', background: '#fff' }}>
                    {resolvingPatient && !resolvedPatientId && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>Loading patient record…</div>
                    )}
                    {noteSavedFlash && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#d1fae5', color: '#047857', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
                        <FiCheck size={14} /> Note saved. Add another or complete the consultation below.
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={labelStyle}>Subjective</label>
                        <textarea style={{ ...fieldStyle, minHeight: '70px', resize: 'vertical' }} name="subjective" value={noteForm.subjective} onChange={handleNoteChange} placeholder="Patient reports..." />
                      </div>
                      <div>
                        <label style={labelStyle}>Objective</label>
                        <textarea style={{ ...fieldStyle, minHeight: '70px', resize: 'vertical' }} name="objective" value={noteForm.objective} onChange={handleNoteChange} placeholder="Examination findings..." />
                      </div>
                      <div>
                        <label style={labelStyle}>Assessment</label>
                        <textarea style={{ ...fieldStyle, minHeight: '70px', resize: 'vertical' }} name="assessment" value={noteForm.assessment} onChange={handleNoteChange} placeholder="Diagnosis..." />
                      </div>
                      <div>
                        <label style={labelStyle}>Plan</label>
                        <textarea style={{ ...fieldStyle, minHeight: '70px', resize: 'vertical' }} name="plan" value={noteForm.plan} onChange={handleNoteChange} placeholder="Treatment plan..." />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-primary" onClick={handleSaveNote} disabled={isSavingNote} style={{ padding: '8px 20px', fontSize: '13px' }}>
                        {isSavingNote ? 'Saving…' : 'Save Note'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="current-actions">
                <button
                  className="btn-primary btn-block"
                  onClick={() => handleCompleteConsultation(current_patient.id)}
                  style={{ marginBottom: '12px' }}
                >
                  Complete Consultation
                </button>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '-6px 0 12px', lineHeight: 1.4 }}>
                  Add a prescription and/or notes above — no need to leave this page.
                </p>
                <div className="action-row" style={{ marginBottom: '12px' }}>
                  <button className="btn-outline btn-block" onClick={() => onViewPatient && onViewPatient(current_patient.patient || current_patient.patient_mrn)}>
                    <FiEye /> Full Profile
                  </button>
                </div>
                <button className="btn-outline btn-block">
                  <FiFileText /> Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="queue-section">
        <div className="section-header">
          <h3>Waiting Queue ({total_waiting} Patients)</h3>
          <div className="queue-controls">
            <div className="search-input">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Search by name, MRN or token..." />
            </div>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               Filter
            </button>
            <button className="btn-primary" onClick={handleCallNext}>
              Call Next Patient
            </button>
          </div>
        </div>

        <table className="queue-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient name</th>
              <th>MRN</th>
              <th>Status</th>
              <th>Arrival</th>
              <th>Wait time</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {waiting_queue.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#6b7280' }}>No patients in the waiting queue.</td>
              </tr>
            ) : (
              waiting_queue.map((patient) => (
                <tr key={patient.id}>
                  <td className="token-cell">#{patient.token_number}</td>
                  <td className="patient-cell">
                    <span className="name">{patient.patient_name}</span>
                    <span className="phone">{patient.patient_phone || 'N/A'}</span>
                  </td>
                  <td>{patient.patient_mrn}</td>
                  <td>
                    <span className="status-badge waiting">Waiting</span>
                  </td>
                  <td>{patient.arrival_time}</td>
                  <td style={{ color: patient.wait_time > 15 ? '#ea580c' : '#374151' }}>
                    {patient.wait_time}m
                  </td>
                  <td>{patient.visit_reason}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" title="Start Consultation" onClick={() => handleStartConsultation(patient.id)}>
                        <FiPlayCircle size={18} />
                      </button>
                      <button className="action-btn" title="View Details" onClick={() => onViewPatient && onViewPatient(patient.patient || patient.patient_mrn)}>
                        <FiEye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {completedPatients && (
        <div className="queue-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ margin: 0 }}>Completed History ({completedTotal})</h3>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="detail-group" style={{ marginBottom: 0 }}>
                <select
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', background: 'white' }}
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="today">Today's Patients</option>
                  <option value="date">Specific Date</option>
                  <option value="range">Date Range</option>
                </select>
              </div>

              {filterType === 'date' && (
                <div className="detail-group" style={{ marginBottom: 0 }}>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              )}

              {filterType === 'range' && (
                <>
                  <div className="detail-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Start</span>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', width: '120px' }}
                    />
                  </div>
                  <div className="detail-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>End</span>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', width: '120px' }}
                    />
                  </div>
                </>
              )}

              <button
                className="btn-primary"
                onClick={() => { setPage(1); fetchCompletedPatients(1); }}
                style={{ padding: '6px 16px', fontSize: '13px' }}
              >
                Apply
              </button>

              <button className="btn-outline" style={{ border: 'none', color: '#3b82f6', background: 'transparent', padding: '6px' }}>View All History</button>
            </div>
          </div>

          {completedPatients.length > 0 ? (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient name</th>
                <th>MRN</th>
                <th>Completed time</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {completedPatients.map((patient) => (
                <tr key={patient.id}>
                  <td className="token-cell">#{patient.token_number}</td>
                  <td>{patient.patient_name}</td>
                  <td>{patient.patient_mrn}</td>
                  <td>{patient.completed_at || patient.completed_time || 'N/A'}</td>
                  <td>{patient.duration || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn"><IoDocumentTextOutline size={18} /></button>
                      <button className="action-btn"><HiOutlineMail size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          ) : (
            <div style={{ background: 'white', padding: '32px', textAlign: 'center', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#6b7280' }}>
              No completed patients found for the selected filter.
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn-outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '6px 12px', opacity: page === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <span style={{ fontSize: '14px', color: '#374151', margin: '0 8px' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn-outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '6px 12px', opacity: page === totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}