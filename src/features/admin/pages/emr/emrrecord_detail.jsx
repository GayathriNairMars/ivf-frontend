//full View of One EMR record
import { useState,useEffect } from "react";
import api from "../../../../services/Client";
import { useAuth } from "../../../../hooks/useAuth";

function InfoRow({label,value}) {
	if (!value && value !== 0) return null;
	return (
		<div className="info-row">
			<span className="info-label">{label}</span>
			<span className="info-value">{value}</span>
		</div>
	);
}

function FileLink({label,url}) {
	if (!url) return useCallback;
	return (
		<div className="info-row">
			<span className="info-label">{label}</span>
			<a href={url} target="_blank" rel="noopener noreferrer" className="btn-edit" style={{fontSize:"0.75rem"}}>
				Open File
			</a>
		</div>
	);
}

export default function EMRRecordDetail({record:initialRecord, patient,onBack,onDeleted}) {
	const {user} = useAuth();
	const [record,setRecord] = useState(null);
	const [loading,setLoading] = useState(true);
	const [deleting,setDeleting] = useState(false);

	useEffect(() => {
		api.get(`/emr/patient/${patient.id}/records/${initialRecord.id}/`)
		.then(({data}) => setRecord(data))
		.catch(() => {})
		.finally(() => setLoading(false));
	}, [patient.id,initialRecord.id]);

	const handleDelete = async () => {
		if (!confirm("Delete this record? This cannot be undone.")) return;
		setDeleting(true);
		try{
			await api.delete(`/emr/patient/${patient.id}/records/${record.id}/delete/`);
			onDeleted();
		} catch {
			alert("Failed to delete.");
		} finally { setDeleting(false); }
	};

	if(loading) return <div className="staff-loading"><div className="spinner" /><span>Loading...</span></div>
	if (!record) return null;

	const canDelete = user?.role === "ADM" || record.created_by === user?.id;

	const renderSubSection= () => {
		const r =record;
		switch(r.record_type){
		
			case "CONSULTATION":
				return r.consultation ? (
					<div className="form-card">
						<h3 className="form-section-title">Consultation Note</h3>
						<InfoRow label="Chief Complaint" value={r.consultation.chief_complaint} />
						<InfoRow label="History" value={r.consultation.history} />
						<InfoRow label="Examination" value={r.consultation.examination} />
						<InfoRow label="Assessment" value={r.consultation.assessment} />
						<InfoRow label="Plan" value={r.consultation.plan} />
					</div>
				): null;
			case "NURSING_NOTE":
				if (!r.nursing_note) return null;
				const vitals = [
					{label:"BP", value: r.nursing_note.vital_bp},
					{label:"Pulse", value: r.nursing_note.vital_pulse},
					{label:"Temp", value: r.nursing_note.vital_temp},
					{label:"SpO2", value: r.nursing_note.vital_spo2},
					{label:"Weight", value: r.nursing_note.vital_weight},
				];
				const details = [
					{label:"Observations", value: r.nursing_note.observations},
					{label:"Medications Given", value: r.nursing_note.medications_given},
					{label:"Instructions", value: r.nursing_note.instructions_given}
				];
				return r.nursing_note ? (
					<div className="form-card">
						<h3 className="form-section-grid">Nursing Note</h3>
						<div className="form-grid" style={{gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))"}}>
							{vitals.map((item,index) => (
								<InfoRow key={index} label={item.label} value={item.value} />
							))}
						</div>
						{details.map((item,index) => (
							<InfoRow key={index} label={item.label} value={item.value} />
						))}
					</div>
				) : null;
			case "COUNSELLING_NOTE":
				notes=[
					{label:"Session Type", value: r.counselling_note.session_type},
					{label:"Concerns Raised", value: r.counselling_note.concerns_raised},
					{label:"Advice Given", value: r.counselling_note.advice_given},
					{label:"Follow-up Required", value: r.counselling_note.follow_up_required? "Yes": "No" },
					{label:"Follow-up Date", value: r.counselling_note.follow_up_date},
				]
				return r.counselling_note? (
					<div className="form-card">
						<h3 className="form-section-title">Counselling Note</h3>
						{notes.map((item,index) => (
							<InfoRow key={index} label={item.label} value={item.value} />
						))}
					</div>
				) : null;
			
			case "PHARMACY_NOTE":
				return r.pharmacy_note? (
					<div className="form-card">
						<h3 className="form-section-title">Pharmacy Note</h3>
						<InfoRow label="Dispensed Items" value={r.pharmacy_note.dispensed_items} />
						<InfoRow label="Batch Numbers" value={r.pharmacy_note.batch_numbers} />
						<InfoRow label="Dispensing Notes" value={r.pharmacy_note.dispensed_notes} />
						<InfoRow label="Counselling Given" value={r.pharmacy_note.counselling_given} />
					</div>
				) : null;
			
			case "ANDROLOGY_NOTE":
				andrology_notes=[
					{label:"Sample Type", value:r.andrology_note.sample_type},
					{label:"Volume(mL)", value:r.andrology_note.volume_ml},
					{label:"Concentration", value:r.andrology_note.concentration},
					{label:"Motility %", value:r.andrology_note.motility_percent},
					{label:"Morphology %", value:r.andrology_note.morphology_percent},
					{label:"DNA Fragmentation %", value:r.andrology_note.dna_fragmentation},
					{label:"WHO Criteria", value:r.andrology_note.who_criteria}
				]
				return r.andrology_note ? (
					<div className="form-card">
						<h3 className="form-section-title">Andrology Note</h3>
						<div className="form-grid">
							{andrology_notes.map(t => (
								<InfoRow label={t.label} value={t.value} />
							))}
						</div>
						<InfoRow label="Impression" value={r.andrology_note.impression} />
						<FileLink label="Report PDF" url={r.andrology_note.report_file} />
						<FileLink label="Microscopy Image" url={r.andrology_note.report_image} />
					</div>
				) : null;

				case "LAB_RESULT":
					return r.lab_results?.length>0 ? (
						<div className="form-card">
							<h3 className="form-section-title">Lab Results</h3>
							{r.lab_results.map((l,i) => (
								<div key={i} style={{borderBottom:"1px solid var(--border)",paddingBottom:12,marginBottom:12}}>
									<InfoRow label="Test" value={l.test_name} />
									<InfoRow label="Result" value={`${l.result_value} ${l.unit}`} />
									<InfoRow label="Reference Range" value={l.reference_range} />
									{l.is_abnormal && <span className="status-pill status-inactive">Abnormal</span>}
									<FileLink label="Report PDF" url={l.report_file} />
									<FileLink label="Report Image" url={l.report_image} />
								</div>
							))}
						</div>
					) : null;
				
				case "SCAN":
					return r.scans?.length > 0 ? (
						<div className="form-card">
							<h3 className="form-section-title">Scan Reports</h3>
							{r.scans.map((s,i) => (
								<div key={i} style={{borderBottom:"1px solid var(--border)",paddingBottom:12,marginBottom:12}}>
									<InfoRow label="Scan Type" value={s.scan_type} />
									<InfoRow label="Follice Count" value={s.follice_count} />
									<InfoRow label="Endometrium" value={s.endometrium} />
									<InfoRow label="Findings" value={s.findings} /> 
									<InfoRow label="Impressions" value={s.impression} />
									<FileLink label="Scan Image" url={s.image} />
									<FileLink label="Report PDF" url={s.report_file} />
								</div>
							))}
						</div>
					) : null;
				
				case "PROCEDURE":
					return r.procedures?.length > 0 ? (
						<div className="form-card">
							<h3 className="form-section-title">Procedure Notes</h3>
							{r.procedures.map((p,i) => (
								<div key={i} style={{borderBottom:"1px solid var(--border)",paddingBottom:12,marginBottom:12}}>
									<InfoRow label="Procedure" value={p.procedure_name} />
									<InfoRow label="Performed By" value={p.performed_by_name} />
									<InfoRow label="Details" value={p.details} />
									<InfoRow label="Outcome" value={p.outcome} />
									<InfoRow label="Complications" value={p.complications} />
								</div>
							))}
						</div>
					) : null;
				
				case "CYCLE":
					details=[
						{label:"Cycle Type",value:r.cycle.cycle_type},
						{label:"Cycle #",value:r.cycle.cycle_number},
						{label:"Start Date",value:r.cycle.start_date},
						{label:"End Date",value:r.cycle.end_date},
						{label:"Status",value:r.cycle.status},
						{label:"Eggs Retrieved",value:r.cycle.eggs_retrieved},
						{label:"Eggs Fertilised",value:r.cycle.eggs_fertilised},
						{label:"Embryos Formed",value:r.cycle.embryos_formed},
						{label:"Embryos Transferred",value:r.cycle.embryos_transferred},
						{label:"Embryos Frozen",value:r.cycle.embryos_frozen},
					]
					return r.cycle ? (
						<div className="form-card">
							<h3 className="form-section-title">Treatment Cycle</h3>
							<div className="form-grid">
								{details.map(t => (
									<InfoRow label={t.label} value={t.value} />
								))}
							</div>
							<InfoRow label="Outcome" value={r.cycle.outcome} />
						</div>
					) : null;
				
				case "DIAGNOSIS":
					return r.diagnosis?.length>0 ? (
						<div className="form-card">
							<h3 className="form-section-title">Diagnosis</h3>
							{r.diagnosis.map((d,i) => (
								<div key={i} style={{marginBottom: 8}}>
									<span className="role-pill" style={{"--rc" : d.is_primary? "#ef4444" : "#6366f1"}}>
									{d.is_primary? "Primary":"Secondary"}
									</span>
									{" "}<strong>{d.icd_code}</strong> - {d.desciption}
								</div>
							))}
						</div>
					) : null;
				
				case "PRESCRIPTION":
					return r.prescriptions?.length>0 ? (
						<div className="form-card">
							<h3 className="form-section-title">Prescriptions</h3>
							<table className="staff-table">
								<thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Route</th></tr></thead>
								<tbody>
									{r.prescriptions.map((p,i) => (
										<tr key={i}>
											<td>{p.medication_name}</td>
											<td>{p.dosage}</td>
											<td>{p.frequency}</td>
											<td>{p.duration}</td>
											<td>{p.route}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : null;
				default:
					return null;
		}
	};

	return (
		<div className="staff-form-page">
			<div className="form-page-header">
				<button className="btn-back" onClick={onBack}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back to Records
        </button>
				<div style={{flex: 1}}>
					<h2 className="form-page-title">{record.title}</h2>
					<p className="form-page-sub">
						{record.record_type_display} | {record.date} | by {record.created_by_name} ({record.created_by_role})
					</p>
				</div>
				{canDelete && (
					<button className="btn-toggle btn-deactivate" onClick={handleDelete} disabled={deleting}>
						{deleting ? "Deleting..." : "Delete Record" }
					</button>
				)}
			</div>
			{/* General notes */}
			{record.notes && (
				<div className="form-card">
					<h3 className="form-section-title">Notes</h3>
					<p style={{fontSize: "0.875rem", color:"var(--text-2",lineHeight:1.6}}>{record.notes}</p>
				</div>
			)}
			{/* Sub-section */}
			{renderSubSection()}
		</div>
	);
}