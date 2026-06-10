import React, { useState, useEffect, useCallback } from 'react';
import { doctorApi } from '../../api/doctorApi';
import './doctor_calendar.css';
import Icon from '../../components/Icons';
import { CalendarCheck } from 'lucide-react';

// Time slots for the calendar
const TIME_SLOTS = [
	'09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
	'11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
	'02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
	'04:00 PM', '04:30 PM'
];

const DoctorCalendar = ({ onBack }) => {
	// State variables
	const [currentDate, setCurrentDate] = useState(new Date());
	const [calendarData, setCalendarData] = useState([]);
	const [weeklyTotal, setWeeklyTotal] = useState(0);
	const [todaySummary, setTodaySummary] = useState(null);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [showSearchResults, setShowSearchResults] = useState(false);

	// Modal states
	const [selectedAppointment, setSelectedAppointment] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [showRescheduleModal, setShowRescheduleModal] = useState(false);
	const [availableSlots, setAvailableSlots] = useState([]);
	const [rescheduleData, setRescheduleData] = useState({
		new_date: '',
		new_time_slot: '',
		reason: ''
	});

	// Message states
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [actionLoading, setActionLoading] = useState(false);

	// ========== API CALLS ==========

	// Load calendar data using logged-in doctor's own endpoint
	const loadCalendar = useCallback(async () => {
		setLoading(true);
		setError('');

		try {
			const startDate = getStartOfWeek(currentDate);
			const endDate = getEndOfWeek(currentDate);

			const response = await doctorApi.getCalendar(
				formatDate(startDate),
				formatDate(endDate)
			);

			// response.calendar is a flat array of day objects
			if (response && Array.isArray(response.calendar) && response.calendar.length > 0) {
				const calendarDays = response.calendar;
				const total = calendarDays.reduce((sum, day) => sum + (day.total_appointments || 0), 0);
				setCalendarData(calendarDays);
				setWeeklyTotal(total);
				calculateTodaySummary(calendarDays);
			} else {
				setCalendarData([]);
				setWeeklyTotal(0);
				setTodaySummary(null);
			}
		} catch (err) {
			setError('Failed to load calendar: ' + err.message);
		} finally {
			setLoading(false);
		}
	}, [currentDate]);

	// Calculate today's summary from calendar view
	const calculateTodaySummary = (calendarView) => {
		if (!calendarView || calendarView.length === 0) {
			setTodaySummary(null);
			return;
		}

		const today = formatDate(new Date());
		const todayData = calendarView.find(day => day.date === today);

		if (!todayData) {
			setTodaySummary(null);
			return;
		}

		let summaryData = {
			total_appointments: todayData.total_appointments || 0,
			scheduled: 0,
			confirmed: 0,
			in_progress: 0,
			completed: 0,
			cancelled: 0,
			no_show: 0,
			rescheduled: 0
		};

		todayData.slots.forEach(slot => {
			if (slot.appointment) {
				const status = slot.appointment.status;
				switch (status) {
					case 'SCHEDULED':   summaryData.scheduled++;   break;
					case 'CONFIRMED':   summaryData.confirmed++;   break;
					case 'IN_PROGRESS': summaryData.in_progress++; break;
					case 'COMPLETED':   summaryData.completed++;   break;
					case 'CANCELLED':   summaryData.cancelled++;   break;
					case 'NO_SHOW':     summaryData.no_show++;     break;
					case 'RESCHEDULED': summaryData.rescheduled++; break;
					default: break;
				}
			}
		});

		setTodaySummary(summaryData);
	};

	// Search appointments
	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			setShowSearchResults(false);
			return;
		}

		setLoading(true);
		try {
			const response = await doctorApi.searchAppointments(searchQuery);
			const results = Array.isArray(response) ? response : (response.appointments || response.results || []);
			setSearchResults(results);
			setShowSearchResults(true);
		} catch (err) {
			setError('Search failed: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

	// Get appointment details
	const handleViewAppointment = async (appointmentId) => {
		setActionLoading(true);
		try {
			const response = await doctorApi.getAppointment(appointmentId);
			const appointmentDetails = response.details || response.appointment || response;
			setSelectedAppointment({
				appointment: appointmentDetails,
				patient_details: appointmentDetails.patient_details || appointmentDetails.patient || {},
				doctor_details: appointmentDetails.doctor_details || appointmentDetails.doctor || {},
				can_reschedule: appointmentDetails.status !== 'CANCELLED' && appointmentDetails.status !== 'COMPLETED',
				can_cancel: appointmentDetails.status !== 'CANCELLED' && appointmentDetails.status !== 'COMPLETED'
			});
			setShowDetailsModal(true);
		} catch (err) {
			setError('Failed to load appointment details: ' + err.message);
		} finally {
			setActionLoading(false);
		}
	};

	// Get available slots for reschedule
	const handleOpenReschedule = async (appointment) => {
		setSelectedAppointment(appointment);
		setRescheduleData({
			new_date: appointment.appointment?.appointment_date || formatDate(new Date()),
			new_time_slot: appointment.appointment?.time_slot || '',
			reason: ''
		});

		try {
			const slots = await doctorApi.getAvailableSlots(
				appointment.appointment?.appointment_date || formatDate(new Date())
			);
			const slotsList = slots.available_slots || slots.slots || slots || [];
			setAvailableSlots(slotsList);
			setShowDetailsModal(false);
			setShowRescheduleModal(true);
		} catch (err) {
			setError('Failed to load available slots: ' + err.message);
		}
	};

	// Reschedule appointment
	const handleReschedule = async () => {
		if (!rescheduleData.new_date) {
			setError('Please select a new date');
			return;
		}
		if (!rescheduleData.new_time_slot) {
			setError('Please select a time slot');
			return;
		}

		setActionLoading(true);
		setError('');

		try {
			await doctorApi.rescheduleAppointment(
				selectedAppointment.appointment.id,
				{
					new_date: rescheduleData.new_date,
					new_time_slot: rescheduleData.new_time_slot,
					reason: rescheduleData.reason || 'Patient requested'
				}
			);

			setSuccess('Appointment rescheduled successfully!');
			setTimeout(() => {
				setShowRescheduleModal(false);
				setSelectedAppointment(null);
				loadCalendar();
				setSuccess('');
			}, 2000);
		} catch (err) {
			setError('Failed to reschedule: ' + err.message);
		} finally {
			setActionLoading(false);
		}
	};

	// Cancel appointment
	const handleCancelAppointment = async () => {
		if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

		setActionLoading(true);
		try {
			await doctorApi.cancelAppointment(
				selectedAppointment.appointment.id,
				{ reason: 'patient_request', notes: 'Cancelled by doctor' }
			);

			setSuccess('Appointment cancelled successfully!');
			setTimeout(() => {
				setShowDetailsModal(false);
				setSelectedAppointment(null);
				loadCalendar();
				setSuccess('');
			}, 2000);
		} catch (err) {
			setError('Failed to cancel: ' + err.message);
		} finally {
			setActionLoading(false);
		}
	};

	// ========== HELPER FUNCTIONS ==========

	const getStartOfWeek = (date) => {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1);
		return new Date(d.setDate(diff));
	};

	const getEndOfWeek = (date) => {
		const start = getStartOfWeek(date);
		const end = new Date(start);
		end.setDate(start.getDate() + 6);
		return end;
	};

	const formatDate = (date) => date.toISOString().split('T')[0];

	const formatDisplayDate = (dateStr) => {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	};

	const changeWeek = (direction) => {
		const newDate = new Date(currentDate);
		newDate.setDate(currentDate.getDate() + direction * 7);
		setCurrentDate(newDate);
	};

	const getStatusColor = (status) => {
		const colors = {
			'SCHEDULED':   '#FFA500',
			'CONFIRMED':   '#2196F3',
			'IN_PROGRESS': '#FF9800',
			'COMPLETED':   '#4CAF50',
			'CANCELLED':   '#F44336',
			'NO_SHOW':     '#9E9E9E',
			'RESCHEDULED': '#9C27B0'
		};
		return colors[status] || '#757575';
	};

	const getStatusIcon = (status) => {
		const icons = {
			'SCHEDULED':   '🟠',
			'CONFIRMED':   '🔵',
			'IN_PROGRESS': '🟡',
			'COMPLETED':   '🟢',
			'CANCELLED':   '🔴',
			'NO_SHOW':     '⚪',
			'RESCHEDULED': '🟣'
		};
		return icons[status] || '⚪';
	};

	// ========== EFFECTS ==========

	useEffect(() => {
		loadCalendar();
	}, [loadCalendar]);

	// ========== RENDER HELPERS ==========

	const renderWeekDays = () => {
		const start = getStartOfWeek(currentDate);
		return Array.from({ length: 7 }, (_, i) => {
			const day = new Date(start);
			day.setDate(start.getDate() + i);
			return day;
		});
	};

	const getAppointmentForSlot = (dayDate, timeSlot) => {
		const dayData = calendarData.find(d => d.date === dayDate);
		if (!dayData || !dayData.slots) return null;
		const slotData = dayData.slots.find(s => s.time === timeSlot);
		return slotData?.appointment || null;
	};

	const weekDays = renderWeekDays();
	const startDate = getStartOfWeek(currentDate);
	const endDate = getEndOfWeek(currentDate);

	return (
		<div className="physician-calendar">
			{/* Header */}
			<div className="calendar-header">
				<h2 className="calendar-title">
					<CalendarCheck />My Calendar
				</h2>
			</div>
			<h3><p className="summary-title">Appointment Management Dashboard</p></h3>

			{/* Control Bar — no doctor selector */}
			<div className="control-bar">
				<div className="week-controls">
					<button onClick={() => changeWeek(-1)} className="nav-btn">◀ Previous</button>
					<span className="week-range">
						{formatDisplayDate(formatDate(startDate))} - {formatDisplayDate(formatDate(endDate))}
					</span>
					<button onClick={() => changeWeek(1)} className="nav-btn">Next ▶</button>
				</div>

				<div className="search-box">
					<input
						type="text"
						placeholder="🔍 Search by name, ID or MRN..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
					/>
					<button onClick={handleSearch} className="search-btn">Search</button>
				</div>
			</div>


			{/* Messages */}
			{error && <div className="error-message">❌ {error}</div>}
			{success && <div className="success-message">✅ {success}</div>}

			{/* Search Results */}
			{showSearchResults && searchResults.length > 0 && (
				<div className="search-results">
					<h4>Search Results ({searchResults.length})</h4>
					{searchResults.map(apt => (
						<div key={apt.id} className="search-result-item" onClick={() => handleViewAppointment(apt.id)}>
							<span>{getStatusIcon(apt.status)}</span>
							<strong>{apt.patient_name || apt.name}</strong> - {apt.appointment_id || apt.id} - {apt.time_slot || apt.appointment_time}
						</div>
					))}
					<button onClick={() => setShowSearchResults(false)} className="close-results">Close</button>
				</div>
			)}

			{/* Summary Cards */}
			<div className="summary-section">
				{/* <h3 className="summary-title">Appointment Summary</h3> */}
				<div className="summary-cards">
					<div className="summary-card primary">
						<div className="count">{weeklyTotal || 0}</div>
						<div className="label">Total Weekly Appointments</div>
					</div>

					{todaySummary && (
						<>
							<div className="summary-card">
								<div className="count">{todaySummary.total_appointments || 0}</div>
								<div className="label">Today's Appointments</div>
							</div>
							<div className="summary-card">
								<div className="count">{todaySummary.scheduled || 0}</div>
								<div className="label">Scheduled</div>
							</div>
							<div className="summary-card">
								<div className="count">{todaySummary.confirmed || 0}</div>
								<div className="label">Confirmed</div>
							</div>
							<div className="summary-card">
								<div className="count">{todaySummary.in_progress || 0}</div>
								<div className="label">In Progress</div>
							</div>
							<div className="summary-card">
								<div className="count">{todaySummary.completed || 0}</div>
								<div className="label">Completed</div>
							</div>
							<div className="summary-card">
								<div className="count">{todaySummary.cancelled || 0}</div>
								<div className="label">Cancelled</div>
							</div>
						</>
					)}
				</div>
			</div>
			
			{/* Status Legend */}
			<div className="legend">
				<span className="legend-item"><span className="legend-color" style={{ background: '#FFA500' }}></span> Scheduled</span>
				<span className="legend-item"><span className="legend-color" style={{ background: '#2196F3' }}></span> Confirmed</span>
				<span className="legend-item"><span className="legend-color" style={{ background: '#FF9800' }}></span> In Progress</span>
				<span className="legend-item"><span className="legend-color" style={{ background: '#4CAF50' }}></span> Completed</span>
				<span className="legend-item"><span className="legend-color" style={{ background: '#F44336' }}></span> Cancelled</span>
				<span className="legend-item"><span className="legend-color" style={{ background: '#9C27B0' }}></span> Rescheduled</span>
			</div>

			{/* Calendar Grid */}
			<div className="calendar-grid">
				{loading ? (
					<div className="loading">Loading calendar...</div>
				) : (
					<table className="calendar-table">
						<thead>
							<tr>
								<th>TIME</th>
								{weekDays.map((day, idx) => (
									<th key={idx}>
										{day.toLocaleDateString('en-US', { weekday: 'short' })}
										<br />
										<small>{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{TIME_SLOTS.map((timeSlot, timeIdx) => (
								<tr key={timeIdx}>
									<td className="time-slot">{timeSlot}</td>
									{weekDays.map((day, dayIdx) => {
										const dayDate = formatDate(day);
										const appointment = getAppointmentForSlot(dayDate, timeSlot);
										const isToday = dayDate === formatDate(new Date());

										return (
											<td key={dayIdx} className={`slot-cell ${isToday ? 'today' : ''}`}>
												{appointment ? (
													<div
														className="appointment-card"
														style={{ borderLeftColor: getStatusColor(appointment.status) }}
														onClick={() => handleViewAppointment(appointment.id)}
													>
														<div className="appointment-patient">
															{getStatusIcon(appointment.status)} {appointment.patient_name}
														</div>
														<div className="appointment-time">
															ID: {appointment.appointment_id || appointment.id}
														</div>
														<div className="appointment-status" style={{ background: getStatusColor(appointment.status) }}>
															{appointment.status_display || appointment.status}
														</div>
													</div>
												) : (
													<div className="free-slot">+ Available</div>
												)}
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Appointment Details Modal */}
			{showDetailsModal && selectedAppointment && (
				<div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
					<div className="modal" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3>Appointment Details</h3>
							<button className="close-btn" onClick={() => setShowDetailsModal(false)}>✕</button>
						</div>
						<div className="modal-body">
							<div className="info-row">
								<span className="info-label">🏥 Appointment ID:</span>
								<span className="info-value">{selectedAppointment.appointment?.appointment_id || selectedAppointment.appointment?.id}</span>
							</div>
							<div className="info-row">
								<span className="info-label">👤 Patient:</span>
								<span className="info-value">
									{selectedAppointment.appointment?.patient_name || selectedAppointment.patient_details?.full_name}
									{selectedAppointment.appointment?.patient_mrn && ` (MRN: ${selectedAppointment.appointment.patient_mrn})`}
								</span>
							</div>
							<div className="info-row">
								<span className="info-label">📅 Date:</span>
								<span className="info-value">{formatDisplayDate(selectedAppointment.appointment?.appointment_date)}</span>
							</div>
							<div className="info-row">
								<span className="info-label">⏰ Time:</span>
								<span className="info-value">{selectedAppointment.appointment?.time_slot || selectedAppointment.appointment?.time}</span>
							</div>
							<div className="info-row">
								<span className="info-label">📍 Status:</span>
								<span className="info-value" style={{ color: getStatusColor(selectedAppointment.appointment?.status) }}>
									{getStatusIcon(selectedAppointment.appointment?.status)} {selectedAppointment.appointment?.status_display || selectedAppointment.appointment?.status}
								</span>
							</div>
							<div className="info-row">
								<span className="info-label">💊 Reason:</span>
								<span className="info-value">{selectedAppointment.appointment?.visit_reason || selectedAppointment.appointment?.reason || 'Not specified'}</span>
							</div>
						</div>
						<div className="modal-actions">
							{selectedAppointment.can_reschedule && selectedAppointment.appointment?.status !== 'CANCELLED' && (
								<button className="btn-primary" onClick={() => handleOpenReschedule(selectedAppointment)}>
									Reschedule
								</button>
							)}
							{selectedAppointment.can_cancel && selectedAppointment.appointment?.status !== 'CANCELLED' && (
								<button className="btn-danger" onClick={handleCancelAppointment} disabled={actionLoading}>
									{actionLoading ? 'Processing...' : 'Cancel Appointment'}
								</button>
							)}
							<button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
						</div>
					</div>
				</div>
			)}

			{/* Reschedule Modal */}
			{showRescheduleModal && selectedAppointment && (
				<div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
					<div className="modal" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3>Reschedule Appointment</h3>
							<button className="close-btn" onClick={() => setShowRescheduleModal(false)}>✕</button>
						</div>
						<div className="modal-body">
							<div className="current-appointment">
								<strong>Current Appointment:</strong>
								<p>📅 {formatDisplayDate(selectedAppointment.appointment?.appointment_date)} at {selectedAppointment.appointment?.time_slot || selectedAppointment.appointment?.time}</p>
							</div>

							<div className="form-group">
								<label>New Date:</label>
								<input
									type="date"
									value={rescheduleData.new_date}
									onChange={(e) => {
										const newDate = e.target.value;
										setRescheduleData(prev => ({ ...prev, new_date: newDate, new_time_slot: '' }));
										doctorApi.getAvailableSlots(newDate)
											.then(res => {
												const slots = res.available_slots || res.slots || res || [];
												setAvailableSlots(slots);
											})
											.catch(err => console.error(err));
									}}
									min={formatDate(new Date())}
								/>
							</div>

							<div className="form-group">
								<label>New Time Slot:</label>
								<select
									value={rescheduleData.new_time_slot}
									onChange={(e) => setRescheduleData(prev => ({ ...prev, new_time_slot: e.target.value }))}
								>
									<option value="">Select time slot</option>
									{availableSlots.map((slot, idx) => (
										<option key={idx} value={slot.time || slot}>{slot.time || slot}</option>
									))}
								</select>
							</div>

							<div className="form-group">
								<label>Reason (Optional):</label>
								<textarea
									value={rescheduleData.reason}
									onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
									rows="3"
									placeholder="Enter reason for rescheduling..."
								/>
							</div>
						</div>
						<div className="modal-actions">
							<button className="btn-secondary" onClick={() => setShowRescheduleModal(false)}>Cancel</button>
							<button className="btn-primary" onClick={handleReschedule} disabled={actionLoading}>
								{actionLoading ? 'Processing...' : 'Confirm Reschedule'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DoctorCalendar;