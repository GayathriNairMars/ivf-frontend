//Upload &view of previous medical history documents
import { useState,useEffect,useCallback } from "react";
import patientApi from "../../../api/patientApi";

const DOC_TYPES = [
	{value: "PREV_RECORD", label:"Previous Medical Record"},
	{value:"DISCHARGE", label:"Discharge Summary"},
	{value:"PRESCRIPTION", label:"Old Prescription"},
	{value:"LAB_REPORT", label:"Old Lab Report"},
	{value:"SCAN", label:"Old Scan"},
	{value:"REFERRAL",value:"Referral Letter"},
	{value:"OTHER",label:"Other"},
];

export default function HistoryDocuments({patient}) {
	const [docs,setDocs] = useState([]);
	const [loading,setLoading] = useState(true);
	const [showForm,setShowForm] = useState(false);
	const [form,setForm] = useState({ document_type: "PREV_RECORD", title: "", notes: "", document_date: "" });
	const [file,setFile] = useState(null);
	const [submitting,setSubmitting] = useState(null);
	const [errors,setErrors] = useState({});

	const load =useCallback(async () => {
		setLoading(true);
		try {
			const data = await patientApi.getHistoryDocs(patient.id);
			setDocs(data.documents || []);
		} catch { setDocs([]); }
		finally { setLoading(false); }
	}, [patient.id]);
	useEffect(() => {load();}, [load]);

	const handleSubmit = async e => {
		e.preventDefault();
		if (!file) {setErrors({file:"Please select a file."}); return; }
		if (!form.title.trim()) {setErrors({title:"Title is required."}); return; }
		setSubmitting(true);
		try{
			const payload = new FormData();
			payload.append("patient",patient.id);
			payload.append("document_type",form.documents_type);
			payload.append("title",form.title);
			payload.append("notes",form.notes);
			payload.append("file",file);
			if (form.document_date) payload.append("document_date",form.document_date);
			await patientApi.addHistoryDoc(patient.id, payload, {
				headers:{"Content-Type":"multipart/form-data"},
			});
			setForm({document_type:"PREV_RECORD",title:"",notes:"",document_date:""});
			setFile(null);
			setShowForm(false);
			load();
		} catch (err) {
			const data =err.response?.data;
			if (data && typeof data === "object") {
				const fe ={};
				Object.entries(data).forEach(([k,v]) => {fe[k] = Array.isArray(v) ? v[0] : v;});
				setErrors(fe);
			} else {
				setErrors({general: "Upload Failed."});
			}
		} finally { setSubmitting(false); }
	};

	const handleDelete = async (docId) => {
		if (!confirm("Delete this document?")) return;
		try {
			await patientApi.deleteHistoryDoc(docId);
			load();
		} catch { alert("Failed to delete."); }
	};

	return (
		<div>
			<div style={{display:"flex", justifyContent:"space-between", alignItems:"center",marginBottom:16}}>
				<h3 className="form-section-title" style={{margin:0}}>Medical History Documents</h3>
				<button className="btn-edit" onClick={() => setShowForm(s => !s)}>
					{showForm ? "Cancel" : "+ Upload Document"}
				</button>
			</div>
			{/* Upload Form */}
			{showForm && (
				<div className="form-card" style={{marginBottom:20}}>
					<h3 className="form-section-title">Upload Documents</h3>
					<form onSubmit={handleSubmit} className="staff-form" noValidate>
						<div className="form-grid">
							<div className="form-field">
								<label className="form-label">Document Type</label>
								<select className="form-input" value={form.document_type} onChange={e => setForm(p => ({...p, document_type: e.target.value}))}>
									{DOC_TYPES.map(d=> <option key={d.value} value={d.value}>{d.label}</option>)}
								</select>
							</div>
							<div className="form-field">
								<label className="form-label">Title *</label>
								<input className="form-input" value={form.title} onChange={e => setForm(p => ({...p, title:e.target.value}))} placeholder="e.g. Previous IVF Report 2023" />
									{errors.title && <span className="field-error">{errors.title}</span>}
							</div>
							<div className="form-field">
								<label className="form-label">Document Date</label>
								<input className="form-input" type="date" value={form.document_date} onChange={e => setForm(p => ({...p,document_date:e.target.value}))} />
							</div>
							<div className="form-field">
								<label className="form-label">File *</label>
								<input className="form-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
								{errors.file && <span className="field-error">{errors.file}</span>}
							</div>
							<div className="form-field" style={{gridColumn: "1/-1"}}>
								<label className="form-label">Notes</label>
								<textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target_value}))} />
							</div>
						</div>
						{errors.general && <div className="error-banner">{errors.general}</div>}
						<div className="form-actions">
							<button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
							<button type="submit" className="btn-primary" disabled={submitting}>
								{submitting? "Uploading..." : "Upload"}
							</button>
						</div>
					</form>
				</div>
			)}
			{/* Documents List */}
			{loading ? (
				<div className="staff-loading"><div className="spinner" /><span>Loading...</span></div>
			) : docs.length === 0? (
				<div className="staff-empty">
					<div className="empty-icon">📁</div>
					<p>No History documents uploaded yet.</p>
				</div>
			) : (
				<div className="table-wrap">
					<table className="staff-table">
						<thead>
							<tr><th>Type</th><th>Title</th><th>Document Date</th><th>Uploaded By</th><th>Uploaded at</th><th></th></tr>
						</thead>
						<tbody>
							{docs.map(d => (
								<tr key={d.id}>
									<td><span className="role-pill" style={{"--rc":"#6366f1",fontSize:"0.7rem"}}>{d.document_type_display}</span></td>
									<td className="staff-name">{d.title}</td>
									<td className="date-cell">{d.document_date ||"-"}</td>
									<td className="staff-name">{d.uploaded_by_name || "-"} <span style={{color:"var(--text-2)",fontSize:"0.7rem"}}>({d.uploaded_by_role})</span> </td>
									<td className="date-cell">{d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString("en-In",{day:"2-digit",month:"short",year:"numeric"}): "-"}</td>
									<td>
										<div className="action-btns">
											<a href={d.file} target="_blank" rel="noopener noreferrer" className="btn-edit">Open </a>
											<button className="btn-toggle btn-deactivate" onClick={() => handleDelete(d.id)} style={{fontSize:"0.75rem"}}>Delete</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}