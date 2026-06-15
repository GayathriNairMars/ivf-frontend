import React, { useState, useEffect } from "react";
import { Search, Plus, Users, UserCheck, UserX, Network, Download, Eye, Pencil, Trash2 } from "lucide-react";
import { hrApi } from "../../api/hrApi";
import "./hr_staff_management.css";
import AddStaff from "../admin/staff/add_staff";

export default function HRStaffManagement({onAddStaff}) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await hrApi.getStaff();
      if (data && data.success) {
        setStaffList(data.staff || []);
      } else {
        setStaffList(data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch staff", error);
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
      // Optimistically update UI
      setStaffList(prev => prev.map(staff => 
        staff.id === staffId ? { ...staff, is_active: !currentStatus } : staff
      ));
    } catch (error) {
      console.error("Failed to toggle status", error);
      alert("Failed to update status. Please try again.");
    }
  };
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.is_active).length;
  const inactiveStaff = staffList.filter(s => !s.is_active).length;
  const uniqueDepartments = new Set(staffList.map(s => s.department).filter(Boolean)).size;

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
            <div className="card-icon blue"><Users size={18} /></div>
          </div>
          <div className="card-bottom">
            <span className="card-value">{totalStaff}</span>
            <span className="card-subtext blue">System total</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-top">
            <span className="card-title">Active Staff</span>
            <div className="card-icon green"><UserCheck size={18} /></div>
          </div>
          <div className="card-bottom">
            <span className="card-value">{activeStaff}</span>
            <span className="card-subtext green">Currently active</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-top">
            <span className="card-title">Inactive Staff</span>
            <div className="card-icon red"><UserX size={18} /></div>
          </div>
          <div className="card-bottom">
            <span className="card-value">{inactiveStaff}</span>
            <span className="card-subtext red">Currently inactive</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-top">
            <span className="card-title">Departments</span>
            <div className="card-icon gray"><Network size={18} /></div>
          </div>
          <div className="card-bottom">
            <span className="card-value">{uniqueDepartments}</span>
            <span className="card-subtext gray">System total</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group" style={{ flex: 1 }}>
          <label>Search Staff</label>
          <div className="search-input-wrapper" style={{ width: '100%' }}>
            <Search size={16} />
            <input type="text" placeholder="Search by name, ID or email..." />
          </div>
        </div>
        <div className="filter-group">
          <label>Role</label>
          <select className="filter-select">
            <option>All Roles</option>
            <option>HR Manager</option>
            <option>Doctor</option>
            <option>Technician</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select className="filter-select">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn-primary" style={{ padding: '10px 24px' }}>Apply Filters</button>
          <button className="btn-secondary">Reset</button>
          <button className="btn-icon-only"><Download size={18} /></button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Employee Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff, idx) => (
              <tr key={staff.id}>
                <td style={{ color: '#64748b' }}>{String(idx + 1).padStart(2, '0')}</td>
                <td>
                  <div className="employee-cell">
                    <div className="employee-avatar">
                      {staff.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="employee-info">
                      <span className="employee-name">{staff.name}</span>
                      <span className="employee-meta">
                        {staff.employee_id || 'N/A'} • {staff.department}
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ color: '#64748b' }}>{staff.email}</td>
                <td style={{ color: '#475569' }}>{staff.role_name}</td>
              <td>
                <div className="actions-cell" style={{ alignItems: "center" }}>
                  <label className="toggle-switch" style={{ width: "36px", height: "20px" }}>
                    <input
                      type="checkbox"
                      checked={staff.is_active}
                      onChange={() => handleToggleStatus(staff.id, staff.is_active)}
                    />
                    <span className="toggle-slider" style={{ borderRadius: "20px" }}></span>
                  </label>
                  <button className="action-btn"><Eye size={16} /></button>
                  <button className="action-btn"><Pencil size={16} /></button>
                </div>
              </td>
              </tr>
            ))}
            {staffList.length === 0 && !loading && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  No staff members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="pagination">
          <div className="pagination-info">Showing 1-{Math.min(10, totalStaff)} of {totalStaff} records</div>
          <div className="pagination-controls">
            <button className="page-btn">&lt;</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <span style={{ color: '#94a3b8', margin: '0 4px', display: 'flex', alignItems: 'center' }}>...</span>
            <button className="page-btn">9</button>
            <button className="page-btn">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
