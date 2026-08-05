// Lab Order Detail — Receptionist Portal
import { useState, useEffect } from "react";
import {
  ChevronRight, FlaskConical, X, Ban, Printer, User, Mail,
  CheckCircle2, Circle, FileText, ClipboardList
} from "lucide-react";
import receptionistApi from "../../api/receptionistApi";
import "./lab_orders.css";

const STATUS_MAP = {
  ORDERED:   { label: "Ordered",   cls: "ordered"   },
  COLLECTED: { label: "Collected", cls: "collected" },
  COMPLETED: { label: "Completed", cls: "completed" },
  CANCELLED: { label: "Cancelled", cls: "cancelled" },
  PENDING:   { label: "Pending",   cls: "pending"   },
};
const PRIORITY_MAP = {
  ROUTINE: { label: "Routine", cls: "routine" },
  URGENT:  { label: "Urgent",  cls: "urgent"  },
  STAT:    { label: "STAT",    cls: "stat"    },
};

// Order of stages for the timeline stepper
const STAGE_ORDER = ["ORDERED", "COLLECTED", "COMPLETED"];

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: "pending" };
  return <span className={`lab-badge ${s.cls}`}><span className="lab-badge-dot" />{s.label}</span>;
}
function PriorityBadge({ priority }) {
  const p = PRIORITY_MAP[priority] || { label: priority, cls: "routine" };
  return <span className={`lab-priority ${p.cls}`}>{p.label}</span>;
}

