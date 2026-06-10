import React, { useState, useEffect, useCallback } from "react";
import "./patients.css";
import { FiSearch, FiFilter, FiDownload, FiPrinter, FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import api from "../../api/axios";

const getInitials = (name) => {
  if (!name) return "P";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getStatusColor = (status) => {
  switch (status) {
    case "ACT": return { bg: "#e6f4ea", text: "#1e8e3e", icon: "●" };
    case "HOL": return { bg: "#fef7e0", text: "#f29900", icon: "●" };
    case "PEN": return { bg: "#e8f0fe", text: "#1a73e8", icon: "●" };
    default: return { bg: "#f1f3f4", text: "#5f6368", icon: "●" };
  }
};

export default function PatientsList({ onViewPatient }) {
  const [data, setData] = useState({
    patients: [],
    statistics: {
      total_patients: 0,
      active_treatments: 0,
      completed_treatments: 0,
      this_week_patients: 0,
    },
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
  });
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      let url = `doctor/patients/?page=${currentPage}&page_size=20`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      
      const response = await api.get(url);
      if (response.data?.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= data.total_pages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="doc-patients-container">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Patients</p>
            <h3 className="stat-value">{data.statistics.total_patients}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper teal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Active Treatments</p>
            <h3 className="stat-value">{data.statistics.active_treatments}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper gray">
            <FiCalendar size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">This Week Visits</p>
            <h3 className="stat-value">{data.statistics.this_week_patients}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Completed Treatments</p>
            <h3 className="stat-value">{data.statistics.completed_treatments || data.statistics.completed_today_count}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Patient Name / MRN</label>
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={handleStatusChange}>
            <option value="">All Status</option>
            <option value="ACT">Active Treatment</option>
            <option value="HOL">On Hold</option>
            <option value="PEN">Pending</option>
          </select>
        </div>

        <div className="filter-group">
          <label>&nbsp;</label>
          <button className="btn-clear" onClick={clearFilters}>
            <FiFilter /> Clear Filters
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="purple-text"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <h3>Patient Records</h3>
            <span className="badge-records">{data.total} Records</span>
          </div>
          <div className="table-actions">
            <button className="icon-btn"><FiDownload /></button>
            <button className="icon-btn"><FiPrinter /></button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="patients-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>PATIENT NAME</th>
                <th>MRN</th>
                <th>LAST VISIT</th>
                <th>TOTAL VISITS</th>
                <th>TREATMENT TYPE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-4">Loading...</td></tr>
              ) : data.patients.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4">No patients found.</td></tr>
              ) : (
                data.patients.map((patient, index) => {
                  const statusStyle = getStatusColor(patient.status);
                  return (
                    <tr key={patient.id}>
                      <td className="text-muted">
                        {(currentPage - 1) * data.page_size + index + 1 < 10 
                          ? `0${(currentPage - 1) * data.page_size + index + 1}` 
                          : (currentPage - 1) * data.page_size + index + 1}
                      </td>
                      <td>
                        <div className="patient-name-cell">
                          <div className="avatar">{getInitials(patient.name)}</div>
                          <div className="patient-info">
                            <span className="fw-bold">{patient.name}</span>
                            <span className="text-muted small">
                              {patient.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="fw-bold text-muted">{patient.patient_id}</td>
                      <td className="fw-medium">{patient.last_visit}</td>
                      <td className="fw-bold">{patient.total_visits < 10 ? `0${patient.total_visits}` : patient.total_visits}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {statusStyle.icon} {patient.status_display}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-col">
                          <button className="btn-history">History</button>
                          <button className="btn-view" onClick={() => onViewPatient && onViewPatient(patient.id)}>View</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.total_pages > 0 && (
          <div className="pagination-footer">
            <span className="showing-text">
              Showing {(currentPage - 1) * data.page_size + 1} to {Math.min(currentPage * data.page_size, data.total)} of {data.total} entries
            </span>
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <FiChevronLeft />
              </button>
              
              {[...Array(data.total_pages)].map((_, i) => (
                <button 
                  key={i + 1} 
                  className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              
              <button 
                className="page-btn" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === data.total_pages}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
