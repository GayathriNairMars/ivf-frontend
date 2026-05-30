import React, { useState, useEffect } from "react";
import patientApi from "../../../api/patientApi";
import { FiArrowUpRight } from "react-icons/fi";
import arathyAvatar from "../../../assets/arathy_avatar.png"; // reusing this for doctors or I can use dummy images
import doctorAvatar from "../../../assets/doctor_avatar.png";

export default function RecordManagement() {
	const [activeFilter, setActiveFilter] = useState("All Records");
	const [stats, setStats] = useState({
		today: 0,
		this_week: 0,
		this_month: 0,
		total: 0,
		by_record_type: []
	});
	const [loadingStats, setLoadingStats] = useState(true);

	useEffect(() => {
		patientApi.getEmrRecordsStatistics().then(data => {
			setStats(data);
			setLoadingStats(false);
		}).catch(err => {
			console.error("Error fetching stats:", err);
			setLoadingStats(false);
		});
	}, []);

	const filters = ["All Records", "Today", "My Records", "Pending", "Finalized"];

	const tableData = [
		{
			id: "PAT-20255",
			patientName: "Aswathy",
			phone: "+91 98450 12345",
			doctor: "Dr. Sarah Thomas",
			type: "Lab result",
			createdDate: "May 1, 2026",
			status: "Active",
			lastUpdated: "2 hours ago"
		},
		{
			id: "PAT-20255",
			patientName: "Kiran",
			phone: "+91 98450 12345",
			doctor: "Dr. Sarah Thomas",
			type: "Lab result",
			createdDate: "May 15, 2026",
			status: "Active",
			lastUpdated: "3 hours ago"
		},
		{
			id: "PAT-20255",
			patientName: "Sangeetha",
			phone: "+91 98450 12345",
			doctor: "Dr. Sarah Thomas",
			type: "Nursing note",
			createdDate: "May 22, 2026",
			status: "Active",
			lastUpdated: "1 day ago"
		},
		{
			id: "PAT-20255",
			patientName: "Shwetha",
			phone: "+91 98450 12345",
			doctor: "Dr. Sarah Thomas",
			type: "Lab result",
			createdDate: "May 30, 2026",
			status: "Active",
			lastUpdated: "2 hours ago"
		}
	];

	return (
		<div className="section-content" style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>
			<div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
				<h1 style={{ fontSize: "24px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Record management dashboard</h1>
				<div style={{ display: "flex", gap: "16px" }}>
					<button style={{ padding: "10px 20px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "white", color: "#3b82f6", fontWeight: "500", cursor: "pointer", fontSize: "14px" }}>
						Generate Report
					</button>
					<button style={{ padding: "10px 20px", border: "none", borderRadius: "6px", background: "#3b82f6", color: "white", fontWeight: "500", cursor: "pointer", fontSize: "14px" }}>
						New Entry
					</button>
				</div>
			</div>

			{/* KPI Cards */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "32px" }}>
				<div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
					<div style={{ color: "#64748b", fontSize: "14px", fontWeight: "500", marginBottom: "12px" }}>Total records</div>
					<div style={{ color: "#0f172a", fontSize: "32px", fontWeight: "600" }}>{loadingStats ? "..." : stats.total}</div>
				</div>
				<div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
					<div style={{ color: "#64748b", fontSize: "14px", fontWeight: "500", marginBottom: "12px" }}>Today</div>
					<div style={{ color: "#0f172a", fontSize: "32px", fontWeight: "600" }}>{loadingStats ? "..." : stats.today}</div>
				</div>
				<div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
					<div style={{ color: "#64748b", fontSize: "14px", fontWeight: "500", marginBottom: "12px" }}>This week</div>
					<div style={{ color: "#0f172a", fontSize: "32px", fontWeight: "600" }}>{loadingStats ? "..." : stats.this_week}</div>
				</div>
				<div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
					<div style={{ color: "#64748b", fontSize: "14px", fontWeight: "500", marginBottom: "12px" }}>Last 30 days</div>
					<div style={{ color: "#0f172a", fontSize: "32px", fontWeight: "600" }}>{loadingStats ? "..." : stats.this_month}</div>
				</div>
			</div>

			{/* Charts / Data */}
			<div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr", gap: "24px", marginBottom: "32px" }}>
				{/* Distribution */}
				<div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
					<div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
						<div style={{ color: "#3b82f6", fontSize: "18px" }}>📊</div>
						<h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>Distribution</h3>
					</div>
					
					<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
						{loadingStats ? (
							<div style={{ color: "#64748b", fontSize: "14px" }}>Loading distribution...</div>
						) : stats.by_record_type && stats.by_record_type.length > 0 ? (
							stats.by_record_type.map((item, idx) => {
								const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
								const colors = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];
								const color = colors[idx % colors.length];
								return (
									<div key={item.record_type}>
										<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#334155" }}>
											<span style={{ textTransform: "capitalize" }}>{item.record_type.replace(/_/g, " ").toLowerCase()}</span>
											<span>{percentage}%</span>
										</div>
										<div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
											<div style={{ height: "100%", width: `${percentage}%`, background: color }}></div>
										</div>
									</div>
								);
							})
						) : (
							<div style={{ color: "#64748b", fontSize: "14px" }}>No data available</div>
						)}
					</div>
				</div>

				{/* Top Doctors */}
				<div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
					<div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
						<div style={{ color: "#3b82f6", fontSize: "18px" }}>👨‍⚕️</div>
						<h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>Top Doctors</h3>
					</div>
					
					<div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
						<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
							<img src={doctorAvatar} alt="Dr. Robert Chen" style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid #e2e8f0", objectFit: "cover" }} />
							<div style={{ fontSize: "15px", fontWeight: "500", color: "#1e293b" }}>Dr. Robert Chen</div>
						</div>
						<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
							<img src={arathyAvatar} alt="Dr. Emily Watson" style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid #e2e8f0", objectFit: "cover" }} />
							<div style={{ fontSize: "15px", fontWeight: "500", color: "#1e293b" }}>Dr. Emily Watson</div>
						</div>
					</div>

					<button style={{ width: "100%", padding: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#3b82f6", fontWeight: "500", cursor: "pointer", fontSize: "14px", marginTop: "24px" }}>
						Full staff report
					</button>
				</div>
			</div>

			{/* Filters */}
			<div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
				<span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Filters :</span>
				<div style={{ display: "flex", gap: "12px" }}>
					{filters.map((f) => (
						<button 
							key={f}
							onClick={() => setActiveFilter(f)}
							style={{ 
								padding: "8px 16px", 
								borderRadius: "20px", 
								border: activeFilter === f ? "none" : "1px solid #e2e8f0",
								background: activeFilter === f ? "#3b82f6" : "white",
								color: activeFilter === f ? "white" : "#64748b",
								fontSize: "13px",
								fontWeight: "500",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								gap: "6px"
							}}
						>
							{f}
							{f === "Pending" && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f97316" }}></span>}
						</button>
					))}
				</div>
			</div>

			{/* Table */}
			<div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
				<table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
					<thead style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
						<tr>
							<th style={{ padding: "16px 24px", fontWeight: "500" }}>Patient ID</th>
							<th style={{ padding: "16px 24px", fontWeight: "500" }}>Patient name</th>
							<th style={{ padding: "16px 24px", fontWeight: "500" }}>Doctor</th>
							<th style={{ padding: "16px 24px", fontWeight: "500" }}>Type</th>
							<th style={{ padding: "16px 24px", fontWeight: "500" }}>Created date</th>
							<th style={{ padding: "16px 24px", fontWeight: "500" }}>Status</th>
							<th style={{ padding: "16px 24px", fontWeight: "500" }}>Last updated</th>
							<th style={{ padding: "16px 24px", fontWeight: "500" }}></th>
						</tr>
					</thead>
					<tbody>
						{tableData.map((row, i) => (
							<tr key={i} style={{ borderBottom: "1px solid #e2e8f0", color: "#334155" }}>
								<td style={{ padding: "16px 24px", color: "#64748b" }}>{row.id}</td>
								<td style={{ padding: "16px 24px" }}>
									<div style={{ fontWeight: "600", color: "#0f172a" }}>{row.patientName}</div>
									<div style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>{row.phone}</div>
								</td>
								<td style={{ padding: "16px 24px", fontWeight: "600", color: "#0f172a" }}>{row.doctor}</td>
								<td style={{ padding: "16px 24px", color: "#3b82f6", fontWeight: "500", cursor: "pointer" }}>
									{row.type} <FiArrowUpRight style={{ display: "inline", verticalAlign: "middle" }}/>
								</td>
								<td style={{ padding: "16px 24px", color: "#64748b" }}>{row.createdDate}</td>
								<td style={{ padding: "16px 24px" }}>
									<span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#16a34a", fontSize: "12px", fontWeight: "500" }}>
										<span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }}></span> {row.status}
									</span>
								</td>
								<td style={{ padding: "16px 24px", color: "#64748b" }}>{row.lastUpdated}</td>
								<td style={{ padding: "16px 24px", textAlign: "right" }}>
									<button style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "white", color: "#3b82f6", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
										View details <FiArrowUpRight />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", color: "#64748b", fontSize: "14px", borderTop: "1px solid #e2e8f0" }}>
					<div>Showing {tableData.length > 0 ? 1 : 0} of {tableData.length > 40 ? tableData.length : 42} Patients</div>
					<div style={{ display: "flex", gap: "8px" }}>
						<button style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", color: "#94a3b8", cursor: "pointer" }}>&lt;</button>
						<button style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #cbd5e1", borderRadius: "6px", background: "white", color: "#3b82f6", cursor: "pointer" }}>&gt;</button>
					</div>
				</div>
			</div>
		</div>
	);
}
