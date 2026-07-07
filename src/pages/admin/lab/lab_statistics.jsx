import { useState, useEffect } from "react";
import { FlaskConical, FolderOpen, Calendar, RefreshCw, ChevronDown } from "lucide-react";
import adminApi from "../../../api/adminApi";
import "./lab.css";

export default function LabStatistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getLabStatistics();
      if (res && res.success) {
        setStats(res.statistics);
      }
    } catch (error) {
      console.error("Failed to load statistics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusPercent = (status) => {
    if (!stats || !stats.records_by_status) return 0;
    const total = Object.values(stats.records_by_status).reduce((a, b) => a + b, 0) || 1;
    const val = stats.records_by_status[status] || 0;
    return Math.round((val / total) * 100);
  };

  const getStatusCount = (status) => {
    if (!stats || !stats.records_by_status) return 0;
    return stats.records_by_status[status] || 0;
  };

  const getThroughputMax = () => {
    if (!stats || !stats.records_by_test_type || stats.records_by_test_type.length === 0) return 20;
    return Math.max(...stats.records_by_test_type.map(t => t.count)) || 20;
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return "Today";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return "Today";
    }
  };

  return (
    <div className="lab-section">
      {/* Header */}
      <div className="lab-header-container">
        <div>
          <h2 className="lab-main-title">Lab Statistics</h2>
          <p className="lab-main-subtitle">Comprehensive overview of laboratory diagnostic performance.</p>
        </div>
        <div className="lab-header-right">
          <button className="btn-reset-filters" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            Last 30 Days
            <ChevronDown size={14} />
          </button>
          <button className="btn-apply-filters" style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={loadData}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="stats-kpi-row">
        <div className="kpi-card">
          <div className="kpi-left">
            <span className="kpi-label">Active Test Types</span>
            <span className="kpi-value">{stats?.total_test_types || 5}</span>
            <span className="kpi-trend info">↑ Stable</span>
          </div>
          <div className="kpi-icon-wrap" style={{ background: "rgba(68, 116, 246, 0.08)", color: "var(--accent)" }}>
            <FlaskConical size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-left">
            <span className="kpi-label">Total Records Processed</span>
            <span className="kpi-value">{stats?.total_records || 45}</span>
            <span className="kpi-trend up">↑ +12% from last month</span>
          </div>
          <div className="kpi-icon-wrap" style={{ background: "rgba(18, 183, 106, 0.08)", color: "#12b76a" }}>
            <FolderOpen size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-left">
            <span className="kpi-label">Tests Performed Today</span>
            <span className="kpi-value">12</span>
            <span className="kpi-trend info" style={{ color: "#f38020" }}>⏲ 6 remaining in queue</span>
          </div>
          <div className="kpi-icon-wrap" style={{ background: "rgba(243, 128, 32, 0.08)", color: "#f38020" }}>
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="lab-grid-layout">
        {/* Top Left: Monthly Volume Trend */}
        <div className="lab-card-panel">
          <div className="panel-header-row">
            <h3>Monthly Volume Trend</h3>
            <div className="chart-legend">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="bullet-dot" style={{ background: "#0f172a" }}></span>
                Processed Tests
              </span>
            </div>
          </div>
          <div className="chart-container">
            <svg viewBox="0 0 500 200" className="chart-svg">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f2f4f7" strokeWidth="1" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="#f2f4f7" strokeWidth="1" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="#f2f4f7" strokeWidth="1" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="#f2f4f7" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Bars */}
              {/* Jan */}
              <rect x="70" y="100" width="28" height="70" rx="4" fill="#0f172a" />
              {/* Feb */}
              <rect x="140" y="70" width="28" height="100" rx="4" fill="#0f172a" />
              {/* Mar */}
              <rect x="210" y="50" width="28" height="120" rx="4" fill="#0f172a" />
              {/* Apr */}
              <rect x="280" y="90" width="28" height="80" rx="4" fill="#0f172a" />
              {/* May */}
              <rect x="350" y="40" width="28" height="130" rx="4" fill="#0f172a" />
              {/* Jun */}
              <rect x="420" y="30" width="28" height="140" rx="4" fill="#4474f6" />

              {/* X Axis Labels */}
              <text x="84" y="190" fill="#98a2b3" fontSize="12" textAnchor="middle">Jan</text>
              <text x="154" y="190" fill="#98a2b3" fontSize="12" textAnchor="middle">Feb</text>
              <text x="224" y="190" fill="#98a2b3" fontSize="12" textAnchor="middle">Mar</text>
              <text x="294" y="190" fill="#98a2b3" fontSize="12" textAnchor="middle">Apr</text>
              <text x="364" y="190" fill="#98a2b3" fontSize="12" textAnchor="middle">May</text>
              <text x="434" y="190" fill="#98a2b3" fontSize="12" textAnchor="middle">Jun</text>
            </svg>
          </div>
        </div>

        {/* Top Right: Status Distribution */}
        <div className="lab-card-panel">
          <div className="panel-header-row">
            <h3>Status Distribution</h3>
          </div>
          <div className="progress-list">
            <div className="progress-item">
              <div className="progress-label-row">
                <div className="progress-label-left">
                  <span className="bullet-dot" style={{ background: "#12b76a" }}></span>
                  <span>Completed</span>
                </div>
                <span>{getStatusCount("COMPLETED")} ({getStatusPercent("COMPLETED")}%)</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${getStatusPercent("COMPLETED")}%`, background: "#12b76a" }}></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-label-row">
                <div className="progress-label-left">
                  <span className="bullet-dot" style={{ background: "#f38020" }}></span>
                  <span>Pending</span>
                </div>
                <span>{getStatusCount("PENDING")} ({getStatusPercent("PENDING")}%)</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${getStatusPercent("PENDING")}%`, background: "#f38020" }}></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-label-row">
                <div className="progress-label-left">
                  <span className="bullet-dot" style={{ background: "#aa3bff" }}></span>
                  <span>Draft</span>
                </div>
                <span>{getStatusCount("DRAFT")} ({getStatusPercent("DRAFT")}%)</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${getStatusPercent("DRAFT")}%`, background: "#aa3bff" }}></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-label-row">
                <div className="progress-label-left">
                  <span className="bullet-dot" style={{ background: "#f04438" }}></span>
                  <span>Cancelled</span>
                </div>
                <span>{getStatusCount("CANCELLED")} ({getStatusPercent("CANCELLED")}%)</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${getStatusPercent("CANCELLED")}%`, background: "#f04438" }}></div>
              </div>
            </div>

            <p className="progress-footer-note">
              * Distribution reflects current billing cycle data only.
            </p>
          </div>
        </div>

        {/* Bottom Left: Throughput by Test */}
        <div className="lab-card-panel">
          <div className="panel-header-row">
            <h3>Throughput by Test</h3>
            <span className="view-all-link">View All</span>
          </div>
          <div className="throughput-list">
            {loading ? (
              <div>Loading...</div>
            ) : !stats || !stats.records_by_test_type || stats.records_by_test_type.length === 0 ? (
              <>
                <div className="throughput-item">
                  <div className="throughput-icon" style={{ background: "#eff6ff", color: "var(--accent)" }}>🧪</div>
                  <div className="throughput-details">
                    <div className="throughput-label-row">
                      <span>Sugar Test</span>
                      <span>20</span>
                    </div>
                    <div className="throughput-bar-bg">
                      <div className="throughput-bar-fill" style={{ width: "100%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="throughput-item">
                  <div className="throughput-icon" style={{ background: "#fef2f2", color: "#f04438" }}>❤️</div>
                  <div className="throughput-details">
                    <div className="throughput-label-row">
                      <span>BP Test</span>
                      <span>15</span>
                    </div>
                    <div className="throughput-bar-bg">
                      <div className="throughput-bar-fill" style={{ width: "75%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="throughput-item">
                  <div className="throughput-icon" style={{ background: "#fdf2fa", color: "#aa3bff" }}>🩸</div>
                  <div className="throughput-details">
                    <div className="throughput-label-row">
                      <span>Lipid Profile</span>
                      <span>10</span>
                    </div>
                    <div className="throughput-bar-bg">
                      <div className="throughput-bar-fill" style={{ width: "50%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="throughput-item">
                  <div className="throughput-icon" style={{ background: "#f0fdf4", color: "#12b76a" }}>🔬</div>
                  <div className="throughput-details">
                    <div className="throughput-label-row">
                      <span>Hormone Panel</span>
                      <span>5</span>
                    </div>
                    <div className="throughput-bar-bg">
                      <div className="throughput-bar-fill" style={{ width: "25%" }}></div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              stats.records_by_test_type.map((item) => {
                const max = getThroughputMax();
                const pct = Math.round((item.count / max) * 100);
                return (
                  <div className="throughput-item" key={item.id}>
                    <div className="throughput-icon" style={{ background: "#f8fafc", color: "var(--text)" }}>📋</div>
                    <div className="throughput-details">
                      <div className="throughput-label-row">
                        <span>{item.name}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="throughput-bar-bg">
                        <div className="throughput-bar-fill" style={{ width: `${pct}%`, background: "var(--text)" }}></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Right: Recent Lab Activity */}
        <div className="lab-card-panel">
          <div className="panel-header-row">
            <h3>Recent Lab Activity</h3>
            <span className="view-all-link">View History</span>
          </div>
          <div className="table-wrap-new">
            <table className="staff-table-new" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px" }}>Record ID</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Test Type</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Patient</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Timestamp</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Loading...</td>
                  </tr>
                ) : !stats || !stats.recent_records || stats.recent_records.length === 0 ? (
                  <>
                    <tr>
                      <td style={{ padding: "10px", fontWeight: "600" }}>#LAB-9402</td>
                      <td style={{ padding: "10px" }}>Sugar Test</td>
                      <td style={{ padding: "10px" }}>Elena Rodriguez</td>
                      <td style={{ padding: "10px", color: "var(--text-3)" }}>10:45 AM Today</td>
                      <td style={{ padding: "10px" }}>
                        <span className="status-badge-new active"><span className="status-dot"></span>Completed</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px", fontWeight: "600" }}>#LAB-9401</td>
                      <td style={{ padding: "10px" }}>Hormone Panel</td>
                      <td style={{ padding: "10px" }}>Jameson Lee</td>
                      <td style={{ padding: "10px", color: "var(--text-3)" }}>09:12 AM Today</td>
                      <td style={{ padding: "10px" }}>
                        <span className="status-badge-new" style={{ background: "#fef3c7", color: "#d97706" }}><span className="status-dot" style={{ background: "#d97706" }}></span>Pending</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px", fontWeight: "600" }}>#LAB-9398</td>
                      <td style={{ padding: "10px" }}>BP Test</td>
                      <td style={{ padding: "10px" }}>Sarah Miller</td>
                      <td style={{ padding: "10px", color: "var(--text-3)" }}>Yesterday</td>
                      <td style={{ padding: "10px" }}>
                        <span className="status-badge-new active"><span className="status-dot"></span>Completed</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px", fontWeight: "600" }}>#LAB-9395</td>
                      <td style={{ padding: "10px" }}>Lipid Profile</td>
                      <td style={{ padding: "10px" }}>Michael Chen</td>
                      <td style={{ padding: "10px", color: "var(--text-3)" }}>Yesterday</td>
                      <td style={{ padding: "10px" }}>
                        <span className="status-badge-new" style={{ background: "#f3f4f6", color: "#6b7280" }}><span className="status-dot" style={{ background: "#6b7280" }}></span>Draft</span>
                      </td>
                    </tr>
                  </>
                ) : (
                  stats.recent_records.slice(0, 4).map((rec) => (
                    <tr key={rec.id}>
                      <td style={{ padding: "10px", fontWeight: "600" }}>#LAB-{rec.id}</td>
                      <td style={{ padding: "10px" }}>{rec.test_type_name}</td>
                      <td style={{ padding: "10px" }}>{rec.patient_name || `Patient #${rec.patient}`}</td>
                      <td style={{ padding: "10px", color: "var(--text-3)", fontSize: "12px" }}>{formatTimestamp(rec.created_at || rec.test_date)}</td>
                      <td style={{ padding: "10px" }}>
                        <span 
                          className="status-badge-new" 
                          style={{
                            background: rec.status === "COMPLETED" ? "#ecfdf3" : rec.status === "PENDING" ? "#fef3c7" : "#f3f4f6",
                            color: rec.status === "COMPLETED" ? "#027a48" : rec.status === "PENDING" ? "#d97706" : "#6b7280"
                          }}
                        >
                          <span 
                            className="status-dot"
                            style={{
                              background: rec.status === "COMPLETED" ? "#027a48" : rec.status === "PENDING" ? "#d97706" : "#6b7280"
                            }}
                          ></span>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
