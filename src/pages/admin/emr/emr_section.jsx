import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
		setLoading(true);
		try {
			const data = await patientApi.getPatientsList(`search=${search}`);
			setPatients(Array.isArray(data) ? data : (data.results || []));
		} catch {
			setPatients([]);
		} finally { 
			setLoading(false); 
		}
	}, [search]);

	useEffect(() => {
		const t = setTimeout(searchPatients, 350);
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
		<div className="section-content patient-records-page" style={{ background: "#ffffff", borderRadius: "8px", padding: "24px" }}>
			<div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
				<div>
					<h2 style={{ fontSize: "24px", fontWeight: "600", color: "#1e293b", margin: "0 0 8px 0" }}>Patient records</h2>
					<p style={{ color: "#64748b", fontSize: "14px", margin: "0" }}>
						View, search, and manage patient medical records.
					</p>
				</div>
				<div style={{ display: "flex", gap: "12px" }}>
					<button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "white", color: "#334155", fontWeight: "500", cursor: "pointer" }}>
						<FiUpload /> Upload Report
					</button>
					<button 
						style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", border: "none", borderRadius: "6px", background: "#3b82f6", color: "white", fontWeight: "500", cursor: "pointer" }} 
						onClick={() => navigate("/superadmin/patients/add")}
					>
						<FiPlus /> Add patient
					</button>
				</div>
			</div>

			<div className="filters-row" style={{ display: "flex", gap: "16px", marginBottom: "24px", alignItems: "center" }}>
				<div className="search-wrap" style={{ flex: 1, position: "relative" }}>
					<FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
					<input 
						className="search-input" 
						type="text" 
						placeholder="Search by name, MRN, or diagnosis code..." 
						value={search} 
						onChange={e => setSearch(e.target.value)} 
						autoFocus 
						style={{ width: "100%", padding: "10px 10px 10px 36px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "14px", outline: "none" }} 
					/>
				</div>
				<div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
					<select style={{ padding: "10px 32px 10px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", appearance: "none", background: "url('data:image/svg+xml;utf8,<svg fill=\"none\" height=\"20\" stroke=\"%2394a3b8\" stroke-width=\"2\" viewBox=\"0 0 24 24\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><polyline points=\"6 9 12 15 18 9\"/></svg>') no-repeat right 8px center/16px", fontSize: "14px", color: "#334155", outline: "none" }}>
						<option>Active</option>
					</select>
					<select style={{ padding: "10px 32px 10px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", appearance: "none", background: "url('data:image/svg+xml;utf8,<svg fill=\"none\" height=\"20\" stroke=\"%2394a3b8\" stroke-width=\"2\" viewBox=\"0 0 24 24\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><polyline points=\"6 9 12 15 18 9\"/></svg>') no-repeat right 8px center/16px", fontSize: "14px", color: "#334155", outline: "none" }}>
						<option>Assigned doctor</option>
					</select>
					<select style={{ padding: "10px 32px 10px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", appearance: "none", background: "url('data:image/svg+xml;utf8,<svg fill=\"none\" height=\"20\" stroke=\"%2394a3b8\" stroke-width=\"2\" viewBox=\"0 0 24 24\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><polyline points=\"6 9 12 15 18 9\"/></svg>') no-repeat right 8px center/16px", fontSize: "14px", color: "#334155", outline: "none" }}>
						<option>Type</option>
					</select>
					<button style={{ color: "#3b82f6", background: "none", border: "none", fontSize: "14px", fontWeight: "500", cursor: "pointer", padding: "0 8px" }}>More filters</button>
				</div>
			</div>

			<div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
				<table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
					<thead style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
						<tr>
							<th style={{ padding: "16px", fontWeight: "500" }}>Patient ID</th>
							<th style={{ padding: "16px", fontWeight: "500" }}>Patient name</th>
							<th style={{ padding: "16px", fontWeight: "500" }}>Partner name</th>
							<th style={{ padding: "16px", fontWeight: "500" }}>Doctor</th>
							<th style={{ padding: "16px", fontWeight: "500" }}>Type</th>
							<th style={{ padding: "16px", fontWeight: "500" }}>Status</th>
							<th style={{ padding: "16px", fontWeight: "500" }}>registered_on</th>
							<th style={{ padding: "16px", fontWeight: "500" }}></th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan="8" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
									<div className="spinner" style={{ display: "inline-block", marginRight: "8px" }} /> Loading patients...
								</td>
							</tr>
						) : patients.length > 0 ? (
							patients.map(p => (
								<tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0", color: "#334155" }}>
									<td style={{ padding: "16px" }}>{p.patient_id}</td>
									<td style={{ padding: "16px" }}>
										<div style={{ fontWeight: "500", color: "#0f172a" }}>{p.user?.full_name || "Unknown"}</div>
										<div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>{p.phone || p.user?.phone || "+91 98450 12345"}</div>
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
							))
						) : (
							<tr>
								<td colSpan="8" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
									No patients found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
				
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderTop: "1px solid #e2e8f0", color: "#64748b", fontSize: "14px" }}>
					<div>Showing {patients.length > 0 ? 1 : 0} to {patients.length} of {patients.length} Patients</div>
					<div style={{ display: "flex", gap: "8px" }}>
						<button style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", color: "#94a3b8", cursor: "pointer" }}>&lt;</button>
						<button style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #cbd5e1", borderRadius: "6px", background: "white", color: "#3b82f6", cursor: "pointer" }}>&gt;</button>
					</div>
				</div>
			</div>
		</div>
	);
}

