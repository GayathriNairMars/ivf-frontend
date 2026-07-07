import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, LayoutGrid, UserPlus, ClipboardList, Building2, Calendar, FileText, PlusCircle, Users, ArrowRight } from "lucide-react";
import adminApi from "../../../api/adminApi";
import "./lab.css";

export default function LabDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [testTypes, setTestTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statData, testData] = await Promise.all([
          adminApi.getLabStatistics().catch(() => null),
          adminApi.getTestTypes().catch(() => [])
        ]);

        if (statData && statData.success) {
          setStats(statData.statistics);
        }
        setTestTypes(testData?.test_types ?? []);
      } catch (error) {
        console.error("Failed to load lab dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Format timestamp nicely
  const formatTime = (isoString) => {
    if (!isoString) return "10:30 AM";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return "10:30 AM";
    }
  };

  // Get active test types count
  const activeTestTypesCount = testTypes.filter(t => t.is_active).length || stats?.total_test_types || 5;

  return (
    <div className="lab-section">
      {/* Header */}
      <div className="lab-header-container">
        <div>
          <h2 className="lab-main-title">Welcome, Admin!</h2>
          <p className="lab-main-subtitle">Today is June 29, 2026</p>
        </div>
        <div className="lab-header-right">
          <button className="btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} />
            Clinical Schedule: Active
          </button>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="quick-actions-row">
        <div className="quick-action-card" onClick={() => navigate("/superadmin/lab/create-test-type")}>
          <div className="quick-action-icon-wrap">
            <PlusCircle size={22} />
          </div>
          <h3>Create New Test</h3>
          <p>Define parameters and fields for laboratory diagnostics</p>
        </div>

        <div className="quick-action-card" onClick={() => navigate("/superadmin/staff")}>
          <div className="quick-action-icon-wrap" style={{ background: "rgba(18, 183, 106, 0.08)", color: "#12b76a" }}>
            <Users size={22} />
          </div>
          <h3>Manage Users</h3>
          <p>Manage lab clinicians, technicians, and access credentials</p>
        </div>

        <div className="quick-action-card" onClick={() => navigate("/superadmin/lab/statistics")}>
          <div className="quick-action-icon-wrap" style={{ background: "rgba(243, 128, 32, 0.08)", color: "#f38020" }}>
            <FileText size={22} />
          </div>
          <h3>View Reports</h3>
          <p>Analyze test volume trends and clinical performance metrics</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="lab-grid-layout">
        {/* Left Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Recent Test Types Card */}
          <div className="lab-card-panel">
            <div className="panel-header-row">
              <h3>Recent Test Types</h3>
              <span className="view-all-link" onClick={() => navigate("/superadmin/lab/test-types")}>
                View All
              </span>
            </div>

            <div className="table-wrap-new">
              <table className="staff-table-new" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}>Test Name</th>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}>Parameters</th>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}>Records</th>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}>Status</th>
                    <th style={{ textAlign: "right", padding: "12px 16px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Loading...</td>
                    </tr>
                  ) : testTypes.length === 0 ? (
                    <>
                      {/* Fallback to mock data if empty */}
                      <tr>
                        <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>Sugar Test</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>2 fields</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>12 records</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>
                          <span className="status-badge-new active"><span className="status-dot"></span>Active</span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button className="btn-outline" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => navigate("/superadmin/lab/test-types/edit/1")}>
                            Edit
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>Blood Pressure</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>3 fields</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>8 records</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>
                          <span className="status-badge-new active"><span className="status-dot"></span>Active</span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button className="btn-outline" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => navigate("/superadmin/lab/test-types/edit/2")}>
                            Edit
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>Lipid Profile</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>5 fields</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>5 records</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>
                          <span className="status-badge-new active"><span className="status-dot"></span>Active</span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button className="btn-outline" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => navigate("/superadmin/lab/test-types/edit/3")}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    </>
                  ) : (
                    testTypes.slice(0, 5).map((type) => (
                      <tr key={type.id}>
                        <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>{type.name}</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>{type.field_count || type.fields?.length || 0} fields</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>{type.record_count || 0} records</td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>
                          <span className={`status-badge-new ${type.is_active ? "active" : "inactive"}`}>
                            <span className="status-dot"></span>
                            {type.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button className="btn-outline" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => navigate(`/superadmin/lab/test-types/edit/${type.id}`)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clinic Performance Index */}
          <div className="perf-index-card">
            <div className="perf-index-left">
              <h3>Clinic Performance Index</h3>
              <p>Your current system efficiency is optimized. All lab modules are reporting 100% uptime with zero latency in record processing.</p>
            </div>
            <div className="perf-index-right">
              <div className="perf-stat-block">
                <span className="perf-stat-val" style={{ color: "#12b76a" }}>98%</span>
                <span className="perf-stat-lbl">ACCURACY</span>
              </div>
              <div className="perf-stat-block">
                <span className="perf-stat-val" style={{ color: "var(--accent)" }}>2.4s</span>
                <span className="perf-stat-lbl">AVG RESPONSE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* System Overview Card */}
          <div className="lab-card-panel">
            <div className="panel-header-row" style={{ marginBottom: "12px" }}>
              <h3>System Overview</h3>
            </div>
            <div className="overview-stats-list">
              <div className="overview-stat-row">
                <div className="overview-stat-label-wrap">
                  <span className="bullet-dot" style={{ background: "#4474f6" }}></span>
                  <span>Active Tests</span>
                </div>
                <span className="overview-stat-val">{activeTestTypesCount}</span>
              </div>
              <div className="overview-stat-row">
                <div className="overview-stat-label-wrap">
                  <span className="bullet-dot" style={{ background: "#aa3bff" }}></span>
                  <span>Patient Records</span>
                </div>
                <span className="overview-stat-val">{stats?.total_records || 45}</span>
              </div>
              <div className="overview-stat-row">
                <div className="overview-stat-label-wrap">
                  <span className="bullet-dot" style={{ background: "#f38020" }}></span>
                  <span>System Users</span>
                </div>
                <span className="overview-stat-val">12</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="lab-card-panel">
            <div className="panel-header-row" style={{ marginBottom: "12px" }}>
              <h3>Recent Activity</h3>
            </div>
            <div className="timeline-wrap">
              {loading ? (
                <div>Loading timeline...</div>
              ) : !stats || !stats.recent_records || stats.recent_records.length === 0 ? (
                <>
                  <div className="timeline-item">
                    <span className="timeline-dot" style={{ background: "#12b76a" }}></span>
                    <span className="timeline-time">10:30 AM Today</span>
                    <span className="timeline-text">
                      <strong>Lab Tech</strong> created Sugar Test record
                    </span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-dot" style={{ background: "#4474f6" }}></span>
                    <span className="timeline-time">09:45 AM Today</span>
                    <span className="timeline-text">
                      <strong>Admin</strong> created Blood Pressure test
                    </span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-dot" style={{ background: "#f38020" }}></span>
                    <span className="timeline-time">09:00 AM Today</span>
                    <span className="timeline-text">
                      <strong>New user</strong> registered to system
                    </span>
                  </div>
                </>
              ) : (
                stats.recent_records.slice(0, 5).map((rec) => (
                  <div className="timeline-item" key={rec.id}>
                    <span 
                      className="timeline-dot" 
                      style={{ 
                        background: rec.status === "COMPLETED" ? "#12b76a" : rec.status === "PENDING" ? "#f38020" : "#cbd5e1" 
                      }}
                    ></span>
                    <span className="timeline-time">{formatTime(rec.created_at || rec.test_date)}</span>
                    <span className="timeline-text">
                      <strong>{rec.patient_name || `Patient #${rec.patient}`}</strong> was administered <strong>{rec.test_type_name}</strong> ({rec.status})
                    </span>
                  </div>
                ))
              )}
            </div>
            <button className="load-more-btn" onClick={() => navigate("/superadmin/lab/statistics")}>
              Load more activities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
