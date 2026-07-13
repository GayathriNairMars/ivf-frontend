import React, { useState, useEffect, useRef } from "react";
import {
  listCryoGoblets,
  listCryoCanes,
  updateCryoGoblet,
  deleteCryoGoblet,
} from "../../api/cryoApi";
import "./cryo_goblets_list.css";
import {
  Search, Download, Plus, MoreVertical, Eye,
  Edit2, Trash2, RotateCcw, AlertTriangle, Info,
  Printer, Save,
} from "lucide-react";

export default function CryoGobletsList({ onViewGoblet, onCreateGoblet }) {
  const [goblets, setGoblets] = useState([]);
  const [canes, setCanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [caneFilter, setCaneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");

  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Edit Goblet Dialog
  const [editingGoblet, setEditingGoblet] = useState(null);
  const [editForm, setEditForm] = useState({
    color: "", status: "", goblet_rfid: ""
  });
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [gobletsRes, canesRes] = await Promise.all([
        listCryoGoblets(),
        listCryoCanes(),
      ]);
      setGoblets(gobletsRes.data || []);
      setCanes(canesRes.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch goblets data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleResetFilters = () => {
    setSearch("");
    setCaneFilter("all");
    setStatusFilter("all");
    setColorFilter("all");
  };

  const handleDeleteGoblet = async (goblet) => {
    if (window.confirm(`Are you sure you want to delete goblet "${goblet.goblet_number}"?`)) {
      try {
        await deleteCryoGoblet(goblet.id);
        showToast(`Goblet "${goblet.goblet_number}" deleted successfully.`);
        fetchData();
      } catch (err) {
        console.error(err);
        showToast("Failed to delete goblet. Please try again.", "error");
      }
    }
    setActiveMenuId(null);
  };

  const handleOpenEdit = (goblet) => {
    setEditingGoblet(goblet);
    setEditForm({
      color: goblet.color || "WHITE",
      status: goblet.status || "EMPTY",
      goblet_rfid: goblet.goblet_rfid || ""
    });
    setActiveMenuId(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCryoGoblet(editingGoblet.id, {
        color: editForm.color,
        status: editForm.status,
        goblet_rfid: editForm.goblet_rfid.trim() || null
      });
      showToast("Goblet updated successfully.");
      setEditingGoblet(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast("Failed to update goblet.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Computed Stats
  const totalCount = goblets.length;
  const occupiedCount = goblets.filter(g => g.status === "OCCUPIED").length;
  const emptyCount = goblets.filter(g => g.status === "EMPTY").length;
  const damagedCount = goblets.filter(g => g.status === "DAMAGED" || g.status === "DAMAGED_MOCK").length; // handling any naming variants

  // Filtered Goblets
  const filteredGoblets = goblets.filter(g => {
    const matchesSearch =
      (g.goblet_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (g.goblet_rfid || "").toLowerCase().includes(search.toLowerCase()) ||
      (g.cane_info || "").toLowerCase().includes(search.toLowerCase());

    const matchesCane = caneFilter === "all" || String(g.cane) === String(caneFilter);
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    const matchesColor = colorFilter === "all" || g.color === colorFilter;

    return matchesSearch && matchesCane && matchesStatus && matchesColor;
  });

  // Color options helper
  const COLORS_LIST = [
    { value: "WHITE", label: "White", hex: "#ffffff" },
    { value: "RED", label: "Red", hex: "#ef4444" },
    { value: "BLUE", label: "Blue", hex: "#3b82f6" },
    { value: "GREEN", label: "Green", hex: "#10b981" },
    { value: "YELLOW", label: "Yellow", hex: "#f59e0b" },
    { value: "PURPLE", label: "Purple", hex: "#8b5cf6" },
    { value: "ORANGE", label: "Orange", hex: "#f97316" },
    { value: "PINK", label: "Pink", hex: "#ec4899" }
  ];

  const getColorHex = (colorVal) => {
    const match = COLORS_LIST.find(c => c.value === colorVal);
    return match ? match.hex : "#cbd5e1";
  };

  return (
    <div className="goblets-list-container">
      {/* Top Search Bar */}
      <div className="goblets-list-topbar">
        <h1 className="goblets-list-main-title">CryoVault MS</h1>
        <div className="goblets-search-wrapper">
          <Search size={16} className="goblets-search-icon" />
          <input
            type="text"
            placeholder="Search Goblet ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Header & Actions */}
      <div className="goblets-list-header">
        <div>
          <h2>Goblets Management</h2>
          <p>Register and organize containment goblets holding specimens within canes.</p>
        </div>
        <div className="goblets-list-actions">
          <button className="goblets-add-btn" onClick={onCreateGoblet}>
            <Plus size={16} /> New Goblet
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="goblets-filter-bar">
        <div className="filter-left-controls">
          <div className="filter-item">
            <label>Cane</label>
            <select
              className="filter-select"
              value={caneFilter}
              onChange={(e) => setCaneFilter(e.target.value)}
            >
              <option value="all">All Canes</option>
              {canes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.cane_number}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Status</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="EMPTY">Empty</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="RESERVED">Reserved</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Color</label>
            <select
              className="filter-select"
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
            >
              <option value="all">All Colors</option>
              {COLORS_LIST.map(col => (
                <option key={col.value} value={col.value}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>

          <button className="reset-filter-btn" onClick={handleResetFilters}>
            <RotateCcw size={14} /> Reset Filters
          </button>
        </div>

        <button className="export-btn" onClick={() => alert("Exporting Goblets List...")}>
          <Download size={14} /> Export List
        </button>
      </div>

      {/* Table Wrapper */}
      <div className="goblets-table-wrapper">
        {loading ? (
          <div className="goblets-list-loader">
            <div className="goblets-spinner" />
            <p>Fetching goblet assets...</p>
          </div>
        ) : error ? (
          <div className="goblets-list-error">
            <AlertTriangle size={32} />
            <p>{error}</p>
            <button className="goblets-retry-btn" onClick={fetchData}>Retry</button>
          </div>
        ) : filteredGoblets.length === 0 ? (
          <div className="goblets-list-empty">
            <Info size={32} />
            <p>No goblets found matching the selected filters.</p>
          </div>
        ) : (
          <table className="goblets-table">
            <thead>
              <tr>
                <th>Goblet ID</th>
                <th>Parent Cane</th>
                <th>Canister</th>
                <th>Tank</th>
                <th>Color</th>
                <th>Status</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGoblets.map((g) => {
                // Parse cane_info
                const infoParts = (g.cane_info || "").split(" - ");
                const tankName = infoParts[0] || "—";
                const canisterName = infoParts[1] || "—";
                const caneName = infoParts[2] || `Cane #${g.cane}`;

                let badgeClass = "badge-empty";
                if (g.status === "OCCUPIED") badgeClass = "badge-occupied";
                else if (g.status === "RESERVED") badgeClass = "badge-reserved";
                else if (g.status === "DAMAGED") badgeClass = "badge-damaged";

                return (
                  <tr key={g.id}>
                    <td>
                      <span
                        className="goblet-id-bold"
                        onClick={() => onViewGoblet && onViewGoblet(g.id)}
                      >
                        {g.goblet_number}
                      </span>
                    </td>
                    <td>
                      <span className="parent-cane-text">{caneName}</span>
                    </td>
                    <td>
                      <span className="parent-canister-text">{canisterName}</span>
                    </td>
                    <td>
                      <span className="parent-tank-text">{tankName}</span>
                    </td>
                    <td>
                      <span className="goblet-color-indicator">
                        <span
                          className="color-swatch-dot"
                          style={{ backgroundColor: getColorHex(g.color) }}
                        />
                        {g.color_display || g.color}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${badgeClass}`}>
                        {g.status_display || g.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="goblet-view-btn"
                        title="View Details"
                        onClick={() => onViewGoblet && onViewGoblet(g.id)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="table-action-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === g.id ? null : g.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeMenuId === g.id && (
                        <div className="table-actions-menu" ref={menuRef}>
                          <button onClick={() => handleOpenEdit(g)}>
                            <Edit2 size={12} style={{ marginRight: "4px" }} /> Edit
                          </button>
                          <button className="delete-item-btn" onClick={() => handleDeleteGoblet(g)}>
                            <Trash2 size={12} style={{ marginRight: "4px" }} /> Delete
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

        {/* Pagination Footer */}
        {!loading && !error && filteredGoblets.length > 0 && (
          <div className="table-pagination-row">
            <span>Showing 1 to {filteredGoblets.length} of {filteredGoblets.length} goblets</span>
            <div className="pagination-buttons">
              <button className="pagination-btn active">1</button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary Row */}
      {!loading && !error && (
        <div className="goblets-stats-summary">
          <span>TOTAL <strong>{totalCount}</strong></span>
          <span>
            <span className="goblets-stats-dot occupied" /> OCCUPIED <strong>{occupiedCount}</strong>
          </span>
          <span>
            <span className="goblets-stats-dot empty" /> EMPTY <strong>{emptyCount}</strong>
          </span>
          {damagedCount > 0 && (
            <span>
              <span className="goblets-stats-dot damaged" /> DAMAGED <strong>{damagedCount}</strong>
            </span>
          )}
        </div>
      )}

      {/* Edit Goblet Dialog Modal */}
      {editingGoblet && (
        <div className="goblet-edit-modal-overlay">
          <div className="goblet-edit-modal-box">
            <h3>Edit Goblet: {editingGoblet.goblet_number}</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-field">
                <label>RFID Tag ID</label>
                <input
                  type="text"
                  value={editForm.goblet_rfid}
                  onChange={(e) => setEditForm(prev => ({ ...prev, goblet_rfid: e.target.value }))}
                  placeholder="Scan or enter RFID..."
                />
              </div>

              <div className="modal-field">
                <label>Color</label>
                <select
                  value={editForm.color}
                  onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                >
                  {COLORS_LIST.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="EMPTY">Empty</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setEditingGoblet(null)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`goblets-toast goblets-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
