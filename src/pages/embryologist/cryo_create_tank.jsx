import React, { useState } from "react";
import "./cryo_create_tank.css";
import { createCryoTank } from "../../api/cryoApi";

// ── Icons ──────────────────────────────────────────────────────────────────────
function TankIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6">
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 7h8M8 12h8M8 17h4" />
      <circle cx="17" cy="17" r="1" fill="rgba(255,255,255,0.9)" stroke="none" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function DeployIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function DiscardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.4">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

const TANK_TYPES = [
  { value: "LN2",   label: "Liquid Nitrogen (LN2) - Manual" },
  { value: "LN2D",  label: "Liquid Nitrogen (LN2D) - Dry" },
  { value: "CO2",   label: "Carbon Dioxide (CO2)" },
  { value: "OTHER", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE",       label: "Active" },
  { value: "INACTIVE",     label: "Inactive" },
  { value: "MAINTENANCE",  label: "Maintenance" },
];

const FACILITY_RULES = [
  "Tanks must be calibrated every 180 days.",
  "Zone A-12 requires secondary seal verification.",
  "All new assets must pass initial QA inspection.",
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function CryoCreateTank({ onBack }) {
  const [form, setForm] = useState({
    name: "",
    tank_type: "",
    capacity: "",
    current_usage: 0,
    room: "",
    section: "",
    status: "ACTIVE",
    rfid_reader_id: "",
    last_maintenance: "",
    next_maintenance: "",
    notes: "",
    auto_alert: true,
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const previewProgress = form.name || form.tank_type ? 60 : 20;

  const handleDeploy = async () => {
    if (!form.name.trim()) { showToast("Asset Name / Tag ID is required.", "error"); return; }
    if (!form.tank_type)   { showToast("Please select a Tank Type.", "error"); return; }
    if (!form.capacity)    { showToast("Max Capacity is required.", "error"); return; }

    setLoading(true);
    try {
      const payload = {
        name:             form.name.trim(),
        tank_type:        form.tank_type || null,
        capacity:         form.capacity ? Number(form.capacity) : null,
        current_usage:    form.current_usage ? Number(form.current_usage) : 0,
        room:             form.room.trim(),
        section:          form.section.trim(),
        status:           form.status || null,
        rfid_reader_id:   form.rfid_reader_id.trim(),
        last_maintenance: form.last_maintenance || null,
        next_maintenance: form.next_maintenance || null,
        notes:            form.notes.trim(),
      };

      await createCryoTank(payload);
      showToast("Tank asset deployed successfully!", "success");
      setTimeout(() => { if (onBack) onBack(); }, 1800);
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        Object.values(err?.response?.data || {}).flat().join(" ") ||
        "Failed to deploy tank. Please try again.";
      showToast(detail, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    if (onBack) onBack();
  };

  return (
    <div className="cryo-page">
      {/* ── Breadcrumb ── */}
      <div className="cryo-breadcrumb">
        <button onClick={handleDiscard}>Tanks</button>
        <span>›</span>
        <span className="cryo-bc-current">Create New Tank</span>
      </div>

      {/* ── Header ── */}
      <div className="cryo-header">
        <div className="cryo-header-left">
          <h1>Configuration: New Tank Asset</h1>
          <p>Initialize a new cryogenic storage unit within your facility.</p>
        </div>
        <div className="cryo-header-actions">
          <button className="cryo-btn-cancel" onClick={handleDiscard}>Cancel</button>
          <button className="cryo-btn-deploy" onClick={handleDeploy} disabled={loading}>
            <DeployIcon />
            {loading ? "Deploying…" : "Deploy Asset"}
          </button>
        </div>
      </div>

      <hr className="cryo-divider" />

      {/* ── Body ── */}
      <div className="cryo-body">
        {/* Left column */}
        <div className="cryo-left-col">

          {/* Tank Information card */}
          <div className="cryo-card">
            <div className="cryo-card-title">
              <InfoIcon />
              Tank Information
            </div>

            <div className="cryo-form-grid">
              {/* Asset Name */}
              <div className="cryo-field">
                <label>Asset Name / Tag ID</label>
                <input
                  className="cryo-input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. TNK-2024-X4"
                />
                <span className="cryo-hint">UNIQUE IDENTIFIER FOR LABORATORY RECORDS</span>
              </div>

              {/* Tank Type */}
              <div className="cryo-field">
                <label>Tank Type</label>
                <select className="cryo-select" name="tank_type" value={form.tank_type} onChange={handleChange}>
                  <option value="">Select type…</option>
                  {TANK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Capacity */}
              <div className="cryo-field">
                <label>Max Capacity (Litres)</label>
                <div className="cryo-input-unit">
                  <input
                    className="cryo-input"
                    name="capacity"
                    type="number"
                    min="0"
                    value={form.capacity}
                    onChange={handleChange}
                    placeholder="230"
                  />
                  <span>L</span>
                </div>
              </div>

              {/* Status */}
              <div className="cryo-field">
                <label>Status</label>
                <select className="cryo-select" name="status" value={form.status} onChange={handleChange}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Notes / Description — full row */}
              <div className="cryo-field cryo-full">
                <label>Tank Description / Notes</label>
                <textarea
                  className="cryo-textarea"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Primary storage for cardiac stem cell lineages…"
                />
              </div>
            </div>
          </div>

          {/* Lower 2-col grid */}
          <div className="cryo-lower-grid">

            {/* Placement Location */}
            <div className="cryo-card">
              <div className="cryo-card-title">
                <LocationIcon />
                Placement Location
              </div>

              <div className="cryo-form-grid">
                <div className="cryo-field">
                  <label>Facility Room</label>
                  <input
                    className="cryo-input"
                    name="room"
                    value={form.room}
                    onChange={handleChange}
                    placeholder="e.g. Level 1 - Main Biobank"
                  />
                </div>
                <div className="cryo-field">
                  <label>Section / Bay</label>
                  <input
                    className="cryo-input"
                    name="section"
                    value={form.section}
                    onChange={handleChange}
                    placeholder="e.g. Bay 04-A"
                  />
                </div>
              </div>

              <div className="cryo-map-placeholder">
                <MapIcon />
                <span>Interactive Map Unavailable</span>
              </div>
            </div>

            {/* Maintenance & Compliance */}
            <div className="cryo-card">
              <div className="cryo-card-title">
                <WrenchIcon />
                Maintenance &amp; Compliance
              </div>

              <div className="cryo-form-grid">
                <div className="cryo-field">
                  <label>Last Calibration Date</label>
                  <input
                    className="cryo-input"
                    name="last_maintenance"
                    type="date"
                    value={form.last_maintenance}
                    onChange={handleChange}
                  />
                </div>
                <div className="cryo-field">
                  <label>Next Service Due</label>
                  <input
                    className="cryo-input"
                    name="next_maintenance"
                    type="date"
                    value={form.next_maintenance}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* RFID */}
              <div className="cryo-field" style={{ marginTop: "16px" }}>
                <label>RFID Reader ID</label>
                <div className="cryo-rfid-row">
                  <input
                    className="cryo-input"
                    name="rfid_reader_id"
                    value={form.rfid_reader_id}
                    onChange={handleChange}
                    placeholder="RF-X99-001"
                  />
                  <button className="cryo-btn-scan" type="button">
                    <ScanIcon /> Scan
                  </button>
                </div>
              </div>

              {/* Auto-Alert toggle */}
              <div className="cryo-toggle-row">
                <div className="cryo-toggle-wrap">
                  <label>Auto-Alert System</label>
                  <p>Notify maintenance team 14 days before due date.</p>
                </div>
                <label className="cryo-toggle">
                  <input
                    type="checkbox"
                    name="auto_alert"
                    checked={form.auto_alert}
                    onChange={handleChange}
                  />
                  <span className="cryo-slider" />
                </label>
              </div>
            </div>

          </div>{/* end lower grid */}

          {/* ── Footer bar ── */}
          <div className="cryo-footer-bar">
            <div className="cryo-footer-approvals">
              <div className="cryo-avatar-stack">
                <div className="cryo-avatar-chip">JD</div>
                <div className="cryo-avatar-chip">SM</div>
              </div>
              <span>Approvals pending from Lab Lead and QA Manager.</span>
            </div>
            <div className="cryo-footer-actions">
              <button className="cryo-btn-discard" onClick={handleDiscard}>
                <DiscardIcon /> Discard Draft
              </button>
              <button className="cryo-btn-deploy-footer" onClick={handleDeploy} disabled={loading}>
                <DeployIcon />
                {loading ? "Deploying…" : "Deploy Asset"}
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="cryo-right-col">

          {/* Asset Preview card */}
          <div className="cryo-preview-card">
            <div className="cryo-preview-icon">
              <TankIcon />
            </div>
            <div className="cryo-preview-title">Asset Preview</div>
            <div className="cryo-preview-sub">
              Real-time status will sync once the RFID Reader is online.
            </div>
            <div className="cryo-progress-bar">
              <div className="cryo-progress-fill" style={{ width: `${previewProgress}%` }} />
            </div>
            <div className="cryo-preview-status">INITIALIZING…</div>
          </div>

          {/* Facility rules card */}
          <div className="cryo-rules-card">
            <div className="cryo-rules-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              Facility Rules
            </div>
            <ul className="cryo-rules-list">
              {FACILITY_RULES.map((r, i) => (
                <li key={i}>
                  <div className="cryo-rules-check"><CheckCircle /></div>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`cryo-toast cryo-toast-${toast.type}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
