import { useCallback, useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import { ROLE_LABELS } from "../../../constants/constants";

// Dashboard Home
export default function DashboardHome() {
	const navigate = useNavigate();
	const [stats, setStats] = useState(null);
	const [sessions, setSessions] = useState([]);
	const [patients, setPatients] = useState([]);
	const [loading, setLoading] = useState(true);

	const load= useCallback(async () => {
	 try{
	   const data = await adminApi.getDashboardStats();
	   setStats(data);
	   setSessions(data.active_sessions || []);
	   setPatients(data?.patients || []);
	 } catch {
	   //show empty state
	 } finally {
	   setLoading(false);
	 }
	},[]);

	useEffect(()=>{
		load();
		const interval = setInterval(load,30000);
		return () => clearInterval(interval);
	 }, [load]);

	 return (
		<div className="dashboard-content">
		  <div className="dashboard-header">
            <div>
		          <h2>HIMS Overview</h2>
              <p>Operational data and clinical performance monitoring</p>
            </div>
            <div className="header-actions">
              <button className="btn-outline">Generate Report</button>
            </div>
		  </div>

          <div className="dashboard-grid">
            <div className="dashboard-sidebar">
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="stat-label">Total staff</div>
                </div>
                <div className="stat-value">{stats?.summary?.total_staff ?? "0"}</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <div className="stat-label">Active users</div>
                </div>
                <div className="stat-value">{stats?.summary?.active_count ?? "0"}</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div className="stat-label">Daily patients</div>
                </div>
                <div className="stat-value">{stats?.summary?.total_patients ?? "0"}</div>
              </div>
            </div>

            <div className="dashboard-main-panel">
              <div className="panel">
                <div className="panel-header-flex">
                  <div>
                    <h3>Recent active sessions</h3>
                    <p>Currently active personnel within the hospital network</p>
                  </div>
                  <div className="panel-filters">
                    <select><option>User role</option></select>
                    <select><option>Active</option></select>
                  </div>
                </div>

                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>User name</th>
                      <th>User role</th>
                      <th>Date</th>
                      <th>Log In</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" style={{textAlign:"center"}}>Loading...</td></tr>
                    ) : sessions.length === 0 ? (
                      <tr><td colSpan="5" style={{textAlign:"center"}}>No active sessions right now.</td></tr>
                    ) : (
                      sessions.map((s, i) => (
                        <tr key={i}>
                          <td>
                            <div className="table-user">
                              <span className="table-user-name">{s.full_name || "Unknown"}</span>
                              <span className="table-user-email">{s.email || "-"}</span>
                            </div>
                          </td>
                          <td>{ROLE_LABELS[s.role] || "Staff"}</td>
                          <td>{s.login_time ? new Date(s.login_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</td>
                          <td>{s.login_time ? new Date(s.login_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                          <td><span className="status-badge">Active</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="pagination">
                  <div className="pagination-text">Showing <span>{sessions.length}</span> of <span>{stats?.active_count || sessions.length}</span></div>
                  <div className="pagination-controls">
                    <button className="page-btn">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <button className="page-btn">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
		</div>
	 );
}