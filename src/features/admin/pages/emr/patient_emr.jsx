// Full EMR view for a selected Patient
import { useState,useEffect,useCallback } from "react";
import api from "../../../../services/Client";
import AddEMRRecord from "./add_emrrecord";
import EMRRecordDetail from "./emrrecord_detail";
import HistoryDocuments from "./historydocs";


const TYPE_ICONS = {
  CONSULTATION:     "🩺",
  DIAGNOSIS:        "📋",
  PRESCRIPTION:     "💊",
  LAB_RESULT:       "🧪",
  SCAN:             "🖥️",
  PROCEDURE:        "🔬",
  CYCLE:            "🔄",
  NURSING_NOTE:     "🩹",
  PHARMACY_NOTE:    "💉",
  ANDROLOGY_NOTE:   "🔭",
  COUNSELLING_NOTE: "💬",
  OTHER:            "📄",
};

const TABS =[
	{key:"timeline",label:"Timeline"},
	{key:"history",label:"History Docs"},
];

export default function PatientEMR({patient,onBack}) {
	const [summary,setSummary] = useState(null);
	const [records,setRecords] = useState([]);
	const [loading,setLoading] = useState(true);
	const [view,setView] = useState("list");
	const [tab,setTab] = useState("timeline");
	const [typeFilter,setTypeFilter] = useState("");
	const [selectedRecord,setSelectedRecord] = useState(null);

	const loadSummary = useCallback(async () => {
		try {
			const {data} = await api.get(`/emr/patient/${patient.id}/`)
			setSummary(data);
		} catch {}
	},[patient.id]);

	const loadRecords = useCallback(async () => {
		setLoading(true);
		try{
			const params = typeFilter? `?record_type=${typeFilter}` : "";
			const {data} = await api.get(`/emr/patient/${patient.id}/records/${params}`);
			setRecords(data.records || []);
		} catch { setRecords([]) }
		finally { setLoading(false); }
	},[patient.id,typeFilter]);

	useEffect(() => {loadSummary(); }, [loadSummary]);
	useEffect(() => {if (tab === "timeline") loadRecords(); }, [loadRecords, tab]);
	const handleRecordAdded = () => {
		setView("list");
		loadRecords();
		loadSummary();
	};

	if (view==="add") {
		return (
			<AddEMRRecord
			patient={patient}
			onBack={() => setView("list")}
			onSuccess={handleRecordAdded}
			/>
		);
	}
	
	if (view==="detail" && selectedRecord) {
		return (
			<EMRRecordDetail 
				record={selectedRecord}
				patient={patient}
				onBack={() => {setView("list"); setSelectedRecord(null); }}
				onDeleted={() => {setView("list"); setSelectedRecord(null); loadRecords(); loadSummary(); }}
			/>
		);
	}

	return (
		<div className="staff-form-page">
			{/* Header */}
			<div className="patient-header">
				<button className="btn-back" onClick={onBack}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
						<polyline points="15,18 9,12 15,6" />
					</svg>
					Back To Patient Search
				</button>
				<div style={{flex:1}}>
					<h2 className="form-page-title">EMR - {patient.user?.full_name}</h2>
					<p className="form-page-sub">{patient.patient_id}</p>
				</div>
				<button className="btn-add-staff" onClick={() => setView("add")} >
					+Add Record
				</button>
			</div>
			{/* Patient identity strip */}
			<div className="staff-identity-card" style={{"--rc":"#0ea5e9"}}>
				<div className="identity-avatar" style={{background: "#0ea5e9"}}>
					{patient.user?.full_name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}
				</div>
				<div className="identity-info">
					<span className="identity-name">{patient.user?.full_name}</span>
					<span className="identity-email">{patient.user?.email}</span>
				</div>
				<span className="identity-role" style={{color:"#0ea5e9",borderColor:"#0ea5e9"}}>
					{patient.patient_id}
				</span>
				{summary && (
					<span style={{fontSize:"0.8rem", color:"var(--text-2)"}}>
						{summary.total_records} records
					</span>
				)}
			</div>
			{/* Summary Cards */}
			{summary && Object.keys(summary.by_type).length>0 && (
				<div className="stats-grid" style={{gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10,marginBottom:20}}>
					{Object.entries(summary.by_type).map(([code,info]) => (
						<div 
							key={code}
							className="stat-card"
							style={{"--accent":"#6366f1",cursor:"pointer",padding:"12px 14px"}}
							onClick={() => {setTypeFilter(code); setTab("timeline");}}
						>
							<div style={{fontSize:"1.4rem"}}>{TYPE_ICONS[code] || "📄"}</div>
							<div className="stat-value" style={{fontSize: "1.2rem"}}>{info.count}</div>
							<div className="star-label" style={{fontSize:"0.7rem"}}>{info.label}</div>
						</div>
						))}
				</div>
			)}

			{/* Tabs */}
			<div className="staff-subnav" style={{marginBottom:16, borderBottom: "1px solid var(--border)", paddingBottom: 8}}>
				<div style={{display:"flex", gap:8, alignItems: "center"}}>
					{TABS.map(t => (
						<button key={t.key}
							onClick={() => setTab(t.key)}
        			style={{
        			  padding: "6px 16px",
        			  borderRadius: 6,
        			  border: "none",
        			  background: tab === t.key ? "var(--accent, #6366f1)" : "transparent",
        			  color: tab === t.key ? "#fff" : "var(--text-2)",
        			  fontWeight: tab === t.key ? 600 : 400,
        			  cursor: "pointer",
        			}}
						>
							{t.label}
						</button>
					))}
				</div>
				{tab === "timeline" && (
					<select 
					className="filter-select"
					value={typeFilter}
					onChange={e => setTypeFilter(e.target.value)}
					style={{marginLeft:"auto"}}
					>
						<option value="">All Types</option>
						{Object.entries(TYPE_ICONS).map(([code]) =>(
							<option key={code} value={code}>{code.replace(/_/g," ")}</option>
						))}
					</select>
				)}
			</div>

			{/* Timelime tab */}
			{tab === "timeline" && (
				<>
					{loading? (
						<div className="staff-loading"><div className="spinner"/><span>Loading records...</span></div>
					): records.length === 0?(
						<div className="staff-empty">
							<div className="empty-icon">📋</div>
							<p>{typeFilter? "No records of this type":"No EMR records yet"}</p>
							<button className="btn-edit" onClick={() => setView("add")}>Add First Record</button>
						</div>
					) : (
						<div className="table-wrap">
							<table className="staff-table">
								<thead>
									<tr>
										<th>Type</th>
										<th>Title</th>
										<th>Date</th>
										<th>Created_by</th>
										<th>Role</th>
										<th></th>
									</tr>
								</thead>
								<tbody>
									{records.map(r => (
										<tr key={r.id}>
											<td>
												<span style={{fontSize:"1.1rem"}}>{TYPE_ICONS[r.record_type] || "📄" }</span>
												{" "}
												<span className="role-pill" style={{"--rc":"#6366f1",fontSize:"0.7rem"}}>
													{r.record_type_display}</span> 
											</td>
											<td className="staff-name">{r.title}</td>
											<td className="date-cell">
												{r.date ? new Date(r.date).toLocaleDateString("en-IN",{day:"2-digit", month:"short",year:"numeric"}): "-"}
											</td>
											<td className="date-cell">{r.created_by_name || "-"}</td>
											<td className="date-cell">{r.created_by_role || "-"}</td>
											<td>
												<button
													className="btn-edit"
													onClick={() => {setSelectedRecord(r); setView("detail");}}
												>
													View
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>	
			)}

			{/* History tab */}
			{tab === "history" && (
				<HistoryDocuments patient={patient} />
			)}
		</div>
	);
}