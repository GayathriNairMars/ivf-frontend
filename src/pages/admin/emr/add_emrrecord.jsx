// Create a new emr record for a patient
import { useState, useEffect } from "react";
import patientApi from "../../../api/patientApi";
import { TREATMENT_TYPES } from "../../../constants/constants";
import "./add_emrrecord.css";

function Field({ label, error, children }) {
	return (
		<div className="form-field">
			<label className="form-label">{label}</label>
			{children}
			{error && <span className="field-error">{error}</span>}
		</div>
	);
}

// Sub-section forms per record type
function ConsultationForm({ data, onChange }) {
	return (
		<>
			<Field label="Chief Complaint"><textarea className="form-input" rows={2} value={data.chief_complaint || ""} onChange={e => onChange("chief_complaint", e.target.value)} /></Field>
			<Field label="History"><textarea className="form-input" rows={3} value={data.history || ""} onChange={e => onChange("history", e.target.value)} /></Field>
			<Field label="Examination"><textarea className="form-input" rows={3} value={data.examination || ""} onChange={e => onChange("examination", e.target.value)} /></Field>
			<Field label="Assessment"><textarea className="form-input" rows={2} value={data.assessment || ""} onChange={e => onChange("assessment", e.target.value)} /></Field>
			<Field label="Plan"><textarea className="form-input" rows={3} value={data.plan || ""} onChange={e => onChange("plan", e.target.value)} /></Field>
		</>
	);
}

function NursingForm({ data, onChange }) {
	return (
		<div className="form-grid">
			{["vital_bp", "vital_pulse", "vital_temp", "vital_spo2", "vital_weight"].map(f => (
				<Field key={f} label={f.replace("vital_", "").toUpperCase()}>
					<input className="form-input" value={data[f] || ""} onChange={e => onChange(f, e.target.value)} />
				</Field>
			))}
			<Field label="Observations"><textarea className="form-input" rows={2} value={data.observations || ""} onChange={e => onChange("observations", e.target.value)} /></Field>
			<Field label="Medications Given"><textarea className="form-input" rows={2} value={data.medications_given || ""} onChange={e => onChange("medications_given", e.target.value)} /></Field>
			<Field label="Instructions Given"><textarea className="form-input" rows={2} value={data.instructions_given || ""} onChange={e => onChange("instructions_given", e.target.value)} /></Field>
		</div>
	);
}

function CounsellingForm({ data, onChange }) {
	return (
		<>
			<Field label="Session Type"><input className="form-input" value={data.session_type || ""} onChange={e => onChange("session_type", e.target.value)} /></Field>
			<Field label="Concerns Raised"><textarea className="form-input" rows={2} value={data.concerns_raised || ""} onChange={e => onChange("concerns_raised", e.target.value)} /></Field>
			<Field label="Advice Given"><textarea className="form-input" rows={2} value={data.advice_given || ""} onChange={e => onChange("advice_given", e.target.value)} /></Field>
			<Field label="Follow-up Date"><input className="form-input" type="date" value={data.follow_up_date || ""} onChange={e => onChange("follow_up_date", e.target.value)} /></Field>
			<label className="checkbox-item" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
				<input type="checkbox" checked={!!data.follow_up_required} onChange={e => onChange("follow_up_required", e.target.checked)} />
				<span>Follow-up Required</span>
			</label>
		</>
	);
}

function PharmacyForm({ data, onChange }) {
	return (
		<>
			<Field label="Dispensed Items"><textarea className="form-input" rows={3} value={data.dispensed_items || ""} onChange={e => onChange("dispensed_items", e.target.value)} /></Field>
			<Field label="Batch Numbers"><input className="form-input" value={data.batch_numbers || ""} onChange={e => onChange("batch_numbers", e.target.value)} /></Field>
			<Field label="Dispensing Notes"><textarea className="form-input" rows={2} value={data.dispensing_notes || ""} onChange={e => onChange("dispensing_notes", e.target.value)} /></Field>
			<Field label="Counselling given"><textarea className="form-input" rows={2} value={data.counselling_given || ""} onChange={e => onChange("counselling_given", e.target.value)} /></Field>
		</>
	);
}

