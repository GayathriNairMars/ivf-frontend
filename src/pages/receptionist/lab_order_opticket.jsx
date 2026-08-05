// Lab Order OP Ticket — Receptionist Portal
import { useState, useEffect, useRef } from "react";
import { ChevronRight, Printer, CheckCircle2, FlaskConical, X } from "lucide-react";
import receptionistApi from "../../api/receptionistApi";
import "./lab_orders.css";

const STATUS_MAP = {
  ORDERED:   "Ordered",
  COLLECTED: "Collected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  PENDING:   "Pending",
};

const PRIORITY_COLORS = {
  ROUTINE: { bg: "#f1f5f9", fg: "#475569" },
  URGENT:  { bg: "#fff7ed", fg: "#c2410c" },
  STAT:    { bg: "#fff1f2", fg: "#be123c" },
};

export default function LabOrderOpticket({ order: initialOrder, orderId: propOrderId, onBack }) {
  const [order, setOrder]     = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError]     = useState("");
  const ticketRef             = useRef(null);

  useEffect(() => {
    if (initialOrder) { setOrder(initialOrder); return; }
    if (!propOrderId) return;
    setLoading(true);
    receptionistApi.getLabOrderDetail(propOrderId)
      .then(data => setOrder(data.order || data))
      .catch(() => setError("Failed to load order."))
      .finally(() => setLoading(false));
  }, [initialOrder, propOrderId]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

  const getPriorityClass = (p) => {
    if (p === "URGENT") return "urgent";
    if (p === "STAT")   return "stat";
    return "routine";
  };

  // Build the printable ticket as a standalone HTML document, generated
  // directly from `order` data — NOT copied from the on-screen DOM. This
  // avoids pulling in interactive buttons and guarantees styling works
  // even though the popup window doesn't have access to the app's CSS
  // custom properties.
  const handlePrint = () => {
    if (!order) return;

    const token       = order.token_number ?? order.id;
    const dateStr      = formatDate(order.ordered_at || order.created_at);
    const priority      = order.priority || "ROUTINE";
    const priorityColor = PRIORITY_COLORS[priority] || PRIORITY_COLORS.ROUTINE;
    const statusLabel   = STATUS_MAP[order.status] || order.status || "—";
    const orderedBy     = order.ordered_by_name || order.doctor_name;

    const rows = [
      { key: "Patient", val: order.patient_name },
      order.mrn ? { key: "MRN", val: order.mrn } : null,
      { key: "Test", val: order.test_name || order.test_type_name },
      order.test_code ? { key: "Code", val: order.test_code } : null,
      {
        key: "Priority",
        val: `<span style="display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.4px;text-transform:uppercase;background:${priorityColor.bg};color:${priorityColor.fg};">${priority}</span>`,
        raw: true,
      },
      { key: "Status", val: statusLabel },
      orderedBy ? { key: "Ordered By", val: orderedBy } : null,
    ].filter(Boolean);

    const rowsHtml = rows.map(r => `
      <div class="row">
        <span class="ot-key">${r.key}</span>
        <span class="ot-val">${r.raw ? r.val : escapeHtml(r.val || "—")}</span>
      </div>
    `).join("");

    const notesHtml = order.notes ? `
      <div class="row" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <span class="ot-key">Notes</span>
        <span class="ot-val" style="font-weight:400;font-size:13px;color:#475569;line-height:1.5;">${escapeHtml(order.notes)}</span>
      </div>
    ` : "";

    const win = window.open("", "_blank", "width=500,height=720");
    win.document.write(`
      <html>
        <head>
          <title>Lab OP Ticket — Token #${token}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body { height: 100%; }
            body {
              font-family: 'Inter', Arial, sans-serif;
              background: #fff;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              padding: 24px 16px;
            }
            .ticket {
              width: 100%;
              max-width: 420px;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              background-color: #4f46e5;
              padding: 28px 32px;
              color: #fff;
              text-align: center;
            }
            .header h3 { font-size: 13px; font-weight: 600; margin: 0 0 6px; opacity: 0.9; letter-spacing: 0.3px; }
            .token { font-size: 60px; font-weight: 800; line-height: 1; letter-spacing: -2px; margin: 6px 0; }
            .date { font-size: 13px; opacity: 0.85; }
            .body { padding: 22px 32px 6px; }
            .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; }
            .row:last-child { border-bottom: none; }
            .ot-key { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px; }
            .ot-val { font-weight: 600; color: #0f172a; text-align: right; }
            .footer-note { padding: 16px 32px 24px; text-align: center; font-size: 11px; color: #94a3b8; }
            @media print {
              body { padding: 0; }
              .ticket { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h3>IVF HIMS &middot; Laboratory Request</h3>
              <div class="token">#${token}</div>
              <div class="date">${dateStr}</div>
            </div>
            <div class="body">
              ${rowsHtml}
              ${notesHtml}
            </div>
            <div class="footer-note">Present this ticket at the laboratory collection counter.</div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    // Give the popup a tick to finish layout before invoking print.
    setTimeout(() => {
      win.print();
      win.close();
    }, 150);
  };

  return (
    <div className="lab-page">
      {/* Breadcrumb */}
      <div className="lab-breadcrumb">
        <button onClick={onBack}>Lab Orders</button>
        <ChevronRight size={13} />
        <span>OP Ticket</span>
      </div>

      {/* Header */}
      <div className="lab-page-header">
        <div className="lab-page-header-text">
          <h2>OP Ticket</h2>
          <p>Laboratory test request ticket for the patient</p>
        </div>
        {order && (
          <div style={{ display:"flex", gap:8 }}>
            <button className="lab-btn-primary" onClick={handlePrint}>
              <Printer size={15} /> Print Ticket
            </button>
            <button className="lab-btn-secondary" onClick={onBack}>
              ← Back to List
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="lab-loading">
          <div className="lab-loading-spinner" />
          <p>Loading ticket…</p>
        </div>
      )}

      {error && <div className="lab-alert error"><X size={15} /> {error}</div>}

      {order && !loading && (
        <div className="lab-opticket-wrapper">
          <div className="lab-opticket-card" ref={ticketRef}>
            {/* Gradient header */}
            <div className="lab-opticket-header">
              <h3>IVF HIMS · Laboratory Request</h3>
              <div className="lab-opticket-token">#{order.token_number ?? order.id}</div>
              <div style={{ fontSize:14, opacity:0.85 }}>
                {formatDate(order.ordered_at || order.created_at)}
              </div>
            </div>

            {/* Body rows */}
            <div className="lab-opticket-body">
              <div className="lab-opticket-row">
                <span className="ot-key">Patient</span>
                <span className="ot-val">{order.patient_name || "—"}</span>
              </div>
              {order.mrn && (
                <div className="lab-opticket-row">
                  <span className="ot-key">MRN</span>
                  <span className="ot-val">{order.mrn}</span>
                </div>
              )}
              <div className="lab-opticket-row">
                <span className="ot-key">Test</span>
                <span className="ot-val">{order.test_name || order.test_type_name || "—"}</span>
              </div>
              {order.test_code && (
                <div className="lab-opticket-row">
                  <span className="ot-key">Code</span>
                  <span className="ot-val">{order.test_code}</span>
                </div>
              )}
              <div className="lab-opticket-row">
                <span className="ot-key">Priority</span>
                <span className="ot-val">
                  <span className={`lab-priority ${getPriorityClass(order.priority)}`}>
                    {order.priority || "ROUTINE"}
                  </span>
                </span>
              </div>
              <div className="lab-opticket-row">
                <span className="ot-key">Status</span>
                <span className="ot-val">{STATUS_MAP[order.status] || order.status || "—"}</span>
              </div>
              {(order.ordered_by_name || order.doctor_name) && (
                <div className="lab-opticket-row">
                  <span className="ot-key">Ordered By</span>
                  <span className="ot-val">{order.ordered_by_name || order.doctor_name}</span>
                </div>
              )}
              {order.notes && (
                <div className="lab-opticket-row" style={{ flexDirection:"column", alignItems:"flex-start", gap:4 }}>
                  <span className="ot-key">Notes</span>
                  <span className="ot-val" style={{ fontWeight:400, fontSize:13, color:"var(--rec-text-sub,#475569)", lineHeight:1.5 }}>
                    {order.notes}
                  </span>
                </div>
              )}
            </div>

            {/* Footer actions (on-screen only — never included in print output) */}
            <div className="lab-opticket-footer">
              <button className="lab-btn-primary" onClick={handlePrint}>
                <Printer size={14} /> Print
              </button>
              <button className="lab-btn-secondary" onClick={onBack}>
                Close
              </button>
            </div>
          </div>

          {/* Info box */}
          <div style={{ marginTop:16, background:"#fff", border:"1px solid var(--rec-border,#e2e8f0)", borderRadius:12, padding:"16px 20px", fontSize:13, color:"var(--rec-text-sub,#475569)", lineHeight:1.6 }}>
            <strong style={{ color:"var(--rec-text-main,#0f172a)" }}>Instructions:</strong>
            <ul style={{ margin:"8px 0 0", paddingLeft:18 }}>
              <li>Patient must carry this ticket to the laboratory collection center.</li>
              <li>Show the token number to the lab technician at the counter.</li>
              <li>Results will be available in the system once processed.</li>
              {order.priority === "STAT" && (
                <li style={{ color:"#be123c", fontWeight:600 }}>⚠ STAT order — Immediate processing required.</li>
              )}
              {order.priority === "URGENT" && (
                <li style={{ color:"#c2410c", fontWeight:600 }}>⚠ URGENT — Prioritize at collection counter.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Escapes text before it's injected into the print window's HTML string,
// since that content is built with template literals rather than React.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}