export default function LabOrderDetail({ orderId, onBack, onOpticket }) {
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError("");
    receptionistApi.getLabOrderDetail(orderId)
      .then(data => setOrder(data.order || data))
      .catch(() => setError("Failed to load order details."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this lab order?")) return;
    setCancelling(true);
    try {
      await receptionistApi.cancelLabOrder(orderId);
      const data = await receptionistApi.getLabOrderDetail(orderId);
      setOrder(data.order || data);
    } catch {
      alert("Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

  if (loading) {
    return (
      <div className="lab-page">
        <div className="lab-breadcrumb">
          <button onClick={onBack}>Lab Orders</button>
          <ChevronRight size={13} />
          <span>Order Details</span>
        </div>
        <div className="lab-loading">
          <div className="lab-loading-spinner" />
          <p>Loading order…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lab-page">
        <div className="lab-breadcrumb">
          <button onClick={onBack}>Lab Orders</button>
          <ChevronRight size={13} />
          <span>Order Details</span>
        </div>
        <div className="lab-alert error"><X size={15} /> {error}</div>
      </div>
    );
  }

  if (!order) return null;

  // ── Normalize nested API shape ──────────────────────────────
  const patient    = order.patient   || {};
  const testType   = order.test_type || {};
  const testFields = testType.fields || [];
  const fieldValues = order.field_values || {};
  const isCancelled = order.status === "CANCELLED";
  const isCompleted = order.status === "COMPLETED";
  const currentStageIdx = STAGE_ORDER.indexOf(order.status);

  return (
    <div className="lab-page">
      {/* Breadcrumb */}
      <div className="lab-breadcrumb">
        <button onClick={onBack}>Lab Orders</button>
        <ChevronRight size={13} />
        <span>Order #{order.token_number ?? order.id}</span>
      </div>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="lod-topbar">
        <div className="lod-topbar-left">
          <h2 className="lod-order-title">Order #{order.token_number ?? order.id}</h2>
          <StatusBadge status={order.status} />
          <PriorityBadge priority={order.priority} />
        </div>
        <div className="lod-topbar-actions">
          <button className="lab-btn-secondary" onClick={onBack}>
            ← Back to List
          </button>
          {!isCancelled && !isCompleted && (
            <button
              className="lab-btn-icon lab-btn-cancel"
              style={{ height: 36, padding: "0 14px", borderRadius: 8 }}
              disabled={cancelling}
              onClick={handleCancel}
            >
              <Ban size={14} /> {cancelling ? "Cancelling…" : "Cancel Order"}
            </button>
          )}
          <button className="lab-btn-secondary" onClick={() => window.print()}>
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* ── Main two-column layout ──────────────────────────── */}
      <div className="lod-layout">
        {/* ── Left column ─────────────────────────────────── */}
        <div className="lod-col-main">

          {/* Patient Information */}
          <div className="lod-card">
            <div className="lod-card-title">
              <User size={15} /> Patient Information
            </div>
            <div className="lod-info-grid">
              <div className="lod-info-item">
                <span className="lod-info-label">Full Name</span>
                <span className="lod-info-value strong">{patient.name || "—"}</span>
              </div>
              <div className="lod-info-item">
                <span className="lod-info-label">Patient ID</span>
                <span className="lod-info-value">{patient.id ? `#${patient.id}` : "—"}</span>
              </div>
              <div className="lod-info-item">
                <span className="lod-info-label"><Mail size={11} /> Email Address</span>
                <span className="lod-info-value">{patient.email || "—"}</span>
              </div>
            </div>
          </div>

          {/* Test Details + Clinical Notes side by side */}
          <div className="lod-row-2">
            <div className="lod-card">
              <div className="lod-card-title">
                <FlaskConical size={15} /> Test Details
              </div>
              <div className="lod-test-name">{testType.name || "—"}</div>
              {testType.code && <div className="lod-test-code">{testType.code}</div>}
              {testType.description && (
                <p className="lod-test-desc">{testType.description}</p>
              )}
            </div>

            <div className="lod-card">
              <div className="lod-card-title">
                <FileText size={15} /> Clinical Notes
              </div>
              {order.notes ? (
                <p className="lod-notes">{order.notes}</p>
              ) : (
                <p className="lod-notes muted">No clinical notes provided.</p>
              )}
            </div>
          </div>

          {/* Test Results — only revealed once completed */}
          <div className="lod-card">
            <div className="lod-card-title">
              <ClipboardList size={15} /> Test Results
              {!isCompleted && <span className="lod-pending-tag">Processing</span>}
            </div>

            {isCompleted ? (
              testFields.length > 0 ? (
                <div className="lod-results-grid">
                  {testFields.map(f => {
                    const val = fieldValues[f.field_key];
                    const filled = val != null && val !== "";
                    return (
                      <div key={f.id} className={`lod-result-item ${filled ? "filled" : "empty"}`}>
                        <span className="lod-result-label">
                          {f.label} {f.is_required && <span className="lod-required">*</span>}
                        </span>
                        <span className="lod-result-value">
                          {filled ? val : <em>Not recorded</em>}
                        </span>
                        {f.help_text && <span className="lod-result-help">{f.help_text}</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="lod-notes muted">No result fields configured for this test.</p>
              )
            ) : (
              <div className="lod-waiting">
                <FlaskConical size={26} />
                <p>
                  {isCancelled
                    ? "This order was cancelled — no results will be recorded."
                    : "Results will appear here once the test is completed."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ────────────────────────────────── */}
        <div className="lod-col-side">

          {/* Timeline */}
          <div className="lod-card">
            <div className="lod-card-title">Order Timeline</div>
            <div className="lod-timeline">
              {isCancelled ? (
                <div className="lod-timeline-step done cancelled">
                  <div className="lod-timeline-dot">
                    <X size={11} />
                  </div>
                  <div>
                    <div className="lod-timeline-label">Order Cancelled</div>
                    <div className="lod-timeline-time">{formatDate(order.updated_at)}</div>
                  </div>
                </div>
              ) : (
                STAGE_ORDER.map((stage, idx) => {
                  const s = STATUS_MAP[stage];
                  const done = idx <= currentStageIdx;
                  const isCurrent = idx === currentStageIdx;
                  return (
                    <div key={stage} className={`lod-timeline-step ${done ? "done" : "todo"}`}>
                      <div className="lod-timeline-dot">
                        {done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                      </div>
                      <div>
                        <div className="lod-timeline-label">
                          {s.label}{isCurrent ? " (current)" : ""}
                        </div>
                        <div className="lod-timeline-time">
                          {stage === "ORDERED" ? formatDate(order.created_at) : done ? formatDate(order.updated_at) : "Pending"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Summary panel */}
          <div className="lod-summary-card">
            <div className="lod-summary-title">Laboratory Summary</div>
            <div className="lod-summary-row">
              <span>Status</span>
              <strong>{STATUS_MAP[order.status]?.label || order.status}</strong>
            </div>
            <div className="lod-summary-row">
              <span>Priority</span>
              <strong>{PRIORITY_MAP[order.priority]?.label || order.priority}</strong>
            </div>
            <div className="lod-summary-row">
              <span>Test Code</span>
              <strong>{testType.code || "—"}</strong>
            </div>
            <div className="lod-summary-row">
              <span>Ordered By</span>
              <strong>{order.ordered_by || "—"}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}