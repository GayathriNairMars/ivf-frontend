import React, { useState, useEffect, useRef } from "react";
import { listStoredSamples, deleteStoredSample } from "../../api/cryoApi";
import "./cryo_stored_samples_list.css";
import {
  Search, SlidersHorizontal, Download, MoreVertical,
  Eye, Trash2, AlertTriangle, Info, CheckCircle, Snowflake
} from "lucide-react";

const ITEMS_PER_PAGE = 8;

export default function CryoStoredSamplesList({ onViewSample }) {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtering & Search
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTank, setFilterTank] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Active Dropdown Menu
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Toast
  const [toast, setToast] = useState(null);

  const triggerToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      if (filterTank) params.tank = filterTank;

      const res = await listStoredSamples(params);
      const data = res.data;
      setSamples(Array.isArray(data) ? data : (data.results || data.data || []));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load stored samples. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchSamples();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, filterType, filterStatus, filterTank]);

  // Close active menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle deletion
  const handleDelete = async (id, sampleId) => {
    if (window.confirm(`Are you sure you want to delete sample "${sampleId}"? This action cannot be undone.`)) {
      try {
        await deleteStoredSample(id);
        triggerToast(`Sample "${sampleId}" deleted successfully.`);
        fetchSamples();
      } catch (err) {
        console.error(err);
        const detail = err?.response?.data?.detail || "Failed to delete sample.";
        triggerToast(detail, "error");
      }
    }
  };

  // Metrics
  const totalSamples = samples.length;
  const storedCount = samples.filter(s =>
    (s.status || "").toUpperCase() === "STORED" || (s.status || "").toUpperCase() === "IN_STORAGE"
  ).length;
  const thawedCount = samples.filter(s =>
    (s.status || "").toUpperCase() === "THAWED" || (s.status || "").toUpperCase() === "DISPOSED"
  ).length;
  const expiredCount = samples.filter(s =>
    ["EXPIRED", "REVIEW", "USED"].includes((s.status || "").toUpperCase())
  ).length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(samples.length / ITEMS_PER_PAGE));
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSamples = samples.slice(startIdx, startIdx + ITEMS_PER_PAGE);


  // Helper: format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }) +
      "\n" + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  // Helper: build location string
  const getFullLocation = (s) => {
    return s.full_location || "";
  };

  // Helper: status class
  const getStatusClass = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "STORED" || s === "IN_STORAGE") return "stored";
    if (s === "THAWED" || s === "DISPOSED") return "thawed";
    if (s === "USED") return "used";
    if (s === "EXPIRED" || s === "REVIEW") return "expired";
    return "stored";
  };

  // Helper: status label
  const getStatusLabel = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "STORED" || s === "IN_STORAGE") return "Stored";
    if (s === "THAWED") return "Thawed";
    if (s === "DISPOSED") return "Disposed";
    if (s === "USED") return "Used";
    if (s === "EXPIRED") return "Expired";
    if (s === "REVIEW") return "Review";
    return status || "Stored";
  };

  // Helper: type badge class
  const getTypeBadgeClass = (type) => {
    const t = (type || "").toUpperCase();
    if (t === "SPERM") return "sperm";
    if (t === "EMBRYO") return "embryo";
    if (t === "EGG" || t === "OOCYTE") return "egg";
    return "sperm";
  };

  // Helper: type label
  const getTypeLabel = (type) => {
    const t = (type || "").toUpperCase();
    if (t === "SPERM") return "Sperm";
    if (t === "EMBRYO") return "Embryo";
    if (t === "EGG") return "Egg";
    if (t === "OOCYTE") return "Oocyte";
    return type || "—";
  };

  // Helper: sample ID display
  const getSampleDisplayId = (s) => {
    return s.sample_id || s.display_id || `SAMPLE-${String(s.id).padStart(3, "0")}`;
  };

  // Helper: patient name
  const getPatientName = (s) => {
    if (s.patient_name) return s.patient_name;
    if (s.patient?.user?.full_name) return s.patient.user.full_name;
    if (s.patient?.full_name) return s.patient.full_name;
    return "—";
  };

  // Export CSV
  const handleExportCSV = () => {
    if (samples.length === 0) {
      triggerToast("No data to export.", "error");
      return;
    }
    const headers = ["Sample ID", "Patient Name", "Type", "Status", "Location", "Last Update"];
    const rows = samples.map(s => [
      getSampleDisplayId(s),
      getPatientName(s),
      getTypeLabel(s.sample_type),
      getStatusLabel(s.status),
      getFullLocation(s),
      s.updated_at || s.created_at || ""
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stored_samples_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    triggerToast("CSV exported successfully.");
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setFilterType("");
    setFilterStatus("");
    setFilterTank("");
    setShowFilters(false);
  };

  // Unique tanks for tank filter dropdown
  const uniqueTanks = [...new Set(samples.map(s => s.tank_name || s.tank?.name).filter(Boolean))];

  return (
    <div className="samples-list-container">
      {/* Topbar */}
      <div className="samples-list-topbar">
        <h1 className="samples-list-main-title">CryoLab Systems</h1>
        <div className="samples-search-wrapper">
          <Search size={16} className="samples-search-icon" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Header */}
      <div className="samples-list-header">
        <div>
          <h2>Stored Samples</h2>
          <p>Manage and monitor all cryopreserved biological samples across storage infrastructure.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="samples-metrics-grid">
        <div className="samples-metric-card total">
          <div className="smc-top-row">
            <span className="smc-label">Total Samples</span>
            <span className="smc-badge up">↑ Active</span>
          </div>
          <div className="smc-value-row">
            <span className="smc-value">{totalSamples}</span>
            <span className="smc-unit">units</span>
          </div>
        </div>

        <div className="samples-metric-card stored">
          <div className="smc-top-row">
            <span className="smc-label">Currently Stored</span>
            <span className="smc-badge stable">✓ Stable</span>
          </div>
          <div className="smc-value-row">
            <span className="smc-value">{storedCount}</span>
            <span className="smc-unit">units</span>
          </div>
        </div>

        <div className="samples-metric-card thawed">
          <div className="smc-top-row">
            <span className="smc-label">Thawed</span>
            <span className="smc-badge active">△ Active</span>
          </div>
          <div className="smc-value-row">
            <span className="smc-value">{thawedCount}</span>
            <span className="smc-unit">units</span>
          </div>
        </div>

        <div className="samples-metric-card expired">
          <div className="smc-top-row">
            <span className="smc-label">Expired / Review</span>
            <span className="smc-badge critical">! Critical</span>
          </div>
          <div className="smc-value-row">
            <span className="smc-value">{expiredCount}</span>
            <span className="smc-unit">units</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="samples-filter-bar">
        <div className="samples-filter-left">
          <button
            className={`samples-filter-toggle ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={14} />
            Advanced Filters
          </button>

          {showFilters && (
            <>
              <select
                className="samples-filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="SPERM">Sperm</option>
                <option value="EMBRYO">Embryo</option>
                <option value="EGG">Egg</option>
                <option value="OOCYTE">Oocyte</option>
              </select>

              <select
                className="samples-filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="STORED">Stored</option>
                <option value="THAWED">Thawed</option>
                <option value="USED">Used</option>
                <option value="EXPIRED">Expired</option>
                <option value="DISPOSED">Disposed</option>
              </select>

              {uniqueTanks.length > 0 && (
                <select
                  className="samples-filter-select"
                  value={filterTank}
                  onChange={(e) => setFilterTank(e.target.value)}
                >
                  <option value="">All Tanks</option>
                  {uniqueTanks.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
            </>
          )}

          {(filterType || filterStatus || filterTank) && (
            <button className="samples-clear-btn" onClick={clearFilters}>
              Clear All
            </button>
          )}
        </div>

        <div className="samples-filter-right">
          <button className="samples-export-btn" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="samples-table-wrapper">
        {loading ? (
          <div className="samples-list-loader">
            <div className="spinner" />
            <p>Fetching stored samples data...</p>
          </div>
        ) : error ? (
          <div className="samples-list-error">
            <AlertTriangle size={32} />
            <p>{error}</p>
            <button className="samples-retry-btn" onClick={fetchSamples}>Retry</button>
          </div>
        ) : samples.length === 0 ? (
          <div className="samples-list-empty">
            <Info size={32} />
            <p>No stored samples found matching the selected criteria.</p>
          </div>
        ) : (
          <>
            <table className="samples-table">
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>Patient Name</th>
                  <th>Type</th>
                  <th>Location (Tank→Rack→Box→Slot)</th>
                  <th>Status</th>
                  <th>Days In Storage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSamples.map((sample) => {

                  return (
                    <tr key={sample.id}>
                      <td>
                        <div className="sample-id-cell" onClick={() => onViewSample(sample.id)}>
                          <span className="sample-id-text">{getSampleDisplayId(sample)}</span>
                        </div>
                      </td>
                      <td>
                        <span className="patient-name-cell">{getPatientName(sample)}</span>
                      </td>
                      <td>
                        <span className={`sample-type-badge ${getTypeBadgeClass(sample.sample_type)}`}>
                          {getTypeLabel(sample.sample_type)}
                        </span>
                      </td>
                      <td>
                        <span className="sample-location-text">
                          {getFullLocation(sample)}
                        </span>
                      </td>
                      <td>
                        <span className={`sample-status-badge ${getStatusClass(sample.status)}`}>
                          {getStatusLabel(sample.status)}
                        </span>
                      </td>
                      <td>
                        <span className="sample-date-text">
                          {sample.days_in_storage || ""}
                        </span>
                      </td>
                      <td className="samples-actions-cell">
                        <button
                          className="samples-action-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === sample.id ? null : sample.id);
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuId === sample.id && (
                          <div className="samples-action-menu" ref={menuRef}>
                            <button onClick={() => { onViewSample(sample.id); setActiveMenuId(null); }}>
                              <Eye size={14} /> View Details
                            </button>
                            <button
                              className="delete-action"
                              onClick={() => { handleDelete(sample.id, getSampleDisplayId(sample)); setActiveMenuId(null); }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="samples-pagination-bar">
              <span className="samples-page-info">
                Showing {startIdx + 1} to {Math.min(startIdx + ITEMS_PER_PAGE, samples.length)} of {samples.length} entries
              </span>
              <div className="samples-page-buttons">
                <button
                  className="samples-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`samples-page-btn ${currentPage === pageNum ? "active" : ""}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="samples-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Panels */}
      <div className="samples-footer-panels">
        {/* Capacity Panel */}
        <div className="samples-footer-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Storage Capacity Optimization</h3>
            <span className="scan-timer">Next Scan: 14 mins</span>
          </div>
          <div className="capacity-bars">
            {[
              { label: "Tank A", pct: 45, cls: "low" },
              { label: "Tank B", pct: 72, cls: "high" },
              { label: "Tank C", pct: 58, cls: "medium" },
              { label: "Tank D", pct: 91, cls: "critical" },
              { label: "Tank E", pct: 33, cls: "low" },
            ].map((bar) => (
              <div key={bar.label} className="capacity-bar-item">
                <div className="capacity-bar-track">
                  <div
                    className={`capacity-bar-fill ${bar.cls}`}
                    style={{ height: `${bar.pct}%` }}
                  />
                </div>
                <span className="capacity-bar-label">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integrity Panel */}
        <div className="samples-footer-panel">
          <h3>Cryo Integrity Status</h3>
          <div className="integrity-item">
            <span className="integrity-label">Liquid Nitrogen Level</span>
            <span className="integrity-value">94%</span>
          </div>
          <div className="integrity-bar-track">
            <div className="integrity-bar-fill good" style={{ width: "94%" }} />
          </div>

          <div className="integrity-item">
            <span className="integrity-label">System Pressure</span>
            <span className="integrity-value">1.2 Bar</span>
          </div>
          <div className="integrity-bar-track">
            <div className="integrity-bar-fill good" style={{ width: "78%" }} />
          </div>

          <div className="integrity-status-ok">
            <CheckCircle size={14} /> All Systems Normal
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`samples-toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
