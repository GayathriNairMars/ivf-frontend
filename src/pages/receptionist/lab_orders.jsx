// Lab Orders List — Receptionist Portal
import { useState, useEffect, useCallback } from "react";
import { Eye, Ticket, Ban, Plus, FlaskConical, Search, RefreshCw, X } from "lucide-react";
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

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: "pending" };
  return (
    <span className={`lab-badge ${s.cls}`}>
      <span className="lab-badge-dot" />
      {s.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const p = PRIORITY_MAP[priority] || { label: priority, cls: "routine" };
  return <span className={`lab-priority ${p.cls}`}>{p.label}</span>;
}

export default function LabOrders({ onView, onCreate, onOpticket }) {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);
  const [cancellingId, setCancellingId] = useState(null);

  // Backend-provided aggregate stats (independent of current page)
  const [statsData, setStatsData] = useState({
    total: 0,
    ordered: 0,
    completed: 0,
    cancelled: 0,
    urgent: 0,
  });

  const PAGE_SIZE = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search)         params.search   = search;
      if (statusFilter)   params.status   = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const data = await receptionistApi.getLabOrders(params);

      // Handle: plain array | { results, count } | { orders, stats, count }
      if (Array.isArray(data)) {
        setOrders(data);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        const list = data.orders || data.results || [];
        setOrders(list);

        const count = data.count ?? data.stats?.total ?? list.length;
        setTotal(count);
        setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));

        if (data.stats) {
          setStatsData({
            total:     data.stats.total     ?? count,
            ordered:   data.stats.ordered   ?? 0,
            completed: data.stats.completed ?? 0,
            cancelled: data.stats.cancelled ?? 0,
            urgent:    data.stats.urgent    ?? 0,
          });
        }
      }
    } catch (err) {
      setError("Failed to load lab orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this lab order?")) return;
    setCancellingId(id);
    try {
      await receptionistApi.cancelLabOrder(id);
      fetchOrders();
    } catch {
      alert("Failed to cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  // Prefer backend-aggregated stats; fall back to current-page counts only
  // if the API didn't send a stats block at all.
  const stats = {
    total:     statsData.total || total,
    ordered:   statsData.ordered || orders.filter(o => o.status === "ORDERED").length,
    completed: statsData.completed || orders.filter(o => o.status === "COMPLETED").length,
    urgent:    statsData.urgent || orders.filter(o => o.priority === "URGENT" || o.priority === "STAT").length,
  };

  return (
    <div className="lab-page">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="lab-page-header">
        <div className="lab-page-header-text">
          <h2>Lab Orders</h2>
          <p>Manage and track all laboratory test orders</p>
        </div>
        <button className="lab-btn-primary" onClick={onCreate}>
          <Plus size={15} /> Add New Test
        </button>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="lab-stat-row">
        <div className="lab-stat-card">
          <div className="lab-stat-icon" style={{ background: "#eef2ff" }}>
            <FlaskConical size={20} color="#4f46e5" />
          </div>
          <div>
            <div className="lab-stat-value">{stats.total}</div>
            <div className="lab-stat-label">Total Orders</div>
          </div>
        </div>
        <div className="lab-stat-card">
          <div className="lab-stat-icon" style={{ background: "#eff6ff" }}>
            <FlaskConical size={20} color="#2563eb" />
          </div>
          <div>
            <div className="lab-stat-value">{stats.ordered}</div>
            <div className="lab-stat-label">Ordered</div>
          </div>
        </div>
        <div className="lab-stat-card">
          <div className="lab-stat-icon" style={{ background: "#f0fdf4" }}>
            <FlaskConical size={20} color="#16a34a" />
          </div>
          <div>
            <div className="lab-stat-value">{stats.completed}</div>
            <div className="lab-stat-label">Completed</div>
          </div>
        </div>
        <div className="lab-stat-card">
          <div className="lab-stat-icon" style={{ background: "#fff7ed" }}>
            <FlaskConical size={20} color="#ea580c" />
          </div>
          <div>
            <div className="lab-stat-value">{stats.urgent}</div>
            <div className="lab-stat-label">Urgent / STAT</div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="lab-toolbar">
        <div className="lab-search-box">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search patient, test, token…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button style={{ background:"none",border:"none",cursor:"pointer",padding:0 }} onClick={() => setSearch("")}>
              <X size={14} color="#94a3b8" />
            </button>
          )}
        </div>
        <select
          className="lab-filter-select"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="ORDERED">Ordered</option>
          <option value="COLLECTED">Collected</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          className="lab-filter-select"
          value={priorityFilter}
          onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Priority</option>
          <option value="ROUTINE">Routine</option>
          <option value="URGENT">Urgent</option>
          <option value="STAT">STAT</option>
        </select>
        <button className="lab-btn-secondary" onClick={fetchOrders} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Error ────────────────────────────────────────────── */}
      {error && (
        <div className="lab-alert error">
          <X size={15} /> {error}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="lab-table-card">
        {loading ? (
          <div className="lab-loading">
            <div className="lab-loading-spinner" />
            <p>Loading lab orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="lab-empty">
            <FlaskConical size={40} />
            <p>No lab orders found.</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Test</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Ordered</th>
                  <th>Doctor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const testName = order.test_name || order.test_type_name || "—";
                  const testCode = order.test_code || order.test_type_code;
                  const patientMrn = order.mrn || order.patient_mrn;

                  return (
                    <tr key={order.id}>
                      <td>
                        <span className="lab-token-pill">#{order.token_number ?? order.id}</span>
                      </td>
                      <td>
                        <div className="lab-patient-cell">
                          <span className="p-name">{order.patient_name || "—"}</span>
                          {patientMrn && <span className="p-sub">MRN: {patientMrn}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="lab-patient-cell">
                          <span className="p-name">{testName}</span>
                          {testCode && <span className="p-sub">{testCode}</span>}
                        </div>
                      </td>
                      <td><PriorityBadge priority={order.priority} /></td>
                      <td><StatusBadge status={order.status} /></td>
                      <td style={{ color: "var(--rec-text-muted)", fontSize: "12.5px" }}>
                        {order.ordered_at
                          ? new Date(order.ordered_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
                          : order.test_date
                          ? new Date(order.test_date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
                          : order.created_at
                          ? new Date(order.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
                          : "—"}
                      </td>
                      <td style={{ fontSize: "13px", color: "var(--rec-text-sub)" }}>
                        {order.ordered_by_name || order.doctor_name || "—"}
                      </td>
                      <td>
                        <div className="lab-row-actions">
                          {/* View / Eye */}
                          <button
                            className="lab-btn-icon lab-btn-view"
                            title="View Order Details"
                            onClick={() => onView(order.id)}
                          >
                            <Eye size={14} /> View
                          </button>
                          {/* OP Ticket */}
                          {order.status !== "CANCELLED" && (
                            <button
                              className="lab-btn-icon lab-btn-ticket"
                              title="OP Ticket"
                              onClick={() => onOpticket(order)}
                            >
                              <Ticket size={14} /> Ticket
                            </button>
                          )}
                          {/* Cancel */}
                          {(order.status === "ORDERED" || order.status === "PENDING") && (
                            <button
                              className="lab-btn-icon lab-btn-cancel"
                              title="Cancel Order"
                              disabled={cancellingId === order.id}
                              onClick={() => handleCancel(order.id)}
                            >
                              <Ban size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="lab-pagination">
                <span>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} orders
                </span>
                <div className="lab-pagination-btns">
                  <button
                    className="lab-pagination-btn"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >← Prev</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = i + 1;
                    return (
                      <button
                        key={pg}
                        className={`lab-pagination-btn ${page === pg ? "active" : ""}`}
                        onClick={() => setPage(pg)}
                      >{pg}</button>
                    );
                  })}
                  <button
                    className="lab-pagination-btn"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}