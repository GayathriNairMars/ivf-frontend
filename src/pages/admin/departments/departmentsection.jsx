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
function DeptCard({ dept, onClick, onEdit }) {
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
			<div className="dept-card-right" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', justifyContent: 'center' }}>
				<div className="staff-stat-container">
					<span className="staff-stat-number">{dept.staff_count ?? 0}</span>
					<span className="staff-stat-label">Staff</span>
				</div>
				<div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-edit-card" onClick={(e) => {
                        e.stopPropagation();
                        onEdit(dept);
                    }} style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>
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

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
	const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "", head: "" });
	const [editingId, setEditingId] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [staffList, setStaffList] = useState([]);

	const fetchDepts = useCallback(async () => {
		setLoading(true);
		try{
			const [deptData, staffData] = await Promise.all([
				adminApi.getDepartments(),
				adminApi.getStaffList().catch(() => [])
			]);
			setDepartments(deptData);
			setStaffList(Array.isArray(staffData) ? staffData : (staffData?.results || []));
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

	const handleOpenAdd = () => {
		setModalMode("add");
		setDeptForm({ name: "", code: "", description: "", head: "" });
		setEditingId(null);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (dept) => {
		setModalMode("edit");
		setDeptForm({ name: dept.name, code: dept.code || "", description: dept.description || "", head: dept.head || "" });
		setEditingId(dept.id);
		setIsModalOpen(true);
	};

	const handleModalSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			const payload = { ...deptForm, head: deptForm.head === "" ? null : deptForm.head };
			if (modalMode === "add") {
				await adminApi.addDepartment(payload);
			} else {
				await adminApi.updateDepartment(editingId, payload);
			}
			setIsModalOpen(false);
			fetchDepts();
		} catch (error) {
			alert("Error saving department.");
		} finally {
			setIsSubmitting(false);
		}
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
					<button className="btn-add-dept-action" onClick={handleOpenAdd}>
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
						<DeptCard key={dept.id} dept={dept} onClick={handleCardClick} onEdit={handleOpenEdit} />
					))}
				</div>
			)}

			{/* Modal for Add / Edit */}
			{isModalOpen && (
                <div className="dept-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="dept-modal-content" style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>
                                {modalMode === 'add' ? 'Add Department' : 'Edit Department'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Department Name</label>
                                <input required type="text" value={deptForm.name} onChange={(e) => setDeptForm({...deptForm, name: e.target.value})} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', color: '#0f172a' }} placeholder="e.g. Cardiology" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Department Code</label>
                                <input required type="text" value={deptForm.code} onChange={(e) => setDeptForm({...deptForm, code: e.target.value})} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', color: '#0f172a' }} placeholder="e.g. CAR" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Description</label>
                                <textarea value={deptForm.description} onChange={(e) => setDeptForm({...deptForm, description: e.target.value})} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', minHeight: '100px', resize: 'vertical', color: '#0f172a' }} placeholder="Brief description..."></textarea>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Department Head</label>
                                <select value={deptForm.head} onChange={(e) => setDeptForm({...deptForm, head: e.target.value})} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', color: '#0f172a', background: '#fff' }}>
                                    <option value="">-- No Head Assigned --</option>
                                    {staffList.map(staff => (
                                        <option key={staff.id} value={staff.id}>{staff.full_name || staff.username || `Staff ${staff.id}`} ({staff.role_display || staff.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 500, cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                                    {isSubmitting ? 'Saving...' : modalMode === 'add' ? 'Add Department' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
		</div>
	);
}