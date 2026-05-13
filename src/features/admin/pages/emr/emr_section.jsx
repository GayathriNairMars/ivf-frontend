import { useState,useEffect,useCallback } from "react";
import { useNavigate,useParams } from "react-router-dom";
import api from "../../../../services/Client";
import PatientEMR from "./patient_emr";

export default function EMRSection() {
	const { patientId } = useParams(); 
	const [search,setSearch] = useState("");
	const [patients,setPatients] = useState([]);
	const [loading,setLoading] = useState(false);
	const [patient, setPatient]   = useState(null);
	const navigate= useNavigate();

	useEffect(() => {
    if (!patientId) { setPatient(null); return; }
    api.get(`/patients/${patientId}/`)
      .then(({ data }) => setPatient(data))
      .catch(() => navigate("/superadmin/emr"));
  }, [patientId]);

	const searchPatients = useCallback(async () => {
		if (!search.trim()) {setPatients([]); return; }
		setLoading(true);
		try {
			const {data} = await api.get(`/patients/?search=${search}`);
			setPatients(Array.isArray(data) ? data: (data.results || []));
		} catch {setPatients([]);}
		 finally { setLoading(false); }
	}, [search]);

	useEffect(() => {
		const t =setTimeout(searchPatients,350);
		return () => clearTimeout(t);
	}, [searchPatients]);
	if (patientId && patient) {
		return <PatientEMR patient={patient} onBack={() => navigate("/superadmin/emr")} />;
	}

	return (
		<div className="section-content">
			<div className="section-header">
				<h2>EMR - Select Patient</h2>
				<p style={{color: "var(--text-2)", fontSize:"0.875rem"}}>
					Search for a patient to view or add EMR records.
				</p>
			</div>
			<div className="search-wrap" style={{maxWidth:480,marginBottom:24}}>
				<svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
					<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input className="search-input" type="text" placeholder="Search by name, email or patient ID..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
				</div>

			{loading && <div className="staff-loading"><div className="spinner" /><span>Searching...</span></div>}
			
			{!loading && patients.length>0 &&(
				<div className="table-wrap">
					<table className="staff-table">
						<thead>
							<tr>
								<th>Patient</th>
								<th>Patient ID</th>
								<th>Treatment</th>
								<th>Status</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{patients.map(p => (
								<tr key={p.id}>
									<td>
										<div className="staff-name-cell">
											<div className="staff-avatar" style={{background:"#0ea5e9"}}>
												{p.user?.full_name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}
											</div>
											<div>
												<div className="staff-name">{p.user?.full_name}</div>
												<div className="email-cell">{p.user?.email}</div>
											</div>
										</div>
									</td>
									<td><span className="patient-id-pill">{p.patient_id}</span></td>
									<td className="date-cell">{p.treatment_type || "-"}</td>
									<td><span className="status-pill status-active">{p.status}</span></td>

									<td>
										<button className="btn-edit" onClick={() => navigate(`/superadmin/emr/${p.id}`)}>
											Open EMR
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{!loading && search && patients.length === 0 && (
				<div className="staff-empty">
					<div className="empty-icon">🏥</div>
					<p>Start typing to search for a patient</p>
				</div>
			)}
		</div>
	);
}
