// Patient Directory - Tab view with Add Patient and Manage Patients
import { useState } from "react";
import AddPatient from "./add_patient";
import ManagePatients from "./manage_patients";
import { UserPlus, Users } from "lucide-react";

export default function PatientDirectory() {
  const [tab, setTab] = useState("manage"); // "manage" | "add"

  const tabStyle = (key) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    border: "none",
    borderBottom: tab === key ? "2px solid #3b82f6" : "2px solid transparent",
    background: "none",
    color: tab === key ? "#3b82f6" : "#64748b",
    fontWeight: tab === key ? "600" : "500",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Tab Bar */}
      <div style={{
        background: "white",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        padding: "0 24px",
        gap: "8px",
        flexShrink: 0,
      }}>
        <button style={tabStyle("manage")} onClick={() => setTab("manage")}>
          <Users size={16} />
          Manage Patients
        </button>
        <button style={tabStyle("add")} onClick={() => setTab("add")}>
          <UserPlus size={16} />
          Add Patient
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "manage" ? (
          <ManagePatients onAddPatient={() => setTab("add")} />
        ) : (
          <AddPatient onBack={() => setTab("manage")} />
        )}
      </div>
    </div>
  );
}
