import React, { useState, useEffect } from "react";
import { createCryoCane, listCryoCanisters } from "../../api/cryoApi";
import "./cryo_create_cane.css";
import {
  Info, Scan, Save, Lightbulb, CheckCircle2,
  Container, ChevronRight, Shield,
} from "lucide-react";

export default function CryoCreateCane({ onBack }) {
  const [canisters, setCanisters] = useState([]);
  const [loadingCanisters, setLoadingCanisters] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    canister: "",
    cane_number: "",
    capacity: 9,
    cane_rfid: "",
    notes: "",
  });

  const fetchCanisters = async () => {
    try {
      const res = await listCryoCanisters();
      setCanisters(res.data || []);
      if (res.data && res.data.length > 0) {
        setForm((prev) => ({ ...prev, canister: res.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to fetch canisters", err);
      showToast("Failed to load parent canisters.", "error");
    } finally {
      setLoadingCanisters(false);
    }
  };

  useEffect(() => {
    fetchCanisters();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "capacity" || name === "canister" ? Number(value) : value,
    }));
  };

  const handleScanRFID = () => {
    const randomRFID = "RFID-CANE-" + Math.floor(100 + Math.random() * 900);
    setForm((prev) => ({ ...prev, cane_rfid: randomRFID }));
    showToast("RFID Tag scanned successfully: " + randomRFID, "success");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.canister) {
      showToast("Please select a parent canister.", "error");
      return;
    }
    if (!form.cane_number.trim()) {
      showToast("Cane Number/ID is required.", "error");
      return;
    }
    if (!form.capacity || form.capacity <= 0) {
      showToast("Capacity must be greater than zero.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        canister: Number(form.canister),
        cane_number: form.cane_number.trim(),
        capacity: Number(form.capacity),
        cane_rfid: form.cane_rfid.trim() || null,
        notes: form.notes.trim(),
      };
      await createCryoCane(payload);
      showToast("Cane registered successfully!", "success");
      setTimeout(() => {
        if (onBack) onBack();
      }, 1500);
    } catch (err) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "object"
          ? Object.values(err.response.data).flat().join(" ")
          : "Failed to create cane.");
      showToast(detail, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Find selected canister info for display
  const selectedCanister = canisters.find((cn) => cn.id === Number(form.canister));
  const availableInfo = selectedCanister
    ? `${selectedCanister.capacity - (selectedCanister.current_usage || 0)} spaces available`
    : "";

  return (
    <div className="cryo-page">
      {/* ── Breadcrumb ── */}
      <div className="cryo-breadcrumb">
        <button onClick={onBack}>Inventory</button>
        <span>›</span>
        <button onClick={onBack}>Canes</button>
        <span>›</span>
        <span className="cryo-bc-current">Register New Cane</span>
      </div>

      {/* ── Header ── */}
      <div className="cryo-header">
        <div className="cryo-header-left">
          <h1>Cane Asset Registration</h1>
          <p>
            Provide technical specifications and mapping data to register a new
            storage cane into the facility database.
          </p>
        </div>
      </div>

      <hr className="cryo-divider" />

      {/* ── Body Grid ── */}
      <div className="cryo-body">
        {/* Left Column — Form */}
        <div className="cryo-left-col">
          <div className="cryo-card info-card">
            <div className="cryo-form-grid">
              {/* Parent Canister */}
              <div className="cryo-field">
                <label>
                  Parent Canister <span className="cane-required">*</span>
                </label>
                <select
                  className="cryo-select"
                  name="canister"
                  value={form.canister}
                  onChange={handleChange}
                  disabled={loadingCanisters}
                  required
                >
                  {loadingCanisters ? (
                    <option>Loading canisters...</option>
                  ) : (
                    canisters.map((cn) => (
                      <option key={cn.id} value={cn.id}>
                        {cn.canister_number || `Canister #${cn.id}`}
                        {cn.tank_info ? ` — ${cn.tank_info}` : ""}
                      </option>
                    ))
                  )}
                </select>
                {availableInfo && (
                  <span className="cane-avail-hint">
                    ⚠ {availableInfo}
                  </span>
                )}
              </div>

              {/* Cane Number/ID */}
              <div className="cryo-field">
                <label>
                  Cane Number/ID <span className="cane-required">*</span>
                </label>
                <input
                  type="text"
                  className="cryo-input"
                  name="cane_number"
                  value={form.cane_number}
                  onChange={handleChange}
                  placeholder="e.g. CN-9024"
                  required
                />
              </div>

              {/* Capacity */}
              <div className="cryo-field">
                <label>Capacity (Number of Goblets)</label>
                <div className="cryo-capacity-row">
                  <input
                    type="number"
                    className="cryo-input"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    min="1"
                    max="20"
                    required
                  />
                  <div className="capacity-max-badge">Slots total</div>
                </div>
              </div>

              {/* RFID Tag UID */}
              <div className="cryo-field">
                <label>RFID Tag UID</label>
                <div className="cryo-rfid-row">
                  <input
                    type="text"
                    className="cryo-input"
                    name="cane_rfid"
                    value={form.cane_rfid}
                    onChange={handleChange}
                    placeholder="Scan or enter RFID"
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
            </div>

            {/* Internal Notes — full width */}
            <div className="cryo-field" style={{ marginTop: "18px" }}>
              <label>Internal Notes</label>
              <textarea
                className="cryo-textarea"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="e.g. 'New cane for embryology samples', 'Specialized frost-resistant coating applied'"
              />
            </div>
          </div>
        </div>

        {/* Right Column — Registration Guide */}
        <div className="cryo-right-col">
          <div className="cane-guide-card">
            <div className="cane-guide-header">
              <div className="cane-guide-icon-box">
                <Container size={28} color="#fff" />
              </div>
            </div>

            <h3 className="cane-guide-title">Registration Guide</h3>

            <div className="cane-guide-items">
              <div className="cane-guide-item">
                <CheckCircle2 size={16} className="cane-guide-check" />
                <span>
                  Ensure Cane IDs follow the <strong>YY-NNNN</strong> naming
                  convention for audit tracking.
                </span>
              </div>
              <div className="cane-guide-item">
                <CheckCircle2 size={16} className="cane-guide-check" />
                <span>
                  RFID tags must be registered to the central gateway before
                  assignment.
                </span>
              </div>
              <div className="cane-guide-item">
                <CheckCircle2 size={16} className="cane-guide-check" />
                <span>
                  Maximum capacity for standard canes is typically 10 vials;
                  adjust as needed for ultra-slim variants.
                </span>
              </div>
            </div>

            <div className="cane-system-status">
              <div className="cane-system-icon">
                <Shield size={18} />
              </div>
              <div>
                <span className="cane-system-label">System Ready</span>
                <span className="cane-system-sub">Asset database v4.2 online</span>
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
            onClick={handleSave}
            disabled={submitting}
          >
            <Save size={16} />
            {submitting ? "Saving..." : "Save Asset"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`cryo-toast cryo-toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
