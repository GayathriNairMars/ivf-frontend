import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import patientApi from "../../../api/patientApi";
import "./emr_overview.css";

export default function EMROverview() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [patients, setPatients] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);   // FIX 1: split into two loading states
    const [patientsLoading, setPatientsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");        // FIX 2: search state

    useEffect(() => {
        setStatsLoading(true);
        patientApi.getEmrDashboardStats()
            .then(data => setStats(data))
            .catch(err => console.error(err))
            .finally(() => setStatsLoading(false));
    }, []);

    useEffect(() => {
        setPatientsLoading(true);
        patientApi.getPatientsByStatus(activeTab)
            .then(data => setPatients(data.patients))
            .catch(err => console.error(err))
            .finally(() => setPatientsLoading(false));
    }, [activeTab]);

    // FIX 2: filter patients client-side based on search query
    const filteredPatients = patients.filter(patient => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            patient.full_name?.toLowerCase().includes(q) ||
            patient.patient_id?.toLowerCase().includes(q) ||
            patient.diagnosis_code?.toLowerCase().includes(q)
        );
    });

    // FIX 3 & 4: helpers for progress and status badge
    const getProgress = (patient) => patient.progress ?? 0;

    const getStatusBadge = (status) => {
        switch (status) {
            case "active":      return { label: "Active",       className: "success" };
            case "pending":     return { label: "Pending",      className: "warning" };
            case "on_hold":     return { label: "On Hold",      className: "warning" };
            case "completed":   return { label: "Completed",    className: "success" };
            case "cancelled":   return { label: "Cancelled",    className: "danger"  };
            default:            return { label: "Unknown",      className: ""        };
        }
    };

    const tabs = [
        { id: "all",       label: "All",              count: stats?.clinic_stats?.total_patients    || 0 }, // FIX 5: removed trailing space
        { id: "pending",   label: "Pending",          count: stats?.clinic_stats?.pending           || 0 },
        { id: "active",    label: "Active Treatment", count: stats?.clinic_stats?.active_treatments || 0 },
        { id: "on_hold",   label: "On Hold",          count: stats?.clinic_stats?.on_hold           || 0 },
        { id: "completed", label: "Completed",        count: stats?.clinic_stats?.completed         || 0 },
        { id: "cancelled", label: "Cancelled",        count: stats?.clinic_stats?.cancelled         || 0 },
    ];

    const loading = statsLoading || patientsLoading;

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

                        {/* FIX 2: wired up search input */}
                        <div className="emr-search-bar">
                            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by name, MRN, or diagnosis code..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
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
                            {filteredPatients.length > 0 ? (    /* FIX 2: use filteredPatients */
                                filteredPatients.map(patient => {
                                    const progress = getProgress(patient);           // FIX 3
                                    const badge = getStatusBadge(patient.status);   // FIX 4
                                    return (
                                        <div key={patient.id} className="emr-patient-row">
                                            <div className="emr-patient-identity">
                                                <div className="emr-patient-avatar">
                                                    {patient.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "PT"}
                                                </div>
                                                <div className="emr-patient-info">
                                                    <span className="emr-patient-name">{patient.full_name}</span>
                                                    <span className="emr-patient-id">{patient.patient_id}</span>
                                                </div>
                                            </div>

                                            <div className="emr-patient-physician">
                                                <span className="emr-physician-label">{patient.doctor_role}</span>
                                                <span className="emr-physician-name">{patient.assigned_doctor}</span>
                                            </div>

                                            <div className="emr-patient-progress">
                                                <div className="progress-text">
                                                    <span>{patient.status_display}</span>
                                                    <span className="progress-percent" style={{ color: "#3b82f6" }}>{progress}%</span>
                                                </div>
                                                <div className="progress-bar-container">
                                                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            </div>

                                            <div className="emr-patient-status">
                                                <span className={`emr-status-badge ${badge.className}`}>{badge.label}</span>
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
                                    );
                                })
                            ) : (
                                <div className="staff-empty">
                                    <p>{searchQuery ? "No patients match your search." : "No recent patients found."}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
