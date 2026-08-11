import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, DollarSign, BarChart2, Building2, RefreshCw
} from "lucide-react";
import financeApi from "../../../api/financeApi";
import "./finance.css";

const DEPT_COLORS = {
  PHARMACY:  { bar: "#4474f6", dot: "#4474f6" },
  LAB:       { bar: "#12b76a", dot: "#12b76a" },
  RADIOLOGY: { bar: "#f97316", dot: "#f97316" },
  OPD:       { bar: "#7c3aed", dot: "#7c3aed" },
};

const DEFAULT_COLOR = "#98a2b3";

function fmt(n) {
  if (n == null || isNaN(Number(n))) return "₹0.00";
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await financeApi.getIncomeReport();
      setReport(data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load income report.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

// Build chart data from department_breakdown or department_summary
  const rawDept = report?.department_breakdown
    ?? report?.department_summary
    ?? report?.departments;

  const deptData = Array.isArray(rawDept)
    ? rawDept
    : rawDept && typeof rawDept === "object"
      ? Object.entries(rawDept).map(([name, val]) => ({
          name,
          ...(typeof val === "object" && val !== null ? val : { total_revenue: val }),
        }))
      : [];

  const maxVal = Math.max(...deptData.map(d => Number(d.total_revenue ?? d.total ?? d.amount ?? 0)), 1);

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div className="fin-page-header">
        <div>
          <h2>Financial Overview</h2>
          <p>Income report &amp; P&amp;L summary across all departments</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-outline"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate("/superadmin/finance/process-bill")}
          >
            + New Bill Entry
          </button>
        </div>
      </div>

      {loading && <div className="fin-loading">Loading income report…</div>}
      {error   && <div className="fin-empty" style={{ color: "#ef4444" }}>{error}</div>}

      {!loading && !error && report && (
        <>
          {/* KPI Row */}
          <div className="fin-kpi-row">
            <div className="fin-kpi-card">
              <div className="fin-kpi-top">
                <span className="fin-kpi-label">Total Income</span>
                <span className="fin-kpi-icon blue"><TrendingUp size={18} /></span>
              </div>
              <div className="fin-kpi-value">{fmt(report.total_income ?? report.total_revenue)}</div>
              <div className="fin-kpi-sub">
                <span className="up">↑</span>All posted transactions
              </div>
            </div>

            <div className="fin-kpi-card">
              <div className="fin-kpi-top">
                <span className="fin-kpi-label">Total Expenses</span>
                <span className="fin-kpi-icon red"><DollarSign size={18} /></span>
              </div>
              <div className="fin-kpi-value">{fmt(report.total_expenses ?? 0)}</div>
              <div className="fin-kpi-sub">Operational costs &amp; payables</div>
            </div>

            <div className="fin-kpi-card">
              <div className="fin-kpi-top">
                <span className="fin-kpi-label">Net Profit</span>
                <span className="fin-kpi-icon green"><BarChart2 size={18} /></span>
              </div>
              <div className="fin-kpi-value" style={{ color: "#12b76a" }}>
                {fmt(report.net_profit ?? report.total_income ?? report.total_revenue)}
              </div>
              <div className="fin-kpi-sub">
                <span className="up">↑</span>Revenue minus expenses
              </div>
            </div>

            <div className="fin-kpi-card">
              <div className="fin-kpi-top">
                <span className="fin-kpi-label">Active Depts</span>
                <span className="fin-kpi-icon purple"><Building2 size={18} /></span>
              </div>
              <div className="fin-kpi-value">{deptData.length || report.total_departments || "—"}</div>
              <div className="fin-kpi-sub">Reporting departments</div>
            </div>
          </div>

          {/* Chart + Quick Stats */}
          <div className="fin-mid-row">
            <div className="fin-card">
              <div className="fin-card-header">
                <div>
                  <h3>Income by Department</h3>
                  <p>Revenue breakdown across billing sources</p>
                </div>
              </div>
              <div className="fin-card-body">
                {deptData.length === 0 ? (
                  <div className="fin-empty">No department data available.</div>
                ) : (
                  <div className="fin-bar-chart">
                    {deptData.map((d) => {
                      const key = (d.source_type || d.department || d.name || "").toUpperCase();
                      const val = Number(d.total_revenue ?? d.total ?? d.amount ?? 0);
                      const pct = maxVal ? (val / maxVal) * 100 : 0;
                      const color = DEPT_COLORS[key]?.bar || DEFAULT_COLOR;
                      return (
                        <div className="fin-bar-group" key={key}>
                          <div className="fin-bar-track">
                            <div
                              className="fin-bar-fill"
                              style={{ height: `${pct}%`, background: color }}
                            >
                              <div className="fin-bar-tooltip">{fmt(val)}</div>
                            </div>
                          </div>
                          <span className="fin-bar-label">{key.slice(0, 5)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="fin-card">
              <div className="fin-card-header">
                <div><h3>Quick Stats</h3></div>
              </div>
              <div className="fin-quick-stats">
                {deptData.length === 0 ? (
                  <div className="fin-empty" style={{ padding: "20px" }}>No data.</div>
                ) : (
                  deptData.map((d) => {
                    const key = (d.source_type || d.department || d.name || "").toUpperCase();
                    const val = Number(d.total_revenue ?? d.total ?? d.amount ?? 0);
                    const color = DEPT_COLORS[key]?.dot || DEFAULT_COLOR;
                    const label = key.charAt(0) + key.slice(1).toLowerCase();
                    return (
                      <div className="fin-qs-row" key={key}>
                        <div className="fin-qs-left">
                          <div className="fin-qs-dot" style={{ background: color }} />
                          <span className="fin-qs-dept">{label}</span>
                        </div>
                        <span className="fin-qs-amount">{fmt(val)}</span>
                      </div>
                    );
                  })
                )}
                <div className="fin-qs-row" style={{ borderTop: "2px solid var(--border)", marginTop: 4 }}>
                  <div className="fin-qs-left">
                    <div className="fin-qs-dot" style={{ background: "#4474f6" }} />
                    <span className="fin-qs-dept" style={{ fontWeight: 700 }}>Total</span>
                  </div>
                  <span className="fin-qs-amount" style={{ color: "#4474f6" }}>
                    {fmt(report.total_income ?? report.total_revenue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Journal Entries preview */}
          <div className="fin-table-section">
            <div className="fin-card">
              <div className="fin-card-header">
                <div>
                  <h3>Recent Journal Entries</h3>
                  <p>Latest posted transactions (Audit Trail)</p>
                </div>
                <button
                  className="btn-outline"
                  onClick={() => navigate("/superadmin/finance/journal-entries")}
                >
                  View All
                </button>
              </div>
              <RecentEntries />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* Mini recent-entries sub-component */
function RecentEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getJournalEntries({ limit: 5 })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setEntries(list.slice(0, 5));
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="fin-loading">Loading…</div>;
  if (entries.length === 0) return <div className="fin-empty">No journal entries found.</div>;

  return (
    <table className="fin-table">
      <thead>
        <tr>
          <th>Source</th>
          <th>Bill ID</th>
          <th>Date &amp; Time</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={e.id ?? i}>
            <td><SourceBadge type={e.source_type} /></td>
            <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{e.source_id ?? "—"}</td>
            <td style={{ color: "var(--text-2)" }}>
              {e.created_at
                ? new Date(e.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium", timeStyle: "short",
                  })
                : "—"}
            </td>
            <td className="fin-amount-positive">
              ₹{Number(e.amount ?? e.total_amount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </td>
            <td>
              <span className={`fin-status-badge ${(e.status || "posted").toLowerCase()}`}>
                {e.status || "POSTED"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SourceBadge({ type }) {
  const t = (type || "").toUpperCase();
  const cls = t === "PHARMACY" ? "pharmacy"
            : t === "LAB"      ? "lab"
            : t === "RADIOLOGY"? "radiology"
            : t === "OPD"      ? "opd"
            : "default";
  return <span className={`fin-badge ${cls}`}>{t || "—"}</span>;
}
