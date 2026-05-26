//Receptionist dashboard with todays stat
import { useState,useEffect,useCallback } from "react";
import receptionistApi from "../../api/receptionistApi";

function StatCard({label,value,accent,sub,onClick}) {
	return (
		<div className="stat-card" style={{"--accent":accent,cursor:onClick? "pointer": "default"}} onClick={onClick}>
			<div className="stat-value">{value ?? "-"}</div>
			<div className="stat-label">{label}</div>
			{sub && <div className="stat-sub">{sub}</div>}
		</div>
	);
}

const STATUS_STYLES = {
  WAITING:    { bg: "#fef3c7", color: "#92400e", label: "Waiting"        },
  IN_CONSULT: { bg: "#dbeafe", color: "#1e40af", label: "In Consultation" },
  DONE:       { bg: "#d1fae5", color: "#065f46", label: "Done"           },
  CANCELLED:  { bg: "#fee2e2", color: "#991b1b", label: "Cancelled"      },
};

export default function RecDashboardHome(){
	const [stats,setStats]=useState(null);
	const [tickets,setTickets]=useState([]);
	const [loading,setLoading]=useState(true);

	const load=useCallback(async () => {
		try {
			const [statsRes,ticketsRes] = await Promise.all([
				receptionistApi.getDashboardStats(),
				receptionistApi.getTodayTickets(),
			]);
			setStats(statsRes);
			setTickets(ticketsRes.tickets || ticketsRes || []);
		} catch {}
		finally {setLoading(false);}
	}, []);
	useEffect(() => {
		load();
		const interval=setInterval(load,6000);
		return () => clearInterval(interval);
	}, [load]);
	const today = new Date().toLocaleDateString("en-IN",{
		weekday:"long",day:"2-digit",month:"long",year:"numeric"
	});
	return (
		<div>
		<div className="section-header">
			<h2>Good {getGreeting()},{stats?.receptionist_name?.split(" ")[0] || ""}!</h2>
			<span className="section-date">{today}</span>
		</div>
		{/* Stat cards */}
		<div className="stats-grid" style={{marginBottom:24}}>
			<StatCard label="Patients Today" value={stats?.patients_today ?? "-"} accent="#0ea5e9" sub="registered today" />
			<StatCard label="Tickets Generated" value={stats?.tickets_today ?? "-"} accent="#6366f1" sub="OP tickets today" />
			<StatCard label="Waiting" value={stats?.waiting ?? "-"} accent="#f59e0b" sub="in queue" />
			<StatCard label="In Consultation" value={stats?.in_consult ?? "-"} accent="#3b82f6" sub="with doctor" />
			<StatCard label="Done" value={stats?.done ?? "-"} accent="#10b981" sub="completed today" />
			<StatCard label="Total Patients" value={stats?.total_patients ?? "-"} />
		</div>

		{/* Recent tickets */}
		<div className="dashboard-panels">
			<div className="panel" style={{flex:2}}>
				<div className="panel-header">
					<h3>Today's Queue</h3>
					<span style={{fontSize:"0.75rem",color:"var(--text-2)"}}>
						Next token: <strong>#{stats?.next_token?? "-"}</strong>
					</span>
				</div>
				{loading ? (
					<div className="panel-empty">Loading...</div>
				):tickets.length===0?(
					<div className="panel-empty">No tickets generated today.</div>
				):(
					<div style={{display:"flex",flexDirection:"column",gap:8, maxHeight:380,overflow:"auto"}}>
						{tickets.slice(0,10).map(t => {
							const ss=STATUS_STYLES[t.status] || STATUS_STYLES.WAITING;
							return(
								<div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px", borderRadius:8,background:"var(--surface-2,#f8fafc)",border:"1px solid var(--border)",}}>
									<div style={{width:40,height:40,borderRadius:8,background:"#6366f1",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"1rem",}}>
										{t.token_number}
									</div>
									<div style={{flex:1,minWidth:0}}>
										<div style={{fontWeight:600,fontSize:"0.88rem"}}>{t.patient_name}</div>
										<div style={{fontSize:"0.72rem",color:"var(--text-2)"}}>{t.patient_id_str} - {t.visit_reason_display}
										</div>
									</div>
									<div style={{fontSize:"0.72rem",color:"var(--text-2)",textAlign:"right"}}>
									<div>{t.doctor_name || "No Doctor"}</div>
									<div>{new Date(t.created_at).toLocaleDateString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
									</div>
									<span style={{
										background: ss.bg,color:ss.color, padding:"3px 10px",borderRadius:20, fontSize:"0.68rem", fontWeight:600,whiteSpace:"nowrap",
									}}>
										{ss.label}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>
			{/* Recent patients registered */}
			<div className="panel" style={{flex:1}}>
				<div className="panel-header">
					<h3>Registered Today</h3>
				</div>
				{loading? (
					<div className="panel-empty">Loading...</div>
				): !stats?.recent_patients?.length? (
					<div className="panel-empty">No patients registered today.</div>
				): (
					<div className="session-list">
						{stats.recent_patients.map((p,i) => (
							<div key={i} className="session-row">
								<div className="session-avatar" style={{background:"#0ea5e9"}}>
									{(p.full_name || "P")[0].toUpperCase()}
								</div>
								<div className="session-info">
									<span className="session-name">{p.full_name}</span>
									<span className="session-role" style={{color:"#0ea5e9"}}>{p.patient_id}</span>
								</div>
								<div className="session-time">
									{p.registered_on? new Date(p.registered_on).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "-"}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
		</div>
	);
}

function getGreeting(){
	const h =new Date().getHours();
	if (h<12) return "Morning";
	if (h<17) return "Afternoon";
	return "Evening";
}