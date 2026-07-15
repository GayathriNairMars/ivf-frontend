import React, { useState, useEffect } from "react";
import { getCryoGoblet } from "../../api/cryoApi";
import "./cryo_goblet_details.css";
import {
  ArrowLeft, Printer, ArrowLeftRight, Info, MapPin,
  Clock, ExternalLink, Copy, Check, AlertTriangle
} from "lucide-react";

export default function CryoGobletDetails({ gobletId, onBack }) {
  const [goblet, setGoblet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch Goblet details
  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await getCryoGoblet(gobletId);
      setGoblet(res.data || null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch goblet details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gobletId) {
      fetchDetails();
    }
  }, [gobletId]);

  const handleCopyPath = (pathText) => {
    navigator.clipboard.writeText(pathText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="gob-det-loader">
        <div className="gob-det-spinner" />
        <p>Retrieving goblet configuration...</p>
      </div>
    );
  }

  if (error || !goblet) {
    return (
      <div className="gob-det-error">
        <AlertTriangle size={32} color="#dc2626" />
        <p>{error || "Goblet not found."}</p>
        <button className="gob-det-retry-btn" onClick={onBack}>
          Go Back
        </button>
      </div>
    );
  }

  // Parse parent locations from cane_info
  // Format is: "Tank A - Canister B - Cane 3"
  const infoParts = (goblet.cane_info || "").split(" - ");
  const tankName = infoParts[0] ? infoParts[0].replace("Tank ", "") : "A";
  const canisterName = infoParts[1] ? infoParts[1].replace("Canister ", "") : "B";
  const caneName = infoParts[2] ? infoParts[2].replace("Cane ", "") : "3";
  const positionName = "2"; // mock default position index

  const fullPath = `FAC-A9 / TANK-${tankName.toUpperCase()} / CAN-${canisterName.toUpperCase()} / CANE-${caneName.toUpperCase()} / POS-${positionName}`;

  const colorHexes = {
    WHITE: "#ffffff",
    RED: "#ef4444",
    BLUE: "#3b82f6",
    GREEN: "#10b981",
    YELLOW: "#f59e0b",
    PURPLE: "#8b5cf6",
    ORANGE: "#f97316",
    PINK: "#ec4899",
  };
  const selectedColorHex = colorHexes[goblet.color] || "#cbd5e1";

  // Mock location logs
  const AUDIT_LOGS = [
    {
      dateTime: "2026-07-02 14:22:11",
      action: "Sample Ingress",
      origin: "Receiving Station 4",
      destination: `Tank ${tankName}-${canisterName}-${caneName}-${positionName}`,
      operator: "S. Chen (Lead)",
      verification: "Dual-Signoff",
      badgeType: "check",
    },
    {
      dateTime: "2026-06-15 09:10:45",
      action: "Sterilization",
      origin: "Autoclave Unit 2",
      destination: "Dry Storage B1",
      operator: "M. Kostic",
      verification: "Automated",
      badgeType: "auto",
    },
    {
      dateTime: "2025-10-12 11:30:00",
      action: "Annual Inspection",
      origin: "Dry Storage B1",
      destination: "Dry Storage B1",
      operator: "Quality Control",
      verification: "Pass",
      badgeType: "pass",
    },
    {
      dateTime: "2025-01-05 16:45:12",
      action: "Relocation",
      origin: "Storage Shelf 42",
      destination: "Autoclave Unit 2",
      operator: "J. Doe",
      verification: "Info",
      badgeType: "info",
    },
  ];

  return (
    <div className="gob-det-container">
      {/* Breadcrumb */}
      <div className="gob-det-breadcrumb">
        <button onClick={onBack}>Inventory</button>
        <span>›</span>
        <button onClick={onBack}>Goblets Management</button>
        <span>›</span>
        <span className="gob-det-bc-current">{goblet.goblet_number}</span>
      </div>

      {/* Header */}
      <div className="gob-det-header">
        <div className="gob-det-header-left">
          <button className="gob-det-back-arrow-btn" onClick={onBack} title="Back to list">
            <ArrowLeft size={16} />
          </button>
          <div className="gob-det-title-group">
            <h1>
              {goblet.goblet_number}
              <span
                className={`status-badge ${
                  goblet.status === "OCCUPIED" ? "badge-occupied" : "badge-empty"
                }`}
              >
                {goblet.status_display || goblet.status}
              </span>
            </h1>
            <div className="gob-det-title-meta">
              <span>#{goblet.goblet_rfid || "NO-RFID"}</span>
            </div>
          </div>
        </div>

        <div className="gob-det-header-actions">
          <button
            className="gob-det-print-btn"
            onClick={() => alert(`Printing barcode label for ${goblet.goblet_number}`)}
          >
            <Printer size={14} /> Print Label
          </button>
          <button
            className="gob-det-relocate-btn"
            onClick={() => alert(`Initiating relocation workflow for Goblet ID: ${goblet.id}`)}
          >
            <ArrowLeftRight size={14} /> Relocate Goblet
          </button>
        </div>
      </div>

      {/* Two columns spec details */}
      <div className="gob-det-grid">
        {/* Goblet Info Card */}
        <div className="gob-det-card">
          <div className="gob-det-card-title">
            <Info size={16} /> Goblet Information
          </div>

          <div className="gob-det-info-list">
            <div className="gob-det-info-item">
              <span className="gob-det-info-label">Identifier</span>
              <span className="gob-det-info-value">{goblet.goblet_number}</span>
            </div>

            <div className="gob-det-info-item">
              <span className="gob-det-info-label">Assigned Color</span>
              <span className="gob-det-info-value">
                <span
                  className="gob-det-color-square"
                  style={{ backgroundColor: selectedColorHex }}
                />
                {goblet.color_display || goblet.color}
              </span>
            </div>

            <div className="gob-det-info-item">
              <span className="gob-det-info-label">Status</span>
              <span className="gob-det-info-value">{goblet.status_display || goblet.status}</span>
            </div>

            <div className="gob-det-info-item">
              <span className="gob-det-info-label">RFID Tag</span>
              <span className="gob-det-info-value">{goblet.goblet_rfid || "—"}</span>
            </div>

            <div className="gob-det-info-item">
              <span className="gob-det-info-label">Last Inspection</span>
              <span className="gob-det-info-value">Oct 12, 2025</span>
            </div>

            <div className="gob-det-info-item">
              <span className="gob-det-info-label">Service Life</span>
              <span className="gob-det-info-value">4.2 / 10 Years</span>
            </div>
          </div>
        </div>

        {/* Storage Location Card */}
        <div className="gob-det-card">
          <div className="gob-det-card-title">
            <MapPin size={16} /> Storage Location
          </div>

          <div className="gob-det-info-list">
            <div className="gob-det-info-item">
              <span className="gob-det-info-label">Tank</span>
              <span className="gob-det-info-value">{tankName}</span>
            </div>

            <div className="gob-det-info-item">
              <span className="gob-det-info-label">Canister</span>
              <span className="gob-det-info-value">{canisterName}</span>
            </div>

            <div className="gob-det-info-item">
              <span className="gob-det-info-label">Cane</span>
              <span className="gob-det-info-value">{caneName}</span>
            </div>

            <div className="gob-det-info-item">
              <span className="gob-det-info-label">Position</span>
              <span className="gob-det-info-value">{positionName}</span>
            </div>

            <div className="gob-det-path-section">
              <span className="gob-det-info-label">Full Path String</span>
              <div className="gob-det-path-box" style={{ marginTop: "6px" }}>
                <span>{fullPath}</span>
                <button
                  className="gob-det-copy-btn"
                  onClick={() => handleCopyPath(fullPath)}
                  title="Copy path"
                >
                  {copied ? (
                    <Check size={14} style={{ color: "#10b981" }} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sample Section */}
      <div className="gob-det-card" style={{ marginBottom: "20px" }}>
        <div className="gob-det-card-title" style={{ justifyContent: "space-between" }}>
          <span>Active Sample Information</span>
          <button className="sample-link-btn" onClick={() => alert("Opening full Patient Record...")}>
            View Full Patient Record <ExternalLink size={12} />
          </button>
        </div>

        {goblet.status === "OCCUPIED" ? (
          <div className="sample-info-layout">
            <div className="sample-image-box">
              {/* Premium micro SVG graphic of cell viability */}
              <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ background: "#0f172a" }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                {/* Tadpole/Sperm cell shapes */}
                <path d="M40 38 C38 40, 32 46, 30 45 C28 44, 25 45, 23 48" fill="none" stroke="#a7f3d0" strokeWidth="1" />
                <circle cx="41" cy="37" r="2.5" fill="#a7f3d0" />

                <path d="M55 58 C53 62, 48 68, 48 72 C48 76, 49 80, 47 84" fill="none" stroke="#38bdf8" strokeWidth="1" />
                <circle cx="56" cy="57" r="2.5" fill="#38bdf8" />

                <path d="M62 33 C66 31, 72 29, 75 30 C78 31, 82 28, 85 27" fill="none" stroke="#f472b6" strokeWidth="1" />
                <circle cx="61" cy="34" r="2" fill="#f472b6" />

                <path d="M32 65 C33 69, 31 75, 29 78 C27 81, 28 85, 26 88" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
                <circle cx="32" cy="64" r="1.5" fill="#cbd5e1" />
                
                {/* Center crosshairs */}
                <line x1="50" y1="5" x2="50" y2="12" stroke="#475569" strokeWidth="1" />
                <line x1="50" y1="88" x2="50" y2="95" stroke="#475569" strokeWidth="1" />
                <line x1="5" y1="50" x2="12" y2="50" stroke="#475569" strokeWidth="1" />
                <line x1="88" y1="50" x2="95" y2="50" stroke="#475569" strokeWidth="1" />
              </svg>
            </div>

            <div className="sample-details-column">
              <div className="sample-top-header">
                <span className="sample-id-label">SAMPLE ID: SPERM-2026-001</span>
                <div className="sample-staff-badge">
                  <span /> Verified by 2 Staff
                </div>
              </div>

              <div className="sample-properties-grid">
                <div className="gob-det-info-item">
                  <span className="gob-det-info-label">Patient Name</span>
                  <span className="gob-det-info-value">Amal Sreenivas</span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>MRN: #440-291-002</span>
                </div>

                <div className="gob-det-info-item">
                  <span className="gob-det-info-label">Sample Type</span>
                  <span className="gob-det-info-value">Sperm</span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Media: CryoClear™ V2</span>
                </div>

                <div className="gob-det-info-item">
                  <span className="gob-det-info-label">Storage Dates</span>
                  <span className="gob-det-info-value">2026-07-02</span>
                  <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600" }}>Exp: 2036-07-02</span>
                </div>

                <div className="gob-det-info-item">
                  <span className="gob-det-info-label">Vial Count</span>
                  <span className="gob-det-info-value">12 / 12</span>
                </div>

                <div className="gob-det-info-item">
                  <span className="gob-det-info-label">Current Temp</span>
                  <span className="gob-det-info-value">-196.2°C</span>
                </div>

                <div className="gob-det-info-item">
                  <span className="gob-det-info-label">Protocol</span>
                  <span className="gob-det-info-value">Rapid Freezing (B)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="gob-det-info-value" style={{ color: "#64748b", padding: "12px 0" }}>
            <Info size={16} /> No active specimen is currently stored in this goblet. It is ready for allocation.
          </div>
        )}
      </div>

      {/* Audit Logs Section */}
      <div className="gob-det-card">
        <div className="gob-det-card-title">
          <Clock size={16} /> Location History &amp; Audit Log
        </div>

        <div className="gob-history-top">
          <span>Displaying last 12 months</span>
          <button className="gob-det-print-btn" style={{ padding: "6px 12px" }} onClick={() => alert("Downloading logs PDF...")}>
            Download Logs
          </button>
        </div>

        <table className="gob-history-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Action</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Operator</th>
              <th>Verification</th>
            </tr>
          </thead>
          <tbody>
            {AUDIT_LOGS.map((log, index) => (
              <tr key={index}>
                <td>{log.dateTime}</td>
                <td>
                  <span className="history-action-text">
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: log.badgeType === "check" ? "#10b981" : "#64748b",
                        display: "inline-block",
                      }}
                    />
                    {log.action}
                  </span>
                </td>
                <td>{log.origin}</td>
                <td>
                  <span className="history-dest-bold">{log.destination}</span>
                </td>
                <td>
                  <div className="history-tech-cell">
                    <span
                      className="history-tech-avatar"
                      style={{
                        backgroundColor: index % 2 === 0 ? "#0d9488" : "#8b5cf6",
                      }}
                    >
                      {log.operator.split(" ").map((w) => w[0]).join("")}
                    </span>
                    {log.operator}
                  </div>
                </td>
                <td>
                  <span
                    className={`history-signoff-badge ${
                      log.badgeType === "check" || log.badgeType === "pass"
                        ? "check"
                        : log.badgeType === "auto"
                        ? "auto"
                        : ""
                    }`}
                  >
                    {log.verification}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="gob-history-footer">
          <span>System records indicate this Goblet has maintained 100% temperature integrity since Sample Ingress.</span>
          <div className="pagination-buttons">
            <button className="pagination-btn" disabled>Previous</button>
            <button className="pagination-btn" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
