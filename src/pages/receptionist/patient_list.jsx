//receptionist view patient list with edit capability
import { useState,useEffect,useCallback } from "react";
import receptionistApi from "../../api/receptionistApi";
import PatientEditModal from "./patient_edit";
import { PATIENT_STATUSES } from "../../constants/constants";
import PatientHistory from "./patient_op_history";

export default function PatientSearch({ onViewHistory }) {
	const [patients,setPatients] = useState([]);
	const [loading,setLoading] = useState(false);
	const [search,setSearch] = useState("");
	const [status,setStatus] = useState("");
	const [editing,setEditing] = useState(null);
	const [viewTickets,setViewTickets] = useState(null);
	const [tickets,setTickets] = useState([]);
	// const [viewHistory,setViewHistory] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const params=new URLSearchParams();
			if (search) params.append("search",search);
			if (status) params.append("status",status);
			const data = await receptionistApi.searchPatients(params);
			const result = Array.isArray(data) ? data : (data.results || []);
			setPatients(result);
		} catch {setPatients([]);}
		finally {setLoading(false);}
	},[search,status]);
	useEffect(() => {
		const t = setTimeout(load,350);
		return () => clearTimeout(t);
	},[load]);

	const loadTickets = async (patient) => {
		setViewTickets(patient);
		try {
			const data = await receptionistApi.getPatientTickets(patient.id);
			setTickets(data.tickets || []);
		} catch {setTickets([]);}
	};

	// if (viewHistory) {
	// 	console.log("Rendering history for:", viewHistory, "id:", viewHistory?.id);
	// 	return (
	// 		<PatientHistory
	// 			patient_id={viewHistory.id}
	// 			onBack={() => setViewHistory(null)}
	// 		/>
	// 	);
	// }

	return (
		<div>
			{/* Filters */}
			<div className="filters-bar" style={{marginBottom:16}}>
				<div className="search-wrap">
					<svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
					<input className="search-input" type="text" placeholder="Search by name, ID, phone or email..." value={search} onChange={e => setSearch(e.target.value)} />
					</div>
					<select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
						<option value="">-All Treatments-</option>
						{PATIENT_STATUSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
					</select>
					<span className="result-count">{patients.length} patients</span>
			</div>
			{/* Table */}
			{loading ? (
				<div className="staff-loading"><div className="spinner" /><span>Loading...</span></div>
			): patients.length === 0 ? (
				<div className="staff-empty"><div className="empty-icon">🔍</div><p>No patients found</p></div>
			):(
				<div className="table-wrap">
					<table className="staff-table">
						<thead>
						 <tr>
							<th>Patient</th>
							<th>Patient ID</th>
							<th>Phone</th>
							<th>Doctor</th>
							<th>Status</th>
							<th>Actions</th>
						 </tr>
						</thead>
						<tbody>
							{patients.map(p => (
								<tr key={p.id} onClick={() => onViewHistory(p)} style={{cursor:"pointer"}}>
									<td>
										<div className="staff-name-cell">
											<div className="staff-avatar" style={{background:"#0ea5e9"}}>
												{p.full_name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}
											</div>
											<div>
												<div className="staff-name">{p.full_name}</div>
												<div className="email-cell">{p.email}</div>
											</div>
										</div>
									</td>
									<td><span className="patient-id-pill">{p.patient_id}</span></td>
									<td className="date-cell">{p.phone || "-"}</td>
									<td className="date-cell">{p.assigned_doctor_name || "-"}</td>
									<td>
										<span className={`status-pill ${p.status === "ACT"? "status-active":"status-inactive"}`}>{PATIENT_STATUSES.find(o => o.value === p.status)?.label || p.status}</span>
									</td>
									<td>
										<div className="action-btns">
											<button className="btn-edit" onClick={() => setEditing(p)}>Edit</button>
											<button className="btn-edit" onClick={() => loadTickets(p)}>Tickets</button>
											<button className="btn-edit" onClick={e => { e.stopPropagation(); onViewHistory(p); }}>History</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			{/* Edit Modal */}
			{editing && (
				<PatientEditModal 
					patient={editing}
					onClose={() => setEditing(null)}
					onSaved={() => {setEditing(null); load(); }}
					/>
			)}
			{/* Tickets Modal */}
			{viewTickets && (
				<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
					<div style={{background:"var(--surface)",borderRadius:12,padding:24,width:640,maxHeight:"80vh",overflow:"auto"}}>
						<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
							<h3 style={{margin:0}}>Tickets - {viewTickets.full_name}</h3>
							<button className="btn-secondary" onClick={() => setViewTickets(null)}>Close</button>
						</div>
						{tickets.length == 0? (
							<p style={{color:"var(--text-2)",textAlign:"center"}}>No tickets generated yet.</p>
						):(
							<table className="staff-table">
								<thead><tr>
								<th>Token</th>
								<th>Date</th>
								<th>Reason</th>
								<th>Doctor</th>
								<th>Status</th>
								</tr></thead>
								<tbody>
									{tickets.map(t => (
										<tr key={t.id}>
											<td><strong>#{t.token_number}</strong></td>
											<td className="date-cell">{t.date}</td>
											<td className="date-cell">{t.visit_reason_display}</td>
											<td className="date-cell">{t.doctor_name || "-"}</td>
											<td><span className="status-pill status-active">{t.status_display}</span></td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			)}
		</div>
	);
}