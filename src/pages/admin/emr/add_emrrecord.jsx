//Create a new emr record for a patient
import { useState,useEffect } from "react";
import patientApi from "../../../api/patientApi";
import { TREATMENT_TYPES } from "../../../constants/constants";

function Field({label,error,children}) {
	return (
		<div className="form-field">
			<label className="form-label">{label}</label>
			{children}
			{error && <span className="field-error">{error}</span>}
		</div>
	);
}

//sub-section forms per record type
function ConsultationForm({data,onChange}) {
	return (
		<>
			<Field label="Chief Complaint"><textarea className="form-input" rows={2} value={data.chief_complaint || ""} onChange={e => onChange("chief_complaint",e.target.value)}/></Field>
			<Field label="History"><textarea className="form-input" rows={3} value={data.history || ""} onChange={e => onChange("history",e.target.value)}/></Field>
			<Field label="Examination"><textarea className="form-input" rows={3} value={data.examination || ""} onChange={e => onChange("examination",e.target.value)}/></Field>
			<Field label="Assessment"><textarea className="form-input" rows={2} value={data.assessment || ""} onChange={e => onChange("assessment",e.target.value)}/></Field>
			<Field label="Plan"><textarea className="form-input" rows={3} value={data.plan || ""} onChange={e => onChange("plan",e.target.value)}/></Field>
		</>
	);
}

function NursingForm({data,onChange}) {
	return(
		<div className="form-grid">
			{["vital_bp","vital_pulse","vital_temp","vital_spo2","vital_weight"].map(f => (
				<Field key={f} label={f.replace("vital_","").toUpperCase()}>
					<input className="form-input" value={data[f] || ""} onChange={e => onChange(f,e.target.value)} />
				</Field>
			))}
			<Field label="Observations"><textarea className="form-input" rows={2} value={data.observations || ""} onChange={e => onChange("observations",e.target.value)} /></Field>
			<Field label="Medications Given"><textarea className="form-input" rows={2} value={data.medications_given || ""} onChange={e => onChange("medications_given",e.target.value)} /></Field>
			<Field label="Instructions Given"><textarea className="form-input" rows={2} value={data.instructions_given || ""} onChange={e => onChange("instructions_given",e.target.value)} /></Field>
		</div>
	);
}

function CounsellingForm({data,onChange}) {
	return (
		<>
			<Field label="Session Type"><input className="form-input" value={data.session_type || ""} onChange={e => onChange("session_type",e.target.value)} /></Field>
			<Field label="Concerns Raised"><textarea className="form-input" rows={2} value={data.concerns_raised || ""} onChange={e => onChange("concerns_raised",e.target.value)} /></Field>
			<Field label="Advice Given"><textarea className="form-input" rows={2} value={data.advice_given || ""} onChange={e => onChange("advice_given",e.target.value)} /></Field>
			<Field label="Follow-up Date"><input className="form-input" type="date" value={data.follow_up_date || ""} onChange={e => onChange("follow_up_date",e.target.value)} /></Field>
			<label className="checkbox-item">
				<input type="checkbox" checked={!!data.follow_up_required} onChange={e => onChange("follow_up_required",e.target.checked)} />
				<span>Follow-up Required</span>
			</label>
		</>
	);
}

function PharmacyForm({data,onChange}) {
	return (
		<>
			<Field label="Dispensed Items"><textarea className="form-input" rows={3} value={data.dispensed_items || ""} onChange={e => onChange("dispensed_items",e.target.value)} /></Field>
			<Field label="Batch Numbers"><input className="form-input" value={data.batch_numbers || ""} onChange={e => onChange("batch_numbers",e.target.value)} /></Field>
			<Field label="Dispensing Notes"><textarea className="form-input" rows={2} value={data.dispensing_notes || ""} onChange={e => onChange("dispensing_notes",e.target.value)} /></Field>
			<Field label="Counselling given"><textarea className="form-input" rows={2} value={data.counselling_given || ""} onChange={e => onChange("counselling_given",e.target.value)} /></Field>
		</>
	);
}

