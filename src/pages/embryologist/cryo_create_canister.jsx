import React, { useState, useEffect } from "react";
import { createCryoCanister, listCryoTanks } from "../../api/cryoApi";
import "./cryo_create_canister.css";
import { 
  Info, Scan, Save, Trash2, HelpCircle, Lightbulb, 
  FlaskConical, CheckCircle2, ChevronRight, Container 
} from "lucide-react";

export default function CryoCreateCanister({ onBack }) {
  const [tanks, setTanks] = useState([]);
  const [loadingTanks, setLoadingTanks] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    tank: "",
    canister_number: "",
    capacity: 10,
    canister_rfid: "",
    notes: "",
    asset_class: "Clinical" // Clinical, Research
  });

  const fetchTanks = async () => {
    try {
      const res = await listCryoTanks();
      setTanks(res.data || []);
      if (res.data && res.data.length > 0) {
        setForm(prev => ({ ...prev, tank: res.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to fetch tanks", err);
      showToast("Failed to load parent tanks.", "error");
    } finally {
      setLoadingTanks(false);
    }
  };

  useEffect(() => {
    fetchTanks();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value
    }));
  };

  const handleAssetClass = (cls) => {
    setForm(prev => ({ ...prev, asset_class: cls }));
  };

  const handleScanRFID = () => {
    // Simulated RFID scan
    const randomRFID = "RFID-CAN-" + Math.floor(100 + Math.random() * 900);
    setForm(prev => ({ ...prev, canister_rfid: randomRFID }));
    showToast("RFID Tag scanned successfully: " + randomRFID, "success");
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!form.tank) {
      showToast("Please select a parent tank.", "error");
      return;
    }
    if (!form.canister_number.trim()) {
      showToast("Canister number/ID is required.", "error");
      return;
    }
    if (!form.capacity || form.capacity <= 0) {
      showToast("Capacity must be greater than zero.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tank: Number(form.tank),
        canister_number: form.canister_number.trim(),
        capacity: Number(form.capacity),
        canister_rfid: form.canister_rfid.trim(),
        notes: (form.notes + (form.asset_class ? ` [Asset Class: ${form.asset_class}]` : "")).trim()
      };
      await createCryoCanister(payload);
      showToast("Canister deployed successfully!", "success");
      setTimeout(() => {
        if (onBack) onBack();
      }, 1500);
    } catch (err) {
      console.error(err);
      const detail = err?.response?.data?.detail || "Failed to create canister.";
      showToast(detail, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const previewName = form.canister_number.trim() 
    ? form.canister_number.trim().toUpperCase().replace(/\s+/g, "_") 
    : "NEW_CANISTER_09";

  return (
    <div className="cryo-page">
      {/* ── Breadcrumb ── */}
      <div className="cryo-breadcrumb">
        <button onClick={onBack}>Inventory</button>
        <span>›</span>
        <button onClick={onBack}>Canister Management</button>
        <span>›</span>
        <span className="cryo-bc-current">New Canister</span>
      </div>

      {/* ── Header ── */}
      <div className="cryo-header">
        <div className="cryo-header-left">
          <h1>Create New Canister</h1>
          <p>Register a new secondary storage unit for biological specimens within a parent tank.</p>
        </div>
      </div>

      <hr className="cryo-divider" />

      {/* ── Body Grid ── */}
      <div className="cryo-body">
        {/* Form Container (Left Column) */}
        <div className="cryo-left-col">
          {/* Information Card */}
          <div className="cryo-card info-card">
            <div className="cryo-card-title">
              <Info size={16} /> Information
            </div>

            <div className="cryo-form-grid">
              {/* Parent Tank dropdown */}
              <div className="cryo-field">
                <label>Parent Tank</label>
                <select 
                  className="cryo-select" 
                  name="tank" 
                  value={form.tank} 
                  onChange={handleChange}
                  disabled={loadingTanks}
                  required
                >
                  {loadingTanks ? (
                    <option>Loading tanks...</option>
                  ) : (
                    tanks.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Canister Number/ID */}
              <div className="cryo-field">
                <label>Canister Number/ID</label>
                <input
                  type="text"
                  className="cryo-input"
                  name="canister_number"
                  value={form.canister_number}
                  onChange={handleChange}
                  placeholder="e.g. CAN-09-V"
                  required
                />
              </div>

              {/* Capacity */}
              <div className="cryo-field">
                <label>Capacity (Vials/Cane Count)</label>
                <div className="cryo-capacity-row">
                  <input
                    type="number"
                    className="cryo-input"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    min="1"
                    max="24"
                    required
                  />
                  <div className="capacity-max-badge">MAX: 24</div>
                </div>
              </div>

              {/* Asset Class */}
              <div className="cryo-field">
                <label>Asset Class</label>
                <div className="asset-class-toggle-group">
                  <button 
                    type="button"
                    className={`asset-class-btn ${form.asset_class === "Clinical" ? "active" : ""}`}
                    onClick={() => handleAssetClass("Clinical")}
                  >
                    Clinical
                  </button>
                  <button 
                    type="button"
                    className={`asset-class-btn ${form.asset_class === "Research" ? "active" : ""}`}
                    onClick={() => handleAssetClass("Research")}
                  >
                    Research
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Card */}
          <div className="cryo-card tracking-card">
            <div className="cryo-card-title">
              <Container size={16} /> Tracking
            </div>

            <div className="cryo-form-grid" style={{ gridTemplateColumns: "1fr" }}>
              {/* RFID Tag ID */}
              <div className="cryo-field">
                <label>RFID Tag ID</label>
                <div className="cryo-rfid-row">
                  <input
                    type="text"
                    className="cryo-input"
                    name="canister_rfid"
                    value={form.canister_rfid}
                    onChange={handleChange}
                    placeholder="Scan or enter RFID..."
                  />
                  <button 
                    type="button" 
                    className="cryo-btn-scan"
                    onClick={handleScanRFID}
                  >
                    <Scan size={14} /> Scan
                  </button>
                </div>
                <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px" }}>
                  Assign a unique physical identifier for location proximity sensing.
                </span>
              </div>

              {/* Notes & Observations */}
              <div className="cryo-field">
                <label>Notes &amp; Observations</label>
                <textarea
                  className="cryo-textarea"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="e.g. 'Labeled in blue', 'High-priority retrieval', 'Modified handle grip'..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Panel (Right Column) */}
        <div className="cryo-right-col">
          <div className="cryo-preview-card">
            <div className="preview-header">Asset Visualization</div>
            
            <div className="preview-graphic-box">
              <div className="preview-canister-icon">
                <FlaskConical size={32} color="#8b5cf6" style={{ zIndex: 3 }} />
                <div 
                  className="preview-canister-fluid"
                  style={{ height: `${(form.capacity / 24) * 100}%` }}
                />
              </div>
              <div className="preview-dots">
                <div className="preview-dot active"></div>
                <div className="preview-dot active"></div>
                <div className="preview-dot"></div>
              </div>
              <div className="preview-name">{previewName}</div>
              <div className="preview-live-sub">Live Preview</div>
            </div>

            <div className="preview-details-list">
              <div className="preview-row">
                <span className="row-label">Storage Environment</span>
                <span className="row-value">Vapor Phase LN2</span>
              </div>
              <div className="preview-row">
                <span className="row-label">Default Temp</span>
                <span className="row-value">-196°C</span>
              </div>
              <div className="preview-row">
                <span className="row-label">Validation Status</span>
                <span className="validation-badge">READY</span>
              </div>
            </div>

            <div className="form-tip-box">
              <Lightbulb className="form-tip-icon" size={16} />
              <div className="form-tip-text">
                Filling this form will trigger a <strong>Chain of Custody</strong> log entry for immediate asset tracking.
              </div>
            </div>
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
            onClick={handleDeploy}
            disabled={submitting}
          >
            <Save size={16} /> 
            {submitting ? "Deploying..." : "Deploy Canister"}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`cryo-toast cryo-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
