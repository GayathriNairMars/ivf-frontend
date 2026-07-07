import React, { useState, useEffect } from "react";
import { getCryoCane, updateCryoCane, deleteCryoCane } from "../../api/cryoApi";
import "./cryo_cane_details.css";
import {
  Edit2, Trash2, Info, BarChart2, Grid3x3, Clock,
  ExternalLink, CheckCircle2, Wifi, Database,
} from "lucide-react";

// Sample storage history data (API doesn't provide this yet)
const SAMPLE_HISTORY = [
  { sampleId: "SMP-77201", patient: "Jonathan Doe", goblet: "G1", date: "2023-10-24 09:12", tech: { initials: "AS", name: "A. Stevens", color: "#0d9488" }, status: "Deposited" },
  { sampleId: "SMP-77205", patient: "Maria Garcia", goblet: "G2", date: "2023-10-24 09:15", tech: { initials: "AS", name: "A. Stevens", color: "#0d9488" }, status: "Deposited" },
  { sampleId: "SMP-66892", patient: "K. Thompson", goblet: "G4", date: "2023-10-22 14:02", tech: { initials: "ML", name: "M. Lawson", color: "#8b5cf6" }, status: "Deposited" },
  { sampleId: "SMP-55102", patient: "Robert Chen", goblet: "G6", date: "2023-10-21 11:45", tech: { initials: "ML", name: "M. Lawson", color: "#8b5cf6" }, status: "Deposited" },
  { sampleId: "SMP-44231", patient: "Sarah Miller", goblet: "G8", date: "2023-10-20 16:30", tech: { initials: "AS", name: "A. Stevens", color: "#0d9488" }, status: "Deposited" },
];

