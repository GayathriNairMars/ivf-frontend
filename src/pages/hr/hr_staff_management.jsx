import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Users, UserCheck, UserX, Network, Eye, Pencil, Ban } from "lucide-react";
import { hrApi } from "../../api/hrApi";
import "./hr_staff_management.css";
import { ROLES } from "../../constants/constants";

export default function HRStaffManagement({ onAddStaff }) {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hrApi.getStaff();
      if (data && data.success) {
        setStaffList(data.staff || []);
      } else {
        setStaffList(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch staff", err);
      setError("Failed to load staff data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = async (staffId, currentStatus) => {
    const newAction = currentStatus ? "deactivate" : "activate";
    try {
      await hrApi.toggleStaffStatus(staffId, newAction);
      setStaffList((prev) =>
        prev.map((staff) =>
          staff.id === staffId ? { ...staff, is_active: !currentStatus } : staff
        )
      );
    } catch (error) {
      console.error("Failed to toggle status", error);
      alert("Failed to update status. Please try again.");
    }
  };

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  // Filter logic
  const filtered = staffList.filter((s) => {
    const matchSearch =
      !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || s.role === roleFilter;
    const matchStatus =
      statusFilter === "" ? true : statusFilter === "active" ? s.is_active : !s.is_active;
    const matchDate = !dateFilter || s.date_joined?.startsWith(dateFilter);
    return matchSearch && matchRole && matchStatus && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.is_active).length;
  const inactiveStaff = staffList.filter((s) => !s.is_active).length;
  const uniqueDepartments = new Set(staffList.map((s) => s.department).filter(Boolean)).size;

  const isHod = (staffId) => {
    const staff = staffList.find((s) => s.id === staffId);
    return staff?.is_hod === true || staff?.is_head_of_department === true;
  };

  return (
    <div className="staff-management-container">
      <div className="staff-header">
        <div>
          <h1>Staff Management</h1>
          <p>Manage all clinic staff members, their roles, and status</p>
        </div>
        <button className="btn-primary" onClick={onAddStaff}>
          <Plus size={18} />
          Add New Staff
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-top">
            <span className="card-title">Total Staff</span>
            <div className="card-icon blue">
              <Users size={18} />
            </div>
          </div>
          <div className="card-bottom">
            <span className="card-value">{totalStaff}</span>
            <span className="card-subtext blue">System total</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-top">
            <span className="card-title">Active Staff</span>
            <div className="card-icon green">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="card-bottom">
            <span className="card-value">{activeStaff}</span>
            <span className="card-subtext green">Currently active</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-top">
            <span className="card-title">Inactive Staff</span>
            <div className="card-icon red">
              <UserX size={18} />
            </div>
          </div>
          <div className="card-bottom">
            <span className="card-value">{inactiveStaff}</span>
            <span className="card-subtext red">Currently inactive</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-top">
            <span className="card-title">Departments</span>
            <div className="card-icon gray">
              <Network size={18} />
            </div>
          </div>
          <div className="card-bottom">
            <span className="card-value">{uniqueDepartments}</span>
            <span className="card-subtext gray">System total</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, role, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Status (All)</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          className="filter-select"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Role (All)</option>
          {ROLES.filter((r) => r.value !== "").map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <input
          type="month"
          className="date-filter-input"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
        />

        <button className="btn-link">More filters</button>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="table-status">Loading staff...</div>
        ) : error ? (
          <div className="table-status error">{error}</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Staff name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Joined date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? (
                  paginated.map((s) => {
                    const roleLabel = ROLES.find((r) => r.value === s.role)?.label || s.role;
                    return (
                      <tr key={s.id} className={!s.is_active ? "row-inactive" : ""}>
                        <td>STAFF-{String(s.id).padStart(5, "0")}</td>
                        <td className="cell-strong">{s.full_name}</td>
                        <td>
                          <div className="role-cell">
                            {roleLabel}
                            {isHod(s.id) && <span className="hod-badge">head</span>}
                          </div>
                        </td>
                        <td className="cell-email">{s.email}</td>
                        <td>
                          {s.date_joined
                            ? new Date(s.date_joined).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={!!s.is_active}
                              onChange={() => handleToggleStatus(s.id, s.is_active)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              onClick={() => navigate(`/superadmin/staff/edit/${s.id}`)}
                              className="action-btn"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => navigate(`/superadmin/staff/view/${s.id}`)}
                              className="action-btn"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(s.id, s.is_active)}
                              className="action-btn action-btn-danger"
                              title={s.is_active ? "Deactivate" : "Activate"}
                            >
                              <Ban size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="table-status">
                      No staff members found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer / Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)} to{" "}
              {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} Staffs
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                &lt;
              </button>
              <button
                className="page-btn page-btn-active"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}