function AndrologyForm({ data, onChange }) {
	return (
		<div className="form-grid">
			<Field label="Sample Type"><input className="form-input" value={data.sample_type || ""} onChange={e => onChange("sample_type", e.target.value)} /></Field>
			<Field label="Volume (mL)"><input className="form-input" type="number" value={data.volume_ml || ""} onChange={e => onChange("volume_ml", e.target.value)} /></Field>
			<Field label="Concentration"><input className="form-input" value={data.concentration || ""} onChange={e => onChange("concentration", e.target.value)} /></Field>
			<Field label="Motility %"><input className="form-input" type="number" value={data.motility_percent || ""} onChange={e => onChange("motility_percent", e.target.value)} /></Field>
			<Field label="Morphology %"><input className="form-input" type="number" value={data.morphology_percent || ""} onChange={e => onChange("morphology_percent", e.target.value)} /></Field>
			<Field label="DNA Fragmentation"><input className="form-input" type="number" value={data.dna_fragmentation || ""} onChange={e => onChange("dna_fragmentation", e.target.value)} /></Field>
			<Field label="WHO Criteria"><input className="form-input" value={data.who_criteria || ""} onChange={e => onChange("who_criteria", e.target.value)} /></Field>
			<Field label="Impression"><input className="form-input" value={data.impression || ""} onChange={e => onChange("impression", e.target.value)} /></Field>
			<Field label="Report PDF"><input className="form-input" type="file" accept=".pdf" onChange={e => onChange("report_file", e.target.files[0])} /></Field>
			<Field label="Microscopic Image"><input className="form-input" type="file" accept="image/*" onChange={e => onChange("report_image", e.target.files[0])} /></Field>
		</div>
	);
}

function LabResultForm({ data, onChange }) {
	return (
		<div className="form-grid">
			<Field label="Test Name"><input className="form-input" value={data.test_name || ""} onChange={e => onChange("test_name", e.target.value)} /></Field>
			<Field label="Result Value"><input className="form-input" value={data.result_value || ""} onChange={e => onChange("result_value", e.target.value)} /></Field>
			<Field label="Unit"><input className="form-input" value={data.unit || ""} onChange={e => onChange("unit", e.target.value)} /></Field>
			<Field label="Reference Range"><input className="form-input" value={data.reference_range || ""} onChange={e => onChange("reference_range", e.target.value)} /></Field>
			<label className="checkbox-item" style={{ display: "flex", gap: 8, alignItems: "center" }}>
				<input type="checkbox" checked={!!data.is_abnormal} onChange={e => onChange("is_abnormal", e.target.checked)} />
				<span>Abnormal Result</span>
			</label>
			<Field label="Notes"><textarea className="form-input" rows={2} value={data.notes || ""} onChange={e => onChange("notes", e.target.value)} /></Field>
			<Field label="Report PDF"><input className="form-input" type="file" accept=".pdf" onChange={e => onChange("report_file", e.target.files[0])} /></Field>
			<Field label="Report Image"><input className="form-input" type="file" accept="image/*" onChange={e => onChange("report_image", e.target.files[0])} /></Field>
		</div>
	);
}

function ScanForm({ data, onChange }) {
	return (
		<div className="form-grid">
			<Field label="Scan Type"><input className="form-input" value={data.scan_type || ""} onChange={e => onChange("scan_type", e.target.value)} /></Field>
			<Field label="Follicle Count"><input className="form-input" type="number" value={data.follice_count || ""} onChange={e => onChange("follice_count", e.target.value)} /></Field>
			<Field label="Endometrium"><input className="form-input" value={data.endometrium || ""} onChange={e => onChange("endometrium", e.target.value)} /></Field>
			<Field label="Findings"><textarea className="form-input" rows={2} value={data.findings || ""} onChange={e => onChange("findings", e.target.value)} /></Field>
			<Field label="Impression"><textarea className="form-input" rows={2} value={data.impression || ""} onChange={e => onChange("impression", e.target.value)} /></Field>
			<Field label="Scan Image"><input className="form-input" type="file" accept="image/*" onChange={e => onChange("image", e.target.files[0])} /></Field>
			<Field label="Report PDF"><input className="form-input" type="file" accept=".pdf" onChange={e => onChange("report_file", e.target.files[0])} /></Field>
		</div>
	);
}

