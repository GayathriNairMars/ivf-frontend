import { useState, useEffect, useCallback, useRef } from "react";
import { Eye, X, Search } from "lucide-react";
import financeApi from "../../../api/financeApi";
import "./finance.css";

const SOURCE_TYPES = ["ALL", "PHARMACY", "LAB", "RADIOLOGY", "OPD"];
const PAGE_SIZE = 10;

function SourceBadge({ type }) {
  const t = (type || "").toUpperCase();
  const cls = t === "PHARMACY"  ? "pharmacy"
            : t === "LAB"       ? "lab"
            : t === "RADIOLOGY" ? "radiology"
            : t === "OPD"       ? "opd"
            : "default";
  return <span className={`fin-badge ${cls}`}>{t || "—"}</span>;
}

function DetailModal({ entry, onClose }) {
  if (!entry) return null;
  const rows = [
    ["Journal ID",   entry.id ?? "—"],
    ["Source Type",  entry.source_type ?? "—"],
    ["Bill / Source ID", entry.source_id ?? "—"],
    ["Amount",       entry.amount ?? entry.total_amount ?? "—"],
    ["Payment Type", entry.payment_type ?? "CASH"],
    ["Account Code", entry.revenue_account_code ?? "—"],
    ["Status",       entry.status ?? "POSTED"],
    ["Posted At",    entry.created_at
        ? new Date(entry.created_at).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "medium" })
        : "—"],
    ["Description",  entry.description ?? "—"],
  ];

  return (
    <div className="fin-overlay" onClick={onClose}>
      <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fin-modal-header">
          <h3>Journal Entry Detail</h3>
          <button className="fin-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="fin-modal-body">
          {rows.map(([k, v]) => (
            <div className="fin-detail-row" key={k}>
              <span className="fin-detail-key">{k}</span>
              <span className="fin-detail-val">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function JournalEntries() {
  const [entries, setEntries]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [page, setPage]           = useState(1);
  const [sourceFilter, setSource] = useState("ALL");
  const [search, setSearch]       = useState("");
  const [selectedEntry, setEntry] = useState(null);
  const debounceRef               = useRef(null);

  const load = useCallback(async (pg, src, srch) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: pg, page_size: PAGE_SIZE };
      if (src !== "ALL") params.source_type = src;
      if (srch)          params.search = srch;
      const data = await financeApi.getJournalEntries(params);
      if (Array.isArray(data)) {
        setEntries(data);
        setTotal(data.length);
      } else {
        setEntries(data.results ?? []);
        setTotal(data.count ?? (data.results ?? []).length);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load journal entries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, sourceFilter, search); }, [load, page, sourceFilter]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(1, sourceFilter, val);
    }, 400);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="dashboard-content">
      <div className="fin-page-header">
        <div>
          <h2>Journal Entries</h2>
          <p>Full audit trail of all financial transactions posted to the General Ledger</p>
        </div>
      </div>

      <div className="fin-table-section fin-card">
        <div className="fin-card-header">
          <div>
            <h3>Transaction Log</h3>
            <p>{total} entr{total === 1 ? "y" : "ies"} found</p>
          </div>
          <div className="fin-table-filters">
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}
              />
              <input
                type="text"
                placeholder="Search bill ID…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="fin-form-input"
                style={{ paddingLeft: 32, width: 180 }}
              />
            </div>
            {/* Source filter */}
            <select
              className="fin-select"
              value={sourceFilter}
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
            >
              {SOURCE_TYPES.map((s) => (
                <option key={s} value={s}>{s === "ALL" ? "All Sources" : s}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && <div className="fin-loading">Loading transactions…</div>}
        {error   && <div className="fin-empty" style={{ color: "#ef4444" }}>{error}</div>}

        {!loading && !error && (
          <>
            {entries.length === 0 ? (
              <div className="fin-empty">
                <Eye size={32} style={{ marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
                No entries found. Try changing the filter or adding a new bill.
              </div>
            ) : (
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Source</th>
                    <th>Bill ID</th>
                    <th>Date &amp; Time</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={e.id ?? i}>
                      <td style={{ color: "var(--text-3)", fontSize: "0.78rem" }}>
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td><SourceBadge type={e.source_type} /></td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 600 }}>
                        {e.source_id ?? "—"}
                      </td>
                      <td style={{ color: "var(--text-2)", fontSize: "0.82rem" }}>
                        {e.created_at
                          ? new Date(e.created_at).toLocaleString("en-IN", {
                              dateStyle: "medium", timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td className="fin-amount-positive">
                        ₹{Number(e.amount ?? e.total_amount ?? 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        <span style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: (e.payment_type || "CASH") === "CREDIT" ? "#7c3aed" : "var(--text-2)",
                        }}>
                          {e.payment_type || "CASH"}
                        </span>
                      </td>
                      <td>
                        <span className={`fin-status-badge ${(e.status || "posted").toLowerCase()}`}>
                          {e.status || "POSTED"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="fin-icon-btn"
                          title="View details"
                          onClick={() => setEntry(e)}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="fin-pagination">
              <div className="fin-page-info">
                Showing <span>{entries.length}</span> of <span>{total}</span> entries
              </div>
              <div className="fin-page-controls">
                <button
                  className="fin-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => {
                  const p = idx + 1;
                  return (
                    <button
                      key={p}
                      className="fin-page-btn"
                      style={p === page ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  className="fin-page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedEntry && (
        <DetailModal entry={selectedEntry} onClose={() => setEntry(null)} />
      )}
    </div>
  );
}