function AndrologyForm({data,onChange}) {
	return (
		<div className="form-grid">
			<Field label="Sample Type"><input className="form-input" value={data.sample_type || ""} onChange={e => onChange("sample_type",e.target.value)} /></Field>
			<Field label="Volume (mL)"><input className="form-input" type="number" value={data.volume_ml || ""} onChange={e => onChange("volume_ml",e.target.value)} /></Field>
			<Field label="Concentration"><input className="form-input" value={data.concentration || ""} onChange={e => onChange("concentration",e.target.value)} /></Field>
			<Field label="Motility %"><input className="form-input" type="number" value={data.motility_percent || ""} onChange={e => onChange("motility_percent",e.target.value)} /></Field>
			<Field label="Morphology %"><input className="form-input" type="number" value={data.morphology_percent || ""} onChange={e => onChange("morphology_percent",e.target.value)} /></Field>
			<Field label="DNA Fragmentation"><input className="form-input" type="number" value={data.dna_fragmentation || ""} onChange={e => onChange("dna_fragmentation",e.target.value)} /></Field>
			<Field label="WHO Criteria"><input className="form-input" value={data.who_criteria || ""} onChange={e => onChange("who_criteria",e.target.value)} /></Field>
			<Field label="Impression"><input className="form-input" rows={2} value={data.impression || ""} onChange={e => onChange("impression",e.target.value)} /></Field>
			<Field label="Report PDF"><input className="form-input" type="file" accept=".pdf" onChange={e => onChange("report_file",e.target.files[0])} /></Field>
			<Field label="Microscopic Image"><input className="form-input" type="file" accept="image/*" onChange={e => onChange("report_image",e.target.files[0])} /></Field>
		</div>
	);
}

function LabResultForm({data,onChange}) {
	return (
		<div className="form-grid">
			<Field label="Test Name"><input className="form-input" value={data.test_name || ""} onChange={e => onChange("test_name",e.target.value)} /></Field>
			<Field label="Result Value"><input className="form-input" value={data.result_value || ""} onChange={e => onChange("result_value",e.target.value)} /></Field>
			<Field label="Unit"><input className="form-input" value={data.unit || ""} onChange={e => onChange("unit",e.target.value)} /></Field>
			<Field label="Reference Range"><input className="form-input" value={data.reference_range || ""} onChange={e => onChange("reference_range",e.target.value)} /></Field>
			<label className="checkbox-item">
				<input type="checkbox" checked={!!data.is_abnormal} onChange={e => onChange("is_abnormal",e.target.checked)} />
				<span>Abnormal Result</span>
			</label>
			<Field label="Notes"><textarea className="form-input" rows={2} value={data.notes || ""} onChange={e => onChange("notes",e.target.value)} /></Field>
			<Field label="Report PDF"><input className="form-input" type="file" accept=".pdf" onChange={e => onChange("report_file",e.target.files[0])} /></Field>
			<Field label="Report Image"><input className="form-input" type="file" accept="image/*" onChange={e => onChange("report_image",e.target.files[0])} /></Field>
		</div>
	);
}

function ScanForm({data,onChange}) {
	return (
		<div className="form-grid">
			<Field label="Scan Type"><input className="form-input" value={data.scan_type || ""} onChange={e => onChange("scan_type", e.target.value)} /></Field>
			<Field label="Follicle Count"><input className="form-input" type="number" value={data.follice_count || ""} onChange={e => onChange("follice_count", e.target.value)} /></Field>
			<Field label="Endometrium"><input className="form-input" value={data.endometrium || ""} onChange={e => onChange("endometrium", e.target.value)} /></Field>
			<Field label="Findings"><textarea className="form-input" rows={2} value={data.findings || ""} onChange={e => onChange("findings", e.target.value)} /></Field>
			<Field label="Impression"><textarea className="form-input" rows={2} value={data.impression || ""} onChange={e => onChange("impression", e.target.value)} /></Field>
			<Field label="Scan Image"><input className="form-input" type="file" accept="image/*" onChange={e => onChange("image",e.target.files[0])} /></Field>
			<Field label="Report PDF"><input className="form-input" type="file" accept=".pdf" onChange={e => onChange("report_file",e.target.files[0])} /></Field>
		</div>
	);
}

