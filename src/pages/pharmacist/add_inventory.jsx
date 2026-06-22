import React, { useState, useEffect } from "react";
import { Plus, Calendar, Info, ShieldCheck, ClipboardList, Package, HelpCircle, CheckCircle2, Circle } from "lucide-react";
import pharmacistApi from "../../api/pharmacistApi";
import "./add_inventory.css";

export default function AddInventory() {
  const [formData, setFormData] = useState({
    name: "",
    generic_name: "",
    category: 1, // Default mock category ID
    manufacturer: 1, // Default mock manufacturer ID
    unit: "IU",
    unit_price: "",
    tax_rate: "",
    current_stock: "",
    reorder_level: "",
    minimum_stock: "",
    maximum_stock: "",
    expiry_date: "",
    batch_number: "",
    storage_location: "",
    temperature_requirement: "",
    special_handling: "",
    requires_prescription: true,
    is_controlled: false,
    requires_refrigeration: true,
    requires_doctor_approval: false,
    monitor_side_effects: true,
    side_effects: "",
    interactions: "",
    notes: ""
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleToggle = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const calculateSellingPrice = () => {
    const price = parseFloat(formData.unit_price) || 0;
    const tax = parseFloat(formData.tax_rate) || 0;
    return (price + price * (tax / 100)).toFixed(2);
  };

  const handleSubmit = async (e, addAnother = false) => {
    e?.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        ...formData,
        unit_price: parseFloat(formData.unit_price) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        current_stock: parseInt(formData.current_stock) || 0,
        reorder_level: parseInt(formData.reorder_level) || 0,
        minimum_stock: parseInt(formData.minimum_stock) || 0,
        maximum_stock: parseInt(formData.maximum_stock) || 0,
      };

      delete payload.monitor_side_effects;

      await pharmacistApi.addInventory(payload);
      setSuccessMsg("Medication added successfully!");
      
      if (addAnother) {
        setFormData({
          ...formData,
          name: "",
          generic_name: "",
          unit_price: "",
          tax_rate: "",
          current_stock: "",
          reorder_level: "",
          minimum_stock: "",
          maximum_stock: "",
          expiry_date: "",
          batch_number: "",
          side_effects: "",
          interactions: "",
          notes: ""
        });
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setTimeout(() => {
          setSuccessMsg("");
        }, 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to add medication. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-inv-container">
      {/* Header */}
      <div className="add-inv-header">
        <div className="add-inv-header-left">
          <div className="add-inv-title-row">
            <Plus size={18} className="add-inv-header-icon" />
            <span className="add-inv-subtitle">PHARMACEUTICAL INTAKE</span>
          </div>
          <h1 className="add-inv-title">Add New Medication</h1>
        </div>
        <div className="add-inv-header-right">
          <span className="add-inv-draft"><span className="add-inv-dot"></span> Draft Auto-saved</span>
          <span className="add-inv-last-edited">Last edited: Just now</span>
        </div>
      </div>

      {successMsg && <div className="add-inv-alert-success">{successMsg}</div>}
      {errorMsg && <div className="add-inv-alert-error">{errorMsg}</div>}

      <div className="add-inv-form-content">
        {/* Basic Information */}
        <div className="add-inv-section">
          <div className="add-inv-section-header">
            <Info size={16} />
            <h2>Basic Information</h2>
          </div>
          <div className="add-inv-form-grid-2">
            <div className="add-inv-input-group">
              <label>Medication Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Gonal-F 300IU" />
            </div>
            <div className="add-inv-input-group">
              <label>Generic Name *</label>
              <input type="text" name="generic_name" value={formData.generic_name} onChange={handleChange} placeholder="e.g. Follitropin alfa" />
            </div>
            <div className="add-inv-input-group">
              <label>Category *</label>
              <div className="add-inv-select-add">
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value={1}>Hormonal Therapy</option>
                  <option value={2}>Fertility Drugs</option>
                  <option value={3}>Antibiotics</option>
                  <option value={4}>Vitamins & Supplements</option>
                  <option value={5}>Pain Management</option>
                  <option value={6}>Controlled Substances</option>
                </select>
                <button type="button" className="add-inv-icon-btn"><Plus size={16} /></button>
              </div>
            </div>
            <div className="add-inv-input-group">
              <label>Manufacturer *</label>
              <div className="add-inv-select-add">
                <select name="manufacturer" value={formData.manufacturer} onChange={handleChange}>
                  <option value={1}>Merck Serono</option>
                  {/* add more once created */}
                </select>
                <button type="button" className="add-inv-icon-btn"><Plus size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="add-inv-grid-row-2">
          {/* Pricing & Unit */}
          <div className="add-inv-section">
            <div className="add-inv-section-header">
              <Package size={16} />
              <h2>Pricing & Unit</h2>
            </div>
            <div className="add-inv-input-group">
              <label>Unit *</label>
              <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g. IU, mg, ml" />
            </div>
            <div className="add-inv-input-group add-inv-mt-3">
              <label>Unit Price ($) *</label>
              <input type="number" name="unit_price" value={formData.unit_price} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="add-inv-form-grid-2 add-inv-mt-3">
              <div className="add-inv-input-group">
                <label>Tax Rate (%)</label>
                <input type="number" name="tax_rate" value={formData.tax_rate} onChange={handleChange} placeholder="10" />
              </div>
              <div className="add-inv-input-group">
                <label>Selling Price ($)</label>
                <input type="text" className="add-inv-readonly" value={calculateSellingPrice()} readOnly disabled />
              </div>
            </div>
          </div>

          {/* Stock Management */}
          <div className="add-inv-section">
            <div className="add-inv-section-header">
              <ClipboardList size={16} />
              <h2>Stock Management</h2>
            </div>
            <div className="add-inv-stock-grid">
              <div className="add-inv-initial-stock">
                <label>Initial Stock</label>
                <input type="number" name="current_stock" value={formData.current_stock} onChange={handleChange} placeholder="0" className="add-inv-transparent-input" />
                <span>Total units on hand</span>
              </div>
              <div className="add-inv-input-group">
                <label>Reorder Level</label>
                <input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleChange} placeholder="10" />
              </div>
              <div className="add-inv-input-group">
                <label>Minimum Stock</label>
                <input type="number" name="minimum_stock" value={formData.minimum_stock} onChange={handleChange} placeholder="5" />
              </div>
              <div className="add-inv-input-group">
                <label>Maximum Stock</label>
                <input type="number" name="maximum_stock" value={formData.maximum_stock} onChange={handleChange} placeholder="50" />
              </div>
            </div>
            <div className="add-inv-form-grid-2 add-inv-mt-3">
              <div className="add-inv-input-group">
                <label>Expiry Date *</label>
                <div className="add-inv-date-wrapper">
                  <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} />
                </div>
              </div>
              <div className="add-inv-input-group">
                <label>Batch Number *</label>
                <input type="text" name="batch_number" value={formData.batch_number} onChange={handleChange} placeholder="BATCH-001" />
              </div>
            </div>
          </div>
        </div>

        <div className="add-inv-grid-row-2">
          {/* Storage & Handling */}
          <div className="add-inv-section">
            <div className="add-inv-section-header">
              <Package size={16} />
              <h2>Storage & Handling</h2>
            </div>
            <div className="add-inv-input-group">
              <label>Storage Location *</label>
              <input type="text" name="storage_location" value={formData.storage_location} onChange={handleChange} placeholder="e.g. Fridge 1 - Shelf 2" />
            </div>
            <div className="add-inv-form-grid-2 add-inv-mt-3">
              <div className="add-inv-input-group">
                <label>Temperature (°C)</label>
                <input type="text" name="temperature_requirement" value={formData.temperature_requirement} onChange={handleChange} placeholder="e.g. 2-8°C" />
              </div>
              <div className="add-inv-input-group">
                <label>Special Handling</label>
                <input type="text" name="special_handling" value={formData.special_handling} onChange={handleChange} placeholder="e.g. Keep away from light" />
              </div>
            </div>
          </div>

          {/* Compliance & Restrictions */}
          <div className="add-inv-section">
            <div className="add-inv-section-header">
              <ShieldCheck size={16} />
              <h2>Compliance & Restrictions</h2>
            </div>
            <div className="add-inv-compliance-grid">
              <div className={`add-inv-compliance-toggle ${formData.requires_prescription ? 'active' : ''}`} onClick={() => handleToggle('requires_prescription')}>
                {formData.requires_prescription ? <CheckCircle2 size={18} className="add-inv-icon-active" /> : <Circle size={18} className="add-inv-icon-inactive" />}
                <span>Requires Prescription</span>
              </div>
              <div className={`add-inv-compliance-toggle ${formData.is_controlled ? 'active' : ''}`} onClick={() => handleToggle('is_controlled')}>
                {formData.is_controlled ? <CheckCircle2 size={18} className="add-inv-icon-active" /> : <Circle size={18} className="add-inv-icon-inactive" />}
                <span>Controlled Substance</span>
              </div>
              <div className={`add-inv-compliance-toggle ${formData.requires_refrigeration ? 'active' : ''}`} onClick={() => handleToggle('requires_refrigeration')}>
                {formData.requires_refrigeration ? <CheckCircle2 size={18} className="add-inv-icon-active" /> : <Circle size={18} className="add-inv-icon-inactive" />}
                <span>Requires Refrigeration</span>
              </div>
              <div className={`add-inv-compliance-toggle ${formData.requires_doctor_approval ? 'active' : ''}`} onClick={() => handleToggle('requires_doctor_approval')}>
                {formData.requires_doctor_approval ? <CheckCircle2 size={18} className="add-inv-icon-active" /> : <Circle size={18} className="add-inv-icon-inactive" />}
                <span>Requires Doctor Approval</span>
              </div>
              <div className={`add-inv-compliance-toggle ${formData.monitor_side_effects ? 'active' : ''}`} onClick={() => handleToggle('monitor_side_effects')}>
                {formData.monitor_side_effects ? <CheckCircle2 size={18} className="add-inv-icon-active" /> : <Circle size={18} className="add-inv-icon-inactive" />}
                <span>Monitor Side Effects</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Notes & Safety */}
        <div className="add-inv-section">
          <div className="add-inv-section-header">
            <ClipboardList size={16} />
            <h2>Clinical Notes & Safety</h2>
          </div>
          <div className="add-inv-form-grid-2">
            <div className="add-inv-input-group">
              <label>Side Effects</label>
              <textarea name="side_effects" value={formData.side_effects} onChange={handleChange} placeholder="e.g. Headache, nausea, fatigue" rows={3}></textarea>
            </div>
            <div className="add-inv-input-group">
              <label>Interactions</label>
              <textarea name="interactions" value={formData.interactions} onChange={handleChange} placeholder="e.g. None known" rows={3}></textarea>
            </div>
          </div>
          <div className="add-inv-input-group add-inv-mt-3">
            <label>Inventory Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g. Store in refrigerator. Do not freeze." rows={2}></textarea>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="add-inv-footer">
        <div className="add-inv-footer-left">
          <HelpCircle size={16} />
          <span>Need help with classification? <a href="#">View Guidelines</a></span>
        </div>
        <div className="add-inv-footer-right">
          <button type="button" className="add-inv-btn-cancel">Cancel</button>
          <button type="button" className="add-inv-btn-sec" onClick={(e) => handleSubmit(e, true)} disabled={loading}>
            {loading ? "Saving..." : "Save & Add Another"}
          </button>
          <button type="button" className="add-inv-btn-pri" onClick={(e) => handleSubmit(e, false)} disabled={loading}>
            {loading ? "Saving..." : "Save Medication"}
          </button>
        </div>
      </div>
    </div>
  );
}
