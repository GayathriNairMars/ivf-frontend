import React, { useState, useEffect } from "react";
import { getCryoTank, updateCryoTank, deleteCryoTank } from "../../api/cryoApi";
import "./cryo_tank_details.css";
import { 
  ArrowLeft, Edit3, Trash2, Shield, Calendar, User, 
  MapPin, AlertTriangle, Layers, Database, Play, Info,
  Radio, StickyNote, Wrench
} from "lucide-react";

export default function CryoTankDetails({ tankId, onBack }) {
  const [tank, setTank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", capacity: "", status: "" });
  const [saving, setSaving] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const triggerToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTankDetails = async () => {
    if (!tankId) return;
    setLoading(true);
    try {
      const res = await getCryoTank(tankId);
      setTank(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load tank details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTankDetails();
  }, [tankId]);

  // Handle Deletion
  const handleDelete = async () => {
    if (!tank) return;
    if (window.confirm(`Are you sure you want to delete tank "${tank.name}"? This action cannot be undone.`)) {
      try {
        await deleteCryoTank(tank.id);
        alert(`Tank "${tank.name}" deleted successfully.`);
        if (onBack) onBack();
      } catch (err) {
        console.error(err);
        triggerToast("Failed to delete tank. Please try again.", "error");
      }
    }
  };

  // Open Edit Modal
  const openEditModal = () => {
    if (!tank) return;
    setEditForm({
      name: tank.name || "",
      capacity: tank.capacity || "",
      status: tank.status || "ACTIVE"
    });
    setShowEditModal(true);
  };

  // Save changes
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      triggerToast("Tank name is required.", "error");
      return;
    }
    if (!editForm.capacity) {
      triggerToast("Capacity is required.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...tank,
        name: editForm.name.trim(),
        capacity: Number(editForm.capacity),
        status: editForm.status
      };
      await updateCryoTank(tank.id, payload);
      triggerToast("Tank details updated successfully.");
      setShowEditModal(false);
      fetchTankDetails();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update tank details.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cryo-details-state-container">
        <div className="spinner"></div>
        <p>Retrieving tank containment metrics...</p>
      </div>
    );
  }

  if (error || !tank) {
    return (
      <div className="cryo-details-state-container error">
        <AlertTriangle size={36} />
        <p>{error || "No tank selected."}</p>
        <button className="details-back-btn" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Tanks List
        </button>
      </div>
    );
  }

  // Derived details
  const usagePercent = tank.capacity > 0 ? (tank.current_usage / tank.capacity) * 100 : 0;
  const availableSpace = tank.available_space ?? Math.max(tank.capacity - tank.current_usage, 0);
  
  // Refill estimation logic
  const daysToRefill = tank.status === "MAINTENANCE" 
    ? "N/A" 
    : usagePercent > 80 
      ? "6 Days" 
      : usagePercent > 50 
        ? "14 Days" 
        : "28 Days";

  // Mock Canister Configurations
  const canisters = [
    { id: "CAN-01", label: "Hematology Samples", current: 450, capacity: 500, status: "90% Full", color: "purple" },
    { id: "CAN-02", label: "Oncology Biopsies", current: 120, capacity: 500, status: "24% Full", color: "teal" },
    { id: "CAN-03", label: "Viral Strains", current: 495, capacity: 500, status: "Critical Cap.", color: "red" },
    { id: "CAN-04", label: "Unassigned", current: 0, capacity: 500, status: "Empty", color: "grey" }
  ];

  // Mock Storage History
  const storageHistory = [
    { id: "ST-882-90", type: "Serum Archive", canister: "CAN-01", time: "Oct 14, 2023 · 09:12", tech: "Sarah Jenkins", status: "Logged" },
    { id: "ST-882-89", type: "RNA Extract", canister: "CAN-02", time: "Oct 13, 2023 · 14:45", tech: "Michael Chen", status: "Logged" },
    { id: "ST-882-88", type: "Marrow Cells", canister: "CAN-03", time: "Oct 12, 2023 · 11:20", tech: "Dr. H. Vance", status: "Logged" },
    { id: "ST-882-87", type: "Plasma Pack", canister: "CAN-01", time: "Oct 10, 2023 · 16:05", tech: "Sarah Jenkins", status: "Relocated" }
  ];

  return (
    <div className="cryo-details-container">
      {/* ── Breadcrumb & Header Navigation ── */}
      <div className="cryo-details-topbar">
        <button className="details-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </button>
        
        <div className="details-action-buttons">
          <button className="details-btn-edit" onClick={openEditModal}>
            <Edit3 size={14} /> Edit Tank
          </button>
          <button className="details-btn-delete" onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="cryo-details-header">
        <div>
          <h1>{tank.name} Details</h1>
          <p>Real-time telemetry, location specifications, and container logs.</p>
        </div>
        <div className="status-indicator-bar">
          {tank.tank_type_display && (
            <span className="tank-type-pill">{tank.tank_type_display}</span>
          )}
          <span className={`status-badge large ${
            tank.status === "ACTIVE" ? "active" : tank.status === "MAINTENANCE" ? "maintenance" : "inactive"
          }`}>
            Status: {tank.status_display || tank.status}
          </span>
        </div>
      </div>

      {/* ── Top Grid (Capacity & Location) ── */}
      <div className="cryo-details-main-grid">
        {/* Capacity overview card */}
        <div className="details-card capacity-overview-card">
          <div className="details-card-header">
            <h3>Capacity Overview</h3>
            <span className="telemetry-pill">Status: Optimal</span>
          </div>
          <p className="card-subtitle">Real-time nitrogen level and volume metrics.</p>

          <div className="telemetry-stats-row">
            <div className="stat-box">
              <span className="stat-label">Internal Temp</span>
              <span className="stat-value text-purple">-196°C</span>
              <span className="stat-status-badge text-green">&#9679; Stable</span>
            </div>
            
            <div className="stat-box">
              <span className="stat-label">LN2 Level</span>
              <span className="stat-value">{usagePercent.toFixed(0)}%</span>
              <div className="details-mini-progress">
                <div 
                  className="details-mini-progress-fill" 
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            </div>

            <div className="stat-box">
              <span className="stat-label">Available Space</span>
              <span className="stat-value text-teal">{availableSpace} L</span>
              <span className="stat-date-sub">of {tank.capacity} L total</span>
            </div>

            <div className="stat-box">
              <span className="stat-label">Days to Refill</span>
              <span className="stat-value text-indigo">{daysToRefill}</span>
              <span className="stat-date-sub">Est. calibration cycle</span>
            </div>
          </div>

          <div className="sensor-telemetry-feed">
            <div className="feed-header">
              <Database size={13} />
              <span>Sensor Telemetry Flow: S-992-A</span>
            </div>
            <div className="telemetry-feed-lines">
              <code>[OK] - Sensor telemetry flow is stable.</code>
              <code>[INFO] - Current storage usage represents {tank.current_usage} of {tank.capacity} Litres.</code>
            </div>
          </div>
        </div>

        {/* Facility location card */}
        <div className="details-card facility-location-card">
          <div className="details-card-header">
            <h3>Facility Location</h3>
          </div>
          <p className="card-subtitle">Placement bay alignment inside biobank.</p>

          <div className="facility-map-visual">
            <div className="zone-label-badge">Room: {tank.room || "Lab Room"}</div>
            <div className="visual-locator">
              <MapPin size={24} className="locator-pin-icon" />
              <span>{tank.section || "Section Undefined"}</span>
            </div>
          </div>

          <div className="location-details-list">
            <div className="loc-row">
              <span className="loc-label"><Layers size={13} /> Rack Position</span>
              <span className="loc-value">{tank.section || "Grid-44-Alpha"}</span>
            </div>
            <div className="loc-row">
              <span className="loc-label"><Radio size={13} /> RFID Reader ID</span>
              <span className="loc-value">{tank.rfid_reader_id || "—"}</span>
            </div>
            <div className="loc-row">
              <span className="loc-label"><Calendar size={13} /> Last Inspection</span>
              <span className="loc-value">{tank.last_maintenance || "—"}</span>
            </div>
            <div className="loc-row">
              <span className="loc-label"><Wrench size={13} /> Next Maintenance</span>
              <span className="loc-value">{tank.next_maintenance || "—"}</span>
            </div>
            <div className="loc-row">
              <span className="loc-label"><User size={13} /> Lead Tech</span>
              <span className="loc-value">Sarah Jenkins</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notes ── */}
      {tank.notes && (
        <div className="details-section-container">
          <div className="details-card notes-card">
            <div className="details-card-header">
              <h3><StickyNote size={14} style={{ marginRight: "6px", verticalAlign: "-2px" }} />Tank Notes</h3>
            </div>
            <p className="tank-notes-text">{tank.notes}</p>
          </div>
        </div>
      )}

      {/* ── Canister Configuration ── */}
      <div className="details-section-container">
        <div className="section-title-row">
          <h3>Canister Configuration</h3>
          <button className="provision-canister-btn" onClick={() => alert("Provision Canister pipeline is starting...")}>
            + Provision New Canister
          </button>
        </div>

        <div className="canisters-grid">
          {canisters.map((can) => {
            const pct = (can.current / can.capacity) * 100;
            return (
              <div key={can.id} className={`canister-card color-${can.color}`}>
                <div className="canister-header">
                  <div className="canister-icon-wrap">
                    <Layers size={16} />
                  </div>
                  <span className="can-badge">{can.id}</span>
                </div>
                
                <h4 className="can-title">{can.label}</h4>
                <span className="can-subtitle">Capacity: {can.current}/{can.capacity} units</span>

                <div className="canister-progress-track">
                  <div className="canister-progress-fill" style={{ width: `${pct}%` }} />
                </div>

                <div className="canister-card-footer">
                  <span className="can-status-pct">{can.status}</span>
                  <button className="can-action-link" onClick={() => alert(`Viewing contents of ${can.id}...`)}>
                    View Contents
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent Storages Table ── */}
      <div className="details-section-container">
        <div className="section-title-row">
          <h3>Recent Storages in this Tank</h3>
          <span className="recent-storages-days-sub">Last 30 Days</span>
        </div>

        <div className="details-table-wrapper">
          <table className="details-table">
            <thead>
              <tr>
                <th>Storage ID</th>
                <th>Sample Type</th>
                <th>Canister</th>
                <th>Timestamp</th>
                <th>Technician</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {storageHistory.map((hist) => (
                <tr key={hist.id}>
                  <td><span className="hist-id-bold">{hist.id}</span></td>
                  <td>{hist.type}</td>
                  <td><span className="hist-can-tag">{hist.canister}</span></td>
                  <td>{hist.time}</td>
                  <td>{hist.tech}</td>
                  <td>
                    <span className={`hist-status-dot ${hist.status.toLowerCase()}`}>
                      &#9679; {hist.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="details-table-footer">
          <button className="view-history-link" onClick={() => alert("Loading all storage logs...")}>
            View All Storage History
          </button>
        </div>
      </div>

      {/* ── Update Status & Details Modal ── */}
      {showEditModal && (
        <div className="cryo-modal-overlay">
          <div className="cryo-modal">
            <div className="cryo-modal-header">
              <h3>Update Tank Status &amp; Configuration</h3>
              <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} className="cryo-modal-form">
              <div className="modal-field">
                <label>Tank Name / Tag ID</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Tank A"
                  required
                />
              </div>

              <div className="modal-field">
                <label>Max Capacity (Litres)</label>
                <input 
                  type="number" 
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  placeholder="e.g. 250"
                  min="1"
                  required
                />
              </div>

              <div className="modal-field">
                <label>Operational Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="modal-btn-cancel" 
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn-save" 
                  disabled={saving}
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`cryo-details-toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}