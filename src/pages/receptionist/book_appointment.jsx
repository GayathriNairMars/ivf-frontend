import { useState, useEffect } from "react";
import receptionistApi from "../../api/receptionistApi";
import "./book_appointment.css";

export default function BookAppointment({ onCancel }) {
  const [formData, setFormData] = useState({
    patient_id: "",
    patient_name: "",
    department: "",
    doctor_id: "",
    appointment_date: "",
    time_slot: "",
    reason_for_visit: "",
    notes: ""
  });

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [displayPatientId, setDisplayPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
    fetchPatients();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await receptionistApi.getDepartmentList();
      const list = Array.isArray(data) ? data : (data.departments || data.results || []);
      setDepartments(list);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await receptionistApi.getDoctorList();
      const list = Array.isArray(data) ? data : (data.doctors || data.results || []);
      setDoctors(list);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await receptionistApi.getPatients();
      const list = Array.isArray(data) ? data : (data.results || []);
      setPatients(list);
    } catch (err) {
      console.error("Failed to fetch patients", err);
    }
  };

  const handlePatientSelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const patient = patients.find(p => p.id.toString() === selectedId);
      if (patient) {
        setFormData(prev => ({ 
          ...prev, 
          patient_id: patient.id,
          patient_name: patient.user?.full_name || patient.patient_id
        }));
        setDisplayPatientId(patient.patient_id);
      }
    } else {
      setFormData(prev => ({ 
        ...prev, 
        patient_id: "",
        patient_name: ""
      }));
      setDisplayPatientId("");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await receptionistApi.bookAppointment(formData);
      setSuccess(true);
      setTimeout(() => {
        if (onCancel) onCancel();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book appointment");
      setLoading(false);
    }
  };

  return (
    <div className="book-appt-page">
      <div className="book-appt-breadcrumbs">
        <span className="breadcrumb-link" onClick={onCancel}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Appointment management
        </span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Book appointment</span>
      </div>

      <div className="book-appt-header">
        <h2 className="book-appt-title">
          Book appointment
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" style={{ marginLeft: '8px', color: '#6366f1' }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </h2>
      </div>

      <form className="book-appt-form" onSubmit={handleSubmit}>
        <div className="book-appt-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="12" y1="14" x2="12" y2="18"/>
            <line x1="10" y1="16" x2="14" y2="16"/>
          </svg>
          Appointment details
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Appointment booked successfully! Redirecting...</div>}

        <div className="book-appt-form-grid">
          <div className="form-group">
            <label>Patient ID</label>
            <input type="text" name="display_patient_id" value={displayPatientId} readOnly className="read-only-input" placeholder="Select patient first" />
          </div>

          <div className="form-group">
            <label>Patient Name</label>
            <select name="patient_select" value={formData.patient_id} onChange={handlePatientSelect} required>
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.user?.full_name || 'Unknown'} - {p.phone}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Department</label>
            <select name="department" value={formData.department} onChange={handleChange} required>
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name || dept.department_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Doctor Name</label>
            <select name="doctor_id" value={formData.doctor_id} onChange={handleChange} required>
              <option value="">Select Doctor</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.full_name || doc.name || doc.doctor_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Appointment Date</label>
            <input type="date" name="appointment_date" value={formData.appointment_date} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Time Slot</label>
            <select name="time_slot" value={formData.time_slot} onChange={handleChange} required>
              <option value="">Select Slot</option>
              <option value="09:00 AM">09:00 AM</option>
              <option value="09:30 AM">09:30 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="10:30 AM">10:30 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="11:30 AM">11:30 AM</option>
              <option value="12:00 PM">12:00 PM</option>
              <option value="12:30 PM">12:30 PM</option>
              <option value="02:00 PM">02:00 PM</option>
              <option value="02:30 PM">02:30 PM</option>
              <option value="03:00 PM">03:00 PM</option>
              <option value="03:30 PM">03:30 PM</option>
              <option value="04:00 PM">04:00 PM</option>
              <option value="04:30 PM">04:30 PM</option>
            </select>
          </div>
        </div>

        <div className="form-group full-width" style={{ marginTop: '20px' }}>
          <label>Reason for Visit</label>
          <select name="reason_for_visit" value={formData.reason_for_visit} onChange={handleChange} required>
            <option value="">Select Primary Reason</option>
            <option value="REGULAR">Regular Checkup</option>
            <option value="FOLLOWUP">Follow Up</option>
            <option value="CONSULTATION">Initial Consultation</option>
            <option value="PROCEDURE">Procedure</option>
          </select>
        </div>

        <div className="form-group full-width" style={{ marginTop: '20px' }}>
          <label>Clinical Notes / Special Requests</label>
          <textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange} 
            placeholder="Mention any specific patient requirements or previous cycle notes..." 
            rows="4"
          ></textarea>
        </div>

        <div className="book-appt-actions">
          <button type="button" className="btn-reset" onClick={() => {
            setFormData({ patient_id: "", patient_name: "", department: "", doctor_id: "", appointment_date: "", time_slot: "", reason_for_visit: "", notes: "" });
            setDisplayPatientId("");
          }}>Reset</button>
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-book" disabled={loading}>
            {loading ? "Booking..." : "Book appointment"}
          </button>
        </div>
      </form>
    </div>
  );
}
