import { useState,useEffect,useCallback } from "react";
import adminApi from "../../../api/adminApi";
import { ROLE_COLORS } from "../../../constants/constants";
import { ROLES } from "../../../constants/constants";
import { useNavigate } from "react-router-dom";



function Avatar({name,role}) {
  const initials = name?.split(" ").map(n=> n[0]).slice(0,2).join("").toUpperCase() || "?";
  const color = ROLE_COLORS[role] || "#64748b";
  return (
    <div className="staff-avatar" style={{ background: color }}>
	{initials}
    </div>
  );
}

export default function StaffList({ onEdit }) {
  const [staff,setStaff] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  //Filters
  const [search,setSearch] = useState("");
  const [roleFilter,setRoleFilter] = useState("");
  const [statusFilter,setStatusFilter] = useState("");
  const [dateFilter,setDateFilter] = useState("");

  //Pagination
  const [page,setPage] = useState(1);
  const PER_PAGE = 10;

  const fetchStaff = useCallback(async() => {
    setLoading(true);
    try {
      const data = await adminApi.getStaffList();
      setStaff(data);
    } catch{
      setError("Failed to load staff. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(()=> { fetchStaff(); }, [fetchStaff]);

  const handleToggleStatus = async(staffMember) => {
    try {
      await adminApi.toggleStaffStatus(staffMember.id);
      fetchStaff();
    } catch {
      alert("Failed to update status.");
    }
  };

  //Filter logic
  const filtered = staff.filter((s)=>{
    const matchSearch = 
      !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter ||s.role === roleFilter;
    const matchStatus =
      statusFilter === ""? true :
      statusFilter ==="active" ? s.is_active :
      !s.is_active;
    const matchDate = !dateFilter ||
      s.date_joined?.startsWith(dateFilter);
    return matchSearch && matchRole && matchStatus && matchDate;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page-1)* PER_PAGE, page*PER_PAGE);
  const resetFilters = () => {
    setSearch(""); setRoleFilter("");setStatusFilter("");setDateFilter("");setPage(1);
  };
  const hasFilters = search || roleFilter || statusFilter || dateFilter;
  const navigate= useNavigate();
  return (
    <div className="staff-list">
      <div className="subnav-left">
       <h2 className="staff-title">Staff Management</h2>
       <p className="staff-subtitle">Manage all clinic staff members</p>
      </div>
      <button className="btn-add-staff" onClick={() => navigate("/superadmin/staff/add")}>
        Add Staff
      </button>
      {/* Filters bar */ }
      <div className="filters-bar">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
	<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
           className="search-input"
           type="text"
           placeholder="Search by name or email.."
           value={search}
           onChange={(e) => {setSearch(e.target.value); setPage(1); }}
           />
        </div>
        <select className="filter-select" value={roleFilter} onChange={(e)=> {setRoleFilter(e.target.value); setPage(1);}}>
	{ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option> )}
        </select>
        <select className="filter-select" value={statusFilter} onChange={(e) => {setStatusFilter(e.target.value); setPage(1);}}>
	<option value="">All Status</option>
	<option value="active">Active</option>
	<option value="inactive">Inactive</option>
        </select>
        <input
          className="filter-select"
          type="month"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1);}}
          title="Filter by join month"
        />

        {hasFilters && (<button className="btn-clear" onClick={resetFilters}>Clear</button>
        )}

        <span className="result-count">{filtered.length} staff</span>
      </div>

      {/* Table */}
      {loading? (
        <div className="staff-loading">
         <div className="spinner" />
         <span>Loading staff...</span>
        </div>
      ) : error? (
        <div className="staff-error">{error}</div>
      ) : paginated.length ===0? (
        <div className="staff-empty">
         <div className="empty-icon">👥</div>
         <p>No staff found{hasFilters? " matching your filters":""}.</p>
         {hasFilters && <button className="btn-clear" onClick={resetFilters}>Clear Filters</button>}
        </div>
      ) : (
      <>
       <div className="table-wrap">
        <table className="staff-table">
         <thead>
          <tr>
           <th>Staff Member</th>
           <th>Role</th>
           <th>Email</th>
           <th>Joined</th>
           <th>Status</th>
           <th>Actions</th>
          </tr>
         </thead>
         <tbody>
          {paginated.map((s) => (
	<tr key={s.id} className={!s.is_active? "row-inactive" : ""}>
             <td>
	  <div className="staff-name-cell">
	   <Avatar name={s.full_name} role={s.role} />
	   <span className="staff-name">{s.full_name}</span>
	  </div>
	 </td>
	 <td>
	  <span className="role-pill" style={{"--rc": ROLE_COLORS[s.role] || "#64748b"}}>
	   {ROLES.find(r => r.value === s.role)?.label || s.role}
	  </span>
	 </td>
	 <td className="email-cell">{s.email}</td>
	 <td className="date-cell">
	  {s.date_joined ? new Date(s.date_joined).toLocaleDateString("en-IN",{day:"2-digit", month:"short", year: "numeric"}): "-"}
	 </td>
	 <td>
	  <span className={`status-pill ${s.is_active? "status-active" : "status-inactive"}`}>
	   {s.is_active? "Active" : "Inactive"}
	  </span>
	 </td>
	 <td>
	  <div className="action-btns">
	   <button className="btn-edit" onClick={()=> navigate(`/superadmin/staff/edit/${s.id}`)} title="Edit">
	    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
	     <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                 <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
	    </svg>
	    Edit
	   </button>
	   <button className={`btn-toggle ${s.is_active ? "btn-deactivate":"btn-activate"}`}
	    onClick={()=> handleToggleStatus(s)}
	    title={s.is_active? "Deactivate" : "Activate"} >
	   {s.is_active ? "Deactivate" : "Activate" }
	   </button>
	  </div>
	 </td>
	</tr>
          ))}
         </tbody>
        </table>
       </div>

      {/* Pagination */}
      {totalPages > 1 && (
       <div className="pagination">
        <button className="page-btn" onClick={()=> setPage(p => Math.max(1,p-1))} disabled={page === 1}>
         Prev
        </button>
        {Array.from({length: totalPages },(_,i)=> i+1 )
        .map(p=> (
	<button key={p}
	  className={`page-btn ${p === page? "page-active" : ""}`}
	  onClick={()=> setPage(p)}>
	  {p}
	</button>
        ))}
        <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>
        Next
        </button>
       </div>
      )}
      </>
      )}
    </div>
  );
}