function ProcedureForm({data,onChange}) {
	return (
		<>
			<Field label="Procedure Name"><input className="form-input" value={data.procedure_name || ""} onChange={e => onChange("procedure_name",e.target.value)}  /></Field>
			<Field label="Details"><input className="form-input" rows={3} value={data.details || ""} onChange={e => onChange("details",e.target.value)} /></Field>
			<Field label="Outcome"><input className="form-input" rows={2} value={data.outcome || ""} onChange={e => onChange("outcome",e.target.value)} /></Field>
			<Field label="Complications"><input className="form-input" rows={2} value={data.complications || ""} onChange={e => onChange("complications",e.target.value)} /></Field>
		</>
	);
}

function CycleForm({data,onChange}) {
	return (
		<div className="form-grid">
			<Field label="Cycle Type">
				<select className="form-input" value={data.cycle_type || ""} onChange={e => onChange("cycle_type",e.target.value)}>
					<option value="">--Select--</option>
					{TREATMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
				</select>
			</Field>
			<Field label="Cycle Number"><input className="form-input" type="number" value={data.cycle_number || 1} onChange={e => onChange("cycle_number",e.target.value)} /></Field>
			<Field label="Start Date"><input className="form-input" type="date" value={data.start_date || ""} onChange={e => onChange("start_date",e.target.value)} /></Field>
			<Field label="End Date"><input className="form-input" type="date" value={data.end_date || ""} onChange={e => onChange("end_date",e.target.value)} /></Field>
			{["eggs_retrieved","eggs_fertilized","embryos_formed","embryos_transferred","embryos_frozen"].map(f => (
				<Field key={f} label={f.replace(/_/g," ").replace(/\b\w/g,c=> c.toUpperCase())}>
					<input className="form-input" type="number" value={data[f] || ""} onChange={e => onChange(f,e.target.value)} />
				</Field>
			))}
			<Field label="Outcome"><textarea className="form-input" rows={2} value={data.outcome || ""} onChange={e => onChange("outcome",e.target.value)} /></Field>
		</div>
	);
}

const SUB_SECTION_MAP ={
	CONSULTATION: {key:"consultation_data", Form:ConsultationForm},
	NURSING_NOTE: {key:"nursing_note_data",Form:NursingForm},
	COUNSELLING_NOTE: {key:"counselling_note_data", Form:CounsellingForm},
	PHARMACY_NOTE: {key:"pharmacy_note_data", Form:PharmacyForm},
	ANDROLOGY_NOTE: {key:"andrology_note_data", Form:AndrologyForm},
	LAB_RESULT: {key:"lab_result_data", Form:LabResultForm, many:true},
	SCAN: {key:"scan_data", Form:ScanForm, many:true},
	PROCEDURE: {key:"procedure_data", Form:ProcedureForm, many:true},
	CYCLE: {key:"cycle_data", Form:CycleForm},
};

export default function AddEMRRecord({patient,onBack,onSuccess}) {
	const [allowedTypes,setAllowedTypes] = useState([]);
	const [form,setForm] = useState({record_type: "", title: "", date: "", notes: ""});
	const [subData,setSubData] = useState({});
	const [errors,setErrors] = useState({});
	const [submitting,setSubmitting] = useState(false);
	const [success,setSuccess] = useState(false);

	useEffect(() => {
		patientApi.getAllowedEmrTypes()
			.then((data) => {
				setAllowedTypes(data.allowed_types || []);
				if (data.allowed_types?.length > 0) {
					setForm(prev => ({...prev,record_type:data.allowed_types[0].value }));
				}
			}).catch(() => {});
	}, []);

	const handleChange =e => {
		const {name,value} = e.target;
		setForm(prev => ({...prev, [name]:value}));
		if(name === "record_type") setSubData({});
		setErrors(prev => ({...prev,[name]:""}));
	};

	const handleSubChange = (field,value) => {
		setSubData(prev => ({...prev, [field]:value}));
	};

	const handleSubmit = async e =>{
		e.preventDefault();
		const errs = {};
		if (!form.record_type) errs.record_type = "Required";
		if (!form.title.trim()) errs.title = "Required";
		if (!form.date) errs.date = "Required";
		if (Object.keys(errs).length) {setErrors(errs); return;}

		setSubmitting(true);
		try{
			const section = SUB_SECTION_MAP[form.record_type];
			const payload = new FormData();
			payload.append("patient",patient.id);
			payload.append("record_type",form.record_type);
			payload.append("title",form.title);
			payload.append("date",form.date);
			payload.append("notes",form.notes);

			if (section) {
				if (section.many) {
					const arr = [subData];
					payload.append(section.key, JSON.stringify(arr));
				} else {
					Object.entries(subData).forEach(([k,v]) => {
						if (v!==undefined && v!==null && v!=="") {
							payload.append(`${section.key}.${k}`,v);
						}
					});
				}
			}

			await patientApi.addEmrRecord(patient.id, payload, {
				headers: {"Content-Type":"multipart/form-data"},
			});
			setSuccess(true);
			setTimeout(onSuccess,1200);
		} catch (err) {
			const data = err.response?.data;
			if (data && typeof data === "object") {
				const fe = {};
				Object.entries(data).forEach(([k,v]) => {fe[k] = Array.isArray(v) ? v[0] : v;});
				setErrors(fe);
			} else {
				setErrors({general:"Failed to save. Please try again."});
			}
		} finally {
			setSubmitting(false);
		}
	};
	const section=SUB_SECTION_MAP[form.record_type];
	const SubForm = section?.Form;
	return (
		<div className="staff-form-page">
			<div className="form-page-header">
				<button className="btn-back" onClick={onBack}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
						<polyline points="15,18 9,12 15,6" />
					</svg>
					Back
				</button>
				<div>
					<h2 className="form-page-title">Add EMR Record</h2>
					<p className="form-page-sub">{patient.user?.full_name} - {patient.patient_id}</p>
				</div>
			</div>
			{success && <div className="success-banner">Record saved successfully!</div>}

			<form onSubmit={handleSubmit} className="staff-form" noValidate>
				{/* Base fields */}
				<div className="form-card">
					<h3 className="form-section-title">Record Information</h3>
					<div className="form-grid">
						<Field label="Record Type *" error={errors.record_type}>
							<select className="form-input" name="record_type" value={form.record_type} onChange={handleChange}>
								<option value="">--Select--</option>
								{allowedTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
							</select>
						</Field>
						<Field label="Date *" error={errors.date}>
							<input className="form-input" type="date" name="date" value={form.date} onChange={handleChange} /> 
						</Field>
						<Field label="Title *" error={errors.title}>
							<input className="form-input" type="text" name="title" placeholder="Brief title for this record" value={form.title} onChange={handleChange} /> 
						</Field>
						<Field label="General Notes">
							<textarea className="form-input" name="notes" rows={3} placeholder="Optional notes" value={form.notes} onChange={handleChange} />
						</Field>
					</div>
				</div>
				{/* Sub section form */}
				{SubForm && (
					<div className="form-card">
						<h3 className="form-section-title">
							{form.record_type.replace(/_/g," ")} Details
						</h3>
						<SubForm data={subData} onChange={handleSubChange} />
					</div>
				)}
				{errors.general && <div className="error-banner">{errors.general}</div>}

				<div className="form-actions">
					<button type="button" className="btn-secondary" onClick={onBack} disabled={submitting}>Cancel</button>
					<button type="submit" className="btn-primary" disabled={submitting}>
						{submitting ? "Saving...":"Save Record"}
					</button>
				</div>
			</form>
		</div>
	);
}