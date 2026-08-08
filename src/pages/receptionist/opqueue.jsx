// Today's OP Queue - redesigned table UI  matching the screenshot
import { useState, useEffect, useCallback } from "react";
import "./receptionist.css";
import receptionistApi from "../../api/receptionistApi";
import { useHospital } from "../../context/HospitalContext";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  WAITING:    { dot: "#f59e0b", bg: "#fef3c7", color: "#92400e", label: "Waiting"    },
  IN_CONSULT: { dot: "#3b82f6", bg: "#dbeafe", color: "#1e40af", label: "Consulting" },
  DONE:       { dot: "#10b981", bg: "#d1fae5", color: "#065f46", label: "Completed"  },
  CANCELLED:  { dot: "#ef4444", bg: "#fee2e2", color: "#991b1b", label: "No Show"    },
};

const STATUS_OPTIONS = [
  { value: "",           label: "All Status"  },
  { value: "WAITING",    label: "Waiting"     },
  { value: "IN_CONSULT", label: "Consulting"  },
  { value: "DONE",       label: "Completed"   },
  { value: "CANCELLED",  label: "No Show"     },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { dot: "#94a3b8", bg: "#f1f5f9", color: "#475569", label: status };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

// ── StatusActions: context-aware flow buttons ─────────────────────────────────
// Workflow: WAITING → IN_CONSULT → DONE
// Each button calls PATCH /receptionist/tickets/{id}/status/ with the right key
function StatusActions({ ticket, updating, onStatusChange, onPrint }) {
  const { id, status } = ticket;
  const busy = updating;

  return (
    <div className="opq-action-btns" style={{ gap: 5, flexWrap: "wrap" }}>

      {/* ── WAITING: show "Start Consult" → IN_CONSULT ── */}
      {status === "WAITING" && (
        <button
          className="opq-flow-btn opq-flow-consult"
          disabled={busy}
          onClick={() => onStatusChange(id, "IN_CONSULT")}
          title="Mark as In Consultation"
        >
          {busy ? "…" : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              In Consult
            </>
          )}
        </button>
      )}

      {/* ── IN_CONSULT: show "Mark Done" → DONE  +  "Wait" → WAITING ── */}
      {status === "IN_CONSULT" && (
        <>
          <button
            className="opq-flow-btn opq-flow-done"
            disabled={busy}
            onClick={() => onStatusChange(id, "DONE")}
            title="Mark as Done"
          >
            {busy ? "…" : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Done
              </>
            )}
          </button>
          <button
            className="opq-flow-btn opq-flow-wait"
            disabled={busy}
            onClick={() => onStatusChange(id, "WAITING")}
            title="Move back to Waiting"
          >
            {busy ? "…" : "↩ Wait"}
          </button>
        </>
      )}

      {/* ── DONE: show "Reopen" → WAITING ── */}
      {status === "DONE" && (
        <button
          className="opq-flow-btn opq-flow-reopen"
          disabled={busy}
          onClick={() => onStatusChange(id, "WAITING")}
          title="Re-open ticket"
        >
          ↩ Reopen
        </button>
      )}

      {/* ── CANCELLED / No Show: show "Reopen" → WAITING ── */}
      {status === "CANCELLED" && (
        <button
          className="opq-flow-btn opq-flow-reopen"
          disabled={busy}
          onClick={() => onStatusChange(id, "WAITING")}
          title="Re-open ticket"
        >
          ↩ Reopen
        </button>
      )}

      {/* ── Print button (always visible) ── */}
      <button
        className="opq-action-btn"
        title="Print ticket"
        onClick={onPrint}
        style={{ marginLeft: 2 }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OPQueue({ onNewTicket }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const { hospital }          = useHospital();

  // filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterDept,   setFilterDept]   = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // print modal
  const [printing, setPrinting] = useState(null);
  // track which ticket is being updated
  const [updatingId, setUpdatingId] = useState(null);

  // ── load data ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await receptionistApi.getTodayTickets();
      setData(res);
    } catch {
      setError("Failed to load today's queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── derive data ───────────────────────────────────────────────────────────
  const tickets = data?.tickets || [];
  const summary = data?.summary || {};

  const doctors = [...new Set(tickets.map(t => t.doctor_name).filter(Boolean))];
  const depts   = [...new Set(tickets.map(t => t.department_name).filter(Boolean))];

  const filtered = tickets.filter(t => {
    if (filterStatus && t.status !== filterStatus)       return false;
    if (filterDoctor && t.doctor_name !== filterDoctor)  return false;
    if (filterDept   && t.department_name !== filterDept) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── status-change handler ─────────────────────────────────────────────────
  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    try {
      await receptionistApi.updateTicketStatus(ticketId, newStatus);
      load();
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── date display ──────────────────────────────────────────────────────────
  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="opq-root">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="rec-page-header">
        <div className="rec-page-header-text">
          <h2>OP Queue & Ticket Management</h2>
          <p>Real-time patient queue monitoring, token tracking, and consultation status management.</p>
        </div>
        <button className="btn-primary" onClick={onNewTicket}>
          <span>+</span> Generate New Ticket
        </button>
      </div>

      {/* ── Stats bar ────────────────────────────────────────────── */}
      <div className="opq-stats-row">
        <div className="opq-stat-card">
          <div className="opq-stat-value">{summary.total ?? "—"}</div>
          <div className="opq-stat-label">Tickets today</div>
        </div>
        <div className="opq-stat-card">
          <div className="opq-stat-value" style={{ color: "#f59e0b" }}>{summary.waiting ?? "—"}</div>
          <div className="opq-stat-label">Waiting</div>
        </div>
        <div className="opq-stat-card">
          <div className="opq-stat-value" style={{ color: "#3b82f6" }}>{summary.in_consult ?? "—"}</div>
          <div className="opq-stat-label">Consulting</div>
        </div>
        <div className="opq-stat-card">
          <div className="opq-stat-value" style={{ color: "#10b981" }}>{summary.done ?? "—"}</div>
          <div className="opq-stat-label">Completed</div>
        </div>
      </div>

      {/* ── Queue panel ──────────────────────────────────────────── */}
      <div className="opq-panel">

        {/* Panel header */}
        <div className="opq-panel-header">
          <div>
            <span className="opq-queue-title">Today's OP Queue - </span>
            <span className="opq-queue-date">{todayStr}</span>
            <div className="opq-queue-sub">
              Real-time status of all active clinical sessions.
              &nbsp;·&nbsp; ⏱ Last updated:{" "}
              {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div className="opq-panel-actions">
            <button className="opq-icon-btn" onClick={load} title="Refresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
            <button className="opq-icon-btn" title="Print" onClick={() => window.print()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="opq-summary-strip">
          <span className="opq-summary-chip">
            <span className="chip-dot" style={{ background: "#64748b" }} />
            Total: {summary.total ?? 0}
          </span>
          <span className="opq-summary-chip">
            <span className="chip-dot" style={{ background: "#f59e0b" }} />
            Waiting: {summary.waiting ?? 0}
          </span>
          <span className="opq-summary-chip">
            <span className="chip-dot" style={{ background: "#3b82f6" }} />
            Consulting: {summary.in_consult ?? 0}
          </span>
          <span className="opq-summary-chip">
            <span className="chip-dot" style={{ background: "#10b981" }} />
            Completed: {summary.done ?? 0}
          </span>
          <span className="opq-summary-chip">
            <span className="chip-dot" style={{ background: "#ef4444" }} />
            No Show: {summary.cancelled ?? 0}
          </span>
        </div>

        {/* Filter row */}
        <div className="opq-filter-row">
          <select className="opq-select" value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select className="opq-select" value={filterDoctor}
            onChange={e => { setFilterDoctor(e.target.value); setPage(1); }}>
            <option value="">All Doctors</option>
            {doctors.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select className="opq-select" value={filterDept}
            onChange={e => { setFilterDept(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select className="opq-select" disabled>
            <option>Visit Type</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "14px 22px", color: "#dc2626", background: "#fee2e2",
            margin: "0", fontSize: "0.875rem", borderBottom: "1px solid #fca5a5" }}>
            {error}
          </div>
        )}

        {/* Table / States */}
        {loading ? (
          <div className="opq-loading">
            <div className="opq-spinner" />
            <span>Loading queue…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="opq-empty">
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎫</div>
            <p>{filterStatus || filterDoctor || filterDept
              ? "No tickets match the selected filters."
              : "No tickets generated today."}</p>
            <button className="opq-btn-generate" style={{ marginTop: 14 }} onClick={onNewTicket}>
              + Generate First Ticket
            </button>
          </div>
        ) : (
          <>
            <div className="opq-table-wrap">
              <table className="opq-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Patient name</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Check - in</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(ticket => (
                    <tr key={ticket.id}>
                      <td className="opq-td-id">{ticket.patient_id_str}</td>
                      <td>
                        <div className="opq-patient-name">{ticket.patient_name}</div>
                        <div className="opq-patient-phone">
                          {ticket.patient_phone || ticket.phone || ""}
                        </div>
                      </td>
                      <td className="opq-td-doctor">
                        {ticket.doctor_name
                          ? ticket.doctor_name
                          : <span style={{ color: "#94a3b8", fontWeight: 400 }}>Unassigned</span>}
                      </td>
                      <td>
                        {ticket.department_name
                          ? ticket.department_name
                          : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                        {fmtTime(ticket.created_at)}
                      </td>
                      <td><StatusBadge status={ticket.status} /></td>
                      <td>
                        <StatusActions
                          ticket={ticket}
                          updating={updatingId === ticket.id}
                          onStatusChange={handleStatusChange}
                          onPrint={() => setPrinting(ticket)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="opq-pagination">
              <span className="opq-pag-info">
                Showing{" "}
                <strong>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong>{" "}
                of <span style={{ color: "#7c3aed", fontWeight: 600 }}>{filtered.length} Patients</span>
              </span>
              <div className="opq-pag-btns">
                <button className="opq-pag-btn" disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}>‹</button>
                <button className="opq-pag-btn" disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Print modal */}
      {printing && <PrintTicketModal ticket={printing} onClose={() => setPrinting(null)} />}
    </div>
  );
}

// ── Print Modal ───────────────────────────────────────────────────────────────
function PrintTicketModal({ ticket, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, width: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div id="print-ticket" style={{ padding: 32 }}>
          <div style={{
            textAlign: "center", borderBottom: "2px dashed #ccc",
            paddingBottom: 16, marginBottom: 16,
          }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem", letterSpacing: 1 }}>{hospital.hospital_name || "Hospital"}</h2>
            <p style={{ margin: "4px 0", fontSize: "0.75rem", color: "#666" }}>Outpatient Department</p>
          </div>
          <div style={{ textAlign: "center", margin: "16px 0" }}>
            <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#7c3aed", lineHeight: 1 }}>
              #{ticket.token_number}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#666", marginTop: 4 }}>TOKEN NUMBER</div>
          </div>
          <div style={{
            borderTop: "1px dashed #ccc", paddingTop: 16,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {[
              ["Patient",      ticket.patient_name],
              ["Patient ID",   ticket.patient_id_str],
              ["Doctor",       ticket.doctor_name || "To be assigned"],
              ["Department",   ticket.department_name || "To be assigned"],
              ["Visit Reason", ticket.visit_reason_display],
              ["Date",         new Date(ticket.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })],
              ["Time",         new Date(ticket.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: "#666", fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value}</span>
              </div>
            ))}
            {ticket.notes && (
              <div style={{ marginTop: 8, padding: 8, background: "#f8fafc", borderRadius: 6, fontSize: "0.8rem" }}>
                <div style={{ color: "#666", fontWeight: 500, marginBottom: 4 }}>Notes</div>
                <div>{ticket.notes}</div>
              </div>
            )}
          </div>
          <div style={{
            textAlign: "center", marginTop: 16, paddingTop: 12,
            borderTop: "2px dashed #ccc",
          }}>
            <p style={{ fontSize: "0.7rem", color: "#999", margin: 0 }}>
              Please wait for your token to be called
            </p>
          </div>
        </div>
        <div style={{
          display: "flex", gap: 8, padding: "12px 32px 24px",
          justifyContent: "flex-end",
        }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={() => {
            const content = document.getElementById("print-ticket").innerHTML;
            const w = window.open("", "_blank");
            w.document.write(`
              <html><head><title>OP Ticket #${ticket.token_number}</title>
              <style>body{font-family:Arial,sans-serif;margin:0;padding:20px;}
              @media print{body{padding:0;}}</style></head>
              <body>${content}</body></html>
            `);
            w.document.close();
            w.print();
          }}>🖨️ Print</button>
        </div>
      </div>
    </div>
  );
}