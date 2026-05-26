import { useCallback, useState,useEffect } from "react";
import adminApi from "../../../api/adminApi";
import Icon from "../../../components/Icons";
import { ROLE_COLORS,ROLE_LABELS } from "../../../constants/constants";

// Stat card
function StatCard({ label,value,accent,sub }) {
     return (
         <div className="stat-card" style={{"--accent":accent}}>
	        <div className="stat-value">{value ?? <span className="loading-dot">-</span>}</div>
         	<div className="stat-label">{label}</div>
         	{sub && <div className="stat-sub">{sub}</div>}
         </div>
     );
}


//Dashboard Home
export default function DashboardHome() {
	const [stats, setStats] = useState(null);
	const [sessions, setSessions] = useState([]);
	const [patients, setPatients] = useState([]);
	const [loading, setLoading] = useState(true);

	const load= useCallback(async () => {
	 try{
	   const data = await adminApi.getDashboardStats();
	   setStats(data);
	   setSessions(data.active_sessions || []);
	   setPatients(data?.patients || []);
	 } catch {
	   //show empty state
	 } finally {
	   setLoading(false);
	 }
	},[]);

	useEffect(()=>{
		load();
		const interval = setInterval(load,30000);
		return () => clearInterval(interval);
	 }, [load]);

	 return (
		<div className="section-content">
		  <div className="section-header">
		<h2>Overview</h2>
		<span className="section-date">{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</span>
		  </div>
		  {/* Stat cards*/}
		  <div className="stats-grid">
			<StatCard label="New Patients Today" value={stats?.patient_today_count ?? "-"} accent="#0ea5e9" sub="registered today" />
			<StatCard label="Staff Online" value={stats?.active_count ?? "-"} accent="#10b981" sub="active sessions" />
			<StatCard label="Total Staff" value={stats?.staff_count ?? "-"} accent="#6366f1" sub="excluding patients" />
		  </div>

		  <div className="dashboard-panels">
			<div className="panel">
	  		<div className="panel-header">
				<Icon name="activity" />
				<h3>Staff Currently Logged In</h3>
	  		</div>
	  {loading? (
		<div className="panel-empty">Loading...</div>
	  ): sessions.length===0?(
		<div className="panel-empty">No Active sessions right now.</div>
	  ) : (
		<div className="session-list">
		  {sessions.slice(0,8).map((s,i)=>(
		<div className="session-row" key={i}>
		  <div className="session-avatar" style={{background: ROLE_COLORS[s.user__role] || "#64748b"}}>
		   {(s.user__full_name || "?")[0].toUpperCase()}
		  </div>
		<div className="session-info">
		  <span className="session-name">{s.user__full_name || s.user__email}</span>
		  <span className="session-role" style={{ color:ROLE_COLORS[s.user__role] }}>{ROLE_LABELS[s.user__role] || s.user__role}</span>
		</div>
		<div className="session-time">
		  {s.login_time? new Date(s.login_time).toLocaleDateString("en-IN",{hour:"2-digit",minute:"2-digit"}):"-"}
		</div>
		<span className="session-dot" />
		</div>
		  ))}
		</div>
	  )}
	</div>

	{/* New Patient Registrations */}
	<div className="panel">
	  <div className="panel-header">
		<Icon name="patients" />
		<h3>New Patient Registrations Today</h3>
	  </div>
	  {loading?(
		<div className="panel-empty">Loading..</div>
	  ): patients.length===0?(
		<div className="panel-empty">No New patients registered today</div>
	  ):(
		<div className="session-list">
		  {patients.slice(0,8).map((p,i)=>(
			<div className="session-row" key={i}>
			 <div className="session-avatar" style={{ background:"#0ea5e9"}}>
			  {(p.full_name|| "P")[0].toUpperCase()}
			 </div>
			 <div className="session-info">
				<span className="session-name">{p.full_name}</span>
				<span className="session-role" style={{color:"#0ea5e9"}}>{p.email}</span>
			 </div>
			 <div className="session-time">
				{p.date_joined? new Date(p.date_joined).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"-"}
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