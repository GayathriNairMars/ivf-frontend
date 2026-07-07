import React, { useState, useEffect } from "react";
import { FlaskConical, FileText, Activity, AlertTriangle, Database, Gauge, Calendar, Droplet, Heart, Shield, HelpCircle, MoreVertical, Eye } from "lucide-react";
import labApi from "../../api/labApi";
import "./lab_dashboard.css";

export default function LabDashboard({ testTypes = [], onViewRecord }) {
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statData, recData] = await Promise.all([
          labApi.getStatistics().catch(() => null),
          labApi.getRecentRecords({ limit: 5 }).catch(() => [])
        ]);

        if (statData && statData.success) {
          setStats(statData.statistics);
        } else {
          // Mock statistics fallback
          setStats({
            total_records: 45,
            total_test_types: 5,
            records_by_status: { COMPLETED: 38, PENDING: 5, DRAFT: 2, CANCELLED: 0 }
          });
        }

        if (recData && recData.success) {
          setRecords(recData.records || []);
        } else {
          // Mock recent records fallback
          setRecords([
            { id: 45, test_date: "2026-06-29T10:30:00Z", patient_name: "John Doe", test_type_name: "Sugar Test", result: "120 mg/dL", status: "COMPLETED" },
            { id: 44, test_date: "2026-06-29T11:15:00Z", patient_name: "Jane Smith", test_type_name: "BP Test", result: "140/90", status: "PENDING" },
            { id: 43, test_date: "2026-06-29T09:45:00Z", patient_name: "Robert Wilson", test_type_name: "Lipid Profile", result: "210 Total", status: "DRAFT" },
            { id: 42, test_date: "2026-06-29T09:15:00Z", patient_name: "Emily Davis", test_type_name: "Sugar Test", result: "105 mg/dL", status: "COMPLETED" }
          ]);
        }
      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

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

  const getStatusBadgeClass = (status) => {
    if (status === "COMPLETED") return "lab-badge-success";
    if (status === "PENDING") return "lab-badge-warning";
    if (status === "DRAFT") return "lab-badge-danger";
    return "lab-badge-info";
  };

  const getStatusDisplay = (status) => {
    if (status === "COMPLETED") return "Normal";
    if (status === "PENDING") return "High";
    if (status === "DRAFT") return "Borderline";
    return status;
  };

  const getTestIcon = (testTypeName) => {
    const name = testTypeName.toLowerCase();
    if (name.includes("sugar")) return <Droplet size={14} />;
    if (name.includes("pressure") || name.includes("bp")) return <Heart size={14} />;
    if (name.includes("lipid") || name.includes("hormone")) return <FlaskConical size={14} />;
    return <FileText size={14} />;
  };

  return (
    <div className="lab-dashboard-content">
      {/* Upper Welcome Header */}
      <div className="lab-dashboard-header">
        <div>
          <h2>Welcome, Lab Technician!</h2>
          <p>June 29, 2026 • Monitoring precision for patient care</p>
        </div>
        <button className="lab-status-online-btn">
          <Calendar size={16} />
          Status: Online
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="lab-kpi-row">
        <div className="lab-kpi-card">
          <div className="lab-kpi-left">
            <span className="lab-kpi-lbl">Total Records Processed</span>
            <span className="lab-kpi-val">{stats?.total_records || 45}</span>
          </div>
          <div className="lab-kpi-icon teal-bg">
            <Database size={22} />
          </div>
        </div>

        <div className="lab-kpi-card">
          <div className="lab-kpi-left">
            <span className="lab-kpi-lbl">Today's Throughput</span>
            <span className="lab-kpi-val">12</span>
          </div>
          <div className="lab-kpi-icon teal-bg">
            <Gauge size={22} />
          </div>
        </div>

        <div className="lab-kpi-card">
          <div className="lab-kpi-left">
            <span className="lab-kpi-lbl">High-Priority Alerts</span>
            <span className="lab-kpi-val red-text">8</span>
          </div>
          <div className="lab-kpi-icon red-bg">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="lab-two-column-layout">
        {/* Left Side: Actions */}
        <div className="lab-left-actions-col">
          {/* Quick Actions Panel */}
          <div className="lab-action-panel">
            <h4 className="lab-panel-title">QUICK ACTIONS</h4>
            <div className="lab-panel-buttons">
              <button className="lab-action-btn primary-action">
                <Droplet size={18} />
                New Sugar Record
              </button>
              <button className="lab-action-btn outline-action">
                <Heart size={18} />
                New BP Record
              </button>
              <button className="lab-action-btn outline-action">
                <Activity size={18} />
                View Statistics
              </button>
            </div>
          </div>

          {/* Test Type Access Panel */}
          <div className="lab-action-panel">
            <h4 className="lab-panel-title">TEST TYPE ACCESS</h4>
            <div className="lab-test-type-grid">
              <button className="lab-grid-btn">
                <Droplet size={20} />
                <span>Sugar</span>
              </button>
              <button className="lab-grid-btn">
                <Activity size={20} />
                <span>BP</span>
              </button>
              <button className="lab-grid-btn">
                <FlaskConical size={20} />
                <span>Lipid</span>
              </button>
              <button className="lab-grid-btn">
                <Shield size={20} />
                <span>Hormone</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Recent activity table */}
        <div className="lab-right-activity-col">
          <div className="lab-activity-panel">
            <div className="lab-activity-header">
              <h3>RECENT TEST ACTIVITY</h3>
              <a href="#records" className="lab-view-all-link">View All Records</a>
            </div>

            <table className="lab-activity-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient Name</th>
                  <th>Test Type</th>
                  <th>Result</th>
                  <th>Status</th>
                  <th style={{ width: "40px" }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                      Loading activity...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                      No recent activities recorded.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id}>
                      <td className="lab-time-cell">{formatTime(rec.test_date)}</td>
                      <td className="lab-patient-cell">{rec.patient_name || `Patient #${rec.patient}`}</td>
                      <td className="lab-type-cell">
                        <span className="lab-type-icon-wrapper">
                          {getTestIcon(rec.test_type_name)}
                          {rec.test_type_name}
                        </span>
                      </td>
                      <td className="lab-result-cell">{rec.result || "—"}</td>
                      <td>
                        <span className={`lab-badge ${getStatusBadgeClass(rec.status)}`}>
                          {getStatusDisplay(rec.status)}
                        </span>
                      </td>
                      <td>
                        <button className="lab-more-btn">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Row Charts */}
      <div className="lab-charts-row">
        {/* Left: Throughput Trends */}
        <div className="lab-chart-card">
          <div className="lab-chart-header">
            <div>
              <h4>THROUGHPUT TRENDS</h4>
              <p>Daily tests vs Capacity</p>
            </div>
            <Activity size={18} style={{ color: "#9ca3af" }} />
          </div>
          <div className="lab-bar-chart-container">
            <div className="lab-bar" style={{ height: "40%" }}></div>
            <div className="lab-bar" style={{ height: "65%" }}></div>
            <div className="lab-bar" style={{ height: "55%" }}></div>
            <div className="lab-bar" style={{ height: "80%" }}></div>
            <div className="lab-bar" style={{ height: "45%" }}></div>
            <div className="lab-bar highlighted" style={{ height: "90%" }}></div>
          </div>
        </div>

        {/* Right: Patient Demographics Heatmap */}
        <div className="lab-chart-card">
          <div className="lab-chart-header">
            <div>
              <h4>PATIENT DEMOGRAPHICS HEATMAP</h4>
            </div>
          </div>
          <div className="lab-heatmap-grid">
            <div className="lab-heatmap-cell bg-light"></div>
            <div className="lab-heatmap-cell bg-medium"></div>
            <div className="lab-heatmap-cell bg-dark"></div>
            <div className="lab-heatmap-cell bg-light"></div>

            <div className="lab-heatmap-cell bg-medium"></div>
            <div className="lab-heatmap-cell bg-deep"></div>
            <div className="lab-heatmap-cell bg-dark"></div>
            <div className="lab-heatmap-cell bg-medium"></div>

            <div className="lab-heatmap-cell bg-dark"></div>
            <div className="lab-heatmap-cell bg-medium"></div>
            <div className="lab-heatmap-cell bg-light"></div>
            <div className="lab-heatmap-cell bg-light"></div>

            <div className="lab-heatmap-cell bg-deep"></div>
            <div className="lab-heatmap-cell bg-medium"></div>
            <div className="lab-heatmap-cell bg-light"></div>
            <div className="lab-heatmap-cell bg-dark"></div>
          </div>
          <div className="lab-heatmap-legend">
            <span>Low Volume</span>
            <div className="legend-swatches">
              <span className="legend-swatch bg-light"></span>
              <span className="legend-swatch bg-medium"></span>
              <span className="legend-swatch bg-dark"></span>
              <span className="legend-swatch bg-deep"></span>
            </div>
            <span>High Volume</span>
          </div>
        </div>
      </div>
    </div>
  );
}
