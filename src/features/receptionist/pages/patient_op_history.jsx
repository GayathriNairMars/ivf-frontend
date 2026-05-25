import { useState,useEffect } from "react";
import api from "../../../services/Client";
import { STATUS_STYLES } from "../../../utils/constants";
import { VISIT_REASONS } from "../../../utils/constants";

function InfoRow({label,value}) {
	if (!value) return null;
	return(
		<div style={{display:"flex",flexDirection:"column",gap:2}}>
			<span style={{fontSize:"0.72rem",color:"var(--text-2)",textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</span>
			<span style={{fontSize:"0.88rem",fontWeight:500}}>{value}</span>
		</div>
	);
}

export default function PatientHistory({patientId,onBack}) {
	console.log("PatientHistory received patientId:", patientId);
	const [data,setData] = useState(null);
	const [loading,setLoading] = useState(true);
	const [filter,setFilter] = useState("");
	const [search,setSearch] = useState("");

	useEffect(() => {
		if (!patientId) return;
		api.get(`/receptionist/patients/${patientId}/history/`)
			.then(({data}) => setData(data))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [patientId]);
	
	if (loading) return (
		<div className="staff-loading">
			<div className="spinner" />
			<span>Loading patient history...</span>
		</div>
	);

	if (!data) return (
		<div className="staff-empty">
			<p>Failed to load patient data.</p>
			<button className="btn-secondary" onClick={onBack}>Go Back</button>
		</div>
	);

	const {patient,tickets,total_tickets} = data;
	const filtered = tickets.filter(t => {
		const matchStatus = filter ? t.status === filter : true;
		const matchSearch = search ? 
		(t.visit_reason_display || "").toLowerCase().includes(search.toLowerCase()) ||
		(t.doctor_name || "").toLowerCase().includes(search.toLowerCase()) || 
		String(t.token_number).includes(search)
		:true;
		return matchStatus && matchSearch;
	});

	const genderMap = {M:"Male",F:"Female",O:"Other"};
	const initials = patient.full_name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();

	const statCounts = {
		DONE : tickets.filter(t => t.status === "DONE").length,
		WAITING : tickets.filter(t => t.status === "WAITING").length,
		IN_CONSULT : tickets.filter(t => t.status === "IN_CONSULT").length,
		CANCELLED : tickets.filter(t => t.status === "CANCELLED").length,
	};

	return (
		<div>
			{/* Back Button */}
			<div className="form-page-header" style={{marginBottom:20}}>
				<button className="btn-back" onClick={onBack}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
						<polyline points="15,18 9,12 15,6" />
					</svg>
					Back to Patients
				</button>
			</div>

			{/*Patient Profile Card */}
			<div className="form-card" style={{marginBottom:20}}>
				<div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
					<div style={{width:56,height:56,borderRadius:12,background:"#0ea5e9",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"1.2rem",flexShrink:0}}>
						{initials}
					</div>
					<div style={{flex:1}}>
						<h2 style={{display:"flex",gap:8,alignItems:"center",marginTop:4,flexWrap:"wrap"}}>
							{patient.full_name}
						</h2>
						<div style={{display:"flex",gap:8,alignItems:"center",marginTop:4,flexWrap:"wrap"}}>
							<span className="patient-id-pill">{patient.patient_id}</span>
							<span className={`status-pill ${patient.status === "ACT" ? "status-active" : "status-inactive"}`}>
								{patient.status === "ACT" ? "Active" : patient.status}
							</span>
							{patient.assigned_doctor_name && (
								<span style={{fontSize:"0.75rem",color:"var(--text-2)"}}>
									Dr. {patient.assigned_doctor_name}
								</span>
							)}
						</div>
					</div>
					<div style={{fontSize:"0.75rem",color:"var(--text-2)",textAlign:"right"}}>
						<div>Registered</div>
						<div style={{fontWeight:500}}>
							{patient.registered_on ? new Date(patient.registered_on).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}): "-"}
						</div>
					</div>
				</div>
				{/* Patient details grid */}
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
					<InfoRow label="Email" value={patient.email} />
					<InfoRow label="Phone" value={patient.phone} />
					<InfoRow label="Date of Birth" value={patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}): null} />
					<InfoRow label="Gender" value={genderMap[patient.gender]}></InfoRow>
					<InfoRow label="Blood Group" value={patient.blood_group}></InfoRow>
					<InfoRow label="Address" value={patient.address}></InfoRow>
				</div>
			</div>
			{/* Stats strip */}
			<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10,marginBottom:20}}>
				<div className="stat-card" style={{"--accent":"#6366f1",padding:"10px 14px"}}>
				<div className="stat-value" style={{fontSize:"1.4rem"}}>{total_tickets}</div>
				<div className="stat-label" style={{fontSize:"0.72rem"}}>Total Visits</div> 
				</div>
				{Object.entries(STATUS_STYLES).map(([key, val]) => (
                    <div key={key} className="stat-card"
                        style={{ "--accent": val.color, padding: "10px 14px", cursor: "pointer", border: filter === key ? `2px solid ${val.color}` : "1px solid var(--border)" }}
                        onClick={() => setFilter(filter === key ? "" : key)}>
                        <div className="stat-value" style={{ fontSize: "1.4rem" }}>{statCounts[key] ?? 0}</div>
                        <div className="stat-label" style={{ fontSize: "0.72rem" }}>{val.label}</div>
                    </div>
                ))}
            </div>
 
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Visit History ({filtered.length})</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {filter && (
                <button className="btn-clear" onClick={() => setFilter("")}>Clear filter</button>
            )}
            <div className="search-wrap">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    className="search-input"
                    type="text"
                    placeholder="Search by token, reason, doctor..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ minWidth: 220 }}
                />
              </div>
          </div>
      </div>
      {/* Tickets list */}
      {filtered.length === 0 ? (
        <div className="staff-empty">
          <div className="empty-icon">🎫</div>
          <p>{filter ? `No ${STATUS_STYLES[filter]?.label} visits` : "No visit history found."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(ticket => {
            const ss = STATUS_STYLES[ticket.status] || STATUS_STYLES.WAITING;
            return (
              <div key={ticket.id} style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                }}>
                {/* Token */}
                <div style={{
                    minWidth: 52, height: 52, borderRadius: 10,
                    background: "#6366f1", color: "#fff",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "1.1rem", lineHeight: 1, flexShrink: 0
                }}>
                    #{ticket.token_number}
                </div>
                {/* Visit info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {ticket.visit_reason_display || VISIT_REASONS[ticket.visit_reason] || ticket.visit_reason}
                    </div>
                    {ticket.notes && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-2)", marginTop: 2 }}>
                            {ticket.notes.slice(0, 60)}{ticket.notes.length > 60 ? "..." : ""}
                        </div>
                    )}
                </div>
                {/* Doctor & dept */}
                <div style={{ minWidth: 140, fontSize: "0.8rem", color: "var(--text-2)" }}>
                    <div style={{ fontWeight: 500, color: "var(--text)" }}>{ticket.doctor_name || "No doctor"}</div>
                    <div>{ticket.department_name || "No dept"}</div>
                </div>
                {/* Date & time */}
                <div style={{ minWidth: 90, fontSize: "0.78rem", color: "var(--text-2)", textAlign: "right" }}>
                    <div style={{ fontWeight: 500 }}>
                        {new Date(ticket.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <div>
                        {new Date(ticket.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                </div>
                {/* Status */}
                <span style={{
                    background: ss.bg, color: ss.color,
                    padding: "4px 10px", borderRadius: 20,
                    fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap"
                }}>
                    {ss.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
	);
}