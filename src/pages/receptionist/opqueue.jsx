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
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const d = new Date(timeStr);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'AM' : 'PM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatDoctorName = (name) => {
    if (!name) return "To be assigned";
    if (name.toLowerCase().startsWith("dr.")) return name;
    return `Dr. ${name}`;
  };

  const handlePrintAction = () => {
    const formatDateStr = formatDate(ticket.date || ticket.created_at);
    const formatTimeStr = formatTime(ticket.created_at);
    const docName = formatDoctorName(ticket.doctor_name);
    const patientPhone = ticket.patient_phone || "";
    const patientAddress = ticket.patient_address || "";

    const content = `
      <div class="ticket-card">
        <!-- Header -->
        <div class="header-row">
          <div class="clinic-info">
            <div class="clinic-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h1 class="clinic-title">IVF Speciality Clinic</h1>
              <p class="clinic-subtitle">OP consultation ticket</p>
            </div>
          </div>
          <div class="date-time">
            <p class="date-text">${formatDateStr}</p>
            <p class="time-text">${formatTimeStr}</p>
          </div>
        </div>

        <div class="divider-dotted"></div>

        <!-- ID and Token -->
        <div class="blocks-row">
          <div class="patient-id-block">
            <div class="patient-id-label">Patient ID</div>
            <div class="patient-id-value">${ticket.patient_id_str}</div>
          </div>
          <div class="token-block">
            <div class="token-label">Token number</div>
            <div class="token-value">${ticket.token_number}</div>
          </div>
        </div>

        <div class="divider-solid"></div>

        <!-- Details Grid -->
        <div class="details-grid">
          <div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Patient name</div>
              <div class="detail-value">${ticket.patient_name}</div>
            </div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Phone</div>
              <div class="detail-value">${patientPhone || "-"}</div>
            </div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Address</div>
              <div class="detail-value">${patientAddress || "-"}</div>
            </div>
          </div>
          <div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Reason for visit</div>
              <div class="detail-value">${ticket.visit_reason_display || ticket.visit_reason}</div>
            </div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Consulting doctor</div>
              <div class="detail-value">${docName}</div>
            </div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Department</div>
              <div class="detail-value">${ticket.department_name || "-"}</div>
            </div>
          </div>
        </div>

        <div class="divider-solid"></div>

        <!-- Bottom Row -->
        <div class="bottom-row">
          <div class="instructions-block">
            <div class="instructions-title">Instruction :</div>
            <div class="instructions-text">
              Please keep this ticket until consultation is completed. Proceed to the designated waiting area. Present this ticket at the reception desk when your token number is announced.
            </div>
          </div>
          ${ticket.qr_code ? `
            <div class="qr-block">
              <img src="${ticket.qr_code}" alt="QR Code" class="qr-image" />
              <span class="qr-label">Scan to view patient record</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    const w = window.open("", "_blank");
    w.document.write(`
      <html>
        <head>
          <title>OP Ticket #${ticket.token_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #f8fafc;
              min-height: 90vh;
            }
            .ticket-card {
              width: 500px;
              border: 1px solid #eaecf0;
              border-radius: 12px;
              padding: 32px;
              background: #ffffff;
              box-shadow: 0px 4px 18px rgba(16, 24, 40, 0.03);
              box-sizing: border-box;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .clinic-info {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .clinic-logo {
              width: 44px;
              height: 44px;
              border-radius: 8px;
              background: #3b82f6;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
            }
            .clinic-title {
              font-size: 18px;
              font-weight: 700;
              color: #101828;
              margin: 0;
            }
            .clinic-subtitle {
              font-size: 14px;
              color: #667085;
              margin: 0;
            }
            .date-time {
              text-align: right;
            }
            .date-text {
              font-size: 14px;
              font-weight: 600;
              color: #101828;
              margin: 0;
            }
            .time-text {
              font-size: 14px;
              color: #667085;
              margin: 0;
            }
            .divider-dotted {
              border-top: 1px dashed #d0d5dd;
              margin: 20px 0;
            }
            .blocks-row {
              display: flex;
              gap: 16px;
              margin-bottom: 24px;
            }
            .patient-id-block {
              flex: 1;
              border: 1px solid #d1e9ff;
              background: #f5faff;
              border-radius: 8px;
              padding: 16px 20px;
            }
            .patient-id-label {
              font-size: 12px;
              color: #1570ef;
              margin-bottom: 4px;
              font-weight: 500;
            }
            .patient-id-value {
              font-size: 20px;
              font-weight: 700;
              color: #101828;
            }
            .token-block {
              flex: 1;
              background: #3b82f6;
              border-radius: 8px;
              padding: 16px 20px;
              color: #ffffff;
            }
            .token-label {
              font-size: 12px;
              color: rgba(255, 255, 255, 0.8);
              margin-bottom: 4px;
              font-weight: 500;
            }
            .token-value {
              font-size: 24px;
              font-weight: 700;
            }
            .divider-solid {
              border-top: 1px solid #eaecf0;
              margin: 20px 0;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-bottom: 24px;
            }
            .detail-label {
              font-size: 12px;
              color: #667085;
              margin-bottom: 4px;
            }
            .detail-value {
              font-size: 14px;
              font-weight: 600;
              color: #101828;
            }
            .bottom-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 24px;
            }
            .instructions-block {
              flex: 1;
            }
            .instructions-title {
              font-weight: 700;
              color: #101828;
              font-size: 14px;
              margin-bottom: 6px;
            }
            .instructions-text {
              font-size: 13px;
              color: #475467;
              line-height: 1.5;
            }
            .qr-block {
              display: flex;
              flex-direction: column;
              align-items: center;
              flex-shrink: 0;
            }
            .qr-image {
              width: 100px;
              height: 100px;
              border: 1px solid #eaecf0;
              border-radius: 4px;
              padding: 4px;
            }
            .qr-label {
              font-size: 11px;
              color: #667085;
              margin-top: 6px;
            }
            .no-print {
              margin-top: 20px;
              display: flex;
              justify-content: center;
            }
            .print-btn {
              background: #7c3aed;
              color: white;
              border: none;
              padding: 10px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
            }
            @media print {
              body {
                background: white;
                padding: 0;
                display: block;
              }
              .ticket-card {
                border: none;
                box-shadow: none;
                padding: 0;
                width: 100%;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div>
            ${content}
            <div class="no-print">
              <button onclick="window.print()" class="print-btn">Print Ticket</button>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{ background: "var(--surface)", borderRadius: 12, padding: 0, width: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}>
        {/* Printable ticket card preview */}
        <div style={{ padding: "32px", background: "#ffffff" }}>
          {/* Card Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "8px",
                background: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#101828", margin: 0 }}>IVF Speciality Clinic</h3>
                <p style={{ fontSize: "14px", color: "#667085", margin: 0 }}>OP consultation ticket</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#101828", margin: 0 }}>{formatDate(ticket.date || ticket.created_at)}</p>
              <p style={{ fontSize: "14px", color: "#667085", margin: 0 }}>{formatTime(ticket.created_at)}</p>
            </div>
          </div>

          {/* Dotted Divider */}
          <div style={{ borderTop: "1px dashed #d0d5dd", margin: "20px 0" }} />

          {/* Patient ID and Token Blocks */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
            <div style={{
              flex: 1,
              border: "1px solid #d1e9ff",
              background: "#f5faff",
              borderRadius: "8px",
              padding: "16px 20px"
            }}>
              <div style={{ fontSize: "12px", color: "#1570ef", marginBottom: "4px", fontWeight: "500" }}>Patient ID</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#101828" }}>{ticket.patient_id_str}</div>
            </div>
            <div style={{
              flex: 1,
              background: "#3b82f6",
              borderRadius: "8px",
              padding: "16px 20px",
              color: "#ffffff"
            }}>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", marginBottom: "4px", fontWeight: "500" }}>Token number</div>
              <div style={{ fontSize: "22px", fontWeight: "700" }}>{ticket.token_number}</div>
            </div>
          </div>

          {/* Solid Divider */}
          <div style={{ borderTop: "1px solid #eaecf0", margin: "20px 0" }} />

          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#667085", marginBottom: "2px" }}>Patient name</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#101828" }}>{ticket.patient_name}</div>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#667085", marginBottom: "2px" }}>Phone</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#101828" }}>{ticket.patient_phone || "-"}</div>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#667085", marginBottom: "2px" }}>Address</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#101828" }}>{ticket.patient_address || "-"}</div>
              </div>
            </div>
            <div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#667085", marginBottom: "2px" }}>Reason for visit</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#101828" }}>{ticket.visit_reason_display || ticket.visit_reason}</div>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#667085", marginBottom: "2px" }}>Consulting doctor</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#101828" }}>{formatDoctorName(ticket.doctor_name)}</div>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#101828" }}>Department</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#101828" }}>{ticket.department_name || "-"}</div>
              </div>
            </div>
          </div>

          {/* Solid Divider */}
          <div style={{ borderTop: "1px solid #eaecf0", margin: "20px 0" }} />

          {/* Bottom section with Instructions and QR Code */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "700", color: "#101828", fontSize: "13px", marginBottom: "4px" }}>Instruction :</div>
              <div style={{ fontSize: "12px", color: "#475467", lineHeight: "1.4" }}>
                Please keep this ticket until consultation is completed. Proceed to the designated waiting area. Present this ticket at the reception desk when your token number is announced.
              </div>
            </div>
            {ticket.qr_code && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <img src={ticket.qr_code} alt="QR Code" style={{ width: "80px", height: "80px", border: "1px solid #eaecf0", borderRadius: "4px", padding: "2px" }} />
                <span style={{ fontSize: "10px", color: "#667085", marginTop: "4px", textAlign: "center" }}>Scan to view record</span>
              </div>
            )}
          </div>
        </div>
        {/* Modal Buttons */}
        <div style={{ display: "flex", gap: 12, padding: "16px 24px", justifyContent: "flex-end", borderTop: "1px solid #eaecf0", background: "#f9fafb" }}>
          <button className="btn-secondary" onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: "600" }}>Close</button>
          <button className="btn-primary" onClick={handlePrintAction} style={{ padding: "8px 16px", borderRadius: "8px", background: "#7c3aed", color: "#ffffff", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
            🖨️ Print Ticket
          </button>
        </div>
      </div>
    </div>
  );
}