import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import patientApi from "../../../api/patientApi";
import AddEMRRecord from "./add_emrrecord";
import { FiSearch, FiArrowLeft } from "react-icons/fi";

export default function CreateEMRWrapper() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        patientApi.getPatientsList(search ? `search=${search}` : "")
            .then(res => setPatients(Array.isArray(res) ? res : (res.results || [])))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [search]);

    if (selectedPatient) {
        return (
            <AddEMRRecord 
                patient={selectedPatient} 
                onBack={() => setSelectedPatient(null)} 
                onSuccess={() => navigate("/superadmin/emr")} 
            />
        );
    }

    return (
        <div style={{ padding: "24px", background: "#fff", minHeight: "100%", borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#64748b" }}>
                    <FiArrowLeft />
                </button>
                <h2 style={{ margin: 0, fontSize: "24px", color: "#1e293b", fontWeight: 600 }}>Select Patient for New EMR</h2>
            </div>
            
            <div style={{ position: "relative", marginBottom: "24px" }}>
                <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input 
                    type="text" 
                    placeholder="Search by patient name, ID or diagnosis..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: "100%", padding: "12px 12px 12px 40px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "15px", outline: "none" }}
                />
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
                {loading ? (
                    <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                        <div className="spinner" style={{ display: "inline-block", marginRight: "8px" }} /> Loading patients...
                    </div>
                ) : patients.length > 0 ? (
                    patients.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => setSelectedPatient(p)} 
                            style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}
                            onMouseOver={e => e.currentTarget.style.borderColor = "#3b82f6"}
                            onMouseOut={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                        >
                            <div>
                                <div style={{ fontWeight: 500, color: "#0f172a", fontSize: "16px" }}>{p.user?.full_name || "Unknown"}</div>
                                <div style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>{p.patient_id} • {p.treatment_type_display || p.treatment_type || "Active Treatment"}</div>
                            </div>
                            <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 500, cursor: "pointer" }}>
                                Select
                            </button>
                        </div>
                    ))
                ) : (
                    <div style={{ color: "#64748b", textAlign: "center", padding: "32px" }}>No patients found.</div>
                )}
            </div>
        </div>
    );
}
