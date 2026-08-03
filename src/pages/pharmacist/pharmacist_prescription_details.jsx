import React, { useState, useEffect } from "react";
import pharmacistApi from "../../api/pharmacistApi";
import { 
  ArrowLeft, 
  User, 
  FileText, 
  MapPin, 
  Calendar, 
  Tag, 
  Check, 
  AlertCircle,
  Truck,
  Layers,
  Phone,
  Mail,
  RefreshCw,
  Clock,
  Clipboard,
  ShieldCheck
} from "lucide-react";
import "./pharmacist_prescription_details.css";

export default function PharmacistPrescriptionDetails({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Form states for fulfillment actions
  const [fulfillQty, setFulfillQty] = useState(0);
  const [pharmacistNotes, setPharmacistNotes] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("PENDING");

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await pharmacistApi.getPrescriptionDetails(orderId);
      if (response.success) {
        setOrder(response.data);
        setFulfillQty(response.data.remaining_quantity || 0);
        setPharmacistNotes(response.data.pharmacist_notes || "");
        setStatusUpdate(response.data.status || "PENDING");
      } else {
        setError("Failed to load prescription details");
      }
    } catch (err) {
      console.error("Error fetching prescription details:", err);
      setError("An error occurred while loading order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Go back to the prescription orders list, giving the person a brief
  // moment to see the success banner first.
  const returnToList = (delay = 1100) => {
    setTimeout(() => {
      if (onBack) onBack();
    }, delay);
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this prescription order?")) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await pharmacistApi.updatePrescriptionStatus(orderId, { status: "CANCELLED" });
      if (res.success) {
        setMessage("Order cancelled successfully");
        returnToList();
      } else {
        setError(res.message || "Failed to cancel order");
      }
    } catch (err) {
      console.error("Cancel order error:", err);
      setError("An error occurred while cancelling the order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      let isFulfillmentAction = statusUpdate === "FULFILLED" || statusUpdate === "PARTIALLY_FULFILLED" || Number(fulfillQty) > 0;
      
      // If we are fulfilling quantities
      if (isFulfillmentAction && Number(fulfillQty) > 0) {
        const fulfillRes = await pharmacistApi.fulfillPrescription(orderId, { quantity: Number(fulfillQty) });
        if (!fulfillRes.success) {
          setError(fulfillRes.message || "Fulfillment failed.");
          setSubmitting(false);
          return;
        }
      }

      // Patch the rest of details (pharmacist notes, status)
      const patchPayload = {
        pharmacist_notes: pharmacistNotes
      };
      
      // Update status if it's not fulfilled/partially fulfilled (which gets updated by fulfill endpoint), 
      // or if we just want to align the status manually.
      if (statusUpdate !== order.status) {
        patchPayload.status = statusUpdate;
      }

      const patchRes = await pharmacistApi.updatePrescriptionStatus(orderId, patchPayload);
      
      if (patchRes.success) {
        setMessage("Prescription updated successfully");
        returnToList();
      } else {
        setError(patchRes.message || "Failed to save order updates.");
      }
    } catch (err) {
      console.error("Update order error:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.detail;
      setError(serverMsg || "An error occurred while updating the prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (statusStr) => {
    const s = statusStr?.toUpperCase() || "";
    switch (s) {
      case "PENDING":
        return <span className="rx-detail-badge status-pending">• Pending</span>;
      case "PROCESSING":
        return <span className="rx-detail-badge status-processing">• Processing</span>;
      case "FULFILLED":
        return <span className="rx-detail-badge status-fulfilled">• Fulfilled</span>;
      case "PARTIALLY_FULFILLED":
        return <span className="rx-detail-badge status-partial">• Partially Fulfilled</span>;
      case "OUT_OF_STOCK":
        return <span className="rx-detail-badge status-oos">• Out of Stock</span>;
      case "CANCELLED":
        return <span className="rx-detail-badge status-cancelled">• Cancelled</span>;
      default:
        return <span className="rx-detail-badge status-default">• {statusStr || "Unknown"}</span>;
    }
  };

  const formatDate = (dateString, showTime = true) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const options = { year: "numeric", month: "short", day: "numeric" };
      if (showTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
      }
      return date.toLocaleDateString("en-US", options);
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="rx-details-loading">
        <RefreshCw className="spin loader-icon" size={32} />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="rx-details-error">
        <AlertCircle size={40} className="error-icon" />
        <h3>Error Loading Prescription</h3>
        <p>{error}</p>
        <button onClick={onBack} className="rx-btn-back-error">
          <ArrowLeft size={16} /> Back to Prescriptions
        </button>
      </div>
    );
  }

  // Stock status checks
  const currentStock = order.medication?.current_stock || 0;
  const reorderLevel = order.medication?.reorder_level || 0;
  const isLowStock = currentStock <= reorderLevel && currentStock > 0;
  const isOutOfStock = currentStock === 0;

  const getStockStatusPill = () => {
    if (isOutOfStock) return <span className="stock-pill stock-out">Out of Stock</span>;
    if (isLowStock) return <span className="stock-pill stock-low">Low Stock</span>;
    return <span className="stock-pill stock-in">In Stock</span>;
  };

  return (
    <div className="rx-details-container">
      {/* Breadcrumb Header */}
      <div className="rx-details-header-row">
        <button onClick={onBack} className="rx-back-link">
          <ArrowLeft size={16} /> Back to Orders
        </button>
        <div className="rx-header-actions">
          {order.pharmacist && (
            <span className="rx-assigned-pharmacist">
              <ShieldCheck size={14} /> Fulfilling Pharmacist: <strong>{order.pharmacist.name}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Main Order Title Row */}
      <div className="rx-order-title-row">
        <div className="title-left">
          <h2>Order {order.order_id}</h2>
          <p>Created on {formatDate(order.created_at)}</p>
        </div>
        <div className="title-right">
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Message banners */}
      {message && <div className="rx-success-banner">{message}</div>}
      {error && <div className="rx-error-banner">{error}</div>}

      {/* Grid Layout Cards */}
      <div className="rx-details-grid">
        
        {/* Card 1: Patient Information */}
        <div className="rx-card rx-patient-info-card">
          <div className="rx-card-header">
            <User size={18} className="card-header-icon" />
            <h3>Patient Information</h3>
          </div>
          <div className="rx-card-body">
            <div className="info-row patient-name-row">
              <span className="info-label">Full Name</span>
              <span className="info-value font-bold">{order.patient?.name || "N/A"}</span>
            </div>
            
            <div className="info-split-row">
              <div className="info-row">
                <span className="info-label">MRN</span>
                <span className="info-value font-mono font-bold">#{order.patient?.mrn || "N/A"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">DOB</span>
                <span className="info-value">{formatDate(order.patient?.date_of_birth, false)}</span>
              </div>
            </div>

            <div className="info-split-row">
              <div className="info-row">
                <span className="info-label">Gender</span>
                <span className="info-value">{order.patient?.gender || "N/A"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone</span>
                <span className="info-value">
                  <Phone size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  {order.patient?.phone || "N/A"}
                </span>
              </div>
            </div>

            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">
                <Mail size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                {order.patient?.email || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Prescription Details */}
        <div className="rx-card rx-prescription-details-card">
          <div className="rx-card-header">
            <FileText size={18} className="card-header-icon" />
            <h3>Prescription Details</h3>
          </div>
          <div className="rx-card-body">
            <div className="info-row inline-label-row">
              <span className="info-label">Medicine Name</span>
              <span className="info-value font-bold text-lg">{order.medication_name}</span>
            </div>
            {order.medication?.generic_name && (
              <div className="info-row inline-label-row">
                <span className="info-label">Generic Name</span>
                <span className="info-value italic text-gray-500">{order.medication.generic_name}</span>
              </div>
            )}

            <div className="info-split-row mt-3">
              <div className="info-row">
                <span className="info-label">Quantity Requested</span>
                <span className="info-value font-bold text-purple-700">
                  {order.requested_quantity} {order.medication?.unit || "Units"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Route</span>
                <span className="info-value">Oral</span>
              </div>
            </div>

            <div className="info-split-row">
              <div className="info-row">
                <span className="info-label">Duration</span>
                <span className="info-value">As Directed</span>
              </div>
              <div className="info-row">
                <span className="info-label">Prescribed By</span>
                <span className="info-value font-medium">Dr. {order.doctor?.name || "N/A"}</span>
              </div>
            </div>

            {order.notes && (
              <div className="rx-dosage-instruction">
                <span className="instruction-label">Dosage Instruction</span>
                <p className="instruction-text">{order.notes}</p>
              </div>
            )}
            
            {order.pharmacist_notes && (
              <div className="rx-previous-notes">
                <span className="instruction-label">Pharmacist Instructions</span>
                <p className="instruction-text text-gray-600 italic">"{order.pharmacist_notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Inventory Status */}
        <div className="rx-card rx-inventory-card">
          <div className="rx-card-header">
            <Layers size={18} className="card-header-icon" />
            <h3>Inventory Status</h3>
          </div>
          <div className="rx-card-body">
            <div className="stock-level-display">
              <div className="stock-number">
                <span className="number">{currentStock}</span>
                <span className="units">{order.medication?.unit || "units"}</span>
              </div>
              {getStockStatusPill()}
            </div>

            <div className="info-split-row mt-4">
              <div className="info-row">
                <span className="info-label">Reorder Level</span>
                <span className="info-value">{reorderLevel} Units</span>
              </div>
              <div className="info-row">
                <span className="info-label">Location</span>
                <span className="info-value">
                  <MapPin size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  {order.medication?.storage_location || "Shelf A-3"}
                </span>
              </div>
            </div>

            <div className="info-row">
              <span className="info-label">Expiry Date</span>
              <span className={`info-value ${new Date(order.medication?.expiry_date) < new Date() ? 'text-red font-bold' : ''}`}>
                {formatDate(order.medication?.expiry_date, false)}
              </span>
            </div>
            
            {order.medication?.batch_number && (
              <div className="info-row">
                <span className="info-label">Batch Number</span>
                <span className="info-value font-mono">{order.medication.batch_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Fulfillment Actions */}
        <div className="rx-card rx-actions-card">
          <div className="rx-card-header">
            <Truck size={18} className="card-header-icon" />
            <h3>Fulfillment Actions</h3>
          </div>
          <div className="rx-card-body">
            <form onSubmit={handleUpdateOrder}>
              <div className="rx-form-grid">
                <div className="rx-field">
                  <label htmlFor="fulfillQty">Quantity to Fulfill</label>
                  <input 
                    type="number" 
                    id="fulfillQty"
                    min="0"
                    max={order.remaining_quantity}
                    value={fulfillQty}
                    onChange={(e) => setFulfillQty(Number(e.target.value))}
                    disabled={submitting || order.status === "FULFILLED" || order.status === "CANCELLED"}
                    className="rx-input"
                  />
                  <span className="rx-field-hint">Remaining requested: {order.remaining_quantity}</span>
                </div>

                <div className="rx-field">
                  <label htmlFor="pharmacistNotes">Pharmacist Notes</label>
                  <textarea 
                    id="pharmacistNotes"
                    placeholder="Enter notes about fulfillment..."
                    value={pharmacistNotes}
                    onChange={(e) => setPharmacistNotes(e.target.value)}
                    disabled={submitting || order.status === "FULFILLED" || order.status === "CANCELLED"}
                    className="rx-textarea"
                    rows="3"
                  />
                </div>
              </div>

              <div className="rx-field mt-3">
                <label htmlFor="statusUpdate">Status Update</label>
                <select 
                  id="statusUpdate"
                  value={statusUpdate} 
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  disabled={submitting || order.status === "FULFILLED" || order.status === "CANCELLED"}
                  className="rx-select"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="FULFILLED">Fulfilled</option>
                  <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
                  <option value="OUT_OF_STOCK">Out Of Stock</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="rx-actions-buttons-row">
                {order.status !== "CANCELLED" && order.status !== "FULFILLED" && (
                  <button 
                    type="button" 
                    onClick={handleCancelOrder}
                    disabled={submitting}
                    className="rx-btn rx-btn-outline-danger"
                  >
                    Cancel Order
                  </button>
                )}
                
                <button 
                  type="submit" 
                  disabled={submitting || order.status === "FULFILLED" || order.status === "CANCELLED"}
                  className="rx-btn rx-btn-primary"
                >
                  {submitting ? "Updating..." : "Update Order"}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Activity Log */}
      <div className="rx-card rx-activity-log-card">
        <div className="rx-card-header">
          <Clock size={18} className="card-header-icon" />
          <h3>Activity Log</h3>
        </div>
        <div className="rx-card-body">
          <div className="rx-timeline">
            
            <div className="rx-timeline-item active">
              <div className="timeline-node"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <h4>Order Created</h4>
                  <span className="timeline-time">{formatDate(order.created_at)}</span>
                </div>
                <p>Prescription received via doctor's E-Health integration system.</p>
              </div>
            </div>

            <div className="rx-timeline-item active">
              <div className="timeline-node"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <h4>Stock Validated</h4>
                  <span className="timeline-time">{formatDate(order.created_at)}</span>
                </div>
                <p>System validated {order.medication?.current_stock || 0} units of {order.medication_name} available in {order.medication?.storage_location || "Shelf A-3"}.</p>
              </div>
            </div>

            {order.status !== "PENDING" && (
              <div className="rx-timeline-item active">
                <div className="timeline-node"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <h4>Status Changed to '{order.status_display}'</h4>
                    <span className="timeline-time">{formatDate(order.updated_at)}</span>
                  </div>
                  <p>
                    Order status set to {order.status_display} by {order.pharmacist?.name || "Pharmacist"}.
                    {order.pharmacist_notes && <span> Notes: "{order.pharmacist_notes}"</span>}
                  </p>
                </div>
              </div>
            )}

            {order.status === "FULFILLED" && (
              <div className="rx-timeline-item active">
                <div className="timeline-node node-success"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <h4>Prescription Dispensed</h4>
                    <span className="timeline-time">{formatDate(order.fulfilled_at || order.updated_at)}</span>
                  </div>
                  <p>Prescription fully completed and medication dispensed to the patient.</p>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}