import { useState,useEffect, useCallback } from "react";
import { ROLES,DEPT_ICONS, ROLE_COLORS } from "../../../constants/constants";
import adminApi from "../../../api/adminApi";
import "./department.css";
import "../staff/staff.css";

//---Staff Table---
function StaffTable({staff,loading,emptyMessage}) {
	const [search,setSearch] = useState("");
	const [statusFilter,setStatusFilter] = useState("");
	const [page,setPage] = useState(1);
	const PER_PAGE = 8;

	const filtered = staff.filter(s => {
		const matchSearch = !search || 
		s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
		s.email?.toLowerCase().includes(search.toLowerCase()) ||
		s.staff_id?.toLowerCase().includes(search.toLowerCase()) ||
		s.role?.toLowerCase().includes(search.toLowerCase());
		const matchStatus = 
		  statusFilter === "" ? true :
		  statusFilter === "active" ? s.is_active : !s.is_active;
		return matchSearch && matchStatus;
	});
	const totalPages = Math.ceil(filtered.length/PER_PAGE);
	const paginated = filtered.slice((page-1)* PER_PAGE, page * PER_PAGE);

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
							className="search-input-new"
							type="text"
							placeholder="Search by Staff Id, Name, Role"
							value={search}
							onChange={(e) => {setSearch(e.target.value); setPage(1); }}
						/>
					</div>
					<select className="filter-select-new" value={statusFilter} onChange={(e) => {setStatusFilter(e.target.value); setPage(1);}}>
						<option value="">Status</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>
			</div>

			{paginated.length === 0 ? (
				<div className="staff-empty">
					<div className="empty-icon">👥</div>
					<p>{emptyMessage}</p>
				</div>
			) : (
				<>
					<div className="table-wrap-new">
						<table className="staff-table-new">
							<thead>
								<tr>
									<th>Staff Id</th>
									<th>Name</th>
									<th>Email</th>
									<th>Role</th>
									<th>Status</th>
									<th>Date joined</th>
								</tr>
							</thead>
							<tbody>
								{paginated.map(s => (
									<tr key={s.id}>
										<td className="staff-id-cell">{s.staff_id || s.id || "CD-2024-001"}</td>
										<td>
											<span className="staff-name-bold">{s.full_name}</span>
										</td>
										<td className="email-cell">{s.email}</td>
										<td className="role-cell-new">{s.role_display || s.role}</td>
										<td>
											<span className={`status-badge-new ${s.is_active ? "active" : "inactive"}`}>
												<span className="status-dot"></span>
												{s.is_active ? "Active" : "Inactive"}
											</span>
										</td>
										<td className="date-cell">
											{s.date_joined ? new Date(s.date_joined).toLocaleDateString("en-GB",{day:"2-digit", month:"short", year:"numeric"}).replace(/ /g, ' ') : "14 Jan 2025"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="pagination-footer">
						<span className="showing-text">Showing <strong style={{color:"#3b82f6"}}>{paginated.length}</strong> of <strong style={{color:"#3b82f6"}}>{filtered.length}</strong> staff members</span>
						<div className="pagination-arrows">
							<button className="page-arrow-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="15 18 9 12 15 6"></polyline></svg>
							</button>
							<button className="page-arrow-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg>
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

//Department Detail
function DeptDetail({dept,onBack}) {
	console.log("DeptDetail rendering for:", dept);
	const [activeTab, setActiveTab] = useState("primary");
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
		<div className="dept-detail-container">
			{/* Breadcrumb Header */}
			<div className="dept-breadcrumb">
				<button className="breadcrumb-link" onClick={onBack}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
						<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
					</svg>
					Departments
				</button>
				<span className="breadcrumb-separator"> {'>'} </span>
				<span className="breadcrumb-current">{dept.name}</span>
			</div>

			<div className="dept-detail-top">
				<div className="dept-title-section">
					<h2>{dept.name}</h2>
					<span className={`dept-status-badge ${dept.is_active ? 'active' : 'inactive'}`}>
						{dept.is_active ? 'Active' : 'Inactive'}
					</span>
				</div>
				<div className="dept-stats-section">
					<div className="dept-stat-item">
						<span className="stat-label">Staff count</span>
						<span className="stat-value">{dept.staff_count ?? "-"}</span>
					</div>
					<div className="dept-stat-item">
						<span className="stat-label">Staff count</span>
						<span className="stat-value">{primaryStaff.length}</span>
					</div>
					<div className="dept-stat-item">
						<span className="stat-label">Staff count</span>
						<span className="stat-value">{secondaryStaff.length}</span>
					</div>
				</div>
			</div>

			<div className="dept-head-info-card">
				<div className="dept-head-left">
					<div className="dept-head-profile">
						<div className="hod-avatar-lg" style={{ background: dept.code === 'ADM' ? '#e0f2fe' : dept.code === 'EMB' ? '#ffedd5' : '#f1f5f9' }}>
							{dept.head_name ? dept.head_name.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase() : "H"}
						</div>
						<div className="hod-details">
                            <div className="dept-head-label">Department head</div>
							<span className="hod-name">{dept.head_name || "No Head Assigned"}</span>
							<span className="hod-role">{dept.head_role || "Chief Physician"}</span>
						</div>
					</div>
				</div>
                <div className="dept-head-divider"></div>
				<div className="dept-head-right">
					<p>{dept.description || ""}</p>
				</div>
			</div>

			{/* Tabs */}
			<div className="dept-tabs">
				<button className={`tab-btn ${activeTab === 'primary' ? 'active' : ''}`} onClick={() => setActiveTab('primary')}>Primary staffs</button>
				<button className={`tab-btn ${activeTab === 'secondary' ? 'active' : ''}`} onClick={() => setActiveTab('secondary')}>Secondary staffs</button>
			</div>
            <div className="dept-tabs-line"></div>

			{/* Tab Content */}
			<div className="dept-tab-content">
				{activeTab === 'primary' ? (
					<StaffTable 
						staff={primaryStaff}
						loading={loading}
						emptyMessage="No primary staff assigned to this department."
					/>
				) : (
					<StaffTable 
						staff={secondaryStaff}
						loading={loading}
						emptyMessage="No secondary staff assigned to this department."
					/>
				)}
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
			}).replace(/\s+/g, "");
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

	const handleBlack = () => {
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
		return <DeptDetail dept={selected} onBack={handleBlack} />
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