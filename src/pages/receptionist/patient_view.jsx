// Full Patient View for Receptionist (Separated from Admin EMR)
import { useState, useEffect, useCallback } from "react";
import receptionistApi from "../../api/receptionistApi";
import "../admin/emr/patient_emr.css";
import doctorAvatar from "../../assets/doctor_avatar.png";
import { FolderOpen, Calendar, Activity, CheckCircle, Clock } from "lucide-react";

export default function PatientView({ patient: initialPatient, onBack, onEditDetails }) {
	const [historyData, setHistoryData] = useState(null);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			// Fetches { patient, total_tickets, tickets }
			const data = await receptionistApi.getPatientHistory(initialPatient.id);
			setHistoryData(data);
		} catch (err) {
			console.error("Failed to load patient history:", err);
		} finally {
			setLoading(false);
		}
	}, [initialPatient.id]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Use updated patient info from history API if available, else fallback
	const patient = historyData?.patient || initialPatient;
	const tickets = historyData?.tickets || [];

	// Assigned Doctor calculations
	const doctorName = patient.assigned_doctor_name || patient.assigned_doctor?.full_name || "Unassigned";
	const doctorSpecialty = patient.assigned_doctor?.role_display || "Consultant";
	const doctorCode = patient.assigned_doctor?.id ? `DOC-${patient.assigned_doctor.id}` : "";
	const doctorAvatarUrl = patient.assigned_doctor?.avatar_url || doctorAvatar;

	// Birth Details & Age
	const getAge = (dob) => {
		if (!dob) return "";
		const birth = new Date(dob);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const m = today.getMonth() - birth.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return `${age} Yrs`;
	};
	const ageStr = patient.date_of_birth ? getAge(patient.date_of_birth) : "";
	const displayAge = patient.age !== undefined && patient.age !== null ? `${patient.age} Yrs` : ageStr;

	const treatmentDay = patient.treatment_day || (patient.registered_on 
		? `Day ${Math.max(1, Math.floor((new Date() - new Date(patient.registered_on)) / (1000 * 60 * 60 * 24)))} of Treatment` 
		: "Treatment Started");

	// Status icon helper for tickets
	const getStatusIcon = (status) => {
		switch(status) {
			case 'DONE': return <CheckCircle size={16} color="#10b981" />;
			case 'IN_CONSULT': return <Activity size={16} color="#3b82f6" />;
			case 'WAITING': return <Clock size={16} color="#f59e0b" />;
			default: return <Clock size={16} color="#64748b" />;
		}
	};

	return (
		<div className="emr-page-container">
			{/* Breadcrumbs */}
			<div className="emr-breadcrumbs">
				<span className="breadcrumb-folder" style={{ cursor: "pointer" }} onClick={onBack}>
          <FolderOpen size={20} strokeWidth={2} />
					 Patients</span>
				<span className="breadcrumb-arrow"> &gt; </span>
				<span className="breadcrumb-current">Patient details</span>
			</div>

			{/* Patient Header Row */}
			<div className="emr-patient-header">
				<div className="header-left">
					<div className="patient-title-row">
						<h1>{patient.user?.full_name || patient.full_name}</h1>
						<span className="patient-id-badge">{patient.patient_id}</span>
					</div>
					<div className="patient-subtitle-row">
						<span className="sync-icon">🔄</span>
						<span className="treatment-type">{patient.treatment_type_display || patient.treatment_type || "Active Treatment"}</span>
						<span className="divider-line">|</span>
						<span className="treatment-day">{treatmentDay}</span>
					</div>
				</div>
				<div className="header-right">
					{/* Removed + Create EMR button as requested */}
					<button className="btn-add-note" onClick={() => alert("Add Note is under construction.")}>
						+ Add note
					</button>
				</div>
			</div>

			{/* Main Grid: Patient Info & Sidebar */}
			<div className="emr-grid-container">
				{/* Left Card: Patient Information */}
				<div className="emr-card patient-info-card">
					<div className="card-header">
						<h3>Patient Information</h3>
						<button className="btn-edit-details" onClick={onEditDetails}>
							Edit Details
						</button>
					</div>
					<div className="card-body info-grid">
						<div className="info-item">
							<span className="info-label">Patient ID</span>
							<span className="info-value">{patient.patient_id || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Full Name</span>
							<span className="info-value">{patient.user?.full_name || patient.full_name || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Gender</span>
							<span className="info-value">{patient.gender_display || patient.gender || "-"}</span>
						</div>
						{displayAge && (
							<div className="info-item">
								<span className="info-label">Age</span>
								<span className="info-value">{displayAge}</span>
							</div>
						)}
						<div className="info-item">
							<span className="info-label">Blood Group</span>
							<span className="info-value">{patient.blood_group || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Contact</span>
							<span className="info-value">{patient.phone || patient.user?.phone || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Email</span>
							<span className="info-value">{patient.email || patient.user?.email || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Address</span>
							<span className="info-value">{patient.address || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Registered On</span>
							<span className="info-value">
								{patient.registered_on ? new Date(patient.registered_on).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
							</span>
						</div>
						<div className="info-item">
							<span className="info-label">Treatment Status</span>
							<span className="info-value">{patient.status === 'ACT' ? 'Active' : patient.status || "-"}</span>
						</div>
					</div>
				</div>

				{/* Right Column: Doctor & Clinical Notes */}
				<div className="emr-sidebar-column">
					{/* Assigned Doctor Card */}
					<div className="emr-card doctor-card">
						<div className="card-header">Assigned doctor</div>
						<div className="card-body doctor-profile">
							<div className="doctor-avatar-container">
								<img src={doctorAvatarUrl} alt={doctorName} className="doctor-avatar-img" />
								<span className="status-dot green"></span>
							</div>
							<div className="doctor-meta">
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

					{/* Clinical Notes Card */}
					<div className="emr-card clinical-notes-card" onClick={() => alert("Clinical Notes section is under construction.")}>
						<div className="clinical-notes-trigger">
							<span className="trigger-label">Clinical Notes</span>
							<span className="badge-count">0</span>
							<span className="trigger-arrow">&gt;</span>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Card: Visit History (Tickets) */}
			<div className="emr-card treatment-log-card">
				<div className="card-header-flex">
					<div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
						<h3>Visit History</h3>
					</div>
				</div>

				<div className="card-body">
					{loading ? (
						<div className="staff-loading"><div className="spinner"/><span>Loading visits...</span></div>
					) : tickets.length === 0 ? (
						<div className="staff-empty">
							<div className="empty-icon">🎫</div>
							<p>No visit history found for this patient.</p>
						</div>
					) : (
						<div className="table-wrap" style={{ boxShadow: "none", borderRadius: 0, padding: 0 }}>
							<table className="emr-table">
								<thead>
									<tr>
										<th>Date</th>
										<th>Department</th>
										<th>Reason</th>
										<th>Doctor</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{tickets.map(t => (
										<tr key={t.id}>
											<td style={{fontWeight: 500}}>
												<div style={{display: "flex", alignItems: "center", gap: "8px"}}>
													<Calendar size={16} color="var(--text-2)" />
													{t.date ? new Date(t.date).toLocaleDateString("en-US", {day:"2-digit", month:"short", year:"numeric"}) : "-"}
												</div>
											</td>
											<td style={{color: "var(--text-2)"}}>
												{t.department_name || "-"}
											</td>
											<td style={{fontWeight: 500}}>
												{t.visit_reason_display || t.visit_reason || "-"}
											</td>
											<td style={{color: "var(--text-2)"}}>
												{t.doctor_name || "-"}
											</td>
											<td>
												<span style={{
													display: "inline-flex", 
													alignItems: "center", 
													gap: "6px",
													padding: "4px 8px",
													borderRadius: "12px",
													fontSize: "0.8rem",
													fontWeight: 600,
													backgroundColor: t.status === 'DONE' ? '#ecfdf5' : (t.status === 'IN_CONSULT' ? '#eff6ff' : '#fffbeb'),
													color: t.status === 'DONE' ? '#10b981' : (t.status === 'IN_CONSULT' ? '#3b82f6' : '#f59e0b')
												}}>
													{getStatusIcon(t.status)}
													{t.status_display || t.status}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
