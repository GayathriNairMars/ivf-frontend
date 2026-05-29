import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import patientApi from "../../../api/patientApi";
import "./emr_overview.css";

export default function EMROverview() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        patientApi.getEmrDashboardStats()
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const tabs = [
        { id: "all", label: "All Active", count: stats?.clinic_stats?.active_treatments || 0 },
        { id: "stimulation", label: "Stimulation", count: 0 },
        { id: "retrieval", label: "Retrieval", count: 0 },
        { id: "transfer", label: "Transfer", count: 0 },
        { id: "pregnancy", label: "Pregnancy", count: 0 },
    ];

    return (
        <div className="emr-overview-container">
            <div className="emr-overview-header">
                <div>
                    <h2>Electronic Medical Records</h2>
                    <p>Clinical operations and patient data governance</p>
                </div>
                <div className="emr-header-actions">
                    <button className="btn-upload-report">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Upload Report
                    </button>
                    <button className="btn-create-emr" onClick={() => navigate("/superadmin/emr/patients")}>
                        + Create EMR
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="staff-loading">
                    <div className="spinner" /><span>Loading overview...</span>
                </div>
            ) : (
                <>
                    <div className="emr-stats-cards">
                        <div className="emr-stat-card">
                            <span className="emr-stat-label">Total patients</span>
                            <span className="emr-stat-value">{stats?.clinic_stats?.total_patients || 0}</span>
                        </div>
                        <div className="emr-stat-card">
                            <span className="emr-stat-label" style={{ color: "#f97316" }}>On hold</span>
                            <span className="emr-stat-value">{stats?.clinic_stats?.on_hold || 0}</span>
                        </div>
                        <div className="emr-stat-card">
                            <span className="emr-stat-label">Active treatment</span>
                            <span className="emr-stat-value">{stats?.clinic_stats?.active_treatments || 0}</span>
                        </div>
                        <div className="emr-stat-card">
                            <span className="emr-stat-label">Completed</span>
                            <span className="emr-stat-value">{stats?.clinic_stats?.completed || 0}</span>
                        </div>
                    </div>

                    <div className="emr-streams-section">
                        <h3>Active Patient Streams</h3>
                        
                        <div className="emr-search-bar">
                            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input type="text" placeholder="Search by name, MRN, or diagnosis code..." />
                        </div>

                        <div className="emr-tabs-container">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`emr-tab ${activeTab === tab.id ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>

                        <div className="emr-phase-dropdown">
                            <button className="phase-dropdown-btn">
                                Stimulation Phase
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                        </div>

                        <div className="emr-patient-list">
                            {stats?.recent_patients?.length > 0 ? (
                                stats.recent_patients.map(patient => (
                                    <div key={patient.id} className="emr-patient-row">
                                        <div className="emr-patient-identity">
                                            <div className="emr-patient-avatar">
                                                {patient.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "PT"}
                                            </div>
                                            <div className="emr-patient-info">
                                                <span className="emr-patient-name">{patient.full_name}</span>
                                                <span className="emr-patient-id">
                                                    {patient.patient_id} • C-9032
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="emr-patient-physician">
                                            <span className="emr-physician-label">Physician</span>
                                            <span className="emr-physician-name">Dr. Sarah Thomas</span>
                                        </div>

                                        <div className="emr-patient-progress">
                                            <div className="progress-text">
                                                <span>Day 3 stimulation</span>
                                                <span className="progress-percent" style={{ color: "#3b82f6" }}>65%</span>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div className="progress-bar-fill" style={{ width: "65%" }}></div>
                                            </div>
                                        </div>

                                        <div className="emr-patient-status">
                                            <span className="emr-status-badge success">Report ready</span>
                                        </div>

                                        <div className="emr-patient-actions">
                                            <button className="btn-view-record" onClick={() => navigate(`/superadmin/emr/patients/${patient.id}`)}>
                                                View record
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                    <line x1="7" y1="17" x2="17" y2="7"></line>
                                                    <polyline points="7 7 17 7 17 17"></polyline>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="staff-empty">
                                    <p>No recent patients found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
