import React, { useState, useEffect, useRef } from "react";
import {
  listCryoCanes,
  listCryoCanisters,
  updateCryoCane,
  deleteCryoCane,
} from "../../api/cryoApi";
import "./cryo_canes_list.css";
import {
  Search, Download, Plus, MoreVertical, Eye,
  Edit2, Trash2, RotateCcw, AlertTriangle, Info,
  Printer, ArrowLeftRight, ClipboardList,
} from "lucide-react";

export default function CryoCanesList({ onViewCane, onCreateCane }) {
  const [canes, setCanes] = useState([]);
  const [canisters, setCanisters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [canisterFilter, setCanisterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Edit Cane Dialog
  const [editingCane, setEditingCane] = useState(null);
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

  // ── Fetch Data ──
  const fetchData = async () => {
    setLoading(true);
    try {
      const [canesRes, canistersRes] = await Promise.all([
        listCryoCanes(),
        listCryoCanisters(),
      ]);
      setCanes(canesRes.data || []);
      setCanisters(canistersRes.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch canes data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Handlers ──
  const handleResetFilters = () => {
    setSearch("");
    setCanisterFilter("all");
    setStatusFilter("all");
  };

  const handleDeleteCane = async (cane) => {
    if (window.confirm(`Are you sure you want to delete cane "${cane.cane_number}"?`)) {
      try {
        await deleteCryoCane(cane.id);
        showToast(`Cane "${cane.cane_number}" deleted successfully.`);
        fetchData();
      } catch (err) {
        console.error(err);
        showToast("Failed to delete cane. Please try again.", "error");
      }
    }
    setActiveMenuId(null);
  };

  const handleOpenEdit = (cane) => {
    setEditingCane(cane);
    setEditForm({
      cane_number: cane.cane_number || "",
      capacity: cane.capacity || "",
      cane_rfid: cane.cane_rfid || "",
      notes: cane.notes || "",
    });
    setActiveMenuId(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.cane_number.trim()) {
      showToast("Cane number is required.", "error");
      return;
    }
    setSaving(true);
    try {
      await updateCryoCane(editingCane.id, {
        cane_number: editForm.cane_number.trim(),
        capacity: Number(editForm.capacity),
        cane_rfid: editForm.cane_rfid.trim(),
        notes: editForm.notes.trim(),
      });
      showToast("Cane updated successfully.");
      setEditingCane(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast("Failed to update cane.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Computed Values ──
  const totalCanes = canes.length;
  const fullCanes = canes.filter(c => c.is_full).length;
  const emptyCanes = canes.filter(c => (c.current_usage || 0) === 0).length;
  const avgCapacity = totalCanes > 0
    ? ((canes.reduce((acc, c) => acc + (c.capacity > 0 ? ((c.current_usage || 0) / c.capacity) * 100 : 0), 0)) / totalCanes).toFixed(1)
    : 0;

  // Unique canisters for filter dropdown
  const uniqueCanisterIds = [...new Set(canes.map(c => c.canister))];
  const canisterOptions = uniqueCanisterIds.map(cId => {
    const canObj = canisters.find(cn => cn.id === cId);
    return {
      id: cId,
      label: canObj ? (canObj.canister_number || `Canister #${cId}`) : `Canister #${cId}`,
    };
  });

  // ── Filtering ──
  const filteredCanes = canes.filter(c => {
    const matchesSearch =
      (c.cane_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.canister_info || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.cane_rfid || "").toLowerCase().includes(search.toLowerCase());

    const matchesCanister = canisterFilter === "all" || String(c.canister) === String(canisterFilter);

    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = !c.is_full && (c.current_usage || 0) > 0;
    else if (statusFilter === "full") matchesStatus = c.is_full;
    else if (statusFilter === "empty") matchesStatus = (c.current_usage || 0) === 0;

    return matchesSearch && matchesCanister && matchesStatus;
  });

  // ── Render ──
  return (
    <div className="canes-list-container">
      {/* Top Search Bar */}
      <div className="canes-list-topbar">
        <h1 className="canes-list-main-title">CryoVault MS</h1>
        <div className="canes-search-wrapper">
          <Search size={16} className="canes-search-icon" />
          <input
            type="text"
            placeholder="Search canes, canisters, or tanks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Header & Action Row */}
      <div className="canes-list-header">
        <div>
          <h2>Canes Management</h2>
          <p>Register, monitor, and organize vials containment canes inside biological canisters.</p>
        </div>
        <div className="canes-list-actions">
          <button className="canes-add-btn" onClick={onCreateCane}>
            <Plus size={16} /> New Cane
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="canes-metrics-grid">
        <div className="canes-metric-card">
          <span className="metric-label">Total Canes</span>
          <div className="metric-value-row">
            <span className="metric-value">{totalCanes}</span>
            <span className="metric-unit">registered</span>
          </div>
        </div>
        <div className="canes-metric-card">
          <span className="metric-label">Avg. Capacity</span>
          <div className="metric-value-row">
            <span className="metric-value">{avgCapacity}%</span>
          </div>
          <div className="metric-progress-wrapper">
            <div className="metric-progress-bar">
              <div className="metric-progress-fill" style={{ width: `${avgCapacity}%` }} />
            </div>
          </div>
        </div>
        <div className="canes-metric-card">
          <span className="metric-label">Empty Canes</span>
          <div className="metric-value-row">
            <span className="metric-value">{emptyCanes}</span>
            <span className="metric-unit">Ready for use</span>
          </div>
        </div>
        <div className="canes-metric-card warning">
          <span className="metric-label">At Capacity</span>
          <div className="metric-value-row">
            <span className="metric-value">{fullCanes}</span>
            <span className="metric-unit">{fullCanes > 0 ? "Critical density" : "All clear"}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="canes-filter-bar">
        <div className="filter-left-controls">
          <div className="filter-item">
            <label>Filter by Canister</label>
            <select
              className="filter-select"
              value={canisterFilter}
              onChange={(e) => setCanisterFilter(e.target.value)}
            >
              <option value="all">All Canisters</option>
              {canisterOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Status</label>
            <div className="status-toggle-tabs">
              {["All", "Active", "Full"].map(t => (
                <button
                  key={t}
                  className={`status-tab-btn ${statusFilter === t.toLowerCase() ? "active" : ""}`}
                  onClick={() => setStatusFilter(t.toLowerCase())}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button className="reset-filter-btn" onClick={handleResetFilters}>
            <RotateCcw size={14} /> Reset Filters
          </button>
        </div>

        <button className="export-btn" onClick={() => alert("Exporting Canes List PDF/CSV...")}>
          <Download size={14} /> Export List
        </button>
      </div>

      {/* Main Table */}
      <div className="canes-table-wrapper">
        {loading ? (
          <div className="canes-list-loader">
            <div className="canes-spinner" />
            <p>Fetching cane inventory details...</p>
          </div>
        ) : error ? (
          <div className="canes-list-error">
            <AlertTriangle size={32} />
            <p>{error}</p>
            <button className="canes-retry-btn" onClick={fetchData}>Retry</button>
          </div>
        ) : filteredCanes.length === 0 ? (
          <div className="canes-list-empty">
            <Info size={32} />
            <p>No canes found matching the selected filters.</p>
          </div>
        ) : (
          <table className="canes-table">
            <thead>
              <tr>
                <th>Cane ID / Number</th>
                <th>Parent Canister</th>
                <th>Parent Tank</th>
                <th>Positions (Used/Total)</th>
                <th>Utilization</th>
                <th>Status</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCanes.map((c) => {
                const utilPercent = c.capacity > 0 ? ((c.current_usage || 0) / c.capacity) * 100 : 0;

                let fillClass = "util-fill-active";
                let badgeClass = "badge-active";
                let statusLabel = "ACTIVE";

                if (c.is_full) {
                  fillClass = "util-fill-full";
                  badgeClass = "badge-full";
                  statusLabel = "FULL";
                } else if ((c.current_usage || 0) === 0) {
                  fillClass = "util-fill-empty";
                  badgeClass = "badge-empty";
                  statusLabel = "EMPTY";
                }

                // Parse canister_info for display
                const infoParts = (c.canister_info || "").split(" - ");
                const tankName = infoParts[0] || "—";
                const canisterName = infoParts.length > 1 ? infoParts.slice(1).join(" - ") : `Canister #${c.canister}`;

                return (
                  <tr key={c.id}>
                    <td>
                      <span
                        className="cane-id-bold"
                        onClick={() => onViewCane && onViewCane(c.id)}
                      >
                        {c.cane_number}
                      </span>
                    </td>
                    <td>
                      <span className="parent-canister-text">{canisterName}</span>
                    </td>
                    <td>
                      <span className="parent-tank-text">{tankName}</span>
                    </td>
                    <td>
                      <span className="positions-text">{c.current_usage || 0} / {c.capacity}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className="util-progress-bar">
                          <div className={`util-progress-fill ${fillClass}`} style={{ width: `${utilPercent}%` }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
                          {utilPercent.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${badgeClass}`}>{statusLabel}</span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="cane-view-btn"
                        title="View Details"
                        onClick={() => onViewCane && onViewCane(c.id)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="table-action-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === c.id ? null : c.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeMenuId === c.id && (
                        <div className="table-actions-menu" ref={menuRef}>
                          <button onClick={() => handleOpenEdit(c)}>
                            <Edit2 size={12} style={{ marginRight: "4px", verticalAlign: "-2px" }} /> Edit
                          </button>
                          <button className="delete-item-btn" onClick={() => handleDeleteCane(c)}>
                            <Trash2 size={12} style={{ marginRight: "4px", verticalAlign: "-2px" }} /> Delete
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

        {/* Pagination footer */}
        {!loading && !error && filteredCanes.length > 0 && (
          <div className="table-pagination-row">
            <span>Showing 1 to {filteredCanes.length} of {totalCanes} canes</span>
            <div className="pagination-buttons">
              <button className="pagination-btn active">1</button>
              {totalCanes > filteredCanes.length && (
                <>
                  <button className="pagination-btn">2</button>
                  <button className="pagination-btn">3</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panels */}
      <div className="canes-footer-grid">
        {/* Canister Distribution chart */}
        <div className="distribution-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Canister Distribution</h3>
            <div className="dist-chart-header">
              <div className="chart-legend-item">
                <span className="legend-dot full" /> Full
              </div>
              <div className="chart-legend-item">
                <span className="legend-dot active" /> Active
              </div>
              <div className="chart-legend-item">
                <span className="legend-dot empty" /> Empty
              </div>
            </div>
          </div>

          <div className="dist-bar-chart">
            {canisterOptions.slice(0, 4).map((opt) => {
              const canesInCanister = canes.filter(cn => cn.canister === opt.id);
              const fullCount = canesInCanister.filter(cn => cn.is_full).length;
              const activeCount = canesInCanister.filter(cn => !cn.is_full && (cn.current_usage || 0) > 0).length;
              const emptyCount = canesInCanister.filter(cn => (cn.current_usage || 0) === 0).length;
              const total = canesInCanister.length || 1;
              return (
                <div className="chart-bar-container" key={opt.id}>
                  <div className="chart-bar-stacked">
                    <div className="chart-bar-segment segment-full" style={{ height: `${(fullCount / total) * 120}px` }} />
                    <div className="chart-bar-segment segment-active" style={{ height: `${(activeCount / total) * 120}px` }} />
                    <div className="chart-bar-segment segment-empty" style={{ height: `${(emptyCount / total) * 120}px` }} />
                  </div>
                  <span className="bar-label">{opt.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="quick-actions-panel">
          <h3>Quick Actions</h3>
          <div className="actions-list">
            <div className="action-card" onClick={() => alert("Triggering batch label printer...")}>
              <div className="action-icon-box print">
                <Printer size={18} />
              </div>
              <div className="action-text">
                <span className="action-title">Print Cane Labels</span>
                <span className="action-desc">Batch label generation</span>
              </div>
            </div>

            <div className="action-card" onClick={() => alert("Starting Transfer Batch dialog...")}>
              <div className="action-icon-box transfer">
                <ArrowLeftRight size={18} />
              </div>
              <div className="action-text">
                <span className="action-title">Transfer Batch</span>
                <span className="action-desc">Move multiple canes between tanks</span>
              </div>
            </div>

            <div className="action-card" onClick={() => alert("Displaying Audit Log details...")}>
              <div className="action-icon-box audit">
                <ClipboardList size={18} />
              </div>
              <div className="action-text">
                <span className="action-title">Audit Logs</span>
                <span className="action-desc">View access and movement history</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Cane Dialog */}
      {editingCane && (
        <div className="cryo-modal-overlay">
          <div className="cryo-modal">
            <div className="cryo-modal-header">
              <h3>Edit Cane Configuration</h3>
              <button className="close-modal-btn" onClick={() => setEditingCane(null)}>&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} className="cryo-modal-form">
              <div className="modal-field">
                <label>Cane Number / ID</label>
                <input
                  type="text"
                  value={editForm.cane_number}
                  onChange={(e) => setEditForm({ ...editForm, cane_number: e.target.value })}
                  placeholder="e.g. Cane 3"
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
                  placeholder="e.g. Cane for embryo samples"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setEditingCane(null)}
                  disabled={saving}
                >
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

      {/* Toast Notification */}
      {toast && (
        <div className={`cryo-toast cryo-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
