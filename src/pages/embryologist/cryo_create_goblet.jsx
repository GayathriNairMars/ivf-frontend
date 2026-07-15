import React, { useState, useEffect } from "react";
import { createCryoGoblet, listCryoCanes } from "../../api/cryoApi";
import "./cryo_create_goblet.css";
import "../embryologist/cryo_create_canister.css"; // inheriting base forms
import {
  Info, Scan, Save, Lightbulb, CheckCircle2,
  Container, ChevronRight, HelpCircle, Check,
  Beaker, Bookmark, AlertTriangle
} from "lucide-react";

export default function CryoCreateGoblet({ onBack, onAddCane }) {
  const [canes, setCanes] = useState([]);
  const [loadingCanes, setLoadingCanes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    cane: "",
    goblet_number: "",
    goblet_rfid: "",
    color: "WHITE",
    status: "EMPTY"
  });

  const fetchCanes = async () => {
    try {
      const res = await listCryoCanes();
      setCanes(res.data || []);
      if (res.data && res.data.length > 0) {
        setForm((prev) => ({ ...prev, cane: res.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to fetch canes", err);
      showToast("Failed to load parent canes.", "error");
    } finally {
      setLoadingCanes(false);
    }
  };

  useEffect(() => {
    fetchCanes();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "cane" ? Number(value) : value
    }));
  };

  const handleScanRFID = () => {
    const randomRFID = "RFID-GOBLET-" + Math.floor(100 + Math.random() * 900);
    setForm((prev) => ({ ...prev, goblet_rfid: randomRFID }));
    showToast("RFID Tag scanned successfully: " + randomRFID, "success");
  };

  const handleSelectColor = (colorVal) => {
    setForm((prev) => ({ ...prev, color: colorVal }));
  };

  const handleSelectStatus = (statusVal) => {
    setForm((prev) => ({ ...prev, status: statusVal }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.cane) {
      showToast("Please select a parent cane.", "error");
      return;
    }
    if (!form.goblet_number.trim()) {
      showToast("Goblet Number/ID is required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        cane: Number(form.cane),
        goblet_number: form.goblet_number.trim(),
        color: form.color,
        status: form.status,
        goblet_rfid: form.goblet_rfid.trim() || null
      };

      await createCryoGoblet(payload);
      showToast("Goblet registered successfully!", "success");
      setTimeout(() => {
        if (onBack) onBack();
      }, 1500);
    } catch (err) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "object"
          ? Object.values(err.response.data).flat().join(" ")
          : "Failed to create goblet.");
      showToast(detail, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Remaining spaces calculation
  const selectedCaneObj = canes.find((c) => c.id === form.cane);
  const remainingSpaces = selectedCaneObj
    ? selectedCaneObj.capacity - (selectedCaneObj.current_usage || 0)
    : 0;

  // Swatches List
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

  // Status List
  const STATUSES_LIST = [
    { value: "EMPTY", label: "Empty", icon: <Check size={16} /> },
    { value: "OCCUPIED", label: "Occupied", icon: <Beaker size={16} /> },
    { value: "RESERVED", label: "Reserved", icon: <Bookmark size={16} /> },
    { value: "DAMAGED", label: "Damaged", icon: <AlertTriangle size={16} /> }
  ];

  const getPreviewColorHex = () => {
    const matched = COLORS_LIST.find((c) => c.value === form.color);
    return matched ? matched.hex : "#fff";
  };

  return (
    <div className="cryo-page">
      {/* Breadcrumb */}
      <div className="cryo-breadcrumb">
        <button onClick={onBack}>Inventory</button>
        <span>›</span>
        <button onClick={onBack}>Goblets Management</button>
        <span>›</span>
        <span className="cryo-bc-current">New Goblet</span>
      </div>

      {/* Header */}
      <div className="cryo-header">
        <div className="cryo-header-left">
          <h1>Register New Goblet</h1>
          <p>Register a containment goblet and assign it to a parent storage cane.</p>
        </div>
      </div>

      <hr className="cryo-divider" />

      {/* Body Grid */}
      <div className="cryo-body">
        {/* Form Container (Left Column) */}
        <div className="cryo-left-col">
          <div className="cryo-card info-card">
            <div className="cryo-card-title">
              <Info size={16} /> Goblet Specifications
            </div>

            <div className="cryo-form-grid">
              {/* Parent Cane Dropdown */}
              <div className="cryo-field" style={{ gridColumn: "span 2" }}>
                <label>
                  Parent Cane <span className="goblet-required">*</span>
                </label>
                <div className="parent-cane-dropdown-row">
                  <select
                    className="cryo-select"
                    name="cane"
                    value={form.cane}
                    onChange={handleChange}
                    disabled={loadingCanes}
                    style={{ flex: 1 }}
                    required
                  >
                    {loadingCanes ? (
                      <option>Loading canes...</option>
                    ) : canes.length === 0 ? (
                      <option value="">No canes available. Please add one first.</option>
                    ) : (
                      canes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.cane_number} ({c.canister_info || `Cane #${c.id}`})
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    type="button"
                    className="add-cane-link-btn"
                    onClick={onAddCane}
                  >
                    + Add New Cane
                  </button>
                </div>

                {/* Remaining spaces alert box */}
                {selectedCaneObj && (
                  <div
                    className={`cane-capacity-warning-block ${
                      remainingSpaces <= 0 ? "error" : ""
                    }`}
                  >
                    <Info size={14} />
                    {remainingSpaces <= 0 ? (
                      <span>Cane is FULL. No available spaces remaining.</span>
                    ) : (
                      <span>{remainingSpaces} available spaces remaining in the selected Cane.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Goblet Number */}
              <div className="cryo-field">
                <label>
                  Goblet Number <span className="goblet-required">*</span>
                </label>
                <input
                  type="text"
                  className="cryo-input"
                  name="goblet_number"
                  value={form.goblet_number}
                  onChange={handleChange}
                  placeholder="e.g. G-772"
                  required
                />
              </div>

              {/* RFID Tag ID */}
              <div className="cryo-field">
                <label>RFID Tag ID</label>
                <div className="cryo-rfid-row">
                  <input
                    type="text"
                    className="cryo-input"
                    name="goblet_rfid"
                    value={form.goblet_rfid}
                    onChange={handleChange}
                    placeholder="Scan or enter ID"
                  />
                  <button
                    type="button"
                    className="cryo-btn-scan"
                    onClick={handleScanRFID}
                  >
                    <Scan size={14} /> Scan
                  </button>
                </div>
              </div>

              {/* Color Designation */}
              <div className="color-designation-section">
                <span className="color-designation-label">Color Designation</span>
                <div className="color-swatches-grid">
                  {COLORS_LIST.map((c) => {
                    const isSelected = form.color === c.value;
                    return (
                      <div
                        key={c.value}
                        className={`color-swatch-item ${
                          c.value.toLowerCase() === "white" ? "white-swatch" : ""
                        } ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectColor(c.value)}
                      >
                        <div
                          className={`color-bubble-btn ${
                            isSelected ? "selected" : ""
                          }`}
                        >
                          <div
                            className="color-bubble-inner"
                            style={{ backgroundColor: c.hex }}
                          />
                        </div>
                        <span className="color-swatch-name">{c.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Initial Status */}
              <div className="status-designation-section">
                <span className="color-designation-label">Initial Status</span>
                <div className="status-cards-grid">
                  {STATUSES_LIST.map((s) => {
                    const isSelected = form.status === s.value;
                    return (
                      <div
                        key={s.value}
                        className={`status-option-card ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => handleSelectStatus(s.value)}
                      >
                        <div className="status-card-icon-box">{s.icon}</div>
                        <span className="status-card-label">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Summary Sidebar */}
        <div className="cryo-right-col">
          <div className="cryo-preview-card">
            <div className="preview-header">Registration Summary</div>

            <div className="preview-graphic-box">
              {/* Goblet Visual Representation */}
              <div className="preview-goblet-graphic">
                <div className="preview-goblet-cap" />
                <div
                  className="preview-goblet-fluid"
                  style={{
                    height: form.status === "EMPTY" ? "10%" : "65%",
                    backgroundColor: getPreviewColorHex(),
                    opacity: 0.8
                  }}
                />
              </div>

              <div className="preview-name">
                {form.goblet_number || "G-772"}
              </div>
              <div className="preview-live-sub">Visual Preview</div>
            </div>

            <div className="preview-details-list">
              <div className="preview-row">
                <span className="row-label">Asset Type</span>
                <span className="row-value">Cryo-Goblet</span>
              </div>
              <div className="preview-row">
                <span className="row-label">Storage Temp</span>
                <span className="row-value">-196°C</span>
              </div>
              <div className="preview-row">
                <span className="row-label">Material</span>
                <span className="row-value">Medical-Grade Polymer</span>
              </div>
            </div>

            <div className="form-tip-box">
              <Lightbulb className="form-tip-icon" size={16} />
              <div className="form-tip-text">
                Ensuring proper color-coding enables staff to quickly identify tissue classes under liquid nitrogen vapor.
              </div>
            </div>
          </div>

          {/* Inventory Guidelines */}
          <div className="cane-guide-card" style={{ padding: "20px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#1e1b4b",
                display: "block",
                marginBottom: "8px"
              }}
            >
              Inventory Guidelines
            </span>
            <p style={{ fontSize: "11.5px", color: "#64748b", lineHeight: "1.6" }}>
              Ensure all Goblets are labeled with physical barcodes matching the RFID Tag ID for redundancy. Color-coding should follow the Bio-Storage Standard Operating Procedure v4.2.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="form-footer-actions">
          <button
            type="button"
            className="cryo-btn-cancel"
            onClick={onBack}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cryo-btn-deploy"
            onClick={handleSave}
            disabled={submitting || (selectedCaneObj && remainingSpaces <= 0)}
            style={{
              background:
                selectedCaneObj && remainingSpaces <= 0
                  ? "#94a3b8"
                  : "linear-gradient(135deg, var(--emb-accent, #8b5cf6) 0%, var(--emb-accent-dark, #7c3aed) 100%)"
            }}
          >
            <Save size={16} />
            {submitting ? "Registering..." : "Register Asset"}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`goblet-toast goblet-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
