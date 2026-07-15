import React, { useState, useEffect } from "react";
import { getStoredSample, updateStoredSample, thawSample, deleteStoredSample } from "../../api/cryoApi";
import "./cryo_sample_details.css";
import {
  ArrowLeft, Edit2, Snowflake, Trash2, AlertTriangle,
  User, FlaskConical, MapPin, FileText, Calendar,
  CheckCircle2, AlertCircle, XCircle
} from "lucide-react";

export default function CryoSampleDetails({ sampleId, onBack }) {
  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Thaw Modal
  const [showThawModal, setShowThawModal] = useState(false);
  const [thawForm, setThawForm] = useState({ post_thaw_survival: "", thaw_notes: "" });
  const [thawing, setThawing] = useState(false);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const triggerToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSample = async () => {
    setLoading(true);
    try {
      const res = await getStoredSample(sampleId);
      const data = res.data?.data || res.data;
      setSample(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load sample details. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sampleId) fetchSample();
  }, [sampleId]);

  // ── Helpers ──
  const getStatusClass = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "STORED" || s === "IN_STORAGE") return "stored";
    if (s === "THAWED") return "thawed";
    if (s === "DISPOSED") return "disposed";
    if (s === "USED") return "used";
    if (s === "EXPIRED" || s === "REVIEW") return "expired";
    return "stored";
  };

  const getStatusLabel = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "STORED" || s === "IN_STORAGE") return "Stored";
    if (s === "THAWED") return "Thawed";
    if (s === "DISPOSED") return "Disposed";
    if (s === "USED") return "Used";
    if (s === "EXPIRED") return "Expired";
    if (s === "REVIEW") return "Review";
    return status || "Stored";
  };

  const getTypeBadgeClass = (type) => {
    const t = (type || "").toUpperCase();
    if (t === "SPERM") return "sperm";
    if (t === "EMBRYO") return "embryo";
    if (t === "EGG" || t === "OOCYTE") return "egg";
    return "sperm";
  };

  const getTypeLabel = (type) => {
    const t = (type || "").toUpperCase();
    if (t === "SPERM") return "Sperm";
    if (t === "EMBRYO") return "Embryo";
    if (t === "EGG") return "Egg";
    if (t === "OOCYTE") return "Oocyte";
    return type || "—";
  };

  const getSampleDisplayId = (s) => {
    return s?.sample_id || s?.display_id || `SAMPLE-${String(s?.id).padStart(3, "0")}`;
  };

  const getPatientName = (s) => {
    if (s?.patient_name) return s.patient_name;
    if (s?.patient?.user?.full_name) return s.patient.user.full_name;
    if (s?.patient?.full_name) return s.patient.full_name;
    return "—";
  };

  const getPatientId = (s) => {
    return s?.patient_id || s?.patient?.patient_id || `PAT-${String(s?.patient?.id || s?.patient || "").padStart(5, "0")}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) +
      " at " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const buildLocation = (s) => {
    if (!s) return "—";
    const parts = [
      s.tank_name || s.tank?.name || "",
      s.canister_name || s.canister?.name || "",
      s.cane_name || s.cane?.name || "",
      s.goblet_name || s.goblet?.name || ""
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" → ") : "—";
  };

  const getLocationCode = (s) => {
    if (!s) return "";
    const parts = [
      s.tank_name || s.tank?.name || "",
      s.goblet_name || s.goblet?.name || ""
    ].filter(Boolean);
    return parts.join("-");
  };

  // ── Thaw Handler ──
  const handleThaw = async (e) => {
    e.preventDefault();
    if (!thawForm.post_thaw_survival && thawForm.post_thaw_survival !== 0) {
      triggerToast("Please enter the post-thaw survival rate.", "error");
      return;
    }
    setThawing(true);
    try {
      await thawSample(sampleId, {
        post_thaw_survival: Number(thawForm.post_thaw_survival),
        thaw_notes: thawForm.thaw_notes.trim() || undefined
      });
      triggerToast("Sample thawed successfully!");
      setShowThawModal(false);
      setThawForm({ post_thaw_survival: "", thaw_notes: "" });
      fetchSample();
    } catch (err) {
      console.error(err);
      const detail = err?.response?.data?.detail || err?.response?.data?.error || "Failed to thaw sample.";
      triggerToast(detail, "error");
    } finally {
      setThawing(false);
    }
  };

  // ── Edit Handler ──
  const openEditModal = () => {
    if (!sample) return;
    setEditForm({
      vial_count: sample.vial_count || "",
      vial_volume: sample.vial_volume || "",
      concentration: sample.concentration || "",
      motility: sample.motility || "",
      morphology: sample.morphology || "",
      notes: sample.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      if (editForm.vial_count) payload.vial_count = Number(editForm.vial_count);
      if (editForm.vial_volume) payload.vial_volume = parseFloat(editForm.vial_volume);
      if (editForm.concentration) payload.concentration = parseFloat(editForm.concentration);
      if (editForm.motility) payload.motility = parseFloat(editForm.motility);
      if (editForm.morphology) payload.morphology = parseFloat(editForm.morphology);
      if (editForm.notes !== undefined) payload.notes = editForm.notes;

      await updateStoredSample(sampleId, payload);
      triggerToast("Sample updated successfully.");
      setShowEditModal(false);
      fetchSample();
    } catch (err) {
      console.error(err);
      const detail = err?.response?.data?.detail || "Failed to update sample.";
      triggerToast(detail, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Handler ──
  const handleDelete = async () => {
    if (!sample) return;
    if (window.confirm(`Are you sure you want to delete sample "${getSampleDisplayId(sample)}"? This action cannot be undone.`)) {
      try {
        await deleteStoredSample(sampleId);
        triggerToast(`Sample "${getSampleDisplayId(sample)}" deleted successfully.`);
        setTimeout(() => onBack(), 1500);
      } catch (err) {
        console.error(err);
        const detail = err?.response?.data?.detail || "Failed to delete sample.";
        triggerToast(detail, "error");
      }
    }
  };

  // ── Render: Loading/Error ──
  if (loading) {
    return (
      <div className="sample-details-container">
        <div className="sd-loader">
          <div className="spinner" />
          <p>Loading sample details...</p>
        </div>
      </div>
    );
  }

  if (error || !sample) {
    return (
      <div className="sample-details-container">
        <div className="sd-error">
          <AlertTriangle size={32} />
          <p>{error || "Sample not found."}</p>
          <button className="sd-retry-btn" onClick={fetchSample}>Retry</button>
          <button className="sd-retry-btn" onClick={onBack} style={{ background: "#475569", marginTop: 8 }}>Back to List</button>
        </div>
      </div>
    );
  }

  const isStoredStatus = ["STORED", "IN_STORAGE"].includes((sample.status || "").toUpperCase());

  return (
    <div className="sample-details-container">
      {/* Toast */}
      {toast && (
        <div className={`sd-toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="sd-breadcrumb">
        <button onClick={onBack}>Stored Samples</button>
        <span className="sd-bc-sep">&gt;</span>
        <span className="sd-bc-current">{getSampleDisplayId(sample)}</span>
      </div>

      {/* Header */}
      <div className="sd-header">
        <div className="sd-header-left">
          <h1>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0, color: "#8b5cf6" }}>
              <ArrowLeft size={22} />
            </button>
            {getSampleDisplayId(sample)}
            <span className={`sd-status-badge ${getStatusClass(sample.status)}`}>
              {getStatusLabel(sample.status)}
            </span>
          </h1>
          <span className="sd-subtitle">
            Cryo Storage  •  Cryopreserved {getTypeLabel(sample.sample_type)} Sample
          </span>
        </div>

        <div className="sd-header-actions">
          <button className="sd-btn-secondary" onClick={openEditModal}>
            <Edit2 size={14} /> Edit
          </button>
          {isStoredStatus && (
            <button className="sd-btn-thaw" onClick={() => setShowThawModal(true)}>
              <Snowflake size={14} /> Thaw Sample
            </button>
          )}
          <button className="sd-btn-danger" onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="sd-info-grid">
        {/* Patient Information */}
        <div className="sd-info-card">
          <h3><User size={16} /> Patient Information</h3>
          <div className="sd-field-row">
            <span className="sd-field-label">Patient Name</span>
            <span className="sd-field-value">{getPatientName(sample)}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Patient ID</span>
            <span className="sd-field-value">{getPatientId(sample)}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Email</span>
            <span className="sd-field-value">{sample.patient?.user?.email || sample.patient?.email || "—"}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Phone</span>
            <span className="sd-field-value">{sample.patient?.user?.phone || sample.patient?.phone || "—"}</span>
          </div>
        </div>

        {/* Sample Information */}
        <div className="sd-info-card">
          <h3><FlaskConical size={16} /> Sample Information</h3>
          <div className="sd-field-row">
            <span className="sd-field-label">Sample ID</span>
            <span className="sd-field-value">{getSampleDisplayId(sample)}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Sample Type</span>
            <span className="sd-field-value">
              <span className={`sd-type-badge ${getTypeBadgeClass(sample.sample_type)}`}>
                {getTypeLabel(sample.sample_type)}
              </span>
            </span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Vial Count</span>
            <span className="sd-field-value">{sample.vial_count || "—"}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Vial Volume</span>
            <span className="sd-field-value">{sample.vial_volume ? `${sample.vial_volume} mL` : "—"}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Freezing Method</span>
            <span className="sd-field-value">{sample.freezing_method || "—"}</span>
          </div>
        </div>

        {/* Storage Location */}
        <div className="sd-info-card">
          <h3><MapPin size={16} /> Storage Location</h3>
          <div className="sd-field-row">
            <span className="sd-field-label">Full Path</span>
            <span className="sd-field-value">{buildLocation(sample)}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Tank</span>
            <span className="sd-field-value">{sample.tank_name || sample.tank?.name || "—"}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Canister</span>
            <span className="sd-field-value">{sample.canister_name || sample.canister?.name || "—"}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Cane</span>
            <span className="sd-field-value">{sample.cane_name || sample.cane?.name || "—"}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Goblet</span>
            <span className="sd-field-value">{sample.goblet_name || sample.goblet?.name || "—"}</span>
          </div>
        </div>

        {/* Quality Metrics & Timeline */}
        <div className="sd-info-card">
          <h3><Calendar size={16} /> Quality & Timeline</h3>
          <div className="sd-field-row">
            <span className="sd-field-label">Concentration</span>
            <span className="sd-field-value">{sample.concentration ? `${sample.concentration} M/mL` : "—"}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Motility</span>
            <span className="sd-field-value">{sample.motility ? `${sample.motility}%` : "—"}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Morphology</span>
            <span className="sd-field-value">{sample.morphology ? `${sample.morphology}%` : "—"}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Created</span>
            <span className="sd-field-value">{formatDate(sample.created_at)}</span>
          </div>
          <div className="sd-field-row">
            <span className="sd-field-label">Last Updated</span>
            <span className="sd-field-value">{formatDate(sample.updated_at)}</span>
          </div>
          {sample.thawed_at && (
            <div className="sd-field-row">
              <span className="sd-field-label">Thawed At</span>
              <span className="sd-field-value">{formatDate(sample.thawed_at)}</span>
            </div>
          )}
          {sample.post_thaw_survival !== undefined && sample.post_thaw_survival !== null && (
            <div className="sd-field-row">
              <span className="sd-field-label">Post-Thaw Survival</span>
              <span className="sd-field-value">{sample.post_thaw_survival}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Clinical Notes */}
      <div className="sd-notes-card">
        <h3><FileText size={16} style={{ display: "inline", marginRight: 8, color: "#8b5cf6" }} />Clinical Notes</h3>
        {sample.notes ? (
          <p className="sd-notes-text">{sample.notes}</p>
        ) : (
          <p className="sd-notes-empty">No clinical notes recorded for this sample.</p>
        )}
      </div>

      {sample.thaw_notes && (
        <div className="sd-notes-card">
          <h3><FileText size={16} style={{ display: "inline", marginRight: 8, color: "#f59e0b" }} />Thaw Notes</h3>
          <p className="sd-notes-text">{sample.thaw_notes}</p>
        </div>
      )}

      {/* ── Thaw Modal ── */}
      {showThawModal && (
        <div className="sd-modal-overlay" onClick={() => setShowThawModal(false)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <div className="sd-modal-header-left">
                <div className="sd-modal-header-icon warning">
                  <AlertTriangle size={20} color="#d97706" />
                </div>
                <div>
                  <div className="sd-modal-title">Confirm Thaw Procedure</div>
                  <div className="sd-modal-subtitle">Sample ID: {getSampleDisplayId(sample)}</div>
                </div>
              </div>
              <button className="sd-modal-close" onClick={() => setShowThawModal(false)}>&times;</button>
            </div>

            <div className="sd-modal-body">
              {/* Warning Block */}
              <div className="sd-thaw-warning">
                <div className="sd-thaw-warning-title">Irreversible Action Warning</div>
                <div className="sd-thaw-warning-item">
                  <XCircle size={14} color="#dc2626" />
                  <span>
                    Sample status will be changed from <strong>In Storage</strong> to <strong>Thawed/Disposed</strong>.
                  </span>
                </div>
                <div className="sd-thaw-warning-item">
                  <XCircle size={14} color="#dc2626" />
                  <span>
                    Storage goblet <strong>{getLocationCode(sample)}</strong> will be marked as vacant and available for reuse.
                  </span>
                </div>
                <div className="sd-thaw-warning-item">
                  <XCircle size={14} color="#dc2626" />
                  <span>System will record current timestamp as official Thaw Date/Time.</span>
                </div>
              </div>

              <form onSubmit={handleThaw}>
                <div className="sd-form-row">
                  <div className="sd-form-field">
                    <label>Survival Rate (%)</label>
                    <div className="sd-input-suffix">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Enter post-thaw rate"
                        value={thawForm.post_thaw_survival}
                        onChange={(e) => setThawForm({ ...thawForm, post_thaw_survival: e.target.value })}
                        disabled={thawing}
                        required
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <div className="sd-form-field">
                    <label>Verification Tech ID</label>
                    <input
                      type="text"
                      value={`TECH-${String(sampleId).padStart(3, "0")}-${new Date().getFullYear().toString().slice(-2)}`}
                      disabled
                    />
                  </div>
                </div>

                <div className="sd-form-field full">
                  <label>Thaw Notes & Observations</label>
                  <textarea
                    placeholder="Describe sample appearance, motility after thaw, and any procedural deviations..."
                    value={thawForm.thaw_notes}
                    onChange={(e) => setThawForm({ ...thawForm, thaw_notes: e.target.value })}
                    disabled={thawing}
                    rows={4}
                  />
                </div>

                <div className="sd-modal-footer">
                  <button
                    type="button"
                    className="sd-modal-btn-cancel"
                    onClick={() => setShowThawModal(false)}
                    disabled={thawing}
                  >
                    Cancel & Return
                  </button>
                  <button
                    type="submit"
                    className="sd-modal-btn-confirm thaw"
                    disabled={thawing}
                  >
                    {thawing ? "Processing..." : "Confirm Thaw"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <div className="sd-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <div className="sd-modal-header-left">
                <div className="sd-modal-header-icon edit">
                  <Edit2 size={20} color="#16a34a" />
                </div>
                <div>
                  <div className="sd-modal-title">Update Sample Details</div>
                  <div className="sd-modal-subtitle">Sample ID: {getSampleDisplayId(sample)}</div>
                </div>
              </div>
              <button className="sd-modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>

            <div className="sd-modal-body">
              <form onSubmit={handleSaveEdit}>
                <div className="sd-form-row">
                  <div className="sd-form-field">
                    <label>Vial Count</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.vial_count}
                      onChange={(e) => setEditForm({ ...editForm, vial_count: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div className="sd-form-field">
                    <label>Vial Volume (mL)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.vial_volume}
                      onChange={(e) => setEditForm({ ...editForm, vial_volume: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="sd-form-row">
                  <div className="sd-form-field">
                    <label>Concentration (M/mL)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.concentration}
                      onChange={(e) => setEditForm({ ...editForm, concentration: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div className="sd-form-field">
                    <label>Motility (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editForm.motility}
                      onChange={(e) => setEditForm({ ...editForm, motility: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="sd-form-row">
                  <div className="sd-form-field">
                    <label>Morphology (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editForm.morphology}
                      onChange={(e) => setEditForm({ ...editForm, morphology: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="sd-form-field full">
                  <label>Clinical Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    disabled={saving}
                    rows={4}
                    placeholder="Update clinical observations..."
                  />
                </div>

                <div className="sd-modal-footer">
                  <button
                    type="button"
                    className="sd-modal-btn-cancel"
                    onClick={() => setShowEditModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="sd-modal-btn-confirm save"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
