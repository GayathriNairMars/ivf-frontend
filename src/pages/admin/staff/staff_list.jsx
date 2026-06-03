import { useState, useEffect, useCallback } from "react";
import adminApi from "../../../api/adminApi";
import { ROLE_COLORS, ROLES } from "../../../constants/constants";
import { useNavigate } from "react-router-dom";
import { Search, Edit, Eye, Ban, Calendar, Filter } from "lucide-react";
import "./staff.css";

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffData, statsData] = await Promise.all([
        adminApi.getStaffList(),
        adminApi.getDashboardStats()
      ]);
      setStaff(staffData);
      setDashboardStats(statsData);
    } catch {
      setError("Failed to load staff data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleStatus = async (staffMember) => {
    try {
      await adminApi.toggleStaffStatus(staffMember.id);
      fetchData();
    } catch {
      alert("Failed to update status.");
    }
  };

  const isHod = (staffId) => {
    if (!dashboardStats?.department_heads) return false;
    return dashboardStats.department_heads.some(h => h.head_id === staffId);
  };

  // Filter logic
  const filtered = staff.filter((s) => {
    const matchSearch =
      !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || s.role === roleFilter;
    const matchStatus =
      statusFilter === "" ? true :
      statusFilter === "active" ? s.is_active :
      !s.is_active;
    const matchDate = !dateFilter || s.date_joined?.startsWith(dateFilter);
    return matchSearch && matchRole && matchStatus && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="manage-staff-container" style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#0f172a", margin: "0 0 8px 0" }}>Manage staff</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Manage staff accounts, roles, permissions, and workforce records.</p>
        </div>
        <button 
          onClick={() => navigate("/superadmin/staff/add")}
          style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <span>+</span> Add staff
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        {[
          { label: "Total staff", value: dashboardStats?.summary?.total_staff || 0 },
          { label: "Active staff", value: dashboardStats?.summary?.active_staff || 0 },
          { label: "New joiners", value: 18 }, // Placeholder as requested, or mock
          { label: "Department heads", value: dashboardStats?.summary?.total_hods || 0 },
        ].map((stat, idx) => (
          <div key={idx} style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "500", marginBottom: "12px" }}>{stat.label}</div>
            <div style={{ color: "#0f172a", fontSize: "32px", fontWeight: "600" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search by name, role, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <select 
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "10px 32px 10px 16px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", color: "#334155", appearance: "none", outline: "none", cursor: "pointer" }}
        >
          <option value="">Status (All)</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select 
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ padding: "10px 32px 10px 16px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", color: "#334155", appearance: "none", outline: "none", cursor: "pointer" }}
        >
          <option value="">Role (All)</option>
          {ROLES.filter(r => r.value !== "").map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <div style={{ position: "relative" }}>
          <input
            type="month"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", color: dateFilter ? "#0f172a" : "#94a3b8", background: "white" }}
          />
        </div>

        <button 
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#3b82f6", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}
        >
          More filters
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading staff...</div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>{error}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Staff ID</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Staff name</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Role</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Email</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Joined date</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Status</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? paginated.map((s) => {
                  const roleLabel = ROLES.find(r => r.value === s.role)?.label || s.role;
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #e2e8f0", background: !s.is_active ? "#f8fafc" : "white" }}>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "#475569" }}>
                        STAFF-{String(s.id).padStart(5, '0')}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "#0f172a", fontWeight: "500" }}>
                        {s.full_name}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "#475569" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {roleLabel}
                          {isHod(s.id) && (
                            <span style={{ fontSize: "11px", background: "#e0e7ff", color: "#4338ca", padding: "2px 8px", borderRadius: "12px", fontWeight: "500", border: "1px solid #c7d2fe" }}>head</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "#3b82f6" }}>
                        {s.email}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "#475569" }}>
                        {s.date_joined ? new Date(s.date_joined).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <label className="toggle-switch" style={{ width: "36px", height: "20px" }}>
                          <input 
                            type="checkbox" 
                            checked={s.is_active} 
                            onChange={() => handleToggleStatus(s)} 
                          />
                          <span className="toggle-slider" style={{ borderRadius: "20px" }}></span>
                        </label>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <button onClick={() => navigate(`/superadmin/staff/edit/${s.id}`)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }} title="Edit">
                            <Edit size={18} />
                          </button>
                          <button style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }} title="View">
                            <Eye size={18} />
                          </button>
                          <button onClick={() => handleToggleStatus(s)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0 }} title={s.is_active ? "Deactivate" : "Activate"}>
                            <Ban size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
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
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white" }}>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)} to {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} Staffs
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", color: page === 1 ? "#cbd5e1" : "#64748b", cursor: page === 1 ? "not-allowed" : "pointer" }}
              >
                &lt;
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #3b82f6", borderRadius: "6px", background: "white", color: "#3b82f6", cursor: page === totalPages ? "not-allowed" : "pointer" }}
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
