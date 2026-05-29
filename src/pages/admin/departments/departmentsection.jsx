import { useState,useEffect, useCallback } from "react";
import { ROLES,DEPT_ICONS, ROLE_COLORS } from "../../../constants/constants";
import adminApi from "../../../api/adminApi";
import "./department.css";
import "../staff/staff.css";

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
		s.email?.toLowerCase().includes(search.toLowerCase());
		const matchRole = !roleFilter || s.role ===roleFilter;
		const matchStatus = 
		  statusFilter ===""? true:
		  statusFilter === "active"? s.is_active : !s.is_active;
		return matchSearch && matchRole && matchStatus;
	});
	const totalPages =Math.ceil(filtered.length/PER_PAGE);
	const paginated = filtered.slice((page-1)* PER_PAGE, page * PER_PAGE);
	const hasFilters = search || roleFilter || statusFilter;
	const reset = () => {setSearch(""); setRole("");setStatus("");setPage(1);};

	if(loading) return <div className="staff-loading"><div className="spinner"/><span>Loading...</span></div>;

	return (
		<div>
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
        	  

        	{hasFilters && (<button className="btn-clear" onClick={reset}>Clear</button>)}
        	<span className="result-count">{filtered.length} staff</span>
          </div>

		  {paginated.length === 0?(
			<div className="staff-empty">
				<div className="empty-icon">👥</div>
				<p>{hasFilters ? "No staff matching your filters.": emptyMessage}</p>
				{hasFilters && <button className="btn-clear" onClick={reset}>Clear Filters</button>}
			</div>
		  ):(
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
				 {paginated.map(s =>(
				   <tr key={s.id} className={!s.is_active?"row-inactive" : ""}>
					<td className="staff-name">{s.employee_id}</td>
					<td>
					 <div className="staff-name-cell">
					  <div className="staff-avatar" style={{ background:ROLE_COLORS[s.role] || "#64748b" }}>
						{s.full_name?.split(" ").map(n =>n[0]).slice(0,2).join("").toUpperCase()}
					  </div>
					  <span className="staff-name">{s.full_name}</span>
					 </div>
					</td>
					<td>
					 <span className="role-pill" style={{"--rc": ROLE_COLORS[s.role] || "#64748b"}}>
						{s.role_display}
					 </span>
					</td>
					<td className="email-cell">{s.email}</td>
					<td className="date-cell">{s.unit || "-"}</td>
					<td className="date-cell">
						{s.date_joined ? new Date(s.date_joined).toLocaleDateString("en-IN",{day:"2-digit", month:"short", year:"numeric"}):"-"}
					</td>
					<td>
						<span className={`status-pill ${s.is_active ? "status-active" : "status-inactive"}`}>
							{s.is_active ? "Active":"Inactive"}
						</span>
					</td>
				   </tr>
				 ))}
				</tbody>
			  </table>
			 </div>
			 {totalPages>1 && (
				<div className="pagination">
					<button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}> Prev </button>
					{Array.from({length : totalPages},(_,i) => i+1).map(p => ( 
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

//Department Detail
function DeptDetail({dept,onBack}) {
	console.log("DeptDetail rendering for:", dept);
	const [primaryStaff, setPrimary] = useState([]);
	const [secondaryStaff,setSecondary] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(()=>{
	  async function load(){
		setLoading(true);
		try{
			const data = await adminApi.getDepartmentStaff(dept.id);
			setPrimary(data.primary_staff || []);
			setSecondary(data.secondary_staff || []);
		} catch {
			setPrimary([]);
			setSecondary([]);
		} finally {
			setLoading(false);
		}
	  }
	  load()
	},[dept.id]);

	return (
	  <div className="dept-detail">
	    {/* Header */}
		<div className="dept-detail-header">
			<button className="btn-back" onClick={onBack}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
          <polyline points="15,18 9,12 15,6"/>
				</svg>
				Back to Departments
			</button>
			<div className="dept-detail-title">
				<span className="dept-icon-lg">{DEPT_ICONS[dept.code] || "🏥"}</span>
				<div >
					<h2>{dept.name}</h2>
					<p>{dept.description || "No description"}</p>
				</div>
			</div>
		</div>

		{/* Stats row */}
		<div className="dept-stats-row">
			<div className="dept-stat-box">
				<span className="dsb-value">{dept.staff_count ?? "-"}</span>
				<span className="dsb-label">Total Staff</span>
			</div>
			<div className="dept-stat-box">
				<span className="dsb-value">{primaryStaff.length}</span>
				<span className="dsb-label">Primary Staff</span>
			</div>
			<div className="dept-stat-box">
				<span className="dsb-value">{secondaryStaff.length}</span>
				<span className="dsb-label">Secondary / Temp</span>
			</div>
			<div className="dept-stat-box">
				<span className="dsb-value">{dept.head_name || "-"}</span>
				<span className="dsb-label">Head of Department</span>
			</div>
		</div>
		 {/* Primary Staff */}
		 <div className="dept-staff-section">
			<div className="dept-staff-header">
				<h3>Primary Staff</h3>
				<span className="result-count">{primaryStaff.length} members</span>
			</div>
			<div style={{ padding:"0 0 8px"}}>
				<StaffTable 
				  staff={primaryStaff}
					loading={loading}
					emptyMessage="No primary staff assigned to this department."
				/>
			</div>
		 </div>
		 {/* Secondary Staff */}
		 <div className="dept-staff-section" style={{marginTop:20}}>
			<div className="dept-staff-header">
				<h3>Secondary & Temporary Staff</h3>
				<span className="result-count">{secondaryStaff.length} members</span>
			</div>
			<div style={{ padding:"0 0 8px" }}>
				<StaffTable
					staff={secondaryStaff}
					loading={loading}
					emptyMessage="No secondary staff assigned to this department."
				/>
			</div>
		 </div>
	  </div>
	);
}

//--Department Card--
function DeptCard({ dept, onClick }) {
	const getInitials = (name) => {
		if (!name) return "H";
		return name
			.split(" ")
			.map((n) => n[0])
			.slice(0, 2)
			.join("")
			.toUpperCase();
	};

	const formatTime = (isoString) => {
		if (!isoString) return "10:42AM";
		try {
			const date = new Date(isoString);
			return date.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			}).replace(/\s+/g, ""); // "10:42 AM" -> "10:42AM"
		} catch (e) {
			return "10:42AM";
		}
	};

	return (
		<div className={`dept-card-new ${!dept.is_active ? "dept-card-inactive" : ""}`} onClick={() => onClick(dept)}>
			<div className="dept-card-left">
				<div className="dept-card-header-row">
					<h3 className="dept-card-title">{dept.name}</h3>
					<div className="dept-card-status-badges">
						<span className="status-dot-text">
							<span className="dot-bullet"></span>
							{dept.is_active ? "Active" : "Inactive"}
						</span>
						<span className="dept-card-updated">
							<svg className="clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
								<circle cx="12" cy="12" r="10" />
								<polyline points="12,6 12,12 16,14" />
							</svg>
							Updated {formatTime(dept.updated_at || dept.created_at)}
						</span>
					</div>
				</div>
				<p className="dept-card-description">{dept.description || "No description provided."}</p>
				<div className="dept-card-hod-box">
					<div className="hod-avatar" style={{ background: dept.code === 'ADM' ? '#e0f2fe' : dept.code === 'EMB' ? '#ffedd5' : '#f1f5f9' }}>
						{getInitials(dept.head_name)}
					</div>
					<div className="hod-info">
						<span className="hod-name">{dept.head_name || "No Head Assigned"}</span>
						<span className="hod-role">{dept.head_role || "Department Head"}</span>
					</div>
				</div>
			</div>
			<div className="dept-card-divider"></div>
			<div className="dept-card-right">
				<div className="staff-stat-container">
					<span className="staff-stat-number">{dept.staff_count ?? 0}</span>
					<span className="staff-stat-label">Staff</span>
				</div>
				<button className="btn-manage-card" onClick={(e) => {
					e.stopPropagation();
					onClick(dept);
				}}>
					Manage 
					<svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" style={{ marginLeft: "4px" }}>
						<line x1="7" y1="17" x2="17" y2="7" />
						<polyline points="7,7 17,7 17,17" />
					</svg>
				</button>
			</div>
		</div>
	);
}

//--Main Department Section--
export default function DepartmentSection(){
	const [departments,setDepartments] = useState([]);
	const [selected,setSelected] = useState(null);
	const [loading,setLoading] = useState(true);
	const [seeding, setSeeding] = useState(false);
	const [view,setView] = useState("list");

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("active");

	const fetchDepts = useCallback(async () => {
		setLoading(true);
		try{
			const data = await adminApi.getDepartments();
			setDepartments(data);
		} catch {
			setDepartments([]);
		} finally {
			setLoading(false);
		}
	},[]);

	useEffect(() => {fetchDepts();}, [fetchDepts]);

	const handleSeed = async() => {
		setSeeding(true);
		try {
			await adminApi.seedDepartments();
			await fetchDepts();
		} catch {
			alert("Failed to setup departments.");
		} finally {
			setSeeding(false);
		}
	};

	const handleCardClick = (dept) => {
		console.log("Card clicked:", dept);
		setSelected(dept);
		setView("detail");
	};

	const handleBack = () => {
		setSelected(null);
		setView("list");
		fetchDepts();
	};

	const filteredDepts = departments.filter(dept => {
		const matchesSearch = !searchQuery || 
			dept.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
			(dept.head_name && dept.head_name.toLowerCase().includes(searchQuery.toLowerCase()));
		
		const matchesStatus = 
			statusFilter === "all" ? true :
			statusFilter === "active" ? dept.is_active : !dept.is_active;

		return matchesSearch && matchesStatus;
	});

	if (view === "detail" && selected) {
		return <DeptDetail dept ={selected} onBack={handleBack} />
	}

	return(
		<div className="dept-section">
			{/* Header */}
			<div className="dept-header-container">
				<div className="dept-header-left">
					<h2 className="dept-main-title">Departments</h2>
					<p className="dept-main-subtitle">Manage and monitor hospital departments and clinical performance.</p>
				</div>
				<div className="dept-header-right">
					{departments.length === 0 && !loading && (
						<button className="btn-seed-depts" onClick={handleSeed} disabled={seeding}>
							{seeding ? "Setting up...":"⚡ Setup Default Departments"}
						</button>
					) }
					<button className="btn-add-dept-action">
						Add Department
					</button>
				</div>
			</div>

			{/* Filters Bar */}
			<div className="dept-filters-row">
				<div className="dept-search-input-wrapper">
					<svg className="dept-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<input
						type="text"
						className="dept-search-input-field"
						placeholder="Search by department name, Head name"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				<div className="dept-filter-dropdown-wrapper">
					<select 
						className="dept-filter-select-field"
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
						<option value="all">All Status</option>
					</select>
				</div>
			</div>

			{/* Department grid */}
			{loading ? (
				<div className="staff-loading">
					<div className="spinner" /><span>Loading departments...</span>
				</div>
			): filteredDepts.length === 0 ? (
				<div className="staff-empty">
					<div className="empty-icon">🏥</div>
					<p>{departments.length === 0 ? "No Departments yet. Click 'Setup Default Departments' to get started." : "No departments matching your filters."}</p>
				</div>
			):(
				<div className="dept-grid-new">
					{filteredDepts.map(dept =>(
						<DeptCard key={dept.id} dept={dept} onClick={handleCardClick} />
					))}
				</div>
			)}
		</div>
	);
}