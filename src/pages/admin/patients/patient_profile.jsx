import { useState,useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import patientApi from "../../../api/patientApi";
import { STATUS_COLORS,PATIENT_STATUSES } from "../../../constants/constants";
import "../staff/staff.css"
import "./patient.css"


function InfoRow({label,value}) {
	return (
		<div className="info-row">
			<span className="info-label">{label}</span>
			<span className="info-value">{value || "-"}</span>
		</div>
	);
}

export default function PatientProfile() {
	const {id} = useParams();
	const navigate = useNavigate();
	const [patient,setPatient] = useState(null);
	const [loading,setLoading] = useState(true);
	const [updating,setUpdating] = useState(false);

	useEffect(() => {
		patientApi.getPatientDetails(id)
			.then((data) => setPatient(data))
			.catch(() => navigate("/superadmin/patients"))
			.finally(() => setLoading(false));
	}, [id]);

	const handleStatusChange = async (newStatus) => {
		setUpdating(true);
		try{
			await patientApi.updatePatientStatus(id, newStatus);
			setPatient(prev => ({...prev,status:newStatus, status_display:PATIENT_STATUSES.find(s => s.value === newStatus)?.label}));
		} catch {
			alert("Failed to update status.");
		} finally {
			setUpdating(false);
		}
	};

	if (loading) return <div className="staff-loading"><div className="spinner"/><span>Loading patient...</span></div>
	if (!patient) return null;

	const sc = STATUS_COLORS[patient.status] || STATUS_COLORS.PEN;

	return (
		<div className="patient-profile-page">
			{/* Header */}
			<div className="patient-header">
				<button className="btn-back" onClick={() => navigate("/superadmin/patients/")}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
						<polyline points="15,18,9,12,15,6" />
					</svg>
					Back to Patients
				</button>
				<div style={{flex:1}}>
					<h2 className="patient-name">{patient.user?.full_name}</h2>
					<p className="patient_id">{patient.patient_id}</p>
				</div>
				<button className="btn-edit" onClick={() => navigate(`/superadmin/patients/${id}/edit/`)}>
					Edit Profile
				</button>
			</div>

			{/* Identity card */}
			<div className="patient-identity-card">
				<div className="identity-avatar" style={{background:"#0ea5e9",width:56,height:56,fontSize:"1.2rem"}}>
					{patient.user?.full_name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}
				</div>
				<div className="identity-info">
					<span className="identity-name">{patient.user?.full_name}</span>
					<span className="identity-email">{patient.user?.email}  |  </span>					
					{patient.phone && <span className="identity-email"> 📞 {patient.phone}</span>}
				</div>
				<div style={{display:"flex",flexDirection:"column", gap:8, alignItems:"flex-end"}}>
					<span className="patient-id-pill">{patient.patient_id}</span>
					<span className="status-badge" style={{background:sc.bg, color: sc.color}}>{sc.label}</span>
				</div>
			</div>
			<div className="profile-grid">
				{/* Personal Info */}
				<div className="form-card">
					<h3 className="form-section-title">Personal Information</h3>
					<InfoRow label="Date of Birth" value={patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString("en-IN", {day:"2-digit",month:"long",year:"numeric"}) : null} />
					<InfoRow label="Age" value={patient.age? `${patient.page} years` : null} />
					<InfoRow label="Gender" value={patient.gender_display} />
					<InfoRow label="Blood Group" value={patient.blood_group} />
					<InfoRow label="Address" value={patient.address} />
				</div>

				{/* Treatment Info */}
				<div className="form-card">
					<h3 className="form-section-title">Treatment Details</h3>
					<InfoRow label="Treatment Type" value={patient.treatment_type_display} />
					<InfoRow label="Assigned Doctor" value={patient.assigned_doctor?.full_name} />
					<InfoRow label="Doctor Role" value={patient.assigned_doctor?.role_display} />
					<InfoRow label="Registered On" value={patient.registered_on? new Date(patient.registered_on).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}) : null } />

					{/* Status changer */}
					<div className="info-row" style={{ alignItems: "center" }}>
						<span className="info-label">Status</span>
						<select className="filter-select"
								value={patient.status}
								onChange={e => handleStatusChange(e.target.value)}
								disabled={updating}
								style={{fontSize: "0.8rem"}}
						>
							{PATIENT_STATUSES.map(s => (
								<option key={s.value} value={s.value}>{s.label}</option>
							))}
						</select>
					</div>
				</div>

				{/* Emergency Contact */}
				<div className="form-card">
					<h3 className="form-section-title">Emergency Contact</h3>
					<InfoRow label="Name" value={patient.emergency_contact_name} />
					<InfoRow label="Phone" value={patient.emergency_contact_phone} />
				</div>

				{/* Partner */}
				<div className="form-card">
					<h3 className="form-section-title">Partner / Couple Linkage</h3>
					{patient.partner_info? (
						<>
							<InfoRow label="Partner Name" value={patient.partner_info.full_name} />
							<InfoRow label="Partner Patient ID" value={patient.partner_info.patient_id} />
							<InfoRow label="Partner Email" value={patient.partner_info.email} />
							<button className="btn-secondary" style={{marginTop: 12, fontSize: "0.8rem"}} onClick={async () => {
								await patientApi.unlinkPartner(id);
								setPatient(prev => ({...prev, partner_info: null, partner: null}));
							}}>
								Unlink Partner
							</button>
						</>
					) : (
						<p className="field-hint">No partner linked yet. You can link a partner from the Edit Profile page.</p>
					)}
				</div>
				{/* Notes */}
				{patient.notes && (
					<div className="form-card" style={{gridColumn: "1 / -1"}}>
						<h3 className="form-section-title">Notes</h3>
						<p style={{fontSize:"0.875rem",color:"var(--text-2)", lineHeight:1.6}}>{patient.notes}</p>
					</div>
				)}
			</div>
		</div>
	);
}