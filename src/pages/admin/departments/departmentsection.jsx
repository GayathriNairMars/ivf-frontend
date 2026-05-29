//---Staff Table---
function StaffTable({staff,loading,emptyMessage}) {
	const [search,setSearch] = useState("");
	const [roleFilter,setRoleFilter] = useState("");
	const [statusFilter,setStatusFilter] = useState("");
	const [page,setPage] = useState(1);
	const PER_PAGE = 8;

	const filtered = staff.filter(s => {
		const matchSearch = !search || 
		s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
		s.email?.toLowerCase().includes(search.toLowerCase()) ||
		s.staff_id?.toLowerCase().includes(search.toLowerCase()) ||
		s.role?.toLowerCase().includes(search.toLowerCase());
		const matchRole = !roleFilter || s.role === roleFilter;
		const matchStatus = 
		  statusFilter === "" ? true :
		  statusFilter === "active" ? s.is_active : !s.is_active;
		return matchSearch && matchRole && matchStatus;
	});
	const totalPages = Math.ceil(filtered.length/PER_PAGE);
	const paginated = filtered.slice((page-1)* PER_PAGE, page * PER_PAGE);
	const hasFilters = search || roleFilter || statusFilter;
	
	const reset = () => {
		setSearch("");
		setRoleFilter("");
		setStatusFilter("");
		setPage(1);
	};

	if(loading) return <div className="staff-loading"><div className="spinner"/><span>Loading...</span></div>;

	return (
		<div className="dept-staffs-card">
			<div className="staffs-card-header">
				<h3>Department Staffs</h3>
				<div className="staffs-header-actions">
					<div className="search-wrap-new">
						<svg className="search-icon-new" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
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
					    <option value="">All Roles</option>
					    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option> )}
        	        </select>
        	        <select className="filter-select" value={statusFilter} onChange={(e) => {setStatusFilter(e.target.value); setPage(1);}}>
					    <option value="">All Status</option>
					    <option value="active">Active</option>
					    <option value="inactive">Inactive</option>
        	        </select>
        	    
        	        {hasFilters && (<button className="btn-clear" onClick={reset}>Clear</button>)}
        	        <span className="result-count">{filtered.length} staff</span>
			    </div>
            </div>

		    {paginated.length === 0 ? (
			    <div className="staff-empty">
				    <div className="empty-icon">👥</div>
				    <p>{hasFilters ? "No staff matching your filters." : emptyMessage}</p>
				    {hasFilters && <button className="btn-clear" onClick={reset}>Clear Filters</button>}
			    </div>
		    ) : (
			    <>
			        <div className="table-wrap">
			            <table className="staff-table">
				            <thead>
				                <tr>
				                    <th>Staff ID</th>
				                    <th>Staff Member</th>
				                    <th>Role</th>
				                    <th>Email</th>
				                    <th>Unit</th>
				                    <th>Joined</th>
				                    <th>Status</th>
				                </tr>
				            </thead>
				            <tbody>
				                {paginated.map(s => (
				                    <tr key={s.id} className={!s.is_active ? "row-inactive" : ""}>
					                    <td className="staff-id">{s.employee_id || s.staff_id || "-"}</td>
					                    <td>
					                        <div className="staff-name-cell">
					                            <div className="staff-avatar" style={{ background: ROLE_COLORS[s.role] || "#64748b" }}>
						                            {s.full_name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}
					                            </div>
					                            <span className="staff-name">{s.full_name}</span>
					                        </div>
					                    </td>
					                    <td>
					                        <span className="role-pill" style={{"--rc": ROLE_COLORS[s.role] || "#64748b"}}>
						                        {s.role_display || s.role}
					                        </span>
					                    </td>
					                    <td className="email-cell">{s.email}</td>
					                    <td className="date-cell">{s.unit || "-"}</td>
					                    <td className="date-cell">
						                    {s.date_joined ? new Date(s.date_joined).toLocaleDateString("en-IN",{day:"2-digit", month:"short", year:"numeric"}) : "-"}
					                    </td>
					                    <td>
					                        <span className={`status-pill ${s.is_active ? "status-active" : "status-inactive"}`}>
						                        {s.is_active ? "Active" : "Inactive"}
					                        </span>
					                    </td>
				                    </tr>
				                ))}
				            </tbody>
			            </table>
			        </div>
			        {totalPages > 1 && (
				        <div className="pagination">
					        <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}> Prev </button>
					        {Array.from({length: totalPages}, (_, i) => i + 1).map(p => ( 
						        <button key={p} className={`page-btn ${p === page ? "page-active" : ""}`} onClick={() => setPage(p)}>{p}</button>
					        ))}
					        <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
  						        Next 
					        </button>
				        </div>
			        )}
			    </>
		    )}
		</div>
	);
}
