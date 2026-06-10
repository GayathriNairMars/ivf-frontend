import { useState, useEffect } from "react";
import receptionistApi from "../../api/receptionistApi";
import Appointments from "./appointments";
import "./reschedule_appointment.css";
import Icon from "../../components/Icons";
import doctorAvatar from "../../assets/doctor_avatar.png";


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
          <div className="reschedule-appt-breadcrumbs">
            <span className="breadcrumb-link" onClick={onCancel}>
              <Icon name="appointments" />
              Appointment management
            </span>
            <span className="breadcrumb-separator">&gt;</span>
            <span className="breadcrumb-current">Reschedule appointment</span>
          </div>

          <div className="reschedule-appt-header">
            <h2 className="reschedule-appt-title">
              Reschedule Appointment
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" style={{ marginLeft: '8px', color: '#6366f1' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </h2>
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

  // Get patient information from appointment data
  const patientName = appointment.patient_name || "N/A";
  const appointmentIdDisplay = appointment.appointment_id || appointment.id || "N/A";
  const patientId = appointment.patient_mrn || appointment.patient || "N/A";
  const patientPhone = appointment.patient_phone || "N/A";
  const rawQr = appointment.qr_code_base64 || null;
  const qrCodeBase64 = rawQr ? rawQr.replace(/^data:image\/png;base64,data:image\/png;base64,/, "data:image/png;base64,") : null;
  const doctorCode = appointment.doctor || "-";
  const doctorName = appointment.doctor_name || "-";
  const doctorSpecialty = appointment.doctor_specialization || "-";
  // Generate days for availability map
  const generateDays = () => {
    const baseDate = formData.appointment_date ? new Date(formData.appointment_date) : new Date();
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
      <div className="reschedule-breadcrumbs">
        <span className="breadcrumb-link" onClick={onCancel}>
        <Icon name="appointments" />
          Appointment management
        </span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Reschedule appointment</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Reschedule session</span>
      </div>
      <div className="reschedule-topbar">
        <button className="back-button" onClick={onCancel}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Book Appointment
        </button>
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

          {/* Availability Map */}
          <div className="card map-card">
            <div className="map-header">
              <span>Availability Map</span>
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

        {/* Right Pane - QR Code and Patient Info only */}
        <div className="reschedule-right">
          {/* Assigned Doctor Card */}
					<div className="emr-card doctor-card">
						<div className="card-header">Assigned doctor</div>
						<div className="card-body doctor-profile">
							<div className="doctor-avatar-container">
								<img src={doctorAvatar} alt={doctorName} className="doctor-avatar-img" />
								<span className="status-dot green"></span>
							</div>
							<div className="doctor-meta" >
								<h4 className="doctor-name">{doctorName}</h4>
								<span className="doctor-specialty">{doctorSpecialty}</span>
								{doctorCode && (
									<span className="doctor-id-status">
										<span className="doc-id">{doctorCode}</span>
										<span className="bullet">•</span>
										<span className="status-text green">Online</span>
									</span>
								)}
							</div>
						</div>
						<div className="doctor-actions">
							<button className="btn-doctor-msg" onClick={() => alert("Messaging is under construction.")}>
								✉ Message
							</button>
							<button className="btn-doctor-call" onClick={() => alert("Voice call is under construction.")}>
								📞 Voice Call
							</button>
						</div>
					</div>

          {/* Appointment QR Code */}
          <div className="card qr-card">
            <h4>Appointment QR Code</h4>
            <div className="qr-container">
              {qrCodeBase64 ? (
                <img 
                  src={qrCodeBase64} 
                  alt="Appointment QR Code" 
                  className="qr-code-image"
                />
              ) : (
                <div className="qr-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" width="48" height="48">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="8" y1="8" x2="16" y2="16"/>
                    <line x1="16" y1="8" x2="8" y2="16"/>
                  </svg>
                  <p>QR Code not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Patient Information */}
          <div className="card patient-info-card">
            <h4>Patient Information</h4>
            <div className="patient-info-details">
              <div className="info-row">
                <span className="info-label">Patient Name:</span>
                <span className="info-value">{patientName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Appointment ID:</span>
                <span className="info-value">{appointmentIdDisplay}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Patient ID/MRN:</span>
                <span className="info-value">{patientId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone Number:</span>
                <span className="info-value">{patientPhone}</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
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