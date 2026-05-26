import { useState,useEffect,useCallback } from "react";
import { useNavigate } from "react-router-dom";
import patientApi from "../../../api/patientApi";
import { STATUS_COLORS, TREATMENT_LABELS } from "../../../constants/constants";
import "./patient.css";
import "../staff/staff.css";


export default function PatientList(){
	const navigate = useNavigate();
	const [patients,setPatients] = useState([]);
	const [loading,setLoading] = useState(true);
	const [stats,setStats] = useState(null);

	const [search,setSearch] = useState("");
	const [status,setStatus] = useState("");
	const [treatment,setTreatment] = useState("");
	const [page,setPage] = useState(1);
	const PER_PAGE=10;

	const fetchPatients = useCallback(async() =>{
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (search) params.append("search",search);
			if (status) params.append("status",status);
			if (treatment) params.append("treatment_type", treatment);
			const [pRes,sRes] = await Promise.all([
				patientApi.getPatientsList(params),
				patientApi.getPatientStats(),
			]);
			setPatients(Array.isArray(pRes) ? pRes : (pRes.results || []));
			setStats(sRes);
		} catch {
			setPatients([]);
		} finally {
			setLoading(false);
		}
	}, [search, status, treatment]);

	useEffect(()=> {fetchPatients();},[fetchPatients]);

	const totalPages = Math.ceil(patients.length/PER_PAGE);
	const paginated = patients.slice((page- 1) * PER_PAGE, page * PER_PAGE);
	const hasFilters = search || status || treatment;
	const reset = ()=> {setSearch("");setStatus("");setTreatment("");setPage(1);};

	return(
		<div className="patient-section">
			{/* Header */}
			<div className="staff-list">
				<div className="subnav-left">
					<h2 className="staff-title">Patients</h2>
					<p className="staff-subtitle">{stats?.total ?? 0} registered patients</p>
				</div>
				<button className="btn-add-patient" onClick={() => navigate("/superadmin/patients/add")}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
					Register Patient
				</button>
			</div>
			{/* Stat cards */}
			{stats && (
				<div className="patient-stats-row">
					{Object.entries(STATUS_COLORS).map(([key,val])=> (
						<div key={key} className="patient-stat-card" style={{borderColor: val.color}}>
							<span className="psc-value" style={{color:val.color}}>{stats.by_status?.[key] ?? 0}</span>
							<span className="psc-label">{val.label}</span>
						</div>
					))}
				</div>
			)}
			{/* Filters */}
			<div className="filters-bar">
				<div className="search-wrap">
					<svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
						<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<input className="search-input" type="text" placeholder="Search by name, email, patient ID..." value={search} onChange={e => {setSearch(e.target.value); setPage(1); }} />
				</div>
				<select className="filter-select" value={status} onChange={e =>{setStatus(e.target.value); setPage(1); }}>
					<option value="">All Status</option>
					{Object.entries(STATUS_COLORS).map(([k,v])=> (
						<option key={k} value={k}>{v.label}</option>
					))}
				</select>
				<select className="filter-select" value={treatment} onChange={e => {setTreatment(e.target.value); setPage(1); }}>
					<option value="">All Treatments</option>
					{Object.entries(TREATMENT_LABELS).map(([k,v])=>(
						<option key={k} value={k}>{v}</option>
					))}
				</select>
				{hasFilters && <button className="btn-clear" onClick={reset}>Clear</button>}
				<span className="result-count">{patients.length} patients</span>
			</div>
			{/* Table */}
			{loading ? (
				<div className="staff-loading"><div className="spinner" /><span>Loading patients...</span></div>
			):paginated.length === 0 ? (
				<div className="staff-empty">
					<div className="empty-icon">🧑‍⚕️</div>
					<p>{hasFilters? "No patients matching your filters.":"No patients registered yet."}</p>
					{hasFilters && <button className="btn-clear" onClick={reset}>Clear filters</button>}
				</div>
			) : (
				<>
					<div className="table-wrap">
						<table className="patient-table">
							<thead>
								<tr>
									<th>Patient</th>
									<th>Patient ID</th>
									<th>Treatment</th>
									<th>Assigned Doctor</th>
									<th>Status</th>
									<th>Registered</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{paginated.map(p => {
									const sc = STATUS_COLORS[p.status] || STATUS_COLORS.PEN;
									return(
										<tr key={p.id}>
											<td>
												<div className="staff-name-cell">
													<div className="staff-avatar" style={{background: "#0ea5e9"}}>
														{p.user?.full_name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}
													</div>
													<div>
														<div className="staff-name">{p.user?.full_name}</div>
														<div className="email-cell">{p.user?.email}</div>
													</div>
												</div>
											</td>
											<td><span className="patient-id-pill">{p.patient_id}</span></td>
											<td className="date-cell">{TREATMENT_LABELS[p.treatment_type] || "-"}</td>
											<td className="date-cell">{p.assigned_doctor?.full_name || "-"}</td>
											<td>
												<span className="status-badge" style={{ background: sc.bg, color: sc.color}}>
												{sc.label}
												</span>
											</td>
											<td className="date-cell">
												{p.registered_on ? new Date(p.registered_on).toLocaleDateString("en-IN", {day:"2-digit", month:"short", year:"numeric"}): "-"}
											</td>
											<td>
												<div className="action-btns">
													<button className="btn-edit" onClick={()=> navigate(`/superadmin/patients/${p.id}`)}>View</button>
													<button className="btn-edit" onClick={() => navigate(`/superadmin/patients/${p.id}/edit`)}>Edit</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{totalPages>1 && (
						<div className="pagination">
							<button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Prev</button>
							{Array.from({length:totalPages}, (_,i) => i+1).map(p => (
								<button key={p} className={`page-btn ${p===page ? "page-active":""}`} onClick={() => setPage(p)}>{p}</button>
							))}
							<button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Next</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}