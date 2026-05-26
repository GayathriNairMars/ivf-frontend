//Single ticket row in the queue
import { useState } from "react";
import { STATUS_STYLES } from "../../constants/constants";

 
const NEXT_STATUS = {
  WAITING:    ["IN_CONSULT", "CANCELLED"],
  IN_CONSULT: ["DONE", "WAITING"],
  DONE:       [],
  CANCELLED:  [],
};

export default function OPTicketCard({ticket,onStatusChange,onPrint}) {
	const [loading,setLoading] = useState(false);
	const ss=STATUS_STYLES[ticket.status] || STATUS_STYLES.WAITING;
	const handleStatus = async (newStatus) => {
		setLoading(true);
		await onStatusChange(ticket.id,newStatus);
		setLoading(false);
	};
	return (
		<div style={{
			background:"var(--surface)",
			border:"1px solid var(--border)",
			borderRadius:10,
			padding:"14px 18px",
			display:"flex",
			alignItems:"center",
			gap:16,
		}}>
			{/* Token */}
			<div style={{
				minWidth:56,height:56,borderRadius:10,
				background:"#6366f1",color:"#fff",
				display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
				fontWeight:800, fontSize:"1.3rem", lineHeight:1,
			}}>
				#{ticket.token_number}
			</div>
			{/* Patient Info */}
			<div style={{flex:1,minWidth:0}}>
				<div style={{fontWeight:600,fontSize:"0.95rem"}}>{ticket.patient_name}</div>
				<div style={{fontSize:"0.75rem",color:"var(--text-2)"}}>{ticket.patient_id_str}</div>
				<div style={{fontSize:"0.75rem",color:"var(--text-2)",marginTop:2}}>
					{ticket.visit_reason_display}
					{ticket.notes && `-${ticket.notes.slice(0,40)}${ticket.notes.length>40 ? "..." : ""}`}
				</div>
			</div>
			{/* Doctor & Dept */}
			<div style={{minWidth:140,fontSize:"0.8rem",color:"var(--text-2)"}}>
				<div style={{fontWeight:500}}>{ticket.doctor_name || "No doctor"}</div>
				<div>{ticket.department_name || "No dept"}</div>
				<div style={{marginTop: 2}}>
					{new Date(ticket.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
				</div>
			</div>
			{/* Status badge */}
			<span style={{
				background:ss.bg,color:ss.color,padding:"4px 10px",borderRadius:20,fontSize:"0.72rem",fontWeight:600,whiteSpace:"nowrap",
			}}> {ss.label}</span>
			{/* Actions */}
			<div style={{display:"flex",gap:6,flexShrink:0}}>
				<button className="btn-edit" onClick={onPrint} style={{fontSize:"0.75rem"}}>🖨️</button>
				{NEXT_STATUS[ticket.status]?.map(ns => (
          <button
            key={ns}
            className={ns === "CANCELLED" ? "btn-toggle btn-deactivate" : "btn-edit"}
            style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}
            onClick={() => handleStatus(ns)}
            disabled={loading}
          >
            {ns === "IN_CONSULT" ? "→ Consult" : ns === "DONE" ? "✓ Done" : ns === "WAITING" ? "← Wait" : "✗ Cancel"}
          </button>
        ))}
			</div>
		</div>
	);
}