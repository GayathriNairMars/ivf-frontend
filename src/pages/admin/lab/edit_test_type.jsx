import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X, Info, Edit, Trash2, Calendar, ChevronDown, Check, MoreVertical } from "lucide-react";
import adminApi from "../../../api/adminApi";
import "./lab.css";

export default function EditTestType() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [icon, setIcon] = useState("fa-flask");
  const [color, setColor] = useState("#8B5CF6");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState([]);
  
  // State for drafting a new field
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftField, setDraftField] = useState({
    label: "",
    field_key: "",
    field_type: "decimal",
    is_required: true,
    min_value: 0,
    max_value: 100,
    unit: "",
    options: "",
    display_order: 1,
    help_text: "",
    placeholder: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTestType() {
      try {
        setLoading(true);
        const data = await adminApi.getTestTypeDetails(id);
        if (data) {
          setName(data.name || "");
          setCode(data.code || "");
          setIcon(data.icon || "fa-flask");
          setColor(data.color || "#8B5CF6");
          setDescription(data.description || "");
          setIsActive(data.is_active !== false);
          setFields(data.fields || []);
        }
      } catch (err) {
        console.error("Failed to load test type", err);
        // Fallback mocks
        if (id === "1" || id === "1/") {
          setName("Sugar Test");
          setCode("SUGAR");
          setIcon("fa-droplet");
          setColor("#ef4444");
          setDescription("Blood sugar level monitoring for diabetic screening and prenatal care.");
          setIsActive(true);
          setFields([
            { id: 1, label: "Blood Sugar Level", field_key: "blood_sugar", field_type: "decimal", is_required: true, min_value: 0, max_value: 500, unit: "mg/dL", display_order: 1 },
            { id: 2, label: "Fasting Status", field_key: "fasting", field_type: "select", is_required: true, options: ["Fasting", "Post-meal", "Random"], display_order: 2 }
          ]);
        } else if (id === "2") {
          setName("Blood Pressure");
          setCode("BP");
          setIcon("fa-heart");
          setColor("#EF4444");
          setDescription("Blood pressure level test for cardiovascular monitoring.");
          setIsActive(true);
          setFields([
            { id: 4, label: "Systolic", field_key: "systolic", field_type: "decimal", is_required: true, min_value: 0, max_value: 300, display_order: 1 },
            { id: 5, label: "Diastolic", field_key: "diastolic", field_type: "decimal", is_required: true, min_value: 0, max_value: 200, display_order: 2 }
          ]);
        } else {
          setName("Glucose Test");
          setCode("GLUCOSE");
          setIcon("fa-droplet");
          setColor("#EF4444");
          setDescription("Blood glucose level test for diabetes monitoring");
          setIsActive(true);
          setFields([
            { id: 7, label: "Blood Glucose Level", field_key: "blood_glucose", field_type: "decimal", is_required: true, min_value: 0, max_value: 600, display_order: 1, help_text: "Enter blood glucose level in mg/dL" },
            { id: 8, label: "Fasting Status", field_key: "fasting", field_type: "select", is_required: true, options: ["Fasting", "Post-meal", "Random"], display_order: 2 },
            { id: 9, label: "HbA1c", field_key: "hba1c", field_type: "decimal", is_required: false, min_value: 0, max_value: 20, display_order: 3, help_text: "HbA1c percentage" }
          ]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadTestType();
  }, [id]);

  const handleStartDrafting = () => {
    setDraftField({
      label: "",
      field_key: "",
      field_type: "decimal",
      is_required: true,
      min_value: 0,
      max_value: 100,
      unit: "",
      options: "",
      display_order: fields.length + 1,
      help_text: "",
      placeholder: ""
    });
    setIsDrafting(true);
  };

  const handleDraftChange = (attr, value) => {
    setDraftField(prev => {
      const updated = { ...prev, [attr]: value };
      if (attr === "label") {
        updated.field_key = value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      }
      return updated;
    });
  };

  const handleConfirmDraftField = () => {
    if (!draftField.label) {
      alert("Please specify a label for the field.");
      return;
    }
    
    // Construct field object
    const newField = {
      label: draftField.label,
      field_key: draftField.field_key || draftField.label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
      field_type: draftField.field_type,
      is_required: !!draftField.is_required,
      display_order: parseInt(draftField.display_order) || fields.length + 1,
      unit: draftField.unit || undefined,
      help_text: draftField.help_text || `${draftField.label} field`,
      placeholder: draftField.placeholder || `Enter ${draftField.label.toLowerCase()}`
    };

    if (draftField.field_type === "decimal" || draftField.field_type === "integer") {
      newField.min_value = parseFloat(draftField.min_value) ?? 0;
      newField.max_value = parseFloat(draftField.max_value) ?? 100;
    }

    if (draftField.field_type === "select") {
      newField.options = typeof draftField.options === "string"
        ? draftField.options.split(",").map(o => o.trim()).filter(Boolean)
        : draftField.options || [];
    }

    setFields(prev => [...prev, newField]);
    setIsDrafting(false);
  };

  const handleRemoveField = (index) => {
    setFields(prev => prev.filter((_, idx) => idx !== index).map((f, idx) => ({ ...f, display_order: idx + 1 })));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !code) {
      setError("Test name and test code are required.");
      return;
    }
    if (fields.length === 0) {
      setError("Please add at least one field to the test profile.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Format payload
      const cleanedFields = fields.map(f => {
        const item = {
          label: f.label,
          field_key: f.field_key,
          field_type: f.field_type,
          is_required: !!f.is_required,
          display_order: parseInt(f.display_order) || 1,
          help_text: f.help_text,
          placeholder: f.placeholder,
          unit: f.unit || undefined
        };

        if (f.field_type === "decimal" || f.field_type === "integer") {
          item.min_value = parseFloat(f.min_value) ?? 0;
          item.max_value = parseFloat(f.max_value) ?? 100;
        }

        if (f.field_type === "select") {
          item.options = Array.isArray(f.options) ? f.options : f.options?.split(",").map(o => o.trim()).filter(Boolean) || [];
        }

        return item;
      });

      const payload = {
        name,
        code,
        icon,
        color,
        description,
        is_active: isActive,
        fields: cleanedFields
      };

      await adminApi.updateTestType(id, payload);
      navigate("/superadmin/lab/test-types");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save changes. Please check details and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="staff-loading">
        <div className="spinner" /><span>Loading test type details...</span>
      </div>
    );
  }

  return (
    <div className="lab-section">
      {/* Breadcrumbs */}
      <div className="lab-breadcrumb">
        <button className="lab-breadcrumb-btn" onClick={() => navigate("/superadmin/lab/test-types")}>
          Lab Management
        </button>
        <span className="lab-breadcrumb-separator">&gt;</span>
        <button className="lab-breadcrumb-btn" onClick={() => navigate("/superadmin/lab/test-types")}>
          All Test Types
        </button>
        <span className="lab-breadcrumb-separator">&gt;</span>
        <span className="lab-breadcrumb-current">Edit Test Type</span>
      </div>

      {/* Header */}
      <div className="lab-header-container">
        <div>
          <h2 className="lab-main-title">Edit Test Type - {name}</h2>
          <p className="lab-main-subtitle">Configure diagnostic parameters and field limits.</p>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ textAlign: "left" }}>
          {error}
        </div>
      )}

      {/* Form Grid Layout */}
      <form onSubmit={handleSave} className="form-grid-layout">
        {/* Left Column: Basic Information */}
        <div>
          <div className="form-card">
            <h3>BASIC INFORMATION</h3>
            
            <div className="form-group-lab">
              <label>Test Name</label>
              <input 
                type="text" 
                required
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group-lab">
                <label>Test Code</label>
                <input 
                  type="text" 
                  required
                  value={code} 
                  onChange={e => setCode(e.target.value.toUpperCase())} 
                />
              </div>

              <div className="form-group-lab">
                <label>Status</label>
                <div className="toggle-switch-wrap" style={{ marginTop: "8px" }}>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={isActive} 
                      onChange={e => setIsActive(e.target.checked)} 
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className={`toggle-label ${isActive ? "" : "inactive"}`}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group-lab">
                <label>Brand Color</label>
                <div className="color-picker-wrap">
                  <input 
                    type="text" 
                    className="color-input-field" 
                    value={color} 
                    onChange={e => setColor(e.target.value)} 
                  />
                  <input 
                    type="color" 
                    style={{ border: "none", width: "40px", height: "40px", padding: 0, background: "none", cursor: "pointer" }}
                    value={color} 
                    onChange={e => setColor(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group-lab">
                <label>Icon</label>
                <select value={icon} onChange={e => setIcon(e.target.value)}>
                  <option value="fa-flask">Flask / Beaker</option>
                  <option value="fa-droplet">Droplet / Blood</option>
                  <option value="fa-heart">Heart</option>
                  <option value="fa-dna">DNA</option>
                  <option value="fa-virus">Microscope / Virus</option>
                </select>
              </div>
            </div>

            <div className="form-group-lab" style={{ marginBottom: 0 }}>
              <label>Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Audit Log Preview notification box */}
          <div className="audit-log-preview-box">
            <div className="audit-log-icon">
              <Info size={20} />
            </div>
            <div className="audit-log-text">
              <h4>Audit Log Preview</h4>
              <p>Modifying fields might affect ongoing test cycles. Use caution when removing required parameters.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Fields Configuration */}
        <div>
          <div className="form-card" style={{ padding: "20px" }}>
            <div className="fields-section-header">
              <h3>Fields Configuration</h3>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                onClick={handleStartDrafting}
              >
                <Plus size={14} />
                Add Field
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "16px", textOrigin: "left" }}>
              {fields.length} Fields Defined for this test type
            </p>

            {/* List of existing fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {fields.map((field, idx) => (
                <div className="edit-field-item-row" key={idx}>
                  <div className="edit-field-item-left">
                    <span className="edit-field-num">0{idx + 1}</span>
                    <div>
                      <span className="edit-field-name">{field.label}</span>
                      <div className="edit-field-type" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span>Type: {field.field_type}</span>
                        {field.is_required && <span className="required-badge">Required</span>}
                      </div>
                      
                      {field.field_type === "select" ? (
                        <div className="chips-wrap">
                          {(Array.isArray(field.options) ? field.options : field.options?.split(",") || []).map((opt, oIdx) => (
                            <span className="chip-tag" key={oIdx}>{opt}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="range-unit-text">
                          Range: {field.min_value} - {field.max_value} {field.unit}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    className="btn-delete-field" 
                    style={{ color: "#d92d20", padding: "6px" }}
                    onClick={() => handleRemoveField(idx)}
                    title="Remove field"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Drafting New Field Mode */}
            {isDrafting && (
              <div className="draft-field-card" style={{ marginTop: "16px" }}>
                <div className="draft-field-header">
                  <div className="draft-field-header-left">
                    <span className="draft-field-badge">0{fields.length + 1}</span>
                    <span>DRAFTING NEW FIELD</span>
                  </div>
                  <button type="button" className="btn-close-draft" onClick={() => setIsDrafting(false)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="form-group-lab">
                  <label>Field Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. HbA1c"
                    value={draftField.label}
                    onChange={e => handleDraftChange("label", e.target.value)}
                  />
                </div>

                <div className="form-group-lab">
                  <label>Field Type</label>
                  <select 
                    value={draftField.field_type}
                    onChange={e => handleDraftChange("field_type", e.target.value)}
                  >
                    <option value="decimal">Decimal</option>
                    <option value="integer">Integer</option>
                    <option value="text">Text</option>
                    <option value="select">Select</option>
                  </select>
                </div>

                {draftField.field_type === "select" ? (
                  <div className="form-group-lab">
                    <label>Options (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="Fasting, Post-meal"
                      value={draftField.options}
                      onChange={e => handleDraftChange("options", e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-group-lab">
                      <label>Unit</label>
                      <input 
                        type="text" 
                        placeholder="e.g. % or mg/dL"
                        value={draftField.unit}
                        onChange={e => handleDraftChange("unit", e.target.value)}
                      />
                    </div>
                    
                    <div className="draft-field-row">
                      <div className="form-group-lab">
                        <label>Normal Range (Min)</label>
                        <input 
                          type="number" 
                          placeholder="Min"
                          value={draftField.min_value}
                          onChange={e => handleDraftChange("min_value", e.target.value)}
                        />
                      </div>
                      <div className="form-group-lab">
                        <label>Normal Range (Max)</label>
                        <input 
                          type="number" 
                          placeholder="Max"
                          value={draftField.max_value}
                          onChange={e => handleDraftChange("max_value", e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="checkbox-group-lab">
                  <label className="checkbox-lbl-lab">
                    <input 
                      type="checkbox" 
                      checked={draftField.is_required}
                      onChange={e => handleDraftChange("is_required", e.target.checked)}
                    />
                    Required Field
                  </label>
                </div>

                <div className="draft-footer-row">
                  <button type="button" className="btn-discard-draft" onClick={() => setIsDrafting(false)}>
                    Discard Draft
                  </button>
                  <button type="button" className="btn-confirm-draft" onClick={handleConfirmDraftField}>
                    Confirm Field
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="form-footer-bar" style={{ gridColumn: "1 / span 2" }}>
          <div className="autosave-text">
            Autosaved just now
          </div>
          <div className="form-footer-actions">
            <button 
              type="button" 
              className="btn-form-cancel" 
              onClick={() => navigate("/superadmin/lab/test-types")}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-form-save"
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
