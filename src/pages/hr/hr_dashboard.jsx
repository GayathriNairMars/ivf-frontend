import React, { useEffect, useState } from "react";
import { hrApi } from "../../api/hrApi";
import { useAuth } from "../../hooks/useAuth";
import {
  Calendar,
  Download,
  Search,
  ChevronDown,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import "./hr_dashboard.css";

export default function HRDashboard({onViewDepartment}) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await hrApi.getDashboard();
      if (response.success) {
        setData(response.dashboard);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="hr-dashboard-loading">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="hr-dashboard-error">Failed to load dashboard data.</div>;
  }

  const { summary, leave_stats, staff_breakdown } = data;

  const getMockHeadName = (deptCode) => {
    const mockHeads = {
      'ADM': 'Rahul',
      'GYN': 'Dr. Anjali',
      'HRM': 'Meera Joseph',
      'NUR': 'Priya',
      'REC': 'Sarath Krishna'
    };
    return mockHeads[deptCode] || 'N/A';
  };

  const getDeptId = (id) => {
    return `DEP00${id}`.slice(-6);
  };

  return (
    <div className="hr-dashboard-wrapper">
      <div className="hr-dashboard-header-section">
        <div className="hr-dashboard-title">
          <h1>Welcome, {user?.full_name || "Shravan AC"}</h1>
          <p>Monitor workforce distribution, staff activity, and leave statistics.</p>
        </div>
        <div className="hr-dashboard-actions">
          <button className="btn-date">
            <Calendar size={16} />
            <span>Today</span>
          </button>
          <button className="btn-export">
            <Download size={16} />
            <span>Export report</span>
          </button>
        </div>
      </div>

      <div className="hr-summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total staffs</span>
          <span className="summary-value">{summary.total_staff}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Active staffs</span>
          <span className="summary-value">{summary.active_staff}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Inactive staffs</span>
          <span className="summary-value">{summary.inactive_staff}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Online</span>
          <span className="summary-value">{summary.online_staff || '0'}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Joiners</span>
          <span className="summary-value">{summary.recent_joiners || '0'}</span>
        </div>
      </div>

      <div className="hr-leave-stats-section">
        <h2>Leave Stats</h2>
        <div className="leave-stats-cards">
          <div className="leave-stat-card">
            <div className="stat-icon-wrapper blue">
              <CalendarDays size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Requests</span>
              <span className="stat-value">{leave_stats.this_month.total || '0'}</span>
            </div>
          </div>
          <div className="leave-stat-card">
            <div className="stat-icon-wrapper green">
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Approved</span>
              <span className="stat-value">{leave_stats.this_month.approved || '0'}</span>
            </div>
          </div>
          <div className="leave-stat-card">
            <div className="stat-icon-wrapper gray">
              <XCircle size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Rejected</span>
              <span className="stat-value">{leave_stats.this_month.rejected || '0'}</span>
            </div>
          </div>
          <div className="leave-stat-card pending">
            <div className="stat-icon-wrapper red">
              <AlertCircle size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label pending-label">Pending approvals</span>
              <span className="stat-value pending-val">{leave_stats.this_month.pending || '0'}</span>
            </div>
            <ChevronRight size={20} className="pending-arrow" />
          </div>
        </div>
      </div>

      <div className="hr-staff-breakdown-section">
        <h2>Staff breakdown</h2>
        <div className="staff-breakdown-container">
          <div className="staff-breakdown-filters">
            <div className="search-bar">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Search by name, MRN, or diagnosis code..." />
            </div>
            <div className="dropdowns">
              <button className="dropdown-btn">
                Active <ChevronDown size={14} />
              </button>
              <button className="dropdown-btn">
                Role <ChevronDown size={14} />
              </button>
              <button className="more-filters-btn">More filters</button>
            </div>
          </div>

          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Department / Role</th>
                <th>Staff Name</th>
                <th>Staff Count</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {staff_breakdown.by_department.map((dept, index) => (
                <tr key={dept.id || index}>
                  <td className="staff-id-col">{getDeptId(dept.id)}</td>
                  <td>{dept.name}</td>
                  <td className="staff-name-col">{getMockHeadName(dept.code)}</td>
                  <td>{dept.staff_count}</td>
                  <td>
                    <button className="eye-btn" onClick={() => onViewDepartment(dept)}><Eye size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-pagination">
            <span>Showing {staff_breakdown.by_department.length} of {staff_breakdown.by_department.length} Departments</span>
            <div className="page-arrows">
              <button className="arrow-btn"><ChevronLeft size={16} /></button>
              <button className="arrow-btn active"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
