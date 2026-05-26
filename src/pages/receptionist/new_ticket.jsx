//Generate a new OP ticket
import { useState,useEffect } from "react";
import receptionistApi from "../../api/receptionistApi";
import "./receptionist.css"
import { VISIT_REASONS } from "../../constants/constants";


function Field({label,error,children}) {
	return (
		<div className="form-field">
			<label className="form-label">{label}</label>
			{children}
			{error && <span className="field-error">{error}</span>}
		</div>
	);
}


export default function NewTicket({onSuccess,onCancel}) {
	const [search,setSearch] = useState("");
	const [patients,setPatients] = useState([]);
	const [selected,setSelected] = useState(null);
	const [doctors,setDoctors] = useState([]);
	const [departments,setDepartments] = useState([]);
	const [form,setForm] = useState({
		assigned_doctor:"",department:"",visit_reason:"CONSULTATION",notes:"",payment_done: false,
	});
	const [errors,setErrors] = useState({});
	const [submitting,setSubmitting] = useState(false);
	const [ticket,setTicket] = useState(null);

	useEffect(() => {
		receptionistApi.getDoctors().then((data) => setDoctors(data)).catch(() => {});
		receptionistApi.getDepartments().then((data) => setDepartments(data)).catch(() => {});
	},[]);

	//Patient search
	useEffect(() => {
		if (!search.trim()) {setPatients([]); return; }
		const t = setTimeout(() => {
			receptionistApi.searchPatients(`?search=${search}`)
				.then((data) => setPatients(Array.isArray(data) ? data : (data.results || [])))
				.catch(() => {});
		}, 350);
		return () => clearTimeout(t);
	}, [search]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!selected) {setErrors({patient: "Please select a patient."}); return;}
		setSubmitting(true);
		try {
			const data = await receptionistApi.createTicket({
				patient: selected.id,
				assigned_doctor: form.assigned_doctor || null,
				department: form.department || null,
				visit_reason: form.visit_reason,
				notes: form.notes,
			});
			setTicket(data);
		} catch(err) {
			const d =err.response?.data;
			if (d && typeof d === "object") {
				const fe ={};
				Object.entries(d).forEach(([k,v]) => {fe[k]=Array.isArray(v) ? v[0] : v;});
				setErrors(fe);
			} else {
				setErrors({general:"Failed to generate ticket"});
			}
		} finally {setSubmitting(false);}
	};

	//show generated ticket
	if (ticket) {
		return (
			<div style={{maxWidth:480,margin:"0 auto"}}>
				<div style={{
					background:"var(--surface)",border:"2px solid #6366f1",borderRadius:12,overflow:"hidden",
				}}>
					<div id="new-print-ticket" style={{padding:32}}>
						<div style={{textAlign:"center",borderBottom:"2px dashed #ccc",paddingBottom:16,marginBottom:16}}>
							<h2 style={{margin:0,fontSize:"1.1rem",letterSpacing:1}}>IVF HIMS</h2>
							<p style={{margin:"4px 0",fontSize:"0.75rem",color:"#666"}}>Out Patient Department</p>
						</div>
						<div style={{textAlign:"center",margin:"16px 0"}}>
							<div style={{fontSize:"4rem",fontWeight:800,color:"#6366f1",lineHeight:1}}>
								#{ticket.token_number}
							</div>
							<div style={{fontSize:"0.75rem",color:"#666",marginTop:4}}>TOKEN NUMBER</div>
						</div>
						<div style={{borderTop:"1px dashed #ccc",paddingTop:16,display:"flex",flexDirection:"column",gap:8}}>
							{[
								["Patient", ticket.patient_name],
								["Patient ID", ticket.patient_id_str],
								["Doctor", ticket.doctor_name || "To be assigned"],
								["Department", ticket.department_name || "To be assigned"],
								["Visit Reason", ticket.visit_reason_display],
								["Date", new Date(ticket.date).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})],
								["Time", new Date(ticket.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})],
							].map(([label,value]) => (
								<div key={label} style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem"}}>
									<span style={{color:"#666",fontWeight:500}}>{label}</span>
									<span style={{fontWeight:600}}>{value}</span>
								</div>
							))}
							{ticket.notes && (
								<div style={{marginTop:8,padding:8,background:"#f8fafc",borderRadius:6,fontSize:"0.8rem"}}>
									<div style={{color:"#666",fontWeight:500,marginBottom:4}}>Cheif Complaint</div>
									<div>{ticket.notes}</div>
								</div>
							)}
						</div>
						<div style={{textAlign:"center",marginTop:16,paddingTop:12,borderTop:"2px dashed #ccc"}}>
							<p style={{fontSize:"0.7rem",color:"#999",margin:0}}>Please wait for your token to be called</p>
						</div>
					</div>
					<div style={{display:"flex",gap:8,padding:"0 32px 24px",justifyContent:"center"}}>
						<button className="btn-secondary" onClick={onCancel}>Back to Queue</button>
						<button className="btn-secondary" onClick={() => {setTicket(null); setSelected(null);setSearch(""); setForm({assigned_doctor:"",department:"",visit_reason:"CONSULTATION",cheif_complaint:""});}}>
							+ Another Ticket
						</button>
						<button className="btn-primary" onClick={ () =>{
							const content = document.getElementById("new-print-ticket").innerHTML;
              const w = window.open("", "_blank");
              w.document.write(`<html><head><title>OP Ticket #${ticket.token_number}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:20px;}@media print{body{padding:0;}}</style></head><body>${content}</body></html>`);
              w.document.close();
              w.print();
						}}> 
						🖨️ Print
            </button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={{maxWidth:640,margin:"0 auto"}}>
			<form onSubmit={handleSubmit} className="staff-form" noValidate>
				{/* Patient search */}
				<div className="form-card">
					<h3 className="form-section-title">Select Patient</h3>
					{selected ? (
						<div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px", background:"#f0fdf4",borderRadius:8,border:"1px solid #86efac"}}>
							<div className="staff-avatar" style={{background:"#0ea5e9",width:36,height:36,fontSize:"0.85rem"}}>
								{selected.full_name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}
							</div>
							<div style={{flex:1}}>
								<div style={{fontWeight:600}}>{selected.full_name}</div>
								<div style={{fontSize:"0.75rem",color:"var(--text-2)"}}>{selected.patient_id} - {selected.email}</div>
							</div>
							<button type="button" className="btn-secondary" style={{fontSize:"0.75rem"}} onClick={() => {setSelected(null); setSearch("");}}>
								Change
							</button>
						</div>
					):(
						<>
						 <Field label="Search Patient" error={errors.patient}>
							<div className="search-wrap">
								<svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
								<input className="search-input" type="text" placeholder="Search by name,id,or phone..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
							</div>
						 </Field>
						 {patients.length > 0 && (
							<div style={{border:"1px solid var(--border)",borderRadius:8,overflow:"hidden",marginTop:8}}>
								{patients.slice(0,6).map(p => (
									<div key={p.id} style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10}} 
									onClick={() => {setSelected(p); setSearch(""); setPatients([]);}}>
										<div className="staff-avatar" style={{background:"#0ea5e9",width:32,height:32,fontSize:"0.75rem"}}>
											{p.full_name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}
										</div>
										<div>
											<div style={{fontWeight:500,fontSize:"0.9rem"}}>{p.full_name}</div>
											<div style={{fontSize:"0.72rem",color:"var(--text-2"}}>{p.patient_id} - {p.phone || p.email}</div>
										</div>
									</div>
								))}
							</div>
						 )}
						</>
					)}
				</div>

				{/* Ticket Details */}
				<div className="form-card">
					<h3 className="form-section-title">Visit Details</h3>
					<div className="form-grid">
						<Field label="Visit Reason *" error={errors.visit_reason}>
							<select className="form-input" value={form.visit_reason} onChange={e => setForm(p => ({...p,visit_reason:e.target.value}))}>
								{VISIT_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
							</select>
						</Field>
						<Field label="Assigned Doctor" error={errors.assigned_doctor}>
							<select className="form-input" value={form.assigned_doctor} onChange={e => setForm(p => ({...p,assigned_doctor:e.target.value}))}>
								<option value="">-Select Doctor-</option>
								{doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.role_display})</option>)}
							</select>
						</Field>
						<Field label="Department" error={errors.department}>
							<select className="form-input" value={form.department} onChange={e => setForm(p => ({...p,department:e.target.value}))}>
								<option value="">-Select Department-</option>
								{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
							</select>
						</Field>
						<Field label="Additional Notes" error={errors.notes}>
							<textarea className="form-input" rows={3} placeholder="Breif Description of reason for visit"
							value={form.notes} onChange={e => setForm(p => ({...p,notes:e.target.value}))} />
						</Field>
						<div className="payment-toggle-wrapper">
							<label className="payment-toggle-label">
								Payment Status
							</label>
							<button type="button" className={`payment-toggle-btn ${form.payment_done ? "paid" : "unpaid"}`} 
								onClick={() => setForm(p => ({...p,payment_done: !p.payment_done}))}>
									{form.payment_done ? "✓ Payment Completed" : "Mark Payment as Done"}
							</button>
						</div>	
					</div>
				</div>
				{errors.general && <div className="error-banner">{errors.general}</div>}
				<div className="form-actions">
					<button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
					<button type="submit" className="btn-primary" disabled={submitting || !selected}>
						{submitting? "Generating..." : "🎫 Generate Ticket"}
					</button>
				</div>
			</form>
		</div>
	);
}
