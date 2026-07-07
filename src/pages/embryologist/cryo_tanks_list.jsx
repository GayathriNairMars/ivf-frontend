import React, { useState, useEffect, useRef } from "react";
import { listCryoTanks, deleteCryoTank, updateCryoTank } from "../../api/cryoApi";
import "./cryo_tanks_list.css";
import { 
  Search, SlidersHorizontal, Download, Plus, MoreVertical, 
  Eye, Edit2, Trash2, AlertTriangle, CheckCircle, Info, Activity, Flame
} from "lucide-react";

export default function CryoTanksList({ onViewTank, onCreateTank }) {
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & Search
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, alerts, maintenance
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Active Dropdown Menu index or tank ID
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Edit Modal State
  const [editingTank, setEditingTank] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", capacity: "", status: "" });
  const [saving, setSaving] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const triggerToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTanks = async () => {
    setLoading(true);
    try {
      const res = await listCryoTanks();
      setTanks(res.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch cryogenic tanks. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTanks();
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
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete tank "${name}"?`)) {
      try {
        await deleteCryoTank(id);
        triggerToast(`Tank "${name}" deleted successfully.`);
        fetchTanks();
      } catch (err) {
        console.error(err);
        triggerToast("Failed to delete tank. Please try again.", "error");
      }
    }
  };

  // Open Edit Modal
  const openEditModal = (tank) => {
    setEditingTank(tank);
    setEditForm({
      name: tank.name || "",
      capacity: tank.capacity || "",
      status: tank.status || "ACTIVE"
    });
    setActiveMenuId(null);
  };

  // Save Edit Modal
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
      await updateCryoTank(editingTank.id, {
        ...editingTank,
        name: editForm.name.trim(),
        capacity: Number(editForm.capacity),
        status: editForm.status
      });
      triggerToast("Tank updated successfully.");
      setEditingTank(null);
      fetchTanks();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update tank details.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Metrics calculations
  const totalCapacity = tanks.reduce((acc, t) => acc + (t.capacity || 0), 0);
  const activeTanksCount = tanks.filter(t => t.status === "ACTIVE").length;
  const totalUsage = tanks.reduce((acc, t) => acc + (t.current_usage || 0), 0);
  const utilization = totalCapacity > 0 ? ((totalUsage / totalCapacity) * 100).toFixed(1) : "0.0";
  
  // Warning status count (either status is MAINTENANCE or usage is critical >= 90%)
  const warningCount = tanks.filter(t => 
    t.status === "MAINTENANCE" || 
    (t.capacity > 0 && (t.current_usage || 0) / t.capacity >= 0.9)
  ).length;

  // Filtered tanks list
  const filteredTanks = tanks.filter(t => {
    // Search match
    const matchesSearch = t.name?.toLowerCase().includes(search.toLowerCase()) ||
                          t.room?.toLowerCase().includes(search.toLowerCase()) ||
                          t.tank_type?.toLowerCase().includes(search.toLowerCase());
    
    // Tab match
    let matchesTab = true;
    if (activeTab === "maintenance") {
      matchesTab = t.status === "MAINTENANCE";
    } else if (activeTab === "alerts") {
      matchesTab = t.status === "MAINTENANCE" || (t.capacity > 0 && (t.current_usage || 0) / t.capacity >= 0.9);
    }

    // Dropdown filters
    const matchesType = filterType ? t.tank_type === filterType : true;
    const matchesStatus = filterStatus ? t.status === filterStatus : true;

    return matchesSearch && matchesTab && matchesType && matchesStatus;
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
            placeholder="Search tanks, zones, or rooms..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Title & Action Row */}
      <div className="cryo-list-header">
        <div>
          <h2>Tanks Management</h2>
          <p>Monitor and manage cryogenic storage units across all facility zones.</p>
        </div>
        <div className="cryo-list-actions">
          <div className="cryo-tabs-bar">
            <button 
              className={`cryo-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Tanks
            </button>
            <button 
              className={`cryo-tab-btn ${activeTab === "alerts" ? "active" : ""}`}
              onClick={() => setActiveTab("alerts")}
            >
              Alerts {warningCount > 0 && <span className="tab-badge-red">{warningCount}</span>}
            </button>
            <button 
              className={`cryo-tab-btn ${activeTab === "maintenance" ? "active" : ""}`}
              onClick={() => setActiveTab("maintenance")}
            >
              Maintenance
            </button>
          </div>
          <button className="cryo-add-btn" onClick={onCreateTank}>
            <Plus size={16} /> New Tank
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="cryo-metrics-grid">
        <div className="cryo-metric-card">
          <span className="metric-label">Total Capacity</span>
          <div className="metric-value-row">
            <span className="metric-value">{totalCapacity.toLocaleString()}</span>
            <span className="metric-unit">Liters</span>
          </div>
        </div>
        <div className="cryo-metric-card">
          <span className="metric-label">Active Tanks</span>
          <div className="metric-value-row">
            <span className="metric-value">{activeTanksCount}</span>
            <span className="metric-unit">Units</span>
          </div>
        </div>
        <div className="cryo-metric-card">
          <span className="metric-label">Utilization</span>
          <div className="metric-value-row">
            <span className="metric-value">{utilization}%</span>
            <span className="metric-unit">Used</span>
          </div>
        </div>
        <div className="cryo-metric-card warning">
          <span className="metric-label">Warning Status</span>
          <div className="metric-value-row">
            <span className="metric-value">{warningCount}</span>
            <span className="metric-unit">{warningCount === 1 ? "Action Req." : "Actions Req."}</span>
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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="LN2">Liquid Nitrogen (LN2)</option>
                <option value="LN2D">LN2 Dry</option>
                <option value="CO2">Carbon Dioxide (CO2)</option>
                <option value="OTHER">Other</option>
              </select>
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
              {(filterType || filterStatus) && (
                <button 
                  className="filter-clear-link"
                  onClick={() => { setFilterType(""); setFilterStatus(""); }}
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
            alert("Exporting CSV file representing filtered cryogenic tanks data...");
          }}
        >
          <Download size={14} /> Export
        </button>
      </div>

      {/* Main Table */}
      <div className="cryo-table-wrapper">
        {loading ? (
          <div className="cryo-list-loader">
            <div className="spinner"></div>
            <p>Fetching cryogenic tanks data...</p>
          </div>
        ) : error ? (
          <div className="cryo-list-error">
            <AlertTriangle size={32} />
            <p>{error}</p>
            <button className="cryo-retry-btn" onClick={fetchTanks}>Retry</button>
          </div>
        ) : filteredTanks.length === 0 ? (
          <div className="cryo-list-empty">
            <Info size={32} />
            <p>No tanks found matching the selected criteria.</p>
          </div>
        ) : (
          <table className="cryo-table">
            <thead>
              <tr>
                <th>Tank ID &amp; Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Inventory Usage</th>
                <th>Status</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTanks.map((tank) => {
                const usagePercent = tank.capacity > 0 ? (tank.current_usage / tank.capacity) * 100 : 0;
                
                // Status badge layout
                let statusClass = "badge-inactive";
                let statusLabel = tank.status;
                if (tank.status === "ACTIVE") {
                  statusClass = "badge-active";
                  statusLabel = "Active";
                } else if (tank.status === "MAINTENANCE") {
                  statusClass = "badge-maintenance";
                  statusLabel = "Maintenance";
                } else {
                  statusClass = "badge-inactive";
                  statusLabel = tank.status || "Inactive";
                }

                // Bar color
                let progressColorClass = "progress-normal";
                if (usagePercent >= 90) progressColorClass = "progress-critical";
                else if (usagePercent >= 75) progressColorClass = "progress-high";

                return (
                  <tr key={tank.id}>
                    <td>
                      <div className="tank-name-cell" onClick={() => onViewTank(tank.id)}>
                        <span className="tank-title">{tank.name}</span>
                        <span className="tank-subtitle">{tank.room || "Room Unspecified"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="tank-type-badge">{tank.tank_type || "LN2"}</span>
                    </td>
                    <td>
                      <span className="tank-capacity-value">{(tank.capacity || 0)} L</span>
                    </td>
                    <td>
                      {tank.status === "MAINTENANCE" ? (
                        <div className="inventory-usage-col maintenance">
                          <span className="usage-text-grey">Offline Maintenance Mode</span>
                        </div>
                      ) : (
                        <div className="inventory-usage-col">
                          <div className="usage-stats">
                            <span className="percent-bold">{usagePercent.toFixed(0)}% Full</span>
                            <span className="ratio-text">{tank.current_usage || 0} / {tank.capacity || 0} L</span>
                          </div>
                          <div className="usage-bar-track">
                            <div 
                              className={`usage-bar-fill ${progressColorClass}`} 
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="table-action-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === tank.id ? null : tank.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === tank.id && (
                        <div className="table-actions-menu" ref={menuRef}>
                          <button onClick={() => onViewTank(tank.id)}>
                            <Eye size={14} /> View Details
                          </button>
                          <button onClick={() => openEditModal(tank)}>
                            <Edit2 size={14} /> Edit Tank
                          </button>
                          <button 
                            className="delete-item-btn" 
                            onClick={() => handleDelete(tank.id, tank.name)}
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

      {/* Bottom Health & Tips Section */}
      <div className="cryo-list-footer-panels">
        {/* Left Tip card */}
        <div className="cryo-footer-panel tip-card">
          <div className="panel-illustration">
            <Activity size={28} className="illustration-icon" />
          </div>
          <div className="panel-text-block">
            <h3>Optimization Tip</h3>
            <p>
              Facility cryogenic sensors report high-load storage demands. Consider scheduling 
              inspections on older containment vessels to prevent thermal leakages.
            </p>
            <button className="panel-action-link" onClick={() => alert("Loading Capacity Forecasting Models...")}>
              View Capacity Forecast &rarr;
            </button>
          </div>
        </div>

        {/* Right Health card */}
        <div className="cryo-footer-panel health-card">
          <h3>SYSTEM HEALTH</h3>
          <div className="health-metrics-list">
            <div className="health-row">
              <span>Pressure Sensors</span>
              <span className="health-status-ok"><CheckCircle size={14} /> Normal</span>
            </div>
            <div className="health-row">
              <span>Temp Loggers</span>
              <span className="health-status-ok"><CheckCircle size={14} /> Syncing</span>
            </div>
            <div className="health-row">
              <span>Safety Valving</span>
              {warningCount > 0 ? (
                <span className="health-status-warning"><Flame size={14} /> Check Warnings</span>
              ) : (
                <span className="health-status-ok"><CheckCircle size={14} /> Secure</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal Dialog */}
      {editingTank && (
        <div className="cryo-modal-overlay">
          <div className="cryo-modal">
            <div className="cryo-modal-header">
              <h3>Update Tank Configuration</h3>
              <button className="close-modal-btn" onClick={() => setEditingTank(null)}>&times;</button>
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
                  onClick={() => setEditingTank(null)}
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
