// Full EMR view for a selected Patient
import { useState, useEffect, useCallback } from "react";
import patientApi from "../../../api/patientApi";
import AddEMRRecord from "./add_emrrecord";
import EMRRecordDetail from "./emrrecord_detail";
import HistoryDocuments from "./historydocs";
import "./patient_emr.css";
import doctorAvatar from "../../../assets/doctor_avatar.png";
import { FolderOpen } from "lucide-react";

const TYPE_ICONS = {
  CONSULTATION:     "🩺",
  DIAGNOSIS:        "📋",
  PRESCRIPTION:     "💊",
  LAB_RESULT:       "🧪",
  SCAN:             "🖥️",
  PROCEDURE:        "🔬",
  CYCLE:            "🔄",
  NURSING_NOTE:     "🩹",
  PHARMACY_NOTE:    "💉",
  ANDROLOGY_NOTE:   "🔭",
  COUNSELLING_NOTE: "💬",
  OTHER:            "📄",
};

export default function PatientEMR({ patient, onBack }) {
	const [summary, setSummary] = useState(null);
	const [records, setRecords] = useState([]);
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState("list");
	const [tab, setTab] = useState("timeline");
	const [typeFilter, setTypeFilter] = useState("");
	const [selectedRecord, setSelectedRecord] = useState(null);

	const loadSummary = useCallback(async () => {
		try {
			const data = await patientApi.getEmrSummary(patient.id);
			setSummary(data);
		} catch {}
	}, [patient.id]);

	const loadRecords = useCallback(async () => {
		setLoading(true);
		try {
			const params = typeFilter ? `?record_type=${typeFilter}` : "";
			const data = await patientApi.getEmrRecords(patient.id, params);
			setRecords(data.records || []);
		} catch {
			setRecords([]);
		} finally {
			setLoading(false);
		}
	}, [patient.id, typeFilter]);

	useEffect(() => {
		loadSummary();
	}, [loadSummary]);

	useEffect(() => {
		if (tab === "timeline") loadRecords();
	}, [loadRecords, tab]);

	const handleRecordAdded = () => {
		setView("list");
		loadRecords();
		loadSummary();
	};

	// Assigned Doctor calculations
	const doctorName = patient.assigned_doctor?.full_name || "Dr. Sarah Thomas";
	const doctorSpecialty = patient.assigned_doctor?.role === "END" 
		? "Senior Endocrinologist" 
		: (patient.assigned_doctor?.role_display || "Senior Endocrinologist");
	const doctorCode = `DOC-${patient.assigned_doctor?.id || '8821'}`;
	const doctorAvatarUrl = patient.assigned_doctor?.avatar_url || doctorAvatar;

	// Birth Details calculations
	const getAge = (dob) => {
		if (!dob) return "31 Yrs";
		const birth = new Date(dob);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const m = today.getMonth() - birth.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return `${age} Yrs`;
	};
	const dobFormatted = patient.date_of_birth 
		? new Date(patient.date_of_birth).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) 
		: "Not given";
	const ageStr = patient.date_of_birth ? getAge(patient.date_of_birth) : "Not given";
	const birthDetails = `${dobFormatted} (${ageStr})`;

	// Treatment Day calculation
	const treatmentDay = patient.treatment_day || (patient.registered_on 
		? `Day ${Math.max(1, Math.floor((new Date() - new Date(patient.registered_on)) / (1000 * 60 * 60 * 24)))} of Treatment` 
		: "Day N of Treatment");
	if (view==="add") {
		return (
			<AddEMRRecord
			patient={patient}
			onBack={() => setView("list")}
			onSuccess={handleRecordAdded}
			/>
		);
	}
	return (
		<div className="emr-page-container">
			{/* Breadcrumbs */}
			<div className="emr-breadcrumbs">
				<span className="breadcrumb-folder" style={{ cursor: "pointer" }} onClick={onBack}>
          <FolderOpen size={20} strokeWidth={2} />
					 EMR</span>
				<span className="breadcrumb-arrow"> &gt; </span>
				<span className="breadcrumb-current">Patient details</span>
			</div>

			{/* Patient Header Row */}
			<div className="emr-patient-header">
				<div className="header-left">
					<div className="patient-title-row">
						<h1>{patient.user?.full_name}</h1>
						<span className="patient-id-badge">{patient.patient_id}</span>
					</div>
					<div className="patient-subtitle-row">
						<span className="sync-icon">🔄</span>
						<span className="treatment-type">{patient.treatment_type_display || patient.treatment_type || "Embryo Transfer"}</span>
						<span className="divider-line">|</span>
						<span className="treatment-day">{treatmentDay}</span>
					</div>
				</div>
				<div className="header-right">
					<button className="btn-add-note" onClick={() => setView("add")}>
						+ Add note
					</button>
					<button className="btn-create-emr" onClick={() => setView("add")}>
						+ Create EMR
					</button>
				</div>
			</div>

			{/* Main Grid: Patient Info & Sidebar */}
			<div className="emr-grid-container">
				{/* Left Card: Patient Information */}
				<div className="emr-card patient-info-card">
					<div className="card-header">
						<h3>Patient Information</h3>
						<button className="btn-edit-details" onClick={() => alert("Edit Details is under construction.")}>
							Edit Details
						</button>
					</div>
					<div className="card-body info-grid">
						<div className="info-item">
							<span className="info-label">Patient ID</span>
							<span className="info-value">{patient.patient_id || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Partner</span>
							<span className="info-value">
								{patient.partner_info 
									? `${patient.partner_info.full_name} (${patient.partner_info.age || "N/A"})` 
									: (patient.partner_name ? `${patient.partner_name} (34)` : "-")}
							</span>
						</div>
						<div className="info-item">
							<span className="info-label">Full Name</span>
							<span className="info-value">{patient.user?.full_name || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Gender</span>
							<span className="info-value">{patient.gender_display || patient.gender || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Age</span>
							<span className="info-value">{patient.age !== undefined && patient.age !== null ? `${patient.age} Yrs` : ageStr}</span>
						</div>
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
							<span className="info-value">{patient.user?.email || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Birth Details</span>
							<span className="info-value">{birthDetails}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Address</span>
							<span className="info-value">{patient.address || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Emergency Contact</span>
							<span className="info-value">
								{patient.emergency_contact_name ? `${patient.emergency_contact_name} ` : ""}
								{patient.emergency_contact_phone ? `(${patient.emergency_contact_phone})` : "-"}
							</span>
						</div>
						<div className="info-item">
							<span className="info-label">Insurance Policy</span>
							<span className="info-value">{patient.insurance_policy_number || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Insurance Details</span>
							<span className="info-value">{patient.insurance_details || "-"}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Treatment Type</span>
							<span className="info-value">{patient.treatment_type_display || patient.treatment_type || "-"}</span>
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
								<span className="doctor-id-status">
									<span className="doc-id">{doctorCode}</span>
									<span className="bullet">•</span>
									<span className="status-text green">Online</span>
								</span>
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
							<span className="badge-count">2</span>
							<span className="trigger-arrow">&gt;</span>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Card: Treatment Log & Sub-sections */}
			<div className="emr-card treatment-log-card">
				<div className="card-header-flex">
					<div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
						<h3>
							{view === "detail" ? "Record Detail" : view === "add" ? "Add EMR Record" : "Treatment Log"}
						</h3>
						{view === "list" && (
							<div className="tab-switcher" style={{ display: "flex", gap: "8px" }}>
								<button
									onClick={() => setTab("timeline")}
									style={{
										padding: "6px 14px",
										borderRadius: "6px",
										border: "none",
										background: tab === "timeline" ? "var(--accent)" : "transparent",
										color: tab === "timeline" ? "#fff" : "var(--text-2)",
										fontWeight: 600,
										cursor: "pointer",
										fontSize: "0.85rem",
										transition: "all 0.15s ease"
									}}
								>
									Timeline
								</button>
								<button
									onClick={() => setTab("history")}
									style={{
										padding: "6px 14px",
										borderRadius: "6px",
										border: "none",
										background: tab === "history" ? "var(--accent)" : "transparent",
										color: tab === "history" ? "#fff" : "var(--text-2)",
										fontWeight: 600,
										cursor: "pointer",
										fontSize: "0.85rem",
										transition: "all 0.15s ease"
									}}
								>
									History Docs
								</button>
							</div>
						)}
					</div>
					{view === "list" && tab === "timeline" && (
						<select 
							className="log-filter-select"
							value={typeFilter}
							onChange={e => setTypeFilter(e.target.value)}
						>
							<option value="">All types</option>
							{Object.entries(TYPE_ICONS).map(([code]) => (
								<option key={code} value={code}>{code.replace(/_/g," ")}</option>
							))}
						</select>
					)}
				</div>

				<div className="card-body">
					{view === "add" ? (
						<AddEMRRecord
							patient={patient}
							onBack={() => setView("list")}
							onSuccess={handleRecordAdded}
						/>
					) : view === "detail" && selectedRecord ? (
						<EMRRecordDetail 
							record={selectedRecord}
							patient={patient}
							onBack={() => { setView("list"); setSelectedRecord(null); }}
							onDeleted={() => { setView("list"); setSelectedRecord(null); loadRecords(); loadSummary(); }}
						/>
					) : tab === "history" ? (
						<HistoryDocuments patient={patient} />
					) : loading ? (
						<div className="staff-loading"><div className="spinner"/><span>Loading records...</span></div>
					) : records.length === 0 ? (
						<div className="staff-empty">
							<div className="empty-icon">📋</div>
							<p>{typeFilter ? "No records of this type" : "No EMR records yet"}</p>
							<button className="btn-edit" onClick={() => setView("add")}>Add First Record</button>
						</div>
					) : (
						<div className="table-wrap" style={{ boxShadow: "none", borderRadius: 0, padding: 0 }}>
							<table className="emr-table">
								<thead>
									<tr>
										<th>Type</th>
										<th>Title</th>
										<th>Date</th>
										<th>Created by</th>
										<th></th>
									</tr>
								</thead>
								<tbody>
									{records.map(r => (
										<tr key={r.id}>
											<td>
												<span className="type-cell">
													<span style={{fontSize:"1.1rem"}}>{TYPE_ICONS[r.record_type] || "📄"}</span>
													<span style={{fontWeight: 500}}>{r.record_type_display}</span>
												</span>
											</td>
											<td style={{fontWeight: 500}}>{r.title}</td>
											<td style={{color: "var(--text-2)"}}>
												{r.date ? new Date(r.date).toLocaleDateString("en-US", {day:"2-digit", month:"short", year:"numeric"}) : "-"}
											</td>
											<td style={{color: "var(--text-2)"}}>
												{r.created_by_name || "-"}
											</td>
											<td style={{textAlign: "right"}}>
												<button
													className="btn-view-log"
													onClick={() => { setSelectedRecord(r); setView("detail"); }}
												>
													View ↗
												</button>
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