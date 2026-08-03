// Patient Directory - Tab view with Add Patient and Manage Patients
import { useState } from "react";
import AddPatient from "./add_patient";
import ManagePatients from "./manage_patients";
import { UserPlus, Users } from "lucide-react";

export default function PatientDirectory() {
  const [tab, setTab] = useState("manage"); // "manage" | "add"

  return (
    <div
      className="patient-directory-root"
      style={{ height: "100%", display: "flex", flexDirection: "column", marginTop: 0, paddingTop: 0 }}
    >
      {/* Top Segmented Tab Bar */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        padding: "12px 28px",
        flexShrink: 0,
        margin: 0,
      }}>
        <div className="rec-segmented-tabs">
          <button 
            className={`rec-segmented-tab ${tab === "manage" ? "active" : ""}`} 
            onClick={() => setTab("manage")}
          >
            <Users size={16} />
            Manage Patients
          </button>
          <button 
            className={`rec-segmented-tab ${tab === "add" ? "active" : ""}`} 
            onClick={() => setTab("add")}
          >
            <UserPlus size={16} />
            Register Patient
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: "auto", marginTop: 0, paddingTop: 0 }}>
        {tab === "manage" ? (
          <ManagePatients onAddPatient={() => setTab("add")} />
        ) : (
          <AddPatient onBack={() => setTab("manage")} />
        )}
      </div>
    </div>
  );
}