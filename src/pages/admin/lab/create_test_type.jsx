import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, Info } from "lucide-react";
import adminApi from "../../../api/adminApi";
import "./lab.css";

export default function CreateTestType() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [icon, setIcon] = useState("fa-flask");
  const [color, setColor] = useState("#8B5CF6");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([
    {
      label: "Total Cholesterol",
      field_key: "total_cholesterol",
      field_type: "decimal",
      is_required: true,
      min_value: 0,
      max_value: 500,
      display_order: 1,
      color: "#4474f6",
      help_text: "Total cholesterol in mg/dL",
      placeholder: "Enter total cholesterol"
    }
  ]);
  const [isPublic, setIsPublic] = useState(true);
  const [isUrgent, setIsUrgent] = useState(false);
  const [department, setDepartment] = useState("Biochemistry");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-slugify label to field_key
  const generateKey = (label) => {
    return label
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  };

  const handleFieldChange = (index, attr, value) => {
    setFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [attr]: value };
      
      // Auto-update field_key if label changes
      if (attr === "label") {
        updated[index].field_key = generateKey(value);
        if (!updated[index].placeholder) {
          updated[index].placeholder = `Enter ${value.toLowerCase()}`;
        }
        if (!updated[index].help_text) {
          updated[index].help_text = `${value} in mg/dL`;
        }
      }
      return updated;
    });
  };

  const addField = () => {
    setFields(prev => [
      ...prev,
      {
        label: "",
        field_key: "",
        field_type: "decimal",
        is_required: true,
        min_value: 0,
        max_value: 100,
        display_order: prev.length + 1,
        help_text: "",
        placeholder: "",
        options: "" // String input for comma-separated options
      }
    ]);
  };

  const removeField = (index) => {
    setFields(prev => prev.filter((_, idx) => idx !== index).map((f, i) => ({ ...f, display_order: i + 1 })));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !code) {
      setError("Please fill in the test name and test code.");
      return;
    }
    if (fields.length === 0) {
      setError("Please add at least one field configuration.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Clean up fields payload
      const cleanedFields = fields.map(f => {
        const item = {
          label: f.label,
          field_key: f.field_key || generateKey(f.label),
          field_type: f.field_type,
          is_required: !!f.is_required,
          display_order: parseInt(f.display_order) || 1,
          help_text: f.help_text || undefined,
          placeholder: f.placeholder || undefined
        };

        if (f.field_type === "decimal" || f.field_type === "integer") {
          item.min_value = parseFloat(f.min_value) ?? 0;
          item.max_value = parseFloat(f.max_value) ?? 100;
        }

        if (f.field_type === "select") {
          item.options = typeof f.options === "string" 
            ? f.options.split(",").map(o => o.trim()).filter(Boolean) 
            : f.options || [];
        }

        return item;
      });

      const payload = {
        name,
        code,
        icon,
        color,
        description,
        fields: cleanedFields,
        // settings: could be included if backend supports them, but main payload uses standard structure
        is_active: true
      };

      await adminApi.createTestType(payload);
      navigate("/superadmin/lab/test-types");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create test type. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lab-section">
      {/* Breadcrumbs */}
      <div className="lab-breadcrumb">
        <button className="lab-breadcrumb-btn" onClick={() => navigate("/superadmin/lab/test-types")}>
          <ArrowLeft size={16} style={{ marginRight: "4px" }} />
          Lab Management
        </button>
        <span className="lab-breadcrumb-separator">/</span>
        <span className="lab-breadcrumb-current">Create New Test Type</span>
      </div>

      {/* Header */}
      <div className="lab-header-container">
        <div>
          <h2 className="lab-main-title">Create New Test Type</h2>
          <p className="lab-main-subtitle">Define parameters and reference ranges for a new diagnostic laboratory test.</p>
        </div>
        <div className="lab-header-right">
          <span style={{ padding: "6px 12px", background: "#f2f4f7", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "#475467" }}>
            Drafts
          </span>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ textAlign: "left" }}>
          {error}
        </div>
      )}

      {/* Form Layout */}
      <form onSubmit={handleSave} className="form-grid-layout">
        {/* Left Column */}
        <div>
          {/* Basic Information Card */}
          <div className="form-card">
            <h3>Basic Information</h3>
            <div className="form-row-2col">
              <div className="form-group-lab">
                <label>Test Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Lipid Profile" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>

              <div className="form-group-lab">
                <label>Test Code</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., LIPID" 
                  value={code} 
                  onChange={e => setCode(e.target.value.toUpperCase())} 
                />
              </div>
            </div>

            <div className="form-row-2col">
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
            </div>

            <div className="form-group-lab" style={{ marginBottom: 0 }}>
              <label>Description</label>
              <textarea 
                placeholder="Detailed description of the test purpose and clinical indications..." 
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Fields Configuration Card */}
          <div className="form-card">
            <div className="fields-section-header">
              <h3>Fields Configuration <span className="fields-badge-count">{fields.length} Fields Defined</span></h3>
            </div>

            {fields.map((field, idx) => (
              <div className="field-editor-card" key={idx}>
                <div className="field-editor-card-header">
                  <span className="field-drag-label">
                    ☰ Field 0{idx + 1}: {field.label || "Untitled"}
                  </span>
                  {fields.length > 1 && (
                    <button type="button" className="btn-delete-field" onClick={() => removeField(idx)}>
                      <Trash2 size={14} />
                      Delete Field
                    </button>
                  )}
                </div>

                <div className="form-row-2col">
                  <div className="form-group-lab">
                    <label>Label</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Total Cholesterol" 
                      value={field.label}
                      onChange={e => handleFieldChange(idx, "label", e.target.value)}
                    />
                  </div>

                  <div className="form-group-lab">
                    <label>Field Key</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. total_cholesterol" 
                      value={field.field_key}
                      onChange={e => handleFieldChange(idx, "field_key", e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group-lab">
                    <label>Field Type</label>
                    <select 
                      value={field.field_type} 
                      onChange={e => handleFieldChange(idx, "field_type", e.target.value)}
                    >
                      <option value="decimal">Decimal</option>
                      <option value="integer">Integer</option>
                      <option value="text">Text</option>
                      <option value="select">Select</option>
                    </select>
                  </div>

                  <div className="form-group-lab">
                    <label>Unit (optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. mg/dL" 
                      value={field.unit || ""}
                      onChange={e => handleFieldChange(idx, "unit", e.target.value)}
                    />
                  </div>
                </div>

                {field.field_type === "select" ? (
                  <div className="form-group-lab">
                    <label>Options (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Fasting, Post-meal, Random" 
                      value={field.options || ""}
                      onChange={e => handleFieldChange(idx, "options", e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="form-row-2col">
                    <div className="form-group-lab">
                      <label>Min Value</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={field.min_value}
                        onChange={e => handleFieldChange(idx, "min_value", e.target.value)}
                      />
                    </div>
                    <div className="form-group-lab">
                      <label>Max Value</label>
                      <input 
                        type="number" 
                        placeholder="100" 
                        value={field.max_value}
                        onChange={e => handleFieldChange(idx, "max_value", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="form-row-2col" style={{ margin: 0 }}>
                  <div className="form-group-lab" style={{ justifyContent: "center" }}>
                    <label className="checkbox-lbl-lab">
                      <input 
                        type="checkbox" 
                        checked={field.is_required}
                        onChange={e => handleFieldChange(idx, "is_required", e.target.checked)}
                      />
                      Required Field
                    </label>
                  </div>
                  <div className="form-group-lab">
                    <label>Display Order</label>
                    <input 
                      type="number" 
                      value={field.display_order}
                      onChange={e => handleFieldChange(idx, "display_order", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="btn-add-field-dashed" onClick={addField}>
              <Plus size={16} />
              Add Another Field
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Test Settings Card */}
          <div className="form-card" style={{ padding: "20px" }}>
            <h3>TEST SETTINGS</h3>
            
            <div className="form-group-lab" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
              <label>Public Availability</label>
              <div className="toggle-switch-wrap" style={{ marginTop: "6px" }}>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={isPublic} 
                    onChange={e => setIsPublic(e.target.checked)} 
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className={`toggle-label ${isPublic ? "" : "inactive"}`}>
                  {isPublic ? "Visible to all lab clinicians" : "Private"}
                </span>
              </div>
            </div>

            <div className="form-group-lab" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
              <label>Urgent Processing</label>
              <div className="toggle-switch-wrap" style={{ marginTop: "6px" }}>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={isUrgent} 
                    onChange={e => setIsUrgent(e.target.checked)} 
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className={`toggle-label ${isUrgent ? "" : "inactive"}`}>
                  {isUrgent ? "STAT Priority Enabled" : "Enable STAT priority requests"}
                </span>
              </div>
            </div>

            <div className="form-group-lab">
              <label>Primary Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)} style={{ marginTop: "6px" }}>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Hematology">Hematology</option>
                <option value="Pathology">Pathology</option>
                <option value="Microbiology">Microbiology</option>
              </select>
            </div>

            <div className="settings-tip-box">
              <div className="settings-tip-icon">
                <Info size={18} />
              </div>
              <div className="settings-tip-text">
                <p>Reference ranges defined here will automatically flag abnormal results in patient reports.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="form-footer-bar">
          <div className="autosave-text">
            <span className="autosave-dot"></span>
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
              type="button" 
              className="btn-form-preview"
              onClick={() => alert("Preview Mode: This shows how the fields will display in the EMR form.")}
            >
              Preview
            </button>
            <button 
              type="submit" 
              className="btn-form-save"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Test Type"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
