//Todays OP ticket queue with status management
import { useState,useEffect,useCallback } from "react";
import receptionistApi from "../../api/receptionistApi";
import OPTicketCard from "./opticket_card";
import { STATUS_STYLES } from "../../constants/constants";

export default function OPQueue({onNewTicket}) {
	const [data,setData] = useState(null);
	const [loading,setLoading] = useState(true);
	const [filter,setFilter] = useState("");
	const [printing,setPrinting] = useState(null); //ticket being printed

	const load = useCallback(async () => {
		try {
			const data = await receptionistApi.getTodayTickets();
			setData(data);
		} catch {}
		finally { setLoading(false); }
	}, []);

	useEffect(() => {load();},[load]);

	const handleStatusChange= async (ticketId,newStatus) => {
		try {
			await receptionistApi.updateTicketStatus(ticketId, newStatus);
			load();
		} catch {alert("Failed to update status");}
	};
	const tickets = data?.tickets || [];
	const filtered = filter? tickets.filter(t => t.status === filter) : tickets;

	return (
		<div>
			{/* Summary strip */}
			{data?.summary && (
				<div className="stats-grid" style={{gridTemplateColumns:"repeat(auto-fill, minmax(130px,1fr))",gap:10,marginBottom:20}}>
					{Object.entries(STATUS_STYLES).map(([key,val]) => (
						<div 
							key={key}
							className="stat-card"
							style={{"--accent":val.color, cursor:"pointer",padding:"10px 14px",border: filter === key ? `2px solid ${val.color}`:"1px solid var(--border)"}} onClick={() => setFilter(filter === key? "":key)}>
								<div className="stat-value" style={{fontSize:"1.4rem"}}>{data.summary[key.toLowerCase()] ?? 0}</div>
								<div className="stat-label" style={{fontSize:"0.72rem"}}>{val.label}</div>
						</div>
					))}
					<div className="stat-card" style={{"--accent":"#6366f1",padding:"10px 14px"}}>
						<div className="stat-value" style={{fontSize:"1.4rem"}}>{data.summary.total}</div>
						<div className="stat-label" style={{fontSize:"0.72rem"}}>Total Today</div>
					</div>
				</div>
			)}
			{/* Toolbar */}
			<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
				<div style={{display:"flex",gap:8,alignItems:"center"}}>
					<span style={{fontSize:"0.85rem",color:"var(--text-2)"}}>Next Token:<strong>#{data?.summary?.next_token ?? "-"}</strong></span>
					{filter && (
						<button className="btn-clear" onClick={() => setFilter("")}>Clear filter</button>
					)}
				</div>
				<div style={{display:"flex",gap:8}}>
					<button className="btn-secondary" onClick={load} style={{fontSize:"0.8rem"}}>↻ Refresh</button>
					<button className="btn-add-staff" onClick={onNewTicket}>+ New Ticket</button> 
				</div>
			</div>
			{/* Ticket List */}
			{loading? (
				<div className="staff-loading"><div className="spinner"/><span>Loading queue...</span></div>
			) : filtered.length === 0 ? (
				<div className="staff-empty">
					<div className="empty-icon">🎫</div>
					<p>{filter ? `No ${STATUS_STYLES[filter]?.label} tickets` : "No tickets generated today."}</p>
					<button className="btn-edit" onClick={onNewTicket}>Generate First Ticket</button>
				</div>
			) : (
				<div style={{display:"flex",flexDirection:"column",gap:10}}>
					{filtered.map(ticket => (
						<OPTicketCard key={ticket.id}
								ticket={ticket}
								onStatusChange={handleStatusChange}
								onPrint={() => setPrinting(ticket)}
								/>
					))}
				</div>
			)}
			{/* Print modal */}
			{printing && (
				<PrintTicketModal ticket={printing} onClose={() => setPrinting(null)} />
			)}
		</div>
	);
}

function PrintTicketModal({ticket,onClose}) {
	return (
		<div style={{
			position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",
			display:"flex", alignItems: "center",justifyContent:"center",zIndex:1000
		}}>
			<div style={{background:"var(--surface)",borderRadius:12,padding:0,width:420,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
				{/* Printeble ticket */}
				<div id="print-ticket" style={{padding:32}}>
					<div style={{textAlign:"center",borderBottom:"2px dashed #ccc",paddingBottom:16,marginBottom:16}}>
						<h2 style={{margin:0,fontSize:"1.1rem",letterSpacing:1}}>IVF HIMS</h2>
						<p style={{margin:"4px 0",fontSize:"0.75rem",color:"#666"}}>Outpatient Department</p>
					</div>
					<div style={{textAlign:"center",margin:"16px 0"}}>
						<div style={{fontSize:"3.5rem",fontWeight:800,color:"#6366f1",lineHeight:1}}>#{ticket.token_number}</div>
						<div style={{fontSize:"0.75rem",color:"#666",marginTop:4}}>TOKEN NUMBER</div>
					</div>
					<div style={{borderTop:"1px dashed #ccc",paddingTop:16,display:"flex",flexDirection:"column",gap:8}}>
						{[
							["Patient",ticket.patient_name],
							["Patient ID",ticket.patient_id_str],
							["Doctor",ticket.doctor_name || "To be assigned"],
							["Department",ticket.department_name || "To be assigned"],
							["Visit Reason",ticket.visit_reason_display],
							["Date",new Date(ticket.date).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})],
							["Time",new Date(ticket.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})],
						].map(([label,value]) => (
							<div key={label} style={{display:"flex",justifyContent:"space-between",fontSize:"0.82rem"}}>
								<span style={{color:"#666",fontWeight:500}}>{label}</span>
								<span style={{fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{value}</span>
							</div>
						))}
						{ticket.notes && (
							<div style={{marginTop:8,padding:8,background:"#f8fafc",borderRadius:6,fontSize:"0.8rem"}}>
								<div style={{color:"#666",fontWeight:500,marginBottom:4}}>Notes</div>
								<div>{ticket.notes}</div>
							</div>
						)}
					</div>
					<div style={{textAlign:"center",marginTop:16,paddingTop:12,borderTop:"2px dashed #ccc"}}>
						<p style={{fontSize:"0.7rem",color:"#999",margin:0}}>Please wait for your token to be called</p>
					</div>
				</div>
				{/* Buttons */}
				<div style={{display:"flex",gap:8,padding:"12px 32px 24px",justifyContent:"flex-end"}}>
					<button className="btn-secondary" onClick={onClose}>Close</button>
					<button className="btn-primary"
					onClick={() => {
						const content=document.getElementById("print-ticket").innerHTML;
						const w = window.open("","_blank");
						w.document.write(`
							<html><head><title>OP Ticket #${ticket.token_number}</title>
							<style>
							body{font-family:Arial, sans-serif; margin:0;padding:20px;}
							@media print { body {padding:0;}}
							</style></head>
							<body>${content}</body></html>
							`);
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