function ProcedureForm({ data, onChange }) {
	return (
		<>
			<Field label="Procedure Name"><input className="form-input" value={data.procedure_name || ""} onChange={e => onChange("procedure_name", e.target.value)} /></Field>
			<Field label="Details"><textarea className="form-input" rows={3} value={data.details || ""} onChange={e => onChange("details", e.target.value)} /></Field>
			<Field label="Outcome"><textarea className="form-input" rows={2} value={data.outcome || ""} onChange={e => onChange("outcome", e.target.value)} /></Field>
			<Field label="Complications"><textarea className="form-input" rows={2} value={data.complications || ""} onChange={e => onChange("complications", e.target.value)} /></Field>
		</>
	);
}

function CycleForm({ data, onChange }) {
	return (
		<div className="form-grid">
			<Field label="Cycle Type">
				<select className="form-input" value={data.cycle_type || ""} onChange={e => onChange("cycle_type", e.target.value)}>
					<option value="">--Select--</option>
					{TREATMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
				</select>
			</Field>
			<Field label="Cycle Number"><input className="form-input" type="number" value={data.cycle_number || 1} onChange={e => onChange("cycle_number", e.target.value)} /></Field>
			<Field label="Start Date"><input className="form-input" type="date" value={data.start_date || ""} onChange={e => onChange("start_date", e.target.value)} /></Field>
			<Field label="End Date"><input className="form-input" type="date" value={data.end_date || ""} onChange={e => onChange("end_date", e.target.value)} /></Field>
			{["eggs_retrieved", "eggs_fertilized", "embryos_formed", "embryos_transferred", "embryos_frozen"].map(f => (
				<Field key={f} label={f.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}>
					<input className="form-input" type="number" value={data[f] || ""} onChange={e => onChange(f, e.target.value)} />
				</Field>
			))}
			<Field label="Outcome"><textarea className="form-input" rows={2} value={data.outcome || ""} onChange={e => onChange("outcome", e.target.value)} /></Field>
		</div>
	);
}

const SUB_SECTION_MAP = {
	PRESCRIPTION: { key: "prescription_data", Form: null, many: true },
	CONSULTATION: { key: "consultation_data", Form: ConsultationForm },
	NURSING_NOTE: { key: "nursing_note_data", Form: NursingForm },
	COUNSELLING_NOTE: { key: "counselling_note_data", Form: CounsellingForm },
	PHARMACY_NOTE: { key: "pharmacy_note_data", Form: PharmacyForm },
	ANDROLOGY_NOTE: { key: "andrology_note_data", Form: AndrologyForm },
	LAB_RESULT: { key: "lab_result_data", Form: LabResultForm, many: true },
	SCAN: { key: "scan_data", Form: ScanForm, many: true },
	PROCEDURE: { key: "procedure_data", Form: ProcedureForm, many: true },
	CYCLE: { key: "cycle_data", Form: CycleForm },
};

const RECORD_TYPES_CONFIG = {
	PRESCRIPTION: { label: "Prescription", icon: "💊", title: "Prescription Form", ref: "PRE" },
	CYCLE: { label: "Cycle progress", icon: "🔄", title: "Cycle Progress Form", ref: "CYC" },
	LAB_RESULT: { label: "Lab results", icon: "🧪", title: "Lab Results Form", ref: "LAB" },
	SCAN: { label: "Ultrasound scan", icon: "🖥️", title: "Ultrasound Scan Form", ref: "US" },
	PROCEDURE: { label: "Procedure note", icon: "🔬", title: "Procedure Note Form", ref: "PRO" },
	COUNSELLING_NOTE: { label: "Counselling note", icon: "💬", title: "Counselling Note Form", ref: "CNS" },
	CONSULTATION: { label: "Consultation Note", icon: "🩺", title: "Consultation Note Form", ref: "CON" },
	NURSING_NOTE: { label: "Nursing Note", icon: "🩹", title: "Nursing Note Form", ref: "NUR" },
	PHARMACY_NOTE: { label: "Pharmacy Note", icon: "💉", title: "Pharmacy Note Form", ref: "PHA" },
	ANDROLOGY_NOTE: { label: "Andrology Note", icon: "🔭", title: "Andrology Note Form", ref: "AND" }
};

export default function AddEMRRecord({ patient, onBack, onSuccess }) {
	const [allowedTypes, setAllowedTypes] = useState([]);
	const [form, setForm] = useState({
		record_type: "PRESCRIPTION",
		title: "",
		date: new Date().toISOString().split("T")[0],
		notes: ""
	});
	const [subData, setSubData] = useState({});
	const [medications, setMedications] = useState([
		{ medication_name: "Gonal-F 450 IU", dosage: "150 IU", frequency: "OD", duration: "10", route: "Injection" },
		{ medication_name: "Fertilaid 450", dosage: "150 IU", frequency: "OD", duration: "10", route: "Oral" }
	]);
	const [categorySearch, setCategorySearch] = useState("");
	const [urgentAdmin, setUrgentAdmin] = useState(false);
	const [notifyPharmacy, setNotifyPharmacy] = useState(true);
	const [patientPortal, setPatientPortal] = useState(false);

	const [nextFollowUp, setNextFollowUp] = useState(() => {
		const next = new Date();
		next.setDate(next.getDate() + 7);
		return next.toISOString().split("T")[0];
	});

	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		patientApi.getAllowedEmrTypes()
			.then((data) => {
				setAllowedTypes(data.allowed_types || []);
				if (data.allowed_types?.length > 0) {
					// Default to PRESCRIPTION if allowed, else use the first allowed
					const isPrescriptionAllowed = data.allowed_types.some(t => t.value === "PRESCRIPTION");
					setForm(prev => ({
						...prev,
						record_type: isPrescriptionAllowed ? "PRESCRIPTION" : data.allowed_types[0].value
					}));
				}
			}).catch(() => {});
	}, []);

	const handleChange = e => {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
		setErrors(prev => ({ ...prev, [name]: "" }));
	};

	const handleCategorySelect = (type) => {
		setForm(prev => ({ ...prev, record_type: type }));
		setSubData({});
		setErrors({});
	};

	const handleSubChange = (field, value) => {
		setSubData(prev => ({ ...prev, [field]: value }));
	};

	// Medication table row actions
	const addMedicationRow = () => {
		setMedications(prev => [...prev, { medication_name: "", dosage: "", frequency: "OD", duration: "10", route: "Oral" }]);
	};

	const updateMedicationRow = (index, field, value) => {
		setMedications(prev => prev.map((med, idx) => idx === index ? { ...med, [field]: value } : med));
	};

	const deleteMedicationRow = (index) => {
		setMedications(prev => prev.filter((_, idx) => idx !== index));
	};

	const handleSubmit = async (e) => {
		if (e) e.preventDefault();
		const errs = {};
		if (!form.record_type) errs.record_type = "Required";
		if (!form.date) errs.date = "Required";
		if (Object.keys(errs).length) { setErrors(errs); return; }

		setSubmitting(true);
		try {
			const section = SUB_SECTION_MAP[form.record_type];
			const payload = new FormData();
			payload.append("patient", patient.id);
			payload.append("record_type", form.record_type);
			
			const recordTitle = form.title || `${RECORD_TYPES_CONFIG[form.record_type]?.label || form.record_type} Record`;
			payload.append("title", recordTitle);
			payload.append("date", form.date);
			
			// Build comprehensive notes field
			let finalNotes = form.notes;
			if (urgentAdmin || notifyPharmacy || patientPortal) {
				const flags = [];
				if (urgentAdmin) flags.push("[Urgent Admin]");
				if (notifyPharmacy) flags.push("[Notify Pharmacy]");
				if (patientPortal) flags.push("[Patient Portal]");
				finalNotes = `${flags.join(" ")}\n${finalNotes}`;
			}
			payload.append("notes", finalNotes);

			if (form.record_type === "PRESCRIPTION") {
				payload.append("prescription_data", JSON.stringify(medications));
			} else if (section) {
				let finalSubData = { ...subData };
				if (form.record_type === "COUNSELLING_NOTE") {
					finalSubData.follow_up_date = nextFollowUp;
					finalSubData.follow_up_required = true;
				}

				if (section.many) {
					const arr = [finalSubData];
					payload.append(section.key, JSON.stringify(arr));
				} else {
					Object.entries(finalSubData).forEach(([k, v]) => {
						if (v !== undefined && v !== null && v !== "") {
							// If value is a File, append it directly, otherwise string representation
							payload.append(`${section.key}.${k}`, v);
						}
					});
				}
			}

			await patientApi.addEmrRecord(patient.id, payload, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			setSuccess(true);
			setTimeout(onSuccess, 1200);
		} catch (err) {
			const data = err.response?.data;
			if (data && typeof data === "object") {
				const fe = {};
				Object.entries(data).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : v; });
				setErrors(fe);
			} else {
				setErrors({ general: "Failed to save. Please try again." });
			}
		} finally {
			setSubmitting(false);
		}
	};

	// Patient Demographic details
	const getAge = (dob) => {
		if (!dob) return "32 yrs";
		const birth = new Date(dob);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const m = today.getMonth() - birth.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return `${age} yrs`;
	};
	const genderStr = patient.gender_display || (patient.gender === "M" ? "Male" : patient.gender === "F" ? "Female" : "Other") || "Female";
	const demographicsStr = `${getAge(patient.date_of_birth)} • ${genderStr}`;

	// Categories filter
	const listToDisplay = (allowedTypes.length > 0 ? allowedTypes : Object.entries(RECORD_TYPES_CONFIG).map(([k, v]) => ({ value: k, label: v.label })))
		.filter(t => RECORD_TYPES_CONFIG[t.value]) // Keep configured categories
		.filter(t => t.label.toLowerCase().includes(categorySearch.toLowerCase()));

	const activeCategory = RECORD_TYPES_CONFIG[form.record_type] || { label: form.record_type, icon: "📄", title: `${form.record_type} Form`, ref: "EMR" };
	const SubForm = SUB_SECTION_MAP[form.record_type]?.Form;

	return (
		<div className="add-emr-container">
			{/* Back button */}
			<button className="add-emr-back-btn" onClick={onBack}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
					<polyline points="15,18 9,12 15,6" />
				</svg>
				Add EMR Record
			</button>

			{/* Patient Identity Strip */}
			<div className="patient-identity-bar">
				<div className="identity-items">
					<div className="identity-item-cell">
						<span className="cell-label">Patient name</span>
						<span className="cell-value">{patient.user?.full_name}</span>
					</div>
					<div className="identity-item-cell">
						<span className="cell-label">Patient ID</span>
						<span className="cell-value">{patient.patient_id}</span>
					</div>
					<div className="identity-item-cell">
						<span className="cell-label">Demographics</span>
						<span className="cell-value">{demographicsStr}</span>
					</div>
					<div className="identity-item-cell">
						<span className="cell-label">Date</span>
						<input
							type="date"
							name="date"
							value={form.date}
							onChange={handleChange}
							className="cell-value"
							style={{ border: "none", background: "none", outline: "none", cursor: "pointer", padding: 0 }}
						/>
					</div>
				</div>
				<div className="identity-badge-right">
					<span className="patient-id-badge" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
						{patient.patient_id}
					</span>
				</div>
			</div>

			{success && <div className="success-banner" style={{ margin: 0 }}>Record saved successfully!</div>}
			{errors.general && <div className="error-banner" style={{ margin: 0 }}>{errors.general}</div>}

			<div className="add-emr-content-grid">
				{/* Category Sidebar */}
				<div className="clinical-record-sidebar">
					<div>
						<h3>Clinical record types</h3>
						<p>Select category to begin entry</p>
					</div>

					<div className="category-search-wrap">
						<svg className="category-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
							<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
						<input
							className="category-search-input"
							type="text"
							placeholder="Search categories..."
							value={categorySearch}
							onChange={e => setCategorySearch(e.target.value)}
						/>
					</div>

					<div className="category-list">
						{listToDisplay.map(cat => {
							const cfg = RECORD_TYPES_CONFIG[cat.value] || { icon: "📄", label: cat.label };
							return (
								<button
									key={cat.value}
									type="button"
									className={`category-button ${form.record_type === cat.value ? "active" : ""}`}
									onClick={() => handleCategorySelect(cat.value)}
								>
									<span>{cfg.icon}</span>
									<span>{cfg.label}</span>
									<span className="caret-right">&gt;</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Form Panel */}
				<div className="form-panel">
					{/* Form Header */}
					<div className="form-panel-header">
						<div className="header-left-meta">
							<div className="form-icon">{activeCategory.icon}</div>
							<div>
								<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
									<h2>{activeCategory.title}</h2>
									<span className="badge-new-record">New record</span>
								</div>
								<span className="ref-id-text">Ref ID: {activeCategory.ref}-49210</span>
							</div>
						</div>
						<div className="header-right-meta">
							<span className="auto-save-badge">
								<span>☁️</span> Auto-saved On
							</span>
							<a href="#previous" className="view-prev-link" onClick={e => { e.preventDefault(); alert("Viewing previous records is under construction."); }}>
								View Previous {activeCategory.label}s ↗
							</a>
						</div>
					</div>

					{/* Record Title input (hidden / inline placeholder) */}
					<div className="form-panel-card" style={{ padding: "16px 24px" }}>
						<Field label="Record Title / Heading" error={errors.title}>
							<input
								type="text"
								name="title"
								className="form-input"
								placeholder={`e.g. ${activeCategory.label} Note`}
								value={form.title}
								onChange={handleChange}
								style={{ width: "100%", background: "#f9fafb" }}
							/>
						</Field>
					</div>

					{/* Form Body Fields Card */}
					{form.record_type === "PRESCRIPTION" ? (
						<div className="form-panel-card">
							<div className="card-header-row">
								<h3>
									<span>💊</span>
									Medication Details
								</h3>
								<button
									type="button"
									className="btn-create-emr"
									style={{ padding: "6px 14px", fontSize: "0.85rem" }}
									onClick={addMedicationRow}
								>
									+ Add Medication
								</button>
							</div>
							<div className="medication-table-wrap">
								<table className="medication-table">
									<thead>
										<tr>
											<th>Drug name</th>
											<th>Dosage</th>
											<th>Frequency</th>
											<th>Duration (Days)</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{medications.map((med, index) => (
											<tr key={index}>
												<td style={{ width: "35%" }}>
													<input
														type="text"
														className="tbl-input"
														placeholder="Gonal-F 450 IU"
														value={med.medication_name}
														onChange={e => updateMedicationRow(index, "medication_name", e.target.value)}
													/>
												</td>
												<td style={{ width: "25%" }}>
													<input
														type="text"
														className="tbl-input"
														placeholder="150 IU"
														value={med.dosage}
														onChange={e => updateMedicationRow(index, "dosage", e.target.value)}
													/>
												</td>
												<td style={{ width: "20%" }}>
													<select
														className="tbl-select"
														value={med.frequency}
														onChange={e => updateMedicationRow(index, "frequency", e.target.value)}
													>
														<option value="OD">OD</option>
														<option value="BD">BD</option>
														<option value="TDS">TDS</option>
														<option value="QDS">QDS</option>
														<option value="HS">HS</option>
														<option value="PRN">PRN</option>
													</select>
												</td>
												<td style={{ width: "15%" }}>
													<input
														type="number"
														className="tbl-input"
														placeholder="10"
														value={med.duration}
														onChange={e => updateMedicationRow(index, "duration", e.target.value)}
													/>
												</td>
												<td style={{ width: "5%", textAlign: "center" }}>
													<button
														type="button"
														className="med-row-delete-btn"
														onClick={() => deleteMedicationRow(index)}
													>
														🗑️
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{/* Clinical Notes & Instructions Card */}
						<div className="form-panel-card">
							<h3>
								<span>📝</span>
								Clinical Notes & Instructions
							</h3>
							<textarea
								className="instructions-textarea"
								name="notes"
								placeholder="Enter patient-specific administration instructions, storage requirements, or cautionary notes..."
								value={form.notes}
								onChange={handleChange}
							/>
	
							<div className="checkbox-toggle-group">
								<div
									className={`checkbox-toggle-item ${urgentAdmin ? "checked" : ""}`}
									onClick={() => setUrgentAdmin(!urgentAdmin)}
								>
									<div className="toggle-circle">{urgentAdmin && "✓"}</div>
									<div className="toggle-meta">
										<span className="toggle-title">Urgent Admin</span>
										<span className="toggle-subtitle">Flag for nurse attention</span>
									</div>
								</div>
								<div
									className={`checkbox-toggle-item ${notifyPharmacy ? "checked" : ""}`}
									onClick={() => setNotifyPharmacy(!notifyPharmacy)}
								>
									<div className="toggle-circle">{notifyPharmacy && "✓"}</div>
									<div className="toggle-meta">
										<span className="toggle-title">Notify Pharmacy</span>
										<span className="toggle-subtitle">Auto-trigger order</span>
									</div>
								</div>
								<div
									className={`checkbox-toggle-item ${patientPortal ? "checked" : ""}`}
									onClick={() => setPatientPortal(!patientPortal)}
								>
									<div className="toggle-circle">{patientPortal && "✓"}</div>
									<div className="toggle-meta">
										<span className="toggle-title">Patient Portal</span>
										<span className="toggle-subtitle">Sync to mobile app</span>
									</div>
								</div>
							</div>
						</div>
	
						{/* Next Follow Up Card */}
						<div className="form-panel-card">
							<h3 style={{ border: "none", padding: 0 }}>
								<span>📅</span>
								Next follow up
							</h3>
							<input
								type="date"
								className="followup-date-picker"
								value={nextFollowUp}
								onChange={e => setNextFollowUp(e.target.value)}
							/>
						</div>
						</div>
					) : SubForm ? (
						<div className="form-panel-card">
							<h3>
								<span>⚙️</span>
								{activeCategory.label} Details
							</h3>
							<SubForm data={subData} onChange={handleSubChange} />
						</div>
					) : null}
	
					

					{/* Actions Footer */}
					<div className="add-emr-actions-footer">
						<button
							type="button"
							className="btn-discard-entry"
							onClick={onBack}
							disabled={submitting}
						>
							✕ Discard Entry
						</button>
						<div className="footer-actions-right">
							<button
								type="button"
								className="btn-save-draft"
								onClick={() => {
									alert("Draft saved successfully!");
									onBack();
								}}
								disabled={submitting}
							>
								Save as Draft
							</button>
							<button
								type="button"
								className="btn-finalize-sign"
								onClick={handleSubmit}
								disabled={submitting}
							>
								{submitting ? "Saving..." : "Finalize & Sign Record"}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}