import { useState, useEffect } from "react";
import receptionistApi from "../../api/receptionistApi";
import Appointments from "./appointments";
import "./reschedule_appointment.css";

export default function RescheduleAppointment({ appointmentId, onCancel }) {
  const [appointment, setAppointment] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    appointment_date: "",
    time_slot: "",
    reason_for_change: "Patient requested"
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentId, setCurrentId] = useState(appointmentId);
  const [manualIdInput, setManualIdInput] = useState("");

  useEffect(() => {
    if (appointmentId) {
      setCurrentId(appointmentId);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (currentId) {
      fetchAppointment(currentId);
    } else {
      setLoading(false);
    }
  }, [currentId]);

  const fetchAppointment = async (idToFetch) => {
    try {
      setLoading(true);
      const data = await receptionistApi.getAppointment(idToFetch);
      const apptData = data.details?.appointment || data;
      setAppointment(apptData);
      setDoctorDetails(data.details?.doctor_details || null);
      
      // Pre-fill existing date/time if available
      setFormData(prev => ({
        ...prev,
        appointment_date: apptData.appointment_date || apptData.date || "",
        time_slot: apptData.time_slot || apptData.time || ""
      }));
    } catch (err) {
      console.error("Failed to fetch appointment", err);
      setError("Failed to load appointment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointment && formData.appointment_date) {
      fetchAvailableSlots();
    }
  }, [formData.appointment_date, appointment]);

  const fetchAvailableSlots = async () => {
    try {
      const doctorId = appointment.doctor_id || appointment?.doctor?.id || appointment.doctor;
      if (!doctorId) return;
      const data = await receptionistApi.getAvailableSlots(doctorId, formData.appointment_date);
      const slots = Array.isArray(data) ? data : (data.available_slots || data.slots || []);
      setAvailableSlots(slots);
    } catch (err) {
      console.error("Failed to fetch slots", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        new_date: formData.appointment_date,
        new_time_slot: formData.time_slot,
        reason: formData.reason_for_change
      };
      await receptionistApi.rescheduleAppointment(currentId, payload);
      setSuccess(true);
      setTimeout(() => {
        if (onCancel) onCancel();
      }, 2000);
    } catch (err) {
      console.error("Failed to reschedule", err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to reschedule appointment");
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="reschedule-loading">Loading appointment details...</div>;
  }

  if (!appointment && !loading) {
    if (!currentId) {
      return (
        <div className="reschedule-page" style={{ padding: 0 }}>
          <div className="reschedule-topbar" style={{ padding: "20px 24px", margin: 0, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center" }}>
            <button className="back-button" onClick={onCancel} style={{ marginRight: "20px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Go Back
            </button>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#1e293b" }}>Select an Appointment to Reschedule</h3>
          </div>
          <div style={{ padding: "24px" }}>
            <Appointments 
              onBook={() => {}} 
              onReschedule={(id) => setCurrentId(id)} 
              isEmbedded={true} 
            />
          </div>
        </div>
      );
    }

    return (
      <div className="reschedule-error">
        <p>Appointment not found or failed to load.</p>
        <button onClick={onCancel} className="btn-cancel">Go Back</button>
      </div>
    );
  }

  // Fallbacks for UI if API doesn't provide them
  const doctorName = doctorDetails?.name || appointment.doctor_name || "Doctor Name";
  const doctorRole = doctorDetails?.specialization || appointment.doctor_specialization || "Specialist";
  const procedure = appointment.visit_reason_display || appointment.appointment_type_display || "Consultation";
  const duration = appointment.duration_minutes ? `${appointment.duration_minutes} Minutes` : "30 Minutes";
  const baseFee = appointment.payment_amount ? `$${appointment.payment_amount}` : "$120.00";

  // Generate days for availability map centered around selected date
  const generateDays = () => {
    const baseDate = formData.appointment_date ? new Date(formData.appointment_date) : new Date();
    // Validate date
    if (isNaN(baseDate.getTime())) return [];
    
    const daysArr = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = -3; i <= 3; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      daysArr.push({
        name: dayNames[d.getDay()],
        date: d.getDate().toString().padStart(2, '0'),
        fullDate: d.toISOString().split('T')[0],
        active: i === 0
      });
    }
    return daysArr;
  };
  
  const mapDays = generateDays();

  const handleDayClick = (fullDate) => {
    setFormData(prev => ({ ...prev, appointment_date: fullDate }));
  };

  return (
    <div className="reschedule-page">
      <div className="reschedule-topbar">
        <button className="back-button" onClick={onCancel}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Book Appointment
        </button>
      </div>

      <div className="reschedule-breadcrumbs">
        <span>Dashboard</span>
        <span className="separator">&gt;</span>
        <span>Appointments</span>
        <span className="separator">&gt;</span>
        <span className="current">Reschedule</span>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Appointment rescheduled successfully! Redirecting...</div>}

      <div className="reschedule-layout">
        {/* Left Pane */}
        <div className="reschedule-left">
          <div className="card form-card">
            <div className="card-header">
              <div className="header-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Reschedule Session
              </div>
              <span className="badge in-progress">In Progress</span>
            </div>

            <form onSubmit={handleSubmit} id="rescheduleForm">
              <div className="form-row">
                <div className="form-group">
                  <label>New Date</label>
                  <div className="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" width="16" height="16">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <input type="date" name="appointment_date" value={formData.appointment_date} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>New Time Slot</label>
                  <div className="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" width="16" height="16">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <select name="time_slot" value={formData.time_slot} onChange={handleChange} required>
                      <option value="">Select Slot</option>
                      {availableSlots.length > 0 ? (
                        availableSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))
                      ) : (
                        <>
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
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group full">
                <label>Reason for Change</label>
                <div className="textarea-with-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" width="16" height="16">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                  <textarea name="reason_for_change" value={formData.reason_for_change} onChange={handleChange} rows="3" required></textarea>
                </div>
              </div>
            </form>
          </div>

          <div className="card map-card">
            <div className="map-header">
              <span>Availability Map</span>
              <div className="map-nav">
                <button>&lt;</button>
                <button>&gt;</button>
              </div>
            </div>
            <div className="map-days">
              {mapDays.map((day, idx) => (
                <div key={idx} className={`map-day ${day.active ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => handleDayClick(day.fullDate)}>
                  <span className="day-name">{day.name}</span>
                  <div className="day-box">
                    <span className="day-num">{day.date}</span>
                    {day.active && formData.time_slot && (
                      <span className="day-time">
                        {formData.time_slot.split(' ')[0]}<br/>{formData.time_slot.split(' ')[1]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane */}
        <div className="reschedule-right">
          <div className="card doctor-card">
            <div className="doctor-header-bg"></div>
            <div className="doctor-profile">
              <img src="https://via.placeholder.com/80" alt="Doctor" className="doctor-avatar" />
              <h3>{doctorName}</h3>
              <p className="doctor-role">{doctorRole}</p>
              
              <div className="doctor-stats">
                <div className="stat">
                  <span className="stat-label">Rating</span>
                  <span className="stat-value">⭐ 4.9</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat">
                  <span className="stat-label">Experience</span>
                  <span className="stat-value">12+ Years</span>
                </div>
              </div>

              <div className="doctor-contact">
                <div className="contact-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" width="16" height="16">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>St. Mary's Orthopedic Wing</span>
                </div>
                <div className="contact-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" width="16" height="16">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>+1 (555) 092-4822</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card summary-card">
            <h4>Summary</h4>
            <div className="summary-row">
              <span className="summary-label">Procedure</span>
              <span className="summary-value bold">{procedure}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Duration</span>
              <span className="summary-value bold">{duration}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Base Fee</span>
              <span className="summary-value bold">{baseFee}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span className="summary-label bold">Total Due</span>
              <span className="summary-value purple">{baseFee}</span>
            </div>
          </div>

          <button type="submit" form="rescheduleForm" className="btn-confirm-reschedule" disabled={saving}>
            {saving ? "Confirming..." : "Confirm Reschedule"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          
          <button type="button" className="btn-cancel-changes" onClick={onCancel} disabled={saving}>
            Cancel Changes
          </button>
        </div>
      </div>
    </div>
  );
}
