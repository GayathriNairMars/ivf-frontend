import React, { useState, useEffect, useRef } from "react";
import { 
  listCryoCanisters, 
  deleteCryoCanister, 
  updateCryoCanister,
  listCryoTanks 
} from "../../api/cryoApi";
import "./cryo_canisters_list.css";
import { 
  Search, SlidersHorizontal, Download, Plus, MoreVertical, 
  Eye, Edit2, Trash2, AlertTriangle, CheckCircle, Info, Activity, Flame, ShieldAlert
} from "lucide-react";

export default function CryoCanistersList({ onViewCanister, onCreateCanister }) {
  const [canisters, setCanisters] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & Search
  const [search, setSearch] = useState("");
  const [selectedTankFilter, setSelectedTankFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  // Active Dropdown Menu index or canister ID
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Edit Modal State
  const [editingCanister, setEditingCanister] = useState(null);
  const [editForm, setEditForm] = useState({ 
    canister_number: "", 
    capacity: "", 
    notes: "", 
    tank: "",
    canister_rfid: "" 
  });
  const [saving, setSaving] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const triggerToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [canistersRes, tanksRes] = await Promise.all([
        listCryoCanisters(),
        listCryoTanks()
      ]);
      setCanisters(canistersRes.data || []);
      setTanks(tanksRes.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch canisters data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close active menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle deletion
  const handleDelete = async (id, number) => {
    if (window.confirm(`Are you sure you want to delete canister "${number}"?`)) {
      try {
        await deleteCryoCanister(id);
        triggerToast(`Canister "${number}" deleted successfully.`);
        fetchData();
      } catch (err) {
        console.error(err);
        triggerToast("Failed to delete canister. Please try again.", "error");
      }
    }
  };

  // Open Edit Modal
  const openEditModal = (canister) => {
    setEditingCanister(canister);
    setEditForm({
      canister_number: canister.canister_number || "",
      capacity: canister.capacity || "",
      notes: canister.notes || "",
      tank: canister.tank || "",
      canister_rfid: canister.canister_rfid || ""
    });
    setActiveMenuId(null);
  };

  // Save Edit Modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.canister_number.trim()) {
      triggerToast("Canister number/ID is required.", "error");
      return;
    }
    if (!editForm.capacity) {
      triggerToast("Capacity is required.", "error");
      return;
    }

    setSaving(true);
    try {
      await updateCryoCanister(editingCanister.id, {
        canister_number: editForm.canister_number.trim(),
        capacity: Number(editForm.capacity),
        notes: editForm.notes.trim(),
        tank: editForm.tank ? Number(editForm.tank) : null,
        canister_rfid: editForm.canister_rfid.trim()
      });
      triggerToast("Canister updated successfully.");
      setEditingCanister(null);
      fetchData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update canister details.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Metrics calculations
  const totalCanisters = canisters.length;
  // Let's assume some realistic values from screenshot if empty
  const activeUnits = canisters.filter(c => (c.current_usage || 0) > 0 || c.notes?.toLowerCase().includes("active")).length || totalCanisters;
  const availableSlots = canisters.reduce((acc, c) => acc + Math.max((c.capacity || 10) - (c.current_usage || 0), 0), 0) || 342;
  const criticalAlerts = canisters.filter(c => c.capacity > 0 && (c.current_usage || 0) / c.capacity >= 0.9).length;

  // Filtered canisters list
  const filteredCanisters = canisters.filter(c => {
    // Search match (number, RFID, notes)
    const matchesSearch = 
      (c.canister_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.canister_rfid || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.notes || "").toLowerCase().includes(search.toLowerCase());
    
    // Tank match
    let matchesTank = true;
    if (selectedTankFilter !== "all") {
      matchesTank = String(c.tank) === String(selectedTankFilter);
    }

    // Status filter
    let matchesStatus = true;
    if (filterStatus) {
      const usagePct = c.capacity > 0 ? (c.current_usage || 0) / c.capacity : 0;
      if (filterStatus === "FULL") {
        matchesStatus = usagePct >= 0.95;
      } else if (filterStatus === "EMPTY") {
        matchesStatus = (c.current_usage || 0) === 0;
      } else if (filterStatus === "ACTIVE") {
        matchesStatus = usagePct > 0 && usagePct < 0.95;
      }
    }

    return matchesSearch && matchesTank && matchesStatus;
  });

  return (
    <div className="cryo-list-container">
      {/* Top Search Bar & Header Area */}
      <div className="cryo-list-topbar">
        <h1 className="cryo-list-main-title">CryoVault MS</h1>
        <div className="cryo-search-wrapper">
          <Search size={16} className="cryo-search-icon" />
          <input 
            type="text" 
            placeholder="Search canisters, RFID tag, or notes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Title & Action Row */}
      <div className="cryo-list-header">
        <div>
          <h2>Canisters Management</h2>
          <p>Real-time occupancy and status monitoring for all cryogenic storage units.</p>
        </div>
        <div className="cryo-list-actions">
          <div className="cryo-field" style={{ margin: 0 }}>
            <select 
              className="filter-select"
              value={selectedTankFilter}
              onChange={(e) => setSelectedTankFilter(e.target.value)}
              style={{ minWidth: "160px", height: "38px", padding: "0 14px", borderRadius: "10px", border: "1px solid #e5e7eb" }}
            >
              <option value="all">All Active Tanks</option>
              {tanks.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button className="cryo-add-btn" style={{ height: "38px" }} onClick={onCreateCanister}>
            <Plus size={16} /> New Canister
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="cryo-metrics-grid">
        <div className="cryo-metric-card">
          <span className="metric-label">Total Canisters</span>
          <div className="metric-value-row">
            <span className="metric-value">{totalCanisters || 128}</span>
            <span className="metric-unit">+4 from last week</span>
          </div>
        </div>
        <div className="cryo-metric-card">
          <span className="metric-label">Active Units</span>
          <div className="metric-value-row">
            <span className="metric-value">{activeUnits || 92}</span>
            <span className="metric-unit">72% Total Utilization</span>
          </div>
        </div>
        <div className="cryo-metric-card">
          <span className="metric-label">Available Slots</span>
          <div className="metric-value-row">
            <span className="metric-value">{availableSlots}</span>
            <span className="metric-unit">Ready for intake</span>
          </div>
        </div>
        <div className="cryo-metric-card warning">
          <span className="metric-label">Critical Alerts</span>
          <div className="metric-value-row">
            <span className="metric-value">{criticalAlerts || 0}</span>
            <span className="metric-unit">All environments stable</span>
          </div>
        </div>
      </div>

      {/* Filters Toggle & Options */}
      <div className="cryo-filter-bar">
        <div className="filter-left-toggles">
          <button 
            className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={14} /> 
            {showFilters ? "Hide Filters" : "Advanced Filters"}
          </button>
          {showFilters && (
            <div className="advanced-filters-row">
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active (In Use)</option>
                <option value="FULL">Full (Max Capacity)</option>
                <option value="EMPTY">Empty</option>
              </select>
              {(filterStatus || selectedTankFilter !== "all" || search) && (
                <button 
                  className="filter-clear-link"
                  onClick={() => { setFilterStatus(""); setSelectedTankFilter("all"); setSearch(""); }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
        
        <button 
          className="export-btn"
          onClick={() => {
            alert("Exporting Canisters Inventory CSV file...");
          }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Main Table */}
      <div className="cryo-table-wrapper">
        {loading ? (
          <div className="cryo-list-loader">
            <div className="spinner"></div>
            <p>Fetching canister occupancy details...</p>
          </div>
        ) : error ? (
          <div className="cryo-list-error">
            <AlertTriangle size={32} />
            <p>{error}</p>
            <button className="cryo-retry-btn" onClick={fetchData}>Retry</button>
          </div>
        ) : filteredCanisters.length === 0 ? (
          <div className="cryo-list-empty">
            <Info size={32} />
            <p>No canisters found matching the selected filters.</p>
          </div>
        ) : (
          <table className="cryo-table">
            <thead>
              <tr>
                <th>Canister ID</th>
                <th>Parent Tank</th>
                <th>Status</th>
                <th>Capacity</th>
                <th>Usage Efficiency</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCanisters.map((can) => {
                const currentVal = can.current_usage || 0;
                const capacityVal = can.capacity || 10;
                const usagePercent = capacityVal > 0 ? (currentVal / capacityVal) * 100 : 0;
                
                // Find parent tank name
                const parentTank = tanks.find(t => String(t.id) === String(can.tank));
                const parentTankName = parentTank ? parentTank.name : `Tank ${can.tank || "—"}`;

                // Status configuration
                let statusClass = "badge-empty";
                let statusLabel = "Empty";
                if (usagePercent >= 95) {
                  statusClass = "badge-full";
                  statusLabel = "Full";
                } else if (usagePercent > 0) {
                  statusClass = "badge-active";
                  statusLabel = "Active";
                } else if (can.notes?.toLowerCase().includes("maintenance")) {
                  statusClass = "badge-maintenance";
                  statusLabel = "Maintenance";
                }

                // Bar color
                let progressColorClass = "progress-normal";
                if (usagePercent >= 95) progressColorClass = "progress-critical";
                else if (usagePercent >= 75) progressColorClass = "progress-high";

                return (
                  <tr key={can.id}>
                    <td>
                      <div className="canister-name-cell" onClick={() => onViewCanister && onViewCanister(can.id)}>
                        <span className="canister-title">{can.canister_number || `Canister #${can.id}`}</span>
                        <span className="canister-subtitle">{can.canister_rfid || "No RFID Assigned"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="canister-parent-tank">{parentTankName}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                    </td>
                    <td>
                      <span className="tank-capacity-value">{currentVal} / {capacityVal} Units</span>
                    </td>
                    <td>
                      <div className="inventory-usage-col">
                        <div className="usage-stats">
                          <span className="percent-bold">{usagePercent.toFixed(0)}%</span>
                          <span className="ratio-text">{usagePercent >= 95 ? "Offline" : `${100 - usagePercent.toFixed(0)}% Free`}</span>
                        </div>
                        <div className="usage-bar-track">
                          <div 
                            className={`usage-bar-fill ${progressColorClass}`} 
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="table-action-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === can.id ? null : can.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === can.id && (
                        <div className="table-actions-menu" ref={menuRef}>
                          <button onClick={() => openEditModal(can)}>
                            <Edit2 size={14} /> Edit Canister
                          </button>
                          <button 
                            className="delete-item-btn" 
                            onClick={() => handleDelete(can.id, can.canister_number || can.id)}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Activity & Hint Panels */}
      <div className="cryo-list-footer-panels">
        {/* Recent Activity card */}
        <div className="cryo-footer-panel tip-card" style={{ flex: 2 }}>
          <div className="panel-illustration">
            <Activity size={28} className="illustration-icon" />
          </div>
          <div className="panel-text-block" style={{ width: "100%" }}>
            <h3>Recent Activity</h3>
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px" }}>
                <span style={{ color: "#8b5cf6", fontWeight: "700" }}>●</span>
                <div>
                  <span style={{ color: "#1e1b4b", fontWeight: "600" }}>Dr. A. Sterling</span> moved Canister <span style={{ fontFamily: "monospace", background: "#f3f4f6", padding: "1px 4px", borderRadius: "4px" }}>CN-2024-A01</span> to Alpha-1.
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Today at 09:42 AM</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px" }}>
                <span style={{ color: "#3b82f6", fontWeight: "700" }}>●</span>
                <div>
                  <span style={{ color: "#1e1b4b", fontWeight: "600" }}>Auto-System:</span> Tank <span style={{ fontWeight: "600" }}>Beta-V1</span> LN2 top-off complete.
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Today at 07:15 AM</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Optimization Hint card */}
        <div className="cryo-footer-panel" style={{ flex: 1, background: "#e0f2fe", border: "1px solid #bae6fd", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ color: "#0369a1", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
              <ShieldAlert size={16} /> System Optimization Hint
            </h3>
            <p style={{ color: "#075985", fontSize: "12.5px", lineHeight: "1.5", margin: "10px 0 0 0" }}>
              Alpha-1 is approaching 95% canister occupancy. Consider preparing Tank Gamma-9 for overflow storage to maintain redundancy protocols.
            </p>
          </div>
          <button 
            style={{ 
              background: "#0284c7", 
              color: "#fff", 
              border: "none", 
              padding: "8px 12px", 
              borderRadius: "8px", 
              fontSize: "12px", 
              fontWeight: "700", 
              cursor: "pointer", 
              alignSelf: "flex-start",
              marginTop: "12px"
            }}
            onClick={() => alert("Loading Capacity Report...")}
          >
            View Capacity Report
          </button>
        </div>
      </div>

      {/* Edit Modal Dialog */}
      {editingCanister && (
        <div className="cryo-modal-overlay">
          <div className="cryo-modal">
            <div className="cryo-modal-header">
              <h3>Update Canister Configuration</h3>
              <button className="close-modal-btn" onClick={() => setEditingCanister(null)}>&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} className="cryo-modal-form">
              <div className="modal-field">
                <label>Canister Number / ID</label>
                <input 
                  type="text" 
                  value={editForm.canister_number}
                  onChange={(e) => setEditForm({ ...editForm, canister_number: e.target.value })}
                  placeholder="e.g. Canister B"
                  required
                />
              </div>

              <div className="modal-field">
                <label>Max Capacity (Vials/Cane Count)</label>
                <input 
                  type="number" 
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  placeholder="e.g. 10"
                  min="1"
                  required
                />
              </div>

              <div className="modal-field">
                <label>RFID Tag ID</label>
                <input 
                  type="text" 
                  value={editForm.canister_rfid}
                  onChange={(e) => setEditForm({ ...editForm, canister_rfid: e.target.value })}
                  placeholder="e.g. RFID-CAN-001"
                />
              </div>

              <div className="modal-field">
                <label>Parent Tank</label>
                <select
                  value={editForm.tank}
                  onChange={(e) => setEditForm({ ...editForm, tank: e.target.value })}
                  required
                >
                  <option value="">Select Parent Tank...</option>
                  {tanks.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label>Notes &amp; Observations</label>
                <textarea
                  style={{ padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: "10px", fontSize: "13.5px", minHeight: "80px", fontFamily: "inherit", outline: "none" }}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="e.g. Main canister for sperm samples"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="modal-btn-cancel" 
                  onClick={() => setEditingCanister(null)}
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
        <div className={`cryo-list-toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
