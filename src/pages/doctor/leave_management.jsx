import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import "./leave_management.css";

/* ─── helpers ─────────────────────────────────────────── */
function diffDays(from, to) {
  if (!from || !to) return 0;
  const d1 = new Date(from);
  const d2 = new Date(to);
  const diff = Math.round((d2 - d1) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}
function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function badgeClass(status) {
  if (!status) return "lm-badge-pending";
  switch (status.toLowerCase()) {
    case "approved":  return "lm-badge-approved";
    case "rejected":  return "lm-badge-rejected";
    case "cancelled": return "lm-badge-cancelled";
    default:          return "lm-badge-pending";
  }
}

/* ─── icons ────────────────────────────────────────────── */
const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const HistIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.85"/>
    <polyline points="3 7 3 11 7 11"/>
  </svg>
);
const CloudIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ─── Toast ─────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`lm-toast lm-toast-${type}`}>{msg}</div>;
}

/* ═══ Main Component ═══════════════════════════════════════ */
export default function LeaveManagement() {
  /* ── state ── */
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // {msg, type}

  const [form, setForm] = useState({
    leave_type: "annual",
    from_date: "",
    to_date: "",
    reason: "",
  });

  /* ── fetch helpers ── */
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const res = await api.get("doctor/leave/balance/");
      // API returns { success, leave_balance: { annual, sick, casual, total_taken, total_remaining } }
      setBalance(res.data?.leave_balance || res.data || null);
    } catch {
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await api.get("doctor/leave/request/");
      // API returns { success, leaves: [...] }
      const list =
        res.data?.leaves ||
        res.data?.results ||
        res.data?.requests ||
        (Array.isArray(res.data) ? res.data : []);
      setRequests(list);
    } catch {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchRequests();
  }, [fetchBalance, fetchRequests]);

  /* ── form handlers ── */
  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleReset = () =>
    setForm({ leave_type: "annual", from_date: "", to_date: "", reason: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from_date || !form.to_date || !form.reason.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    if (new Date(form.to_date) < new Date(form.from_date)) {
      showToast("End date cannot be before start date.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("doctor/leave/request/", {
        leave_type: form.leave_type,
        start_date: form.from_date,
        end_date: form.to_date,
        reason: form.reason,
      });
      showToast("Leave request submitted successfully!");
      handleReset();
      fetchBalance();
      fetchRequests();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        Object.values(err.response?.data || {})[0]?.[0] ||
        "Failed to submit request.";
      showToast(typeof msg === "string" ? msg : "Failed to submit request.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this leave request?")) return;
    setCancellingId(id);
    try {
      await api.post(`doctor/leave/cancel/${id}/`);
      showToast("Leave request cancelled.");
      fetchBalance();
      fetchRequests();
    } catch {
      showToast("Failed to cancel request.", "error");
    } finally {
      setCancellingId(null);
    }
  };

  /* ── balance card data ── */
  const days = diffDays(form.from_date, form.to_date);

  const balanceCards = [
    {
      label: "Annual Leave",
      value: balance?.annual ?? balance?.annual_leave ?? "--",
      tag: "Days",
      tagClass: "lm-tag-green",
    },
    {
      label: "Sick Leave",
      value: balance?.sick ?? balance?.sick_leave ?? "--",
      tag: "Days",
      tagClass: "lm-tag-green",
    },
    {
      label: "Casual Leave",
      value: balance?.casual ?? balance?.casual_leave ?? "--",
      tag: "Days",
      tagClass: "lm-tag-green",
    },
    {
      label: "Total Taken",
      value: balance?.total_taken ?? balance?.used ?? "--",
      tag: "Used",
      tagClass: "lm-tag-red",
    },
    {
      label: "Total Remaining",
      value: balance?.total_remaining ?? balance?.remaining ?? "--",
      tag: "Available",
      tagClass: "lm-tag-green",
      highlight: true,
    },
  ];

  return (
    <div className="lm-root">
      {/* Page header */}
      <div className="lm-page-header">
        <h1>Leave Application</h1>
        <p>Review your balances and submit new time-off requests.</p>
      </div>

      {/* Balance cards */}
      <div className="lm-balance-grid">
        {loadingBalance ? (
          <div className="lm-spinner" style={{ gridColumn: "1/-1" }} />
        ) : (
          balanceCards.map((c) => (
            <div key={c.label} className={`lm-balance-card${c.highlight ? " highlight" : ""}`}>
              <span className="lm-balance-label">{c.label}</span>
              <div className="lm-balance-row">
                <span className="lm-balance-num">{c.value}</span>
                <span className={`lm-balance-tag ${c.tagClass}`}>{c.tag}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main 2-col */}
      <div className="lm-main-grid">
        {/* ── Left: New Leave Request ─────────────────── */}
        <div className="lm-card">
          <div className="lm-card-header">
            <div className="lm-card-header-icon"><CalIcon /></div>
            <h2>New Leave Request</h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Leave type */}
            <div className="lm-form-group">
              <label>Leave Type</label>
              <select
                className="lm-select"
                name="leave_type"
                value={form.leave_type}
                onChange={handleChange}
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            {/* Dates */}
            <div className="lm-form-group">
              <div className="lm-date-row">
                <div>
                  <label>From Date</label>
                  <input
                    className="lm-date-input"
                    type="date"
                    name="from_date"
                    value={form.from_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label>To Date</label>
                  <input
                    className="lm-date-input"
                    type="date"
                    name="to_date"
                    value={form.to_date}
                    min={form.from_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="lm-duration-box">
              <span>Calculated Duration</span>
              <strong>Total Days: {days > 0 ? days : "–"}</strong>
            </div>

            {/* Reason */}
            <div className="lm-form-group">
              <label>Reason for Leave</label>
              <textarea
                className="lm-textarea"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="Provide clinical justification or personal context..."
                required
              />
            </div>

            {/* Attachment (UI only) */}
            <div className="lm-form-group">
              <label>Attachments (Optional)</label>
              <div className="lm-upload-zone">
                <CloudIcon />
                <p>Drag and drop or click to upload PDF/JPEG</p>
              </div>
            </div>

            {/* Actions */}
            <div className="lm-form-actions">
              <button type="button" className="lm-btn-reset" onClick={handleReset}>
                Reset
              </button>
              <button type="submit" className="lm-btn-submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Right panel ─────────────────────────────── */}
        <div className="lm-right-panel">
          {/* My Leave Requests */}
          <div className="lm-card">
            <div className="lm-requests-header">
              <h2><HistIcon /> My Leave Requests</h2>
              <button className="lm-view-all" onClick={fetchRequests}>Refresh</button>
            </div>

            {/* Column headers */}
            <div className="lm-table-cols">
              <span>DATE</span>
              <span>TYPE</span>
              <span>FROM – TO</span>
              <span>DAYS</span>
              <span>STATUS</span>
            </div>

            {loadingRequests ? (
              <div className="lm-spinner" />
            ) : requests.length === 0 ? (
              <div className="lm-empty">No leave requests found.</div>
            ) : (
              requests.map((req) => {
                const reqDate = req.created_at || req.applied_on || req.date || "";
                const displayDate = reqDate
                  ? new Date(reqDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                  : "–";
                const leaveLabel =
                  req.leave_type_display ||
                  (req.leave_type
                    ? req.leave_type.charAt(0).toUpperCase() + req.leave_type.slice(1) + " Leave"
                    : "Leave");
                const days =
                  req.days ||
                  req.total_days ||
                  diffDays(req.start_date, req.end_date);
                const statusText = req.status_display || req.status || "Pending";
                const isPending = statusText.toLowerCase() === "pending";

                return (
                  <div className="lm-request-row" key={req.id}>
                    <span className="lm-req-date">{displayDate}</span>
                    <span className="lm-req-type">{leaveLabel}</span>
                    <span className="lm-req-range">
                      {fmtDate(req.start_date)}&nbsp;<ArrowIcon />&nbsp;{fmtDate(req.end_date)}
                    </span>
                    <span className="lm-req-days">{days}</span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                      <span className={`lm-badge ${badgeClass(statusText)}`}>
                        <span className="lm-badge-dot" />
                        {statusText.toUpperCase()}
                      </span>
                      {isPending && (
                        <button
                          className="lm-cancel-btn"
                          onClick={() => handleCancel(req.id)}
                          disabled={cancellingId === req.id}
                        >
                          {cancellingId === req.id ? "..." : "Cancel"}
                        </button>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Wellbeing banner */}
          <div className="lm-wellbeing">
            <div className="lm-wellbeing-text">
              <h3>Doctor Wellbeing Support</h3>
              <p>Our clinic offers mental health days and burnout support. Talk to an advisor today.</p>
              <span className="lm-wellbeing-link">ACCESS PORTAL →</span>
            </div>
            <img
              className="lm-wellbeing-img"
              src="https://images.unsplash.com/photo-1584432743501-7d5c27a39189?q=80&w=400&auto=format&fit=crop"
              alt="Wellbeing"
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
