import React, { useState, useEffect } from "react";
import { doctorApi } from "../../api/doctorApi";
import { FiSearch, FiDownload, FiPrinter, FiPlus, FiChevronLeft, FiChevronRight, FiUsers, FiActivity, FiCalendar, FiCheckCircle } from "react-icons/fi";
import "./patient_directory.css";
import { PATIENT_STATUSES,TREATMENT_TYPES } from "../../constants/constants";

const AVATAR_CLASSES = ["av-purple", "av-blue", "av-green", "av-orange", "av-pink", "av-red"];

export default function PatientDirectory({onViewPatient}) {
  const [patients, setPatients] = useState([]);
  const [statistics, setStatistics] = useState({
    total_patients: 0,
    active_treatments: 0,
    completed_treatments: 0,
    this_week_patients: 0,
    this_month_patients: 0,
    completed_today_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [treatment, setTreatment] = useState(""); // UI-only filter or custom handling
  const [lastVisitDate, setLastVisitDate] = useState("");

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await doctorApi.getPatients({
        page,
        page_size: pageSize,
        search,
        status,
        treatment,
        sort_by: sortBy
      });
      if (data.success) {
        setPatients(data.patients || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
        if (data.statistics) {
          setStatistics(data.statistics);
        }
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, status, sortBy, treatment]);

  // Handle Search Input Debounce / Submit
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      setPage(1);
      fetchPatients();
    }
  };

  const handleSearchBlur = () => {
    setPage(1);
    fetchPatients();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setSortBy("");
    setTreatment("");
    setLastVisitDate("");
    setPage(1);
    // Directly call API with cleared filters
    setLoading(true);
    doctorApi.getPatients({ page: 1, page_size: pageSize })
      .then((data) => {
        if (data.success) {
          setPatients(data.patients || []);
          setTotal(data.total || 0);
          setTotalPages(data.total_pages || 1);
        }
      })
      .finally(() => setLoading(false));
  };

  const getAvatarClass = (name) => {
    if (!name) return AVATAR_CLASSES[0];
    const code = name.charCodeAt(0);
    return AVATAR_CLASSES[code % AVATAR_CLASSES.length];
  };

  const getInitials = (name) => {
    if (!name) return "P";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusClass = (statusStr) => {
    if (!statusStr) return "inactive";
    const norm = statusStr.toLowerCase();
    if (norm.includes("act") || norm.includes("active")) return "active";
    if (norm.includes("hold") || norm.includes("hol")) return "hold";
    if (norm.includes("follow")) return "follow";
    if (norm.includes("comp")) return "completed";
    return "inactive";
  };

  return (
    <div className="pd-container">
      {/* Stats Cards Row */}
      <div className="pd-stats-row">
        <div className="pd-stat-card">
          <div className="pd-stat-icon total">
            <FiUsers />
          </div>
          <div className="pd-stat-text">
            <span className="pd-stat-label">Total Patients</span>
            <span className="pd-stat-value">{statistics.total_patients}</span>
          </div>
        </div>

        <div className="pd-stat-card">
          <div className="pd-stat-icon active">
            <FiActivity />
          </div>
          <div className="pd-stat-text">
            <span className="pd-stat-label">Active Treatments</span>
            <span className="pd-stat-value">{statistics.active_treatments}</span>
          </div>
        </div>

        <div className="pd-stat-card">
          <div className="pd-stat-icon week">
            <FiCalendar />
          </div>
          <div className="pd-stat-text">
            <span className="pd-stat-label">This Week Visits</span>
            <span className="pd-stat-value">{statistics.this_week_patients}</span>
          </div>
        </div>

        <div className="pd-stat-card">
          <div className="pd-stat-icon completed">
            <FiCheckCircle />
          </div>
          <div className="pd-stat-text">
            <span className="pd-stat-label">Completed Today</span>
            <span className="pd-stat-value">{statistics.completed_today_count}</span>
          </div>
        </div>
      </div>

      {/* Filter Options Bar */}
      <div className="pd-filter-bar">
        <div className="pd-filter-row">
          <div className="pd-filter-group search-group">
            <label>Patient Name / MRN</label>
            <div className="pd-filter-search">
              <FiSearch />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                onBlur={handleSearchBlur}
              />
            </div>
          </div>

          <div className="pd-filter-group">
            <label>Status</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              {PATIENT_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="pd-filter-group">
            <label>Treatment</label>
            <select value={treatment} onChange={(e) => {setTreatment(e.target.value); setPage(1); }}>
              <option value="">All Treatments</option>
              {TREATMENT_TYPES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="pd-filter-group">
            <label>Last Visit</label>
            <input
              type="date"
              value={lastVisitDate}
              onChange={(e) => setLastVisitDate(e.target.value)}
            />
          </div>

          <button className="pd-clear-filters" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table Wrapper */}
      <div className="pd-table-wrapper">
        <div className="pd-table-header">
          <div className="pd-table-header-left">
            <FiUsers />
            <span>Patient Records</span>
            <span className="pd-record-count">{total} Records</span>
          </div>
          <div className="pd-table-actions">
            <button title="Download PDF"><FiDownload /></button>
            <button title="Print Table"><FiPrinter /></button>
          </div>
        </div>

        {loading ? (
          <div className="pd-loading">
            <div className="pd-loading-spinner"></div>
            <p>Loading patient records...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="pd-empty-state">
            <FiUsers size={48} />
            <p>No patient records found.</p>
          </div>
        ) : (
          <table className="pd-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>S.No</th>
                <th onClick={() => {
                  setSortBy(sortBy === "name" ? "-name" : "name");
                  setPage(1);
                }} className={sortBy.includes("name") ? "active-sort" : ""}>
                  Patient Name {sortBy === "name" ? "↑" : sortBy === "-name" ? "↓" : ""}
                </th>
                <th>MRN</th>
                <th onClick={() => {
                  setSortBy(sortBy === "last_visit" ? "-last_visit" : "last_visit");
                  setPage(1);
                }} className={sortBy.includes("last_visit") ? "active-sort" : ""}>
                  Last Visit {sortBy === "last_visit" ? "↑" : sortBy === "-last_visit" ? "↓" : ""}
                </th>
                <th>Total Visits</th>
                <th>Treatment Type</th>
                <th style={{ width: "160px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, index) => {
                const sNo = String((page - 1) * pageSize + index + 1).padStart(2, "0");
                return (
                  <tr key={patient.id}>
                    <td>{sNo}</td>
                    <td>
                      <div className="pd-patient-cell">
                        <div className={`pd-avatar ${getAvatarClass(patient.name)}`}>
                          {getInitials(patient.name)}
                        </div>
                        <div className="pd-patient-info">
                          <span className="pd-patient-name">{patient.name}</span>
                          <span className="pd-patient-meta">
                            {patient.phone ? `${patient.phone}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="pd-mrn">#{patient.patient_id}</span>
                    </td>
                    <td>{patient.last_visit || "N/A"}</td>
                    <td>{String(patient.total_visits || 0).padStart(2, "0")}</td>
                    <td>
                      <span className={`pd-treatment pd-treatment-${patient.treatment_type.toLowerCase()}`}>
                        {patient.treatment_display}
                      </span>
                    </td>
                    <td>
                      <div className="pd-actions-cell">
                        <button className="pd-btn-history">History</button>
                        <button className="pd-btn-view" onClick={() => onViewPatient && onViewPatient(patient.id)}>View</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pd-pagination">
            <div className="pd-pagination-info">
              Showing <strong>{(page - 1) * pageSize + 1}</strong> to{" "}
              <strong>{Math.min(page * pageSize, total)}</strong> of{" "}
              <strong>{total}</strong> entries
            </div>
            <div className="pd-pagination-controls">
              <button
                className="pd-page-arrow"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <FiChevronLeft />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pd-page-btn ${page === p ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="pd-page-arrow"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button className="pd-fab" title="Add New Patient">
        <FiPlus />
      </button>
    </div>
  );
}
