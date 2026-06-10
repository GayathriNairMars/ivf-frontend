import React, { useState, useEffect } from 'react';
import { doctorApi } from '../../api/doctorApi';
import './doctor.css';
import { FiPlayCircle, FiEye, FiClock, FiFileText } from 'react-icons/fi';
import { HiOutlineMail } from 'react-icons/hi';
import { IoDocumentTextOutline } from 'react-icons/io5';

export default function TodaysQueue({ onViewPatient }) {
  const [queueData, setQueueData] = useState({
    success: false,
    current_patient: null,
    waiting_queue: [],
    completed_count: 0,
    total_waiting: 0,
    completed_queue: [] // Now handled separately or keep for legacy, but we'll use separate state
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

  const fetchCompletedPatients = async (currentPage, fetchFilters = null) => {
    try {
      const activeFilters = fetchFilters || {
        date: filterType === 'date' ? filterDate : '',
        start_date: filterType === 'range' ? filterStartDate : '',
        end_date: filterType === 'range' ? filterEndDate : ''
      };
      // If 'today', we don't pass any date filters as default API returns today's queue
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
    // Optional: Refresh periodically
    const interval = setInterval(() => {
      fetchQueue();
      fetchCompletedPatients(page);
    }, 30000);
    return () => clearInterval(interval);
  }, [page]);

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

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading queue...</div>;
  }

  const { current_patient, waiting_queue, completed_count, total_waiting } = queueData;
  const totalPatients = total_waiting + completed_count + (current_patient ? 1 : 0);
  
  const totalPages = Math.ceil(completedTotal / 10) || 1; // Assuming 10 per page if not specified

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
              </div>

              <div className="current-actions">
                <button 
                  className="btn-primary btn-block" 
                  onClick={() => handleCompleteConsultation(current_patient.id)}
                  style={{ marginBottom: '12px' }}
                >
                  Complete Consultation
                </button>
                <div className="action-row" style={{ marginBottom: '12px' }}>
                  <button className="btn-outline btn-block">
                    <IoDocumentTextOutline /> Rx
                  </button>
                  <button className="btn-outline btn-block" onClick={() => onViewPatient && onViewPatient(current_patient.patient || current_patient.patient_mrn)}>
                    <FiEye /> View
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
          {/* Filters and Header for Completed Patients inline */}
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

          {/* Pagination Controls */}
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
