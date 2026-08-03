import React, { useState, useEffect } from 'react';
import { doctorApi } from '../../api/doctorApi';
import api from '../../api/axios';
import './doctor_dashboard.css';
import { 
  FiClock, 
  FiPlus, 
  FiEye, 
  FiFileText, 
  FiUser, 
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiPlayCircle
} from 'react-icons/fi';
import { 
  LuFilePlus, 
  LuHeartHandshake, 
  LuFolderSearch, 
  LuArrowUpRight 
} from 'react-icons/lu';
import { IoNotificationsOutline } from 'react-icons/io5';

export default function DoctorDashboard({ onViewPatient, onNavigate }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals state
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  // Form states
  const [rxForm, setRxForm] = useState({
    patient_id: '',
    medication_name: '',
    dosage: '',
    frequency: 'OD',
    duration: '',
    instructions: ''
  });
  
  const [labForm, setLabForm] = useState({
    patient_id: '',
    test_name: '',
    notes: ''
  });

  const [reportsData, setReportsData] = useState([
    { id: 1, patientName: 'S. Bhardwaj', test: 'HCG Serum Quantitative', date: '2026-06-10', status: 'Pending Review' },
    { id: 2, patientName: 'Ananya Singh', test: 'Follicle Ultrasound Scan', date: '2026-06-09', status: 'Pending Review' },
    { id: 3, patientName: 'Kavita R.', test: 'Hormone Panel (FSH/LH)', date: '2026-06-09', status: 'Pending Review' }
  ]);

  const [submittingRx, setSubmittingRx] = useState(false);
  const [submittingLab, setSubmittingLab] = useState(false);

  // Fetch Dashboard
  const fetchDashboard = async () => {
    try {
      const data = await doctorApi.getDashboard();
      if (data.success) {
        setDashboardData(data);
        setError(null);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStartConsultation = async (queueId) => {
    try {
      await doctorApi.startConsultation(queueId);
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to start consultation:', err);
      alert('Failed to start consultation. Please try again.');
    }
  };

  const handleCompleteConsultation = async (queueId) => {
    try {
      await doctorApi.completeConsultation(queueId);
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to complete consultation:', err);
      alert('Failed to complete consultation. Please try again.');
    }
  };

  const handleRxSubmit = async (e) => {
    e.preventDefault();
    if (!rxForm.patient_id || !rxForm.medication_name) {
      alert('Please select a patient and enter a drug name');
      return;
    }
    setSubmittingRx(true);
    try {
      const payload = {
        patient_id: parseInt(rxForm.patient_id),
        medication_name: rxForm.medication_name,
        dosage: rxForm.dosage || 'N/A',
        frequency: rxForm.frequency,
        duration: rxForm.duration || 'N/A',
        route: 'Oral',
        instructions: rxForm.instructions
      };
      
      const res = await api.post('doctor/prescriptions/', payload);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        alert('Prescription created successfully!');
        setIsRxModalOpen(false);
        // Reset form
        setRxForm({
          patient_id: '',
          medication_name: '',
          dosage: '',
          frequency: 'OD',
          duration: '',
          instructions: ''
        });
      }
    } catch (err) {
      console.error('Failed to create prescription:', err);
      alert('Failed to save prescription. Check fields and try again.');
    } finally {
      setSubmittingRx(false);
    }
  };

  const handleLabSubmit = async (e) => {
    e.preventDefault();
    if (!labForm.patient_id || !labForm.test_name) {
      alert('Please fill in patient name and test name');
      return;
    }
    setSubmittingLab(true);
    try {
      // Create a mock lab order/clinical note since backend lab request endpoints aren't available yet
      const selectedPatient = dashboardData?.today_queue?.find(p => p.id === parseInt(labForm.patient_id));
      const payload = {
        patient_id: parseInt(labForm.patient_id),
        subjective: `Ordered Lab Test: ${labForm.test_name}`,
        objective: 'Lab ordered from Doctor Dashboard.',
        assessment: 'Referred for clinical lab test',
        plan: `Lab Test: ${labForm.test_name}. Notes: ${labForm.notes || 'None'}`
      };
      
      await api.post('doctor/notes/', payload);
      alert(`Lab test request for ${labForm.test_name} saved successfully!`);
      setIsLabModalOpen(false);
      setLabForm({
        patient_id: '',
        test_name: '',
        notes: ''
      });
    } catch (err) {
      console.error('Failed to request lab test:', err);
      alert('Failed to request lab test. Please try again.');
    } finally {
      setSubmittingLab(false);
    }
  };

  const openRxForPatient = (patientQueueItem) => {
    setRxForm(prev => ({
      ...prev,
      patient_id: String(patientQueueItem.patient || patientQueueItem.id) // Map back to patient ID
    }));
    setIsRxModalOpen(true);
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Fallbacks if backend doesn't return full details
  const doctor = dashboardData?.doctor || { name: 'Anjali', role_display: 'Gynaecologist' };
  const stats = dashboardData?.stats || {
    today_patients: 14,
    waiting: 4,
    in_consultation: 1,
    completed_today: 22,
    total_patients: 24,
    weekly_patients: 8,
    monthly_patients: 5,
    average_consultation_time: 18
  };
  const queue = dashboardData?.today_queue || [];

  // Categorize patients
  const currentConsultation = queue.find(p => p.status === 'IN_CONSULT');
  const waitingQueue = queue.filter(p => p.status === 'WAITING' || p.status === 'WAIT');
  
  // Format Today's Date
  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Unique patient list for modal dropdowns
  const patientDropdownList = queue.map(p => ({
    id: p.patient || p.id,
    name: p.patient_name,
    mrn: p.patient_mrn
  }));

  return (
    <div className="dashboard-container">
      {/* Header greeting */}
      <header className="dashboard-header">
        <div className="welcome-row">
          <h1>Welcome, Dr. {doctor.name}</h1>
          <span className="active-badge">
            <span className="active-dot" /> Active
          </span>
        </div>
        <p className="header-subtitle">Create staff accounts and assign a role within the hospital system.</p>
      </header>

      {/* Quick Actions Grid */}
      <section className="quick-actions-grid">
        <div className="action-card" onClick={() => onNavigate('prescriptions')}>
          <div className="action-card-left">
            <div className="action-icon-wrapper">
              <LuFilePlus size={20} />
            </div>
            <span className="action-title">Create Prescription</span>
          </div>
          <LuArrowUpRight className="action-arrow" />
        </div>

        <div className="action-card" onClick={() => onNavigate('lab_management')}>
          <div className="action-card-left">
            <div className="action-icon-wrapper">
              <LuHeartHandshake size={20} />
            </div>
            <span className="action-title">Request lab test</span>
          </div>
          <LuArrowUpRight className="action-arrow" />
        </div>

        <div className="action-card" onClick={() => setIsReportsModalOpen(true)}>
          <div className="action-card-left">
            <div className="action-icon-wrapper">
              <LuFolderSearch size={20} />
            </div>
            <span className="action-title">View reports</span>
          </div>
          <LuArrowUpRight className="action-arrow" />
        </div>

        <div className="action-card" onClick={() => onNavigate('patients')}>
          <div className="action-card-left">
            <div className="action-icon-wrapper">
              <FiUser size={20} />
            </div>
            <span className="action-title">Patient directory</span>
          </div>
          <LuArrowUpRight className="action-arrow" />
        </div>
      </section>

      {/* Numeric Stats Cards */}
      <section className="stats-grid">
        <div className="dashboard-stat-card">
          <h3>Appointments</h3>
          <p className="stat-num">{String(stats.today_patients || 0).padStart(2, '0')}</p>
        </div>
        <div className="dashboard-stat-card">
          <h3>Completed</h3>
          <p className="stat-num">{String(stats.completed_today || 0).padStart(2, '0')}</p>
        </div>
        <div className="dashboard-stat-card">
          <h3>Lab results</h3>
          <p className="stat-num">{String(stats.weekly_patients || 8).padStart(2, '0')}</p>
        </div>
        <div className="dashboard-stat-card">
          <h3>Follow-ups</h3>
          <p className="stat-num">{String(stats.monthly_patients || 5).padStart(2, '0')}</p>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="dashboard-grid-layout">
        
        {/* Left Column */}
        <div className="layout-column">
          
          {/* Current Consultation Card */}
          <section className="current-consultation-box">
            <h2>Currently in consultation</h2>
            {currentConsultation ? (
              <div className="current-consultation-inner">
                <div className="patient-info-header">
                  <div className="patient-avatar-name">
                    <div className="patient-avatar-circle">
                      {currentConsultation.patient_name ? 
                        currentConsultation.patient_name.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase() : 'P'}
                    </div>
                    <div className="patient-name-section">
                      <div className="patient-name-row">
                        <h3>{currentConsultation.patient_name}</h3>
                        <span className="active-badge">
                          <span className="active-dot" /> Active
                        </span>
                      </div>
                      <span className="patient-meta-row">
                        {currentConsultation.patient_mrn} &bull; {currentConsultation.patient_age !== undefined ? `${currentConsultation.patient_age} Years` : 'Age N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="time-token-section">
                    <span className="consultation-timer">
                      <FiClock /> {currentConsultation.arrival_time || '12:46'}
                    </span>
                    <span className="token-lbl">Token #TKN-{currentConsultation.token_number}</span>
                  </div>
                </div>

                <div className="visit-reason-section">
                  <label>Reason for visit</label>
                  <p className="visit-reason-text">{currentConsultation.visit_reason?.replace('_', ' ') || 'Consultation'}</p>
                </div>

                <div className="current-consult-actions">
                  <button 
                    className="btn-consult-outline"
                    onClick={() => onViewPatient(currentConsultation.patient || currentConsultation.patient_mrn)}
                  >
                    Open record
                  </button>
                  <button 
                    className="btn-consult-outline"
                    onClick={() => openRxForPatient(currentConsultation)}
                  >
                    Prescription
                  </button>
                  <button 
                    className="btn-consult-primary"
                    onClick={() => handleCompleteConsultation(currentConsultation.id)}
                  >
                    Complete Consultation
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-consultation-box">
                <LuHeartHandshake size={32} />
                <h3>No patient in consultation</h3>
                <p>Click "Call patient" from the waiting queue table below to begin.</p>
              </div>
            )}
          </section>

          {/* Waiting Queue Card */}
          <section className="dashboard-section-card">
            <div className="card-header-row">
              <h2>Waiting Queue</h2>
              <span className="card-link" onClick={() => onNavigate('queue')}>Manage All</span>
            </div>
            
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Token</th>
                  <th style={{ width: '45%' }}>Patient name</th>
                  <th style={{ width: '20%' }}>Wait time</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {waitingQueue.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af', padding: '20px 0' }}>
                      No patients in waiting queue
                    </td>
                  </tr>
                ) : (
                  waitingQueue.map((patient) => (
                    <tr key={patient.id}>
                      <td className="token-txt">#TKN - {patient.token_number}</td>
                      <td className="patient-name-txt">{patient.patient_name}</td>
                      <td className="wait-time-txt">{patient.wait_time || 15} min</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="action-btn-link"
                          onClick={() => handleStartConsultation(patient.id)}
                        >
                          Call patient
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>

        {/* Right Column */}
        <div className="layout-column">
          
          {/* Department Snapshot */}
          <section className="dashboard-section-card">
            <div className="card-header-row">
              <h2>Department snapshot</h2>
            </div>
            <div className="snapshot-list">
              <div className="snapshot-row">
                <span className="snapshot-lbl">Total Patients</span>
                <span className="snapshot-val">{stats.total_patients || 24}</span>
              </div>
              <div className="snapshot-row">
                <span className="snapshot-lbl">Avg Consult Time</span>
                <span className="snapshot-val">{stats.average_consultation_time || 18}m</span>
              </div>
              <div className="snapshot-row">
                <span className="snapshot-lbl">Available Doctors</span>
                <span className="snapshot-val">04</span>
              </div>
            </div>
          </section>

          {/* Pending Lab Results */}
          <section className="dashboard-section-card">
            <div className="card-header-row">
              <h2>Pending Lab Results</h2>
            </div>
            <div className="lab-results-list">
              <div className="lab-result-item urgent">
                <div className="lab-patient-info">
                  <span className="lab-patient-name">S. Bhardwaj</span>
                  <span className="lab-test-name">HCG Serum Quantitative</span>
                </div>
                <span className="lab-action-link" onClick={() => setIsReportsModalOpen(true)}>
                  <FiEye size={13} /> Review Result
                </span>
              </div>

              <div className="lab-result-item normal">
                <div className="lab-patient-info">
                  <span className="lab-patient-name">Ananya Singh</span>
                  <span className="lab-test-name">Follicle Ultrasound Scan</span>
                </div>
                <span className="lab-action-link" onClick={() => setIsReportsModalOpen(true)}>
                  <FiEye size={13} /> Review Result
                </span>
              </div>

              <div className="lab-result-item normal">
                <div className="lab-patient-info">
                  <span className="lab-patient-name">Kavita R.</span>
                  <span className="lab-test-name">Hormone Panel (FSH/LH)</span>
                </div>
                <span className="lab-action-link" onClick={() => setIsReportsModalOpen(true)}>
                  <FiEye size={13} /> Review Result
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Full-Width Table: Today's Schedule */}
      <section className="dashboard-section-card schedule-table-card">
        <div className="card-header-row">
          <h2>Today's Schedule</h2>
          <div className="header-controls">
            <div className="date-paginator">
              <button className="date-paginator-btn"><FiChevronLeft size={16} /></button>
              <span className="date-paginator-current">Today, {todayDateString}</span>
              <button className="date-paginator-btn"><FiChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Time</th>
              <th style={{ width: '35%' }}>Patient details</th>
              <th style={{ width: '25%' }}>Reason</th>
              <th style={{ width: '20%' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0' }}>
                  No appointments scheduled for today.
                </td>
              </tr>
            ) : (
              queue.map((appointment) => {
                let statusClass = 'waiting';
                let statusLabel = 'Waiting';

                if (appointment.status === 'IN_CONSULT') {
                  statusClass = 'consulting';
                  statusLabel = 'In Consultation';
                } else if (appointment.status === 'COMPLETED') {
                  statusClass = 'complete';
                  statusLabel = 'Complete';
                }

                return (
                  <tr key={appointment.id}>
                    <td>{appointment.arrival_time || '09:00 AM'}</td>
                    <td>
                      <div className="patient-cell-wrapper">
                        <span className="patient-cell-name">{appointment.patient_name}</span>
                        <span className="patient-cell-mrn">{appointment.patient_mrn}</span>
                      </div>
                    </td>
                    <td>{appointment.visit_reason?.replace('_', ' ') || 'Consultation'}</td>
                    <td>
                      <span className={`table-status-badge ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* Modal 1: Create Prescription */}
      {isRxModalOpen && (
        <div className="quick-action-modal-overlay" onClick={() => setIsRxModalOpen(false)}>
          <div className="quick-action-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Create Prescription</h3>
              <button className="modal-close-btn" onClick={() => setIsRxModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleRxSubmit}>
              <div className="modal-body-content">
                <label style={{ fontSize: '13px', fontWeight: 500 }}>Select Patient</label>
                <select 
                  value={rxForm.patient_id}
                  onChange={e => setRxForm({...rxForm, patient_id: e.target.value})}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patientDropdownList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>
                  ))}
                </select>

                <label style={{ fontSize: '13px', fontWeight: 500 }}>Medication Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Gonal-F 450 IU" 
                  value={rxForm.medication_name}
                  onChange={e => setRxForm({...rxForm, medication_name: e.target.value})}
                  required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Dosage</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 150 IU" 
                      value={rxForm.dosage}
                      onChange={e => setRxForm({...rxForm, dosage: e.target.value})}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Duration (Days)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 10" 
                      value={rxForm.duration}
                      onChange={e => setRxForm({...rxForm, duration: e.target.value})}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <label style={{ fontSize: '13px', fontWeight: 500 }}>Frequency</label>
                <select 
                  value={rxForm.frequency}
                  onChange={e => setRxForm({...rxForm, frequency: e.target.value})}
                >
                  <option value="OD">Once Daily (OD)</option>
                  <option value="BD">Twice Daily (BD)</option>
                  <option value="TDS">Thrice Daily (TDS)</option>
                  <option value="SOS">As Needed (SOS)</option>
                </select>

                <label style={{ fontSize: '13px', fontWeight: 500 }}>Instructions / Clinical Notes</label>
                <textarea 
                  rows="3" 
                  placeholder="Administration instructions..."
                  value={rxForm.instructions}
                  onChange={e => setRxForm({...rxForm, instructions: e.target.value})}
                />

                <button 
                  type="submit" 
                  className="btn-consult-primary" 
                  style={{ marginTop: '12px', width: '100%' }}
                  disabled={submittingRx}
                >
                  {submittingRx ? 'Saving...' : 'Save Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Request Lab Test */}
      {isLabModalOpen && (
        <div className="quick-action-modal-overlay" onClick={() => setIsLabModalOpen(false)}>
          <div className="quick-action-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Request Lab Test</h3>
              <button className="modal-close-btn" onClick={() => setIsLabModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleLabSubmit}>
              <div className="modal-body-content">
                <label style={{ fontSize: '13px', fontWeight: 500 }}>Select Patient</label>
                <select 
                  value={labForm.patient_id}
                  onChange={e => setLabForm({...labForm, patient_id: e.target.value})}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patientDropdownList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>
                  ))}
                </select>

                <label style={{ fontSize: '13px', fontWeight: 500 }}>Test Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. HCG Serum Quantitative" 
                  value={labForm.test_name}
                  onChange={e => setLabForm({...labForm, test_name: e.target.value})}
                  required
                />

                <label style={{ fontSize: '13px', fontWeight: 500 }}>Special Notes</label>
                <textarea 
                  rows="3" 
                  placeholder="Specific requirements for lab collection..."
                  value={labForm.notes}
                  onChange={e => setLabForm({...labForm, notes: e.target.value})}
                />

                <button 
                  type="submit" 
                  className="btn-consult-primary" 
                  style={{ marginTop: '12px', width: '100%' }}
                  disabled={submittingLab}
                >
                  {submittingLab ? 'Submitting...' : 'Submit Lab Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: View Reports */}
      {isReportsModalOpen && (
        <div className="quick-action-modal-overlay" onClick={() => setIsReportsModalOpen(false)}>
          <div className="quick-action-modal" style={{ width: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Pending Lab Reports</h3>
              <button className="modal-close-btn" onClick={() => setIsReportsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body-content" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="dashboard-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Test / Report</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.map(rep => (
                    <tr key={rep.id}>
                      <td style={{ fontWeight: 600 }}>{rep.patientName}</td>
                      <td>{rep.test}</td>
                      <td>{rep.date}</td>
                      <td>
                        <span style={{ color: '#eab308', background: '#fef9c3', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>
                          {rep.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                className="btn-consult-outline" 
                style={{ marginTop: '16px', width: '100%' }}
                onClick={() => setIsReportsModalOpen(false)}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
