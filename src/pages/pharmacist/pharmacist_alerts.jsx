import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import "./pharmacist_alerts.css";

export default function PharmacistAlerts() {
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");

  /* ─── Fetch ─────────────────────────────────────── */
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let url = "/pharmacy/inventory/alerts/";
      if (activeTab !== "ALL") url += `?type=${activeTab}`;
      else                     url += `?status=ALL`;

      const res = await axios.get(url);
      const body = res.data;
      setAlerts(body.success ? (body.data || []) : (body.results || []));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load stock alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [activeTab]);

  /* ─── Dismiss ────────────────────────────────────── */
  const handleDismiss = async (id) => {
    try {
      await axios.patch(`/pharmacy/inventory/alerts/${id}/dismiss/`);
      fetchAlerts();
    } catch (err) {
      console.error(err);
      alert("Failed to dismiss alert.");
    }
  };

  /* ─── Derived data ───────────────────────────────── */
  const byType  = (type) => alerts.filter(a => a.alert_type === type || a.type === type);
  const critical  = (activeTab === "ALL" || activeTab === "CRITICAL")  ? byType("CRITICAL")  : [];
  const lowStock  = (activeTab === "ALL" || activeTab === "LOW_STOCK") ? byType("LOW_STOCK") : [];
  const expiring  = (activeTab === "ALL" || activeTab === "EXPIRING")  ? byType("EXPIRING")  : [];
  const expired   = (activeTab === "ALL" || activeTab === "EXPIRED")   ? byType("EXPIRED")   : [];

  /* ─── Helpers ────────────────────────────────────── */
  const fmtId   = (id) => `ALT-${String(id).padStart(3, "0")}`;
  const fmtDate = (d)  => d ? new Date(d).toISOString().split("T")[0] : "—";

  /* ─────────────────────────────────────────────────
      RENDER
  ───────────────────────────────────────────────── */
  return (
    <div className="al-container">

      {/* ── Page Header ── */}
      <div className="al-page-header">
        <div>
          <nav className="al-breadcrumb">
            <span>Inventory</span>
            <span className="material-symbols-outlined" style={{fontSize:14}}>chevron_right</span>
            <span className="al-breadcrumb-active">Stock Alerts</span>
          </nav>
          <h2 className="al-title">Stock Alerts</h2>
        </div>
        <div className="al-header-actions">
          <button className="al-btn-light" onClick={fetchAlerts}>
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
          <button className="al-btn-light">
            <span className="material-symbols-outlined">settings_suggest</span>
            Notification Settings
          </button>
          <button className="al-btn-primary">
            <span className="material-symbols-outlined">file_download</span>
            Export
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="al-kpi-grid">
        <div className="al-kpi-card al-kpi-critical" onClick={() => setActiveTab("CRITICAL")}>
          <div className="al-kpi-icon al-kpi-icon-critical">
            <span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}}>error</span>
          </div>
          <div>
            <p className="al-kpi-label">Critical</p>
            <p className="al-kpi-value al-kpi-value-critical">
              {String(byType("CRITICAL").length).padStart(2,"0")}
            </p>
          </div>
        </div>

        <div className="al-kpi-card al-kpi-low" onClick={() => setActiveTab("LOW_STOCK")}>
          <div className="al-kpi-icon al-kpi-icon-low">
            <span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}}>warning</span>
          </div>
          <div>
            <p className="al-kpi-label">Low Stock</p>
            <p className="al-kpi-value al-kpi-value-low">
              {String(byType("LOW_STOCK").length).padStart(2,"0")}
            </p>
          </div>
        </div>

        <div className="al-kpi-card al-kpi-expiring" onClick={() => setActiveTab("EXPIRING")}>
          <div className="al-kpi-icon al-kpi-icon-expiring">
            <span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}}>event_upcoming</span>
          </div>
          <div>
            <p className="al-kpi-label">Expiring Soon</p>
            <p className="al-kpi-value al-kpi-value-expiring">
              {String(byType("EXPIRING").length).padStart(2,"0")}
            </p>
          </div>
        </div>

        <div className="al-kpi-card al-kpi-expired">
          <div className="al-kpi-icon al-kpi-icon-expired">
            <span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}}>cancel</span>
          </div>
          <div>
            <p className="al-kpi-label">Expired</p>
            <p className="al-kpi-value">
              {String(byType("EXPIRED").length).padStart(2,"0")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="al-tabs">
        {[
          { key: "CRITICAL",  label: "Critical",      count: byType("CRITICAL").length,  cls: "tab-dot-error"  },
          { key: "LOW_STOCK", label: "Low Stock",     count: byType("LOW_STOCK").length, cls: "tab-dot-amber"  },
          { key: "EXPIRING",  label: "Expiring Soon", count: byType("EXPIRING").length,  cls: "tab-dot-primary"},
          { key: "EXPIRED",   label: "Expired",       count: byType("EXPIRED").length,   cls: "tab-dot-gray"   },
          { key: "ALL",       label: "All Alerts",    count: null },
        ].map(t => (
          <button
            key={t.key}
            className={`al-tab ${activeTab === t.key ? "al-tab-active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            {t.count !== null && (
              <span className={`al-tab-badge ${t.cls}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      {loading ? (
        <div className="al-state-msg">Loading alerts…</div>
      ) : error ? (
        <div className="al-state-msg al-state-error">{error}</div>
      ) : alerts.length === 0 ? (
        <div className="al-state-msg">✅ No alerts found for the selected category.</div>
      ) : (
        <>
          {/* Critical */}
          {critical.length > 0 && (
            <section className="al-section">
              <div className="al-section-heading">
                <div className="al-section-bar bar-error"></div>
                <h3>Critical Alerts ({critical.length})</h3>
              </div>
              <div className="al-table-wrap wrap-error">
                <table className="al-table">
                  <thead className="thead-red">
                    <tr>
                      <th>Alert ID</th><th>Medication</th><th>Stock</th>
                      <th>Min</th><th>Status</th><th>Days Left (Est)</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {critical.map(a => (
                      <tr key={a.id} className="tr-red">
                        <td><span className="mono text-error">{fmtId(a.id)}</span></td>
                        <td>
                          <span className="med-name">{a.medication_name}</span>
                          {a.unit && <span className="med-sub">{a.unit}</span>}
                        </td>
                        <td>
                          <div className="stock-cell">
                            <span className="stock-val text-error">{a.current_stock ?? "—"}</span>
                            <span className="material-symbols-outlined text-error pulse" style={{fontVariationSettings:"'FILL' 1",fontSize:18}}>error</span>
                          </div>
                        </td>
                        <td>{a.minimum_stock ?? "—"}</td>
                        <td><span className="badge badge-critical">Critical</span></td>
                        <td>{a.days_until_expiry != null ? `${a.days_until_expiry} days` : "—"}</td>
                        <td className="text-right">
                          <div className="action-group">
                            <button className="btn-sm btn-primary-sm">Order</button>
                            <button className="btn-sm btn-outline-sm" onClick={() => handleDismiss(a.id)}>Dismiss</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Low Stock */}
          {lowStock.length > 0 && (
            <section className="al-section">
              <div className="al-section-heading">
                <div className="al-section-bar bar-amber"></div>
                <h3>Low Stock Alerts ({lowStock.length})</h3>
              </div>
              <div className="al-table-wrap wrap-amber">
                <table className="al-table">
                  <thead className="thead-amber">
                    <tr>
                      <th>Alert ID</th><th>Medication</th><th>Stock</th>
                      <th>Reorder Level</th><th>Since</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map(a => (
                      <tr key={a.id} className="tr-amber">
                        <td><span className="mono text-gray">{fmtId(a.id)}</span></td>
                        <td>
                          <span className="med-name">{a.medication_name}</span>
                          {a.unit && <span className="med-sub">{a.unit}</span>}
                        </td>
                        <td>
                          <div className="stock-cell">
                            <span className="stock-val text-amber">{a.current_stock ?? "—"}</span>
                            <span className="material-symbols-outlined text-amber" style={{fontSize:18}}>warning</span>
                          </div>
                        </td>
                        <td>{a.reorder_level ?? "—"}</td>
                        <td className="text-gray">{a.days_since_alert != null ? `${a.days_since_alert} days` : "—"}</td>
                        <td className="text-right">
                          <div className="action-group">
                            <button className="btn-sm btn-secondary-sm">Order</button>
                            <button className="btn-sm btn-outline-sm" onClick={() => handleDismiss(a.id)}>Dismiss</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Expiring Soon */}
          {expiring.length > 0 && (
            <section className="al-section">
              <div className="al-section-heading">
                <div className="al-section-bar bar-primary"></div>
                <h3>Expiring Soon Alerts ({expiring.length})</h3>
              </div>
              <div className="al-table-wrap wrap-default">
                <table className="al-table">
                  <thead className="thead-default">
                    <tr>
                      <th>Alert ID</th><th>Medication</th><th>Expiry Date</th>
                      <th>Days Left</th><th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiring.map(a => (
                      <tr key={a.id} className="tr-default">
                        <td><span className="mono text-gray">{fmtId(a.id)}</span></td>
                        <td>
                          <span className="med-name">{a.medication_name}</span>
                          {a.generic_name && <span className="med-sub">{a.generic_name}</span>}
                        </td>
                        <td className="mono">{fmtDate(a.expiry_date)}</td>
                        <td>
                          <span className={a.days_until_expiry != null && a.days_until_expiry < 60 ? "font-semibold text-error" : "font-semibold text-primary"}>
                            {a.days_until_expiry != null ? `${a.days_until_expiry} days` : "—"}
                          </span>
                        </td>
                        <td><span className="badge badge-active">Active</span></td>
                        <td className="text-right">
                          <div className="action-group">
                            <button className="btn-sm btn-light-sm">Review</button>
                            <button className="btn-sm btn-outline-sm" onClick={() => handleDismiss(a.id)}>Dismiss</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Expired */}
          {expired.length > 0 && (
            <section className="al-section">
              <div className="al-section-heading">
                <div className="al-section-bar bar-gray"></div>
                <h3>Expired Medications ({expired.length})</h3>
              </div>
              <div className="al-table-wrap wrap-default">
                <table className="al-table">
                  <thead className="thead-default">
                    <tr>
                      <th>Alert ID</th><th>Medication</th><th>Expiry Date</th>
                      <th>Status</th><th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expired.map(a => (
                      <tr key={a.id} className="tr-default">
                        <td><span className="mono text-gray">{fmtId(a.id)}</span></td>
                        <td><span className="med-name">{a.medication_name}</span></td>
                        <td className="mono">{fmtDate(a.expiry_date)}</td>
                        <td><span className="badge badge-expired">Expired</span></td>
                        <td className="text-right">
                          <div className="action-group">
                            <button className="btn-sm btn-outline-sm" onClick={() => handleDismiss(a.id)}>Dismiss</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Global Actions ── */}
      <div className="al-global-actions">
        <div className="flex-align" style={{gap:16}}>
          <button className="al-btn-primary-lg">
            <span className="material-symbols-outlined">receipt_long</span>
            Generate Purchase Orders
          </button>
          <button className="al-btn-outline-lg">
            Dismiss All Non-Critical
          </button>
        </div>
        <button className="al-btn-text">
          <span className="material-symbols-outlined">description</span>
          Export Detailed Report
        </button>
      </div>

    </div>
  );
}