export default function CryoCaneDetails({ caneId, onBack }) {
  const [cane, setCane] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit modal
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    cane_number: "", capacity: "", cane_rfid: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCane = async () => {
    setLoading(true);
    try {
      const res = await getCryoCane(caneId);
      setCane(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load cane details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caneId) fetchCane();
  }, [caneId]);

  // ── Edit ──
  const openEdit = () => {
    if (!cane) return;
    setEditForm({
      cane_number: cane.cane_number || "",
      capacity: cane.capacity || "",
      cane_rfid: cane.cane_rfid || "",
      notes: cane.notes || "",
    });
    setEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.cane_number.trim()) {
      showToast("Cane number is required.", "error");
      return;
    }
    setSaving(true);
    try {
      await updateCryoCane(caneId, {
        cane_number: editForm.cane_number.trim(),
        capacity: Number(editForm.capacity),
        cane_rfid: editForm.cane_rfid.trim() || null,
        notes: editForm.notes.trim(),
      });
      showToast("Cane updated successfully.");
      setEditing(false);
      fetchCane();
    } catch (err) {
      console.error(err);
      showToast("Failed to update cane.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${cane?.cane_number}"? This action cannot be undone.`)) return;
    try {
      await deleteCryoCane(caneId);
      showToast("Cane deleted successfully.");
      setTimeout(() => onBack && onBack(), 1200);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete cane.", "error");
    }
  };

  // ── Loading / Error states ──
  if (loading) {
    return (
      <div className="cane-det-container">
        <div className="cane-det-loader">
          <div className="cane-det-spinner" />
          <p>Loading cane details...</p>
        </div>
      </div>
    );
  }

  if (error || !cane) {
    return (
      <div className="cane-det-container">
        <div className="cane-det-error">
          <Info size={32} />
          <p>{error || "Cane not found."}</p>
          <button className="cane-det-retry-btn" onClick={fetchCane}>Retry</button>
          <button className="cane-det-back-btn" onClick={onBack}>← Back to Canes</button>
        </div>
      </div>
    );
  }

  // ── Computed values ──
  const usagePercent = cane.capacity > 0 ? ((cane.current_usage || 0) / cane.capacity) * 100 : 0;
  const infoParts = (cane.canister_info || "").split(" - ");
  const tankName = infoParts[0] || "—";
  const canisterName = infoParts.length > 1 ? infoParts.slice(1).join(" - ") : `Canister #${cane.canister}`;

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "2-digit",
    }) + " • " + d.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const goblets = Array.from({ length: cane.capacity }, (_, i) => ({
    label: `G${i + 1}`,
    filled: i < (cane.current_usage || 0),
  }));

  return (
    <div className="cane-det-container">
      {/* ── Breadcrumb ── */}
      <div className="cane-det-breadcrumb">
        <button onClick={onBack}>Inventory</button>
        <span>›</span>
        <button onClick={onBack}>Canes</button>
        <span>›</span>
        <span className="cane-det-bc-current">{cane.cane_number}</span>
      </div>

      {/* ── Header ── */}
      <div className="cane-det-header">
        <h1>{cane.cane_number} Details</h1>
        <div className="cane-det-header-actions">
          <button className="cane-det-btn-edit" onClick={openEdit}>
            <Edit2 size={14} /> Edit
          </button>
          <button className="cane-det-btn-delete" onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* ── Top Two-Column Grid ── */}
      <div className="cane-det-top-grid">
        {/* Cane Information */}
        <div className="cane-det-card">
          <div className="cane-det-card-title">
            <Info size={16} /> Cane Information
          </div>
          <div className="cane-info-grid">
            <div className="cane-info-item">
              <span className="cane-info-label">CANE ID</span>
              <span className="cane-info-value">{cane.cane_number}</span>
            </div>
            <div className="cane-info-item">
              <span className="cane-info-label">RFID TAG</span>
              <span className="cane-info-value">{cane.cane_rfid || "Not Assigned"}</span>
            </div>
            <div className="cane-info-item">
              <span className="cane-info-label">PARENT CANISTER</span>
              <span className="cane-info-value">{canisterName}</span>
            </div>
            <div className="cane-info-item">
              <span className="cane-info-label">PARENT TANK</span>
              <span className="cane-info-value">{tankName}</span>
            </div>
            <div className="cane-info-item">
              <span className="cane-info-label">TOTAL CAPACITY</span>
              <span className="cane-info-value">{cane.capacity} Goblets</span>
            </div>
            <div className="cane-info-item">
              <span className="cane-info-label">LAST VERIFIED</span>
              <span className="cane-info-value">{formatDate(cane.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Usage Overview */}
        <div className="cane-det-card">
          <div className="cane-det-card-title" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart2 size={16} /> Usage Overview
            </span>
            <span className={`cane-usage-badge ${cane.is_full ? "full" : "active"}`}>
              <span className="cane-usage-dot" />
              {cane.is_full ? "Full" : "Active"}
            </span>
          </div>

          <div className="cane-usage-center">
            <div
              className="cane-usage-doughnut"
              style={{
                background: `conic-gradient(#0d9488 0% ${usagePercent}%, #e2e8f0 ${usagePercent}% 100%)`,
              }}
            >
              <div className="cane-usage-doughnut-inner">
                <span className="cane-usage-pct">{usagePercent.toFixed(0)}%</span>
                <span className="cane-usage-slots">{cane.current_usage || 0} / {cane.capacity} Slots</span>
              </div>
            </div>
          </div>

          <div className="cane-usage-bar-section">
            <span className="cane-usage-bar-label">Storage Utilization</span>
            <span className="cane-usage-bar-status">
              {usagePercent >= 90 ? "At Capacity" : "Optimal"}
            </span>
          </div>
          <div className="cane-usage-bar-track">
            <div
              className="cane-usage-bar-fill"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Goblet Configuration ── */}
      <div className="cane-det-card" style={{ marginTop: "20px" }}>
        <div className="cane-det-card-title" style={{ justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Grid3x3 size={16} /> Goblet Configuration
          </span>
          <div className="cane-goblet-legend">
            <span className="cane-legend-item">
              <span className="cane-legend-dot filled" /> Occupied ({cane.current_usage || 0})
            </span>
            <span className="cane-legend-item">
              <span className="cane-legend-dot empty" /> Empty ({cane.available_space || 0})
            </span>
            <span className="cane-legend-item">
              <span className="cane-legend-dot damaged" /> Damaged (0)
            </span>
          </div>
        </div>

        <div className="cane-goblet-grid">
          {goblets.map((g) => (
            <div key={g.label} className={`cane-goblet-slot ${g.filled ? "filled" : "empty"}`}>
              {g.filled ? (
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2v4l-2 10h12L16 6V2H8z" />
                  <path d="M6 16v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" />
                </svg>
              ) : (
                <span className="cane-goblet-plus">+</span>
              )}
              <span className="cane-goblet-label">{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Storage History ── */}
      <div className="cane-det-card" style={{ marginTop: "20px" }}>
        <div className="cane-det-card-title" style={{ justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={16} /> Storage History
          </span>
          <button className="cane-view-logs-btn" onClick={() => alert("Opening full logs...")}>
            View Full Logs <ExternalLink size={12} />
          </button>
        </div>

        <table className="cane-history-table">
          <thead>
            <tr>
              <th>Sample ID</th>
              <th>Patient</th>
              <th>Goblet Pos.</th>
              <th>Date / Timestamp</th>
              <th>Technician</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_HISTORY.map((row) => (
              <tr key={row.sampleId}>
                <td><span className="cane-sample-id">{row.sampleId}</span></td>
                <td>{row.patient}</td>
                <td>{row.goblet}</td>
                <td>{row.date}</td>
                <td>
                  <div className="cane-tech-cell">
                    <span className="cane-tech-avatar" style={{ background: row.tech.color }}>
                      {row.tech.initials}
                    </span>
                    {row.tech.name}
                  </div>
                </td>
                <td><span className="cane-status-deposited">{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Bottom Status Bar ── */}
      <div className="cane-det-statusbar">
        <span>Last synchronization: 2 minutes ago</span>
        <div className="cane-det-status-right">
          <span className="cane-status-nominal">
            <Wifi size={12} /> Systems Nominal
          </span>
          <span className="cane-status-db">
            <Database size={12} /> Database Connected
          </span>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editing && (
        <div className="cryo-modal-overlay">
          <div className="cryo-modal">
            <div className="cryo-modal-header">
              <h3>Edit Cane Configuration</h3>
              <button className="close-modal-btn" onClick={() => setEditing(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} className="cryo-modal-form">
              <div className="modal-field">
                <label>Cane Number / ID</label>
                <input
                  type="text"
                  value={editForm.cane_number}
                  onChange={(e) => setEditForm({ ...editForm, cane_number: e.target.value })}
                  required
                />
              </div>
              <div className="modal-field">
                <label>Total Capacity (Goblets)</label>
                <input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  min="1"
                  required
                />
              </div>
              <div className="modal-field">
                <label>RFID Tag UID</label>
                <input
                  type="text"
                  value={editForm.cane_rfid}
                  onChange={(e) => setEditForm({ ...editForm, cane_rfid: e.target.value })}
                  placeholder="e.g. RFID-CANE-003"
                />
              </div>
              <div className="modal-field">
                <label>Notes &amp; Observations</label>
                <textarea
                  style={{
                    padding: "10px 14px", border: "1.5px solid #e5e7eb",
                    borderRadius: "10px", fontSize: "13.5px", minHeight: "80px",
                    fontFamily: "inherit", outline: "none", width: "100%",
                  }}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-btn-cancel" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-save" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`cryo-toast cryo-toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
