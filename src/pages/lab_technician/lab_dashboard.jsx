import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  FileText,
  Activity,
  AlertTriangle,
  Database,
  Gauge,
  Calendar,
  Droplet,
  Heart,
  Shield,
  MoreVertical,
} from "lucide-react";

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
          labApi.getStatistics().catch((error) => {
            console.error("Statistics API error:", error);
            return null;
          }),

          labApi.getRecentRecords({ limit: 5 }).catch((error) => {
            console.error("Recent records API error:", error);
            return null;
          }),
        ]);

        // Statistics - API only
        if (statData?.success) {
          setStats(statData.statistics);
        } else {
          setStats(null);
        }

        // Recent records - API only
        if (recData?.success) {
          setRecords(recData.records || []);
        } else {
          setRecords([]);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setStats(null);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return "—";

    try {
      const date = new Date(isoString);

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "—";
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === "COMPLETED") return "lab-badge-success";
    if (status === "PENDING" || status === "ORDERED") {
      return "lab-badge-warning";
    }
    if (status === "DRAFT" || status === "CANCELLED") {
      return "lab-badge-danger";
    }
    if (status === "IN_PROGRESS") return "lab-badge-info";

    return "lab-badge-info";
  };

  const getStatusDisplay = (status) => {
    if (!status) return "—";

    if (status === "IN_PROGRESS") return "In Progress";

    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getTestIcon = (testTypeName = "") => {
    const name = testTypeName.toLowerCase();

    if (name.includes("sugar")) {
      return <Droplet size={14} />;
    }

    if (name.includes("pressure") || name.includes("bp")) {
      return <Heart size={14} />;
    }

    if (name.includes("lipid") || name.includes("hormone")) {
      return <FlaskConical size={14} />;
    }

    return <FileText size={14} />;
  };


  /*
   * ============================================================
   * BOTTOM CHART DATA
   * ============================================================
   *
   * The API test_types response contains:
   *
   * {
   *   name: "Lipid profile",
   *   record_count: 10
   * }
   *
   * Therefore we use record_count directly.
   */

  const testVolumeData = (testTypes || [])
    .filter((test) => test.is_active !== false)
    .map((test) => ({
      name: test.name,
      count: Number(test.record_count || 0),
    }))
    .filter((test) => test.count > 0);


  /*
   * Find the largest test count.
   *
   * We use this only to calculate the visual height
   * of each bar. We are NOT creating data.
   */
  const maxTestCount =
    testVolumeData.length > 0
      ? Math.max(...testVolumeData.map((item) => item.count))
      : 0;


  /*
   * ============================================================
   * TEST STATUS DATA
   * ============================================================
   *
   * This comes from the statistics API:
   *
   * stats.records_by_status
   *
   * Example:
   * {
   *   ORDERED: 22,
   *   IN_PROGRESS: 1,
   *   COMPLETED: 7,
   *   CANCELLED: 2
   * }
   */

  const statusData = Object.entries(
    stats?.records_by_status || {}
  )
    .map(([status, count]) => ({
      status,
      label: getStatusDisplay(status),
      count: Number(count || 0),
    }))
    .filter((item) => item.count > 0);


  /*
   * Find largest status count for visual bar scaling.
   */
  const maxStatusCount =
    statusData.length > 0
      ? Math.max(...statusData.map((item) => item.count))
      : 0;


  /*
   * Status color class
   */
  const getStatusBarClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "completed";

      case "ORDERED":
      case "PENDING":
        return "ordered";

      case "IN_PROGRESS":
        return "progress";

      case "CANCELLED":
        return "cancelled";

      case "DRAFT":
        return "draft";

      default:
        return "default";
    }
  };


  return (
    <div className="lab-dashboard-content">

      {/* ================================
          Upper Welcome Header
      ================================= */}

      <div className="lab-dashboard-header">
        <div>
          <h2>Welcome, Lab Technician!</h2>

          <p>
            Monitoring precision for patient care
          </p>
        </div>

        <button className="lab-status-online-btn">
          <Calendar size={16} />
          Status: Online
        </button>
      </div>


      {/* ================================
          KPI Stats Row
      ================================= */}

      <div className="lab-kpi-row">

        <div className="lab-kpi-card">
          <div className="lab-kpi-left">

            <span className="lab-kpi-lbl">
              Total Records Processed
            </span>

            <span className="lab-kpi-val">
              {stats?.total_records ?? "—"}
            </span>

          </div>

          <div className="lab-kpi-icon teal-bg">
            <Database size={22} />
          </div>
        </div>


        <div className="lab-kpi-card">
          <div className="lab-kpi-left">

            <span className="lab-kpi-lbl">
              Today's Throughput
            </span>

            <span className="lab-kpi-val">
              {stats?.today_records ?? "—"}
            </span>

          </div>

          <div className="lab-kpi-icon teal-bg">
            <Gauge size={22} />
          </div>
        </div>


        <div className="lab-kpi-card">
          <div className="lab-kpi-left">

            <span className="lab-kpi-lbl">
              High-Priority Alerts
            </span>

            <span className="lab-kpi-val red-text">
              {stats?.high_priority_alerts ?? "—"}
            </span>

          </div>

          <div className="lab-kpi-icon red-bg">
            <AlertTriangle size={22} />
          </div>
        </div>

      </div>


      {/* ================================
          Two Column Layout
      ================================= */}

      <div className="lab-two-column-layout">

        {/* Left Side */}
        <div className="lab-left-actions-col">

          {/* Quick Actions */}
          <div className="lab-action-panel">

            <h4 className="lab-panel-title">
              QUICK ACTIONS
            </h4>

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


          {/* Test Type Access */}
          <div className="lab-action-panel">

            <h4 className="lab-panel-title">
              TEST TYPE ACCESS
            </h4>

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


        {/* Right Side */}
        <div className="lab-right-activity-col">

          <div className="lab-activity-panel">

            <div className="lab-activity-header">

              <h3>
                RECENT TEST ACTIVITY
              </h3>

              <a
                href="#records"
                className="lab-view-all-link"
              >
                View All Records
              </a>

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
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "30px",
                        color: "#6b7280",
                      }}
                    >
                      Loading activity...
                    </td>
                  </tr>

                ) : records.length === 0 ? (

                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "30px",
                        color: "#6b7280",
                      }}
                    >
                      No recent activities recorded.
                    </td>
                  </tr>

                ) : (

                  records.slice(0, 8).map((rec) => (

                    <tr key={rec.id}>

                      <td className="lab-time-cell">
                        {formatTime(rec.test_date)}
                      </td>

                      <td className="lab-patient-cell">
                        {rec.patient_name ||
                          `Patient #${rec.patient}`}
                      </td>

                      <td className="lab-type-cell">

                        <span className="lab-type-icon-wrapper">

                          {getTestIcon(
                            rec.test_type_name
                          )}

                          {rec.test_type_name || "—"}

                        </span>

                      </td>

                      <td className="lab-result-cell">
                        {rec.result || "—"}
                      </td>

                      <td>

                        <span
                          className={`lab-badge ${getStatusBadgeClass(
                            rec.status
                          )}`}
                        >
                          {getStatusDisplay(rec.status)}
                        </span>

                      </td>

                      <td>

                        <button
                          className="lab-more-btn"
                          onClick={() =>
                            onViewRecord?.(rec)
                          }
                        >
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


      {/* =====================================================
          BOTTOM ROW - REAL API DATA
      ====================================================== */}

      <div className="lab-charts-row">


        {/* =================================================
            LEFT: TEST VOLUME BY TYPE
        ================================================== */}

        <div className="lab-chart-card">

          <div className="lab-chart-header">

            <div>

              <h4>
                TEST VOLUME BY TYPE
              </h4>

              <p>
                Laboratory records by test type
              </p>

            </div>

            <Activity
              size={18}
              style={{ color: "#9ca3af" }}
            />

          </div>


          <div className="lab-bar-chart-container">

            {testVolumeData.length === 0 ? (

              <div className="lab-chart-empty">
                No test volume data available
              </div>

            ) : (

              testVolumeData.map((test) => {

                /*
                 * Convert actual count to a visual height.
                 *
                 * Example:
                 * max = 14
                 * Lipid = 10
                 *
                 * height = 10 / 14 * 100
                 *
                 * The DATA remains 10.
                 * Only the visual height is calculated.
                 */

                const height =
                  maxTestCount > 0
                    ? Math.max(
                        (test.count / maxTestCount) * 100,
                        8
                      )
                    : 0;

                return (
                  <div
                    className="lab-bar-group"
                    key={test.name}
                  >

                    <span className="lab-bar-value">
                      {test.count}
                    </span>

                    <div
                      className={`lab-bar ${
                        test.count === maxTestCount
                          ? "highlighted"
                          : ""
                      }`}
                      style={{
                        height: `${height}%`,
                      }}
                      title={`${test.name}: ${test.count} records`}
                    />

                    <span className="lab-bar-label">
                      {test.name}
                    </span>

                  </div>
                );
              })

            )}

          </div>

        </div>


        {/* =================================================
            RIGHT: TEST STATUS OVERVIEW
        ================================================== */}

        <div className="lab-chart-card">

          <div className="lab-chart-header">

            <div>

              <h4>
                TEST STATUS OVERVIEW
              </h4>

              <p>
                Current laboratory workload
              </p>

            </div>

          </div>


          <div className="lab-status-chart">

            {statusData.length === 0 ? (

              <div className="lab-chart-empty">
                No status data available
              </div>

            ) : (

              statusData.map((item) => {

                const width =
                  maxStatusCount > 0
                    ? Math.max(
                        (item.count / maxStatusCount) * 100,
                        5
                      )
                    : 0;

                return (
                  <div
                    className="lab-status-row"
                    key={item.status}
                  >

                    <div className="lab-status-info">

                      <span>
                        {item.label}
                      </span>

                      <strong>
                        {item.count}
                      </strong>

                    </div>


                    <div className="lab-status-track">

                      <div
                        className={`lab-status-fill ${getStatusBarClass(
                          item.status
                        )}`}
                        style={{
                          width: `${width}%`,
                        }}
                      />

                    </div>

                  </div>
                );

              })

            )}

          </div>

        </div>

      </div>

    </div>
  );
}