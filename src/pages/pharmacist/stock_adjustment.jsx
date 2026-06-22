import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import "./stock_adjustment.css";
import { Search, Plus, Minus, Hash, Image as ImageIcon, CalendarX, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, FileText, Download, ExternalLink, Calculator, Snowflake, EyeOff } from "lucide-react";

export default function StockAdjustment() {
  const [medications, setMedications] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  
  // Form State
  const [adjustmentType, setAdjustmentType] = useState("REMOVE"); // ADD, REMOVE, SET, DAMAGED, EXPIRED
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("DISPENSE");
  const [reference, setReference] = useState("#RX-001");
  const [notes, setNotes] = useState("Dispensed 1 box of 5 units to Sarah Johnson");
  
  // API states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      setLoadingList(true);
      const res = await api.get("/pharmacy/inventory/");
      const medList = res.data.data || res.data || [];
      if (medList.length === 0) {
        setMedications([
          { id: 1, name: "Paracetamol 500mg", current_stock: 55, unit: "tablets", code: "MED-001", type: "PAINKILLER" },
          { id: 2, name: "Gonal-F 300IU", current_stock: 12, unit: "Units", code: "MED-001", type: "HORMONAL THERAPY" }
        ]);
        setSelectedMedId("2");
      } else {
        setMedications(medList);
        if (medList.length > 0) setSelectedMedId(medList[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setMedications([
        { id: 1, name: "Paracetamol 500mg", current_stock: 55, unit: "tablets", code: "MED-001", type: "PAINKILLER" },
        { id: 2, name: "Gonal-F 300IU", current_stock: 12, unit: "Units", code: "MED-001", type: "HORMONAL THERAPY" }
      ]);
      setSelectedMedId("2");
    } finally {
      setLoadingList(false);
    }
  };

  const selectedMed = medications.find(m => m.id.toString() === selectedMedId.toString());

  const handleAdjustmentTypeClick = (type) => {
    setAdjustmentType(type);
    if (type === "ADD") setReason("PURCHASE");
    if (type === "REMOVE") setReason("DISPENSE");
    if (type === "DAMAGED") setReason("DAMAGE");
    if (type === "EXPIRED") setReason("EXPIRY");
  };

  const getNewStock = () => {
    if (!selectedMed) return 0;
    const current = selectedMed.current_stock || 0;
    const qty = parseInt(quantity) || 0;
    if (adjustmentType === "ADD") return current + qty;
    if (adjustmentType === "REMOVE" || adjustmentType === "DAMAGED" || adjustmentType === "EXPIRED") return Math.max(0, current - qty);
    return current; // Dummy for SET
  };

  const handleSave = async () => {
    if (!selectedMed) {
      setErrorMsg("Please select a medication first.");
      return;
    }
    if (quantity <= 0) {
      setErrorMsg("Quantity must be greater than 0.");
      return;
    }

    let apiAdjType = "ADD";
    if (adjustmentType === "REMOVE" || adjustmentType === "DAMAGED" || adjustmentType === "EXPIRED") {
      apiAdjType = "REMOVE";
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");
      
      const payload = {
        adjustment_type: apiAdjType,
        quantity: parseInt(quantity),
        reason: reason,
        notes: notes,
        reference: reference
      };

      const res = await api.post(`/pharmacy/inventory/${selectedMed.id}/adjust/`, payload);
      
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message || "Stock adjusted successfully");
        setMedications(medications.map(m => {
          if (m.id.toString() === selectedMed.id.toString()) {
            return { ...m, current_stock: res.data.data?.stock_after ?? getNewStock() };
          }
          return m;
        }));
        setQuantity(1);
        setReference("");
        setNotes("");
      } else {
        setErrorMsg("Failed to adjust stock.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "An error occurred during adjustment.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  };

  const newStockValue = getNewStock();
  const isLowStock = newStockValue <= 11;

  return (
    <div className="sa-root">
      <div className="sa-breadcrumbs">
        <span>Inventory</span>
        <span className="sa-breadcrumb-separator">{'>'}</span>
        <span>Medication Details</span>
        <span className="sa-breadcrumb-separator">{'>'}</span>
        <span className="sa-breadcrumb-active">Stock Adjustment</span>
      </div>

      <div className="sa-main-container">
        {/* Header Block */}
        <div className="sa-header-block">
          <div className="sa-header-left">
            <h1>Stock Adjustment</h1>
            <p>
              {selectedMed ? (
                <>
                  <span className="sa-hl-name">{selectedMed.name}</span> <span className="sa-hl-code">({selectedMed.code || 'MED-' + selectedMed.id})</span>
                </>
              ) : 'Select a medication'}
            </p>
          </div>
          <div className="sa-current-stock-box">
            <span className="sa-cs-label">CURRENT STOCK</span>
            <span className="sa-cs-value">{selectedMed ? `${selectedMed.current_stock} Units` : '--'}</span>
          </div>
        </div>

        {/* Step 1: Select Medication */}
        <div className="sa-step-section">
          <div className="sa-step-header">
            <div className="sa-step-number">1</div>
            <h2>Select Medication</h2>
          </div>
          
          <div className="sa-med-selection-grid">
            <div className="sa-input-group">
              <label>MEDICATION NAME OR ID</label>
              <div className="sa-search-input-wrapper">
                <Search size={16} className="sa-search-icon" />
                <select 
                  className="sa-med-select" 
                  value={selectedMedId} 
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  disabled={loadingList}
                >
                  <option value="">Search or select medication...</option>
                  {medications.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.name} ({med.code || 'MED-'+med.id})
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="sa-dropdown-icon" />
              </div>
            </div>
            
            <div className="sa-med-info-box">
              <div className="sa-info-col">
                <span className="sa-info-label">MEDICATION TYPE</span>
                <span className="sa-info-badge">{selectedMed?.type || 'HORMONAL THERAPY'}</span>
              </div>
              <div className="sa-info-col sa-text-right">
                <span className="sa-info-label">CODE</span>
                <span className="sa-info-value">{selectedMed?.code || '--'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Adjustment Details */}
        <div className="sa-step-section">
          <div className="sa-step-header">
            <div className="sa-step-number">2</div>
            <h2>Adjustment Details</h2>
          </div>
          
          <div className="sa-form-content">
            <label className="sa-group-label">ADJUSTMENT TYPE</label>
            <div className="sa-type-grid">
              <button className={`sa-type-btn ${adjustmentType === 'ADD' ? 'active' : ''}`} onClick={() => handleAdjustmentTypeClick('ADD')}>
                <Plus size={20} className="icon-main" />
                <span>Add Stock</span>
              </button>
              <button className={`sa-type-btn ${adjustmentType === 'REMOVE' ? 'active' : ''}`} onClick={() => handleAdjustmentTypeClick('REMOVE')}>
                <Minus size={20} className="icon-main" />
                <span>Remove Stock</span>
              </button>
              <button className={`sa-type-btn ${adjustmentType === 'SET' ? 'active' : ''}`} onClick={() => handleAdjustmentTypeClick('SET')}>
                <Hash size={20} className="icon-main" />
                <span>Set Quantity</span>
              </button>
              <button className={`sa-type-btn ${adjustmentType === 'DAMAGED' ? 'active' : ''}`} onClick={() => handleAdjustmentTypeClick('DAMAGED')}>
                <ImageIcon size={20} className="icon-main" />
                <span>Damaged</span>
              </button>
              <button className={`sa-type-btn ${adjustmentType === 'EXPIRED' ? 'active' : ''}`} onClick={() => handleAdjustmentTypeClick('EXPIRED')}>
                <CalendarX size={20} className="icon-main" />
                <span>Expired</span>
              </button>
            </div>

            <div className="sa-two-cols">
              <div className="sa-input-group">
                <label>QUANTITY (UNITS)</label>
                <div className="sa-number-input">
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  <div className="sa-spinner">
                    <button type="button" onClick={() => setQuantity(prev => parseInt(prev || 0) + 1)}><ChevronUp size={14} /></button>
                    <button type="button" onClick={() => setQuantity(prev => Math.max(1, parseInt(prev || 1) - 1))}><ChevronDown size={14} /></button>
                  </div>
                </div>
              </div>
              <div className="sa-input-group">
                <label>ADJUSTMENT REASON</label>
                <div className="sa-select-wrapper">
                  <select value={reason} onChange={(e) => setReason(e.target.value)}>
                    <option value="INVENTORY">Initial stock setup</option>
                    <option value="PURCHASE">New purchase from supplier</option>
                    <option value="DISPENSE">Dispensing to Patient</option>
                    <option value="RETURN">Return from patient</option>
                    <option value="DAMAGE">Damaged items</option>
                    <option value="EXPIRY">Expired items</option>
                    <option value="ADJUSTMENT">Manual adjustment</option>
                    <option value="TRANSFER">Stock transfer</option>
                    <option value="OTHER">Other reasons</option>
                  </select>
                  <ChevronDown size={16} className="sa-dropdown-icon" />
                </div>
              </div>
            </div>

            <div className="sa-input-group">
              <label>REFERENCE / PRESCRIPTION ID</label>
              <input 
                type="text" 
                className="sa-text-input" 
                placeholder="#RX-001" 
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <div className="sa-input-group">
              <label>INTERNAL CLINICAL NOTES</label>
              <textarea 
                className="sa-textarea" 
                placeholder="Enter notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            {/* Summary Block */}
            <div className="sa-summary-block">
              <div className="sa-summary-left">
                <div className="sa-summary-icon"><Calculator size={20} /></div>
                <div className="sa-summary-details">
                  <span className="sa-summary-label">STOCK IMPACT SUMMARY</span>
                  <div className="sa-summary-values">
                    <span className="sa-old-val">{selectedMed?.current_stock || 0}</span>
                    <span className="sa-arrow">→</span>
                    <span className={`sa-new-val ${adjustmentType === 'REMOVE' || adjustmentType === 'DAMAGED' || adjustmentType === 'EXPIRED' ? 'negative' : 'positive'}`}>
                      {newStockValue} units
                    </span>
                  </div>
                </div>
              </div>
              <div className="sa-summary-right">
                <span className="sa-summary-label">ESTIMATED VALUATION CHANGE</span>
                <span className={`sa-val-change ${adjustmentType === 'REMOVE' || adjustmentType === 'DAMAGED' || adjustmentType === 'EXPIRED' ? 'negative' : 'positive'}`}>
                  {adjustmentType === 'REMOVE' || adjustmentType === 'DAMAGED' || adjustmentType === 'EXPIRED' ? '-$84.50' : '+$84.50'}
                </span>
              </div>
            </div>

            {/* Warning Block */}
            {isLowStock && selectedMed && (
              <div className="sa-warning-block">
                <AlertTriangle size={20} className="sa-warning-icon" />
                <div>
                  <h4>Warning: Low Stock Threshold</h4>
                  <p>Final stock level ({newStockValue} units) is near the reorder point (10 units). An alert <strong>will be sent</strong> to the procurement manager upon confirmation.</p>
                </div>
              </div>
            )}
            
            {/* Success/Error messages */}
            {successMsg && <div className="sa-success-msg">{successMsg}</div>}
            {errorMsg && <div className="sa-error-msg">{errorMsg}</div>}

            {/* Actions */}
            <div className="sa-actions">
              <button className="sa-btn-cancel">CANCEL ADJUSTMENT</button>
              <button className="sa-btn-confirm" onClick={handleSave} disabled={isSubmitting || !selectedMed}>
                {isSubmitting ? "SAVING..." : "CONFIRM & SAVE LOG"}
              </button>
            </div>
          </div>
        </div>
        
        <div className="sa-footer-info">
          <span>LAST AUDITED: 2023-10-24 14:30 • DR. SMITH</span>
          <span className="sa-secure-audit"><CheckCircle2 size={14}/> SECURE CLINICAL AUDIT TRAIL</span>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="sa-bottom-cards">
        <div className="sa-b-card">
          <h3>STORAGE REQUIREMENTS</h3>
          <div className="sa-req-item">
            <div className="sa-req-icon"><Snowflake size={16} /></div>
            <span>2°C - 8°C (Refrigerated)</span>
          </div>
          <div className="sa-req-item">
            <div className="sa-req-icon"><EyeOff size={16} /></div>
            <span>Protect from direct light</span>
          </div>
        </div>
        
        <div className="sa-b-card">
          <h3>INVENTORY HEALTH</h3>
          <div className="sa-health-content">
            <div className="sa-progress-bar">
              <div className="sa-progress-fill" style={{width: '11%'}}></div>
            </div>
            <div className="sa-health-stats">
              <div className="sa-hs-left">
                <strong>11 / 100 Units</strong>
                <span>CURRENT UTILIZATION</span>
              </div>
              <div className="sa-hs-right negative">
                ↘ -5 Units / Week
              </div>
            </div>
          </div>
        </div>

        <div className="sa-b-card">
          <h3>RELATED FILES</h3>
          <div className="sa-file-item">
            <div className="sa-file-left">
              <FileText size={16} />
              <span>Safety Data Sheet</span>
            </div>
            <button className="sa-btn-download">DOWNLOAD</button>
          </div>
          <div className="sa-file-item">
            <div className="sa-file-left">
              <FileText size={16} />
              <span>Lot Tracking Logs</span>
            </div>
            <button className="sa-btn-download">OPEN LOG</button>
          </div>
        </div>
      </div>
    </div>
  );
}
