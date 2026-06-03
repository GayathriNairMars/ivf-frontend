import { useState,useEffect,useCallback } from "react";
import { useNavigate,useParams } from "react-router-dom";
import patientApi from "../../../api/patientApi";
import PatientEMR from "./patient_emr";
import { FiUpload, FiPlus, FiSearch, FiArrowUpRight } from "react-icons/fi";
import AddEMRRecord from "./add_emrrecord";
import { useLocation } from "react-router-dom";

export default function EMRSection() {
	const { patientId } = useParams(); 
	const location = useLocation();
	const isCreatePage = location.pathname.endsWith("/create");
	const [search, setSearch] = useState("");
	const [patients, setPatients] = useState([]);
	const [loading, setLoading] = useState(false);
	const [patient, setPatient] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
    if (!patientId) { setPatient(null); return; }
    patientApi.getPatientDetails(patientId)
      .then((data) => setPatient(data))
      .catch(() => navigate("/superadmin/emr/patients"));
  }, [patientId]);

	const searchPatients = useCallback(async () => {
		if (!search.trim()) {setPatients([]); return; }
		setLoading(true);
		try {
			const data = await patientApi.getPatientsList(`search=${search}`);
			setPatients(Array.isArray(data) ? data: (data.results || []));
		} catch {setPatients([]);}
		 finally { setLoading(false); }
	}, [search]);

	useEffect(() => {
		const t =setTimeout(searchPatients,350);
		return () => clearTimeout(t);
	}, [searchPatients]);

	if ((patientId || isCreatePage) && !patient) {
	    return <div>Loading patient...</div>;
	}

	if (isCreatePage && patient) {
	    return (
	        <AddEMRRecord
	            patient={patient}
	            onBack={() =>
	                navigate(`/superadmin/emr/patients/${patient.id}`)
	            }
	            onSuccess={() =>
	                navigate(`/superadmin/emr/patients/${patient.id}`)
	            }
	        />
	    );
	}

	if (patientId && patient) {
	    return (
	        <PatientEMR
	            patient={patient}
	            onBack={() => navigate("/superadmin/emr/patients")}
	        />
	    );
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
									<td style={{ padding: "16px" }}>{p.partner_info?.full_name || "N/A"}</td>
									<td style={{ padding: "16px", fontWeight: "500" }}>{p.assigned_doctor?.full_name || "N/A"}</td>
									<td style={{ padding: "16px", color: "#3b82f6", cursor: "pointer" }}>{p.treatment_type_display || "Lab result"} <FiArrowUpRight style={{ display: "inline", verticalAlign: "middle" }}/></td>
									<td style={{ padding: "16px" }}>
										<span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: p.status?.toLowerCase() === 'active' ? "#16a34a" : "#64748b", fontSize: "12px", fontWeight: "500" }}>
											<span style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.status?.toLowerCase() === 'active' ? "#16a34a" : "#64748b" }}></span> {p.status || "Active"}
										</span>
									</td>
									<td style={{ padding: "16px", color: "#64748b" }}>{p.registered_on || "2 hours ago"}</td>
									<td style={{ padding: "16px", textAlign: "right" }}>
										<button className="btn-create-emr"
											onClick={() =>	navigate(`/superadmin/emr/patients/${p.id}/create`) }>
										  + Create EMR
										</button>
									</td>
									<td style={{ padding: "16px", textAlign: "right" }}>
										<button 
											onClick={() => navigate(`/superadmin/emr/patients/${p.id}`)} 
											style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "white", color: "#3b82f6", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
										>
											View details <FiArrowUpRight />
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
