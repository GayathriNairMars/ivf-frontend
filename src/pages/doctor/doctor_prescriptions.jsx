import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  ArrowUpRight,
  User,
  Pill,
  Clock,
  FileText,
  SortAsc,
  SortDesc,
  Package,
  RefreshCw,
} from "lucide-react";
import { doctorApi } from "../../api/doctorApi";
import "./doctor_prescriptions.css";

// ─── Create Prescription Modal ───────────────────────────────────────────────
const CreatePrescriptionModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    patient_id: "",
    medicine: "",
    dosage: "",
    duration: "",
    frequency: "",
    route: "",
    instructions: "",
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await doctorApi.createPrescription(formData);
      onSuccess();
      onClose();
      setFormData({ patient_id: "", medicine: "", dosage: "", duration: "", frequency: "", route: "", instructions: "" });
    } catch (error) {
      console.error("Failed to create prescription", error);
      alert("Failed to create prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Prescription</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Patient ID</label>
              <input type="text" name="patient_id" value={formData.patient_id} onChange={handleChange} required placeholder="e.g. 1" />
            </div>
            <div className="form-group">
              <label>Medicine</label>
              <input type="text" name="medicine" value={formData.medicine} onChange={handleChange} required placeholder="e.g. Gonal-F" />
            </div>
            <div className="form-group">
              <label>Dosage</label>
              <input type="text" name="dosage" value={formData.dosage} onChange={handleChange} required placeholder="e.g. 300 IU" />
            </div>
            <div className="form-group">
              <label>Duration (days)</label>
              <input type="text" name="duration" value={formData.duration} onChange={handleChange} required placeholder="e.g. 7" />
            </div>
            <div className="form-group">
              <label>Frequency</label>
              <input type="text" name="frequency" value={formData.frequency} onChange={handleChange} placeholder="e.g. OD, 1-0-1" />
            </div>
            <div className="form-group">
              <label>Route</label>
              <select name="route" value={formData.route} onChange={handleChange}>
                <option value="">Select route</option>
                <option value="Oral">Oral</option>
                <option value="IV">IV</option>
                <option value="IM">IM</option>
                <option value="SC">SC</option>
                <option value="Topical">Topical</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Instructions</label>
            <textarea name="instructions" value={formData.instructions} onChange={handleChange} rows={3} placeholder="Special instructions..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating…" : "Create Prescription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── View Prescription Detail Modal ─────────────────────────────────────────
const ViewPrescriptionModal = ({ isOpen, onClose, prescription, patientDetail, detailLoading }) => {
  if (!isOpen || !prescription) return null;

  const patientPrescriptions = patientDetail?.prescriptions || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Prescription Details</h2>
            <p className="modal-subtitle">{prescription.prescription_id} · {prescription.patient_name}</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Current selected prescription info */}
        <div className="detail-section">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label"><User size={14} /> Patient</span>
              <span className="detail-value">{prescription.patient_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label"><FileText size={14} /> MRN</span>
              <span className="detail-value">{prescription.patient_mrn}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label"><Pill size={14} /> Medicine</span>
              <span className="detail-value">{prescription.medicine}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Dosage</span>
              <span className="detail-value">{prescription.dosage}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Frequency</span>
              <span className="detail-value">{prescription.frequency || "—"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Route</span>
              <span className="detail-value">{prescription.route || "—"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label"><Clock size={14} /> Duration</span>
              <span className="detail-value">{prescription.duration} {!isNaN(prescription.duration) ? "days" : ""}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Prescribed Date</span>
              <span className="detail-value">{new Date(prescription.prescribed_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Prescribed By</span>
              <span className="detail-value">{prescription.prescribed_by || "—"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className={`status-badge ${prescription.status?.toLowerCase()}`}>{prescription.status}</span>
            </div>
          </div>
          {prescription.instructions && (
            <div className="detail-instructions">
              <span className="detail-label">Instructions</span>
              <p>{prescription.instructions}</p>
            </div>
          )}
        </div>

        {/* All prescriptions for this patient */}
        <div className="detail-section">
          <h3 className="detail-section-title">All Prescriptions for this Patient</h3>
          {detailLoading ? (
            <div className="loading-row"><div className="spinner-sm" /></div>
          ) : patientPrescriptions.length === 0 ? (
            <p className="no-data-text">No other prescriptions found.</p>
          ) : (
            <div className="patient-rx-list">
              {patientPrescriptions.map((rx) => (
                <div key={rx.id} className={`patient-rx-card ${rx.id === prescription.id ? "rx-current" : ""}`}>
                  <div className="rx-card-header">
                    <span className="rx-id">RX-{rx.id}</span>
                    <span className="rx-date">{new Date(rx.date || prescription.prescribed_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="rx-card-body">
                    <span className="rx-medicine">{rx.medication || rx.medicine}</span>
                    <span className="rx-dosage">{rx.dosage} · {rx.frequency} · {rx.duration}</span>
                    {rx.instructions && <span className="rx-instructions">{rx.instructions}</span>}
                  </div>
                  <div className="rx-card-footer">
                    <span>Route: {rx.route}</span>
                    <span>By: {rx.prescribed_by}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Medicine Inventory Section ──────────────────────────────────────────────
const MED_PAGE_SIZE = 8;

// Map API `availability` string → CSS class & label
const STATUS_META = {
  "Available":   { label: "Available",    cls: "available" },
  "Low Stock":   { label: "Low Stock",    cls: "low-stock" },
  "Out of Stock":{ label: "Out of Stock", cls: "out-of-stock" },
};
const getStatusMeta = (availability) =>
  STATUS_META[availability] ?? { label: availability || "Available", cls: "available" };


function MedicineInventorySection() {
  // ── State ────────────────────────────────────────────────────────────────
  const [medicines,   setMedicines]   = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [medLoading,  setMedLoading]  = useState(true);
  const [medError,    setMedError]    = useState(null);

  // Summary counts (derived from API or from first full fetch)
  const [invStats,    setInvStats]    = useState({ available: 0, low_stock: 0, out_of_stock: 0, total: 0 });

  // Filters
  const [medSearch,   setMedSearch]   = useState("");
  const [medCategory, setMedCategory] = useState("");   // category id string
  const [medStatus,   setMedStatus]   = useState("");   // AVAILABLE | LOW_STOCK | OUT_OF_STOCK
  const [medSort,     setMedSort]     = useState("name");
  const [medPage,     setMedPage]     = useState(1);
  const [medTotal,    setMedTotal]    = useState(0);    // total records from API

  // ── Fetch categories once ─────────────────────────────────────────────────
  useEffect(() => {
    doctorApi.getMedicineCategories()
      .then((res) => {
        // API returns { success, data: [...] }
        const list = Array.isArray(res) ? res : (res?.data || res?.categories || res?.results || []);
        setCategories(list);
      })
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  // ── Fetch medicines whenever filters/page change ──────────────────────────
  const fetchMedicines = useCallback(async () => {
    setMedLoading(true);
    setMedError(null);
    try {
      const res = await doctorApi.getMedicines({
        search:    medSearch,
        category:  medCategory,
        status:    medStatus,
        sort_by:   medSort,
        page:      medPage,
        page_size: MED_PAGE_SIZE,
      });

      // API response shape: { success, data: [...], summary: {...}, pagination: {...} }
      const list  = Array.isArray(res) ? res : (res?.data ?? res?.results ?? res?.medicines ?? []);
      const total = res?.pagination?.total ?? res?.count ?? list.length;
      setMedicines(list);
      setMedTotal(total);

      // Summary keys from API: available_medicines, low_stock_warnings, out_of_stock, total_medicines
      if (res?.summary) {
        setInvStats({
          available:    res.summary.available_medicines ?? res.summary.available    ?? 0,
          low_stock:    res.summary.low_stock_warnings  ?? res.summary.low_stock    ?? 0,
          out_of_stock: res.summary.out_of_stock        ?? 0,
          total:        res.summary.total_medicines     ?? res.summary.total        ?? total,
        });
      }
    } catch (err) {
      console.error("Failed to load medicines", err);
      setMedError("Failed to load medicines. Please try again.");
    } finally {
      setMedLoading(false);
    }
  }, [medSearch, medCategory, medStatus, medSort, medPage]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  // Reset to page 1 when filters change (but not page itself)
  useEffect(() => { setMedPage(1); }, [medSearch, medCategory, medStatus, medSort]);

  const totalMedPages = Math.max(1, Math.ceil(medTotal / MED_PAGE_SIZE));
  const hasFilters = medSearch || medCategory || medStatus;

  return (
    <div className="inv-section">
      {/* ── Section header ─────────────────────────────────────── */}
      <div className="inventory-header">
        <div>
          <h2>Medicine Inventory Overview</h2>
          <p className="inv-sub">Browse, search and filter available medicines</p>
        </div>
        <button className="btn-primary" onClick={fetchMedicines}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* ── Summary stat cards ─────────────────────────────────── */}
      <div className="inventory-cards">
        <div className="inventory-card available" onClick={() => { setMedStatus("AVAILABLE"); setMedPage(1); }} style={{ cursor: "pointer" }}>
          <span className="inv-card-icon">✅</span>
          <span className="card-title">Available Medicines</span>
          <span className="card-value">{invStats.available || "—"}</span>
        </div>
        <div className="inventory-card low-stock" onClick={() => { setMedStatus("LOW_STOCK"); setMedPage(1); }} style={{ cursor: "pointer" }}>
          <span className="inv-card-icon">⚠️</span>
          <span className="card-title">Low Stock Warnings</span>
          <span className="card-value">{invStats.low_stock || "—"}</span>
        </div>
        <div className="inventory-card out-of-stock" onClick={() => { setMedStatus("OUT_OF_STOCK"); setMedPage(1); }} style={{ cursor: "pointer" }}>
          <span className="inv-card-icon">🚫</span>
          <span className="card-title">Out of Stock</span>
          <span className="card-value">{invStats.out_of_stock || "—"}</span>
        </div>
      </div>

      {/* ── Category tabs ──────────────────────────────────────── */}
      {categories.length > 0 && (
        <div className="cat-tabs">
          <button
            className={`cat-tab ${medCategory === "" ? "active" : ""}`}
            onClick={() => { setMedCategory(""); setMedPage(1); }}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-tab ${medCategory === String(cat.id) ? "active" : ""}`}
              onClick={() => { setMedCategory(String(cat.id)); setMedPage(1); }}
            >
              {cat.name}
              {cat.medicine_count !== undefined && (
                <span className="cat-count">{cat.medicine_count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div className="inv-filter-bar">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search medicine name, generic, ID, batch…"
            value={medSearch}
            onChange={(e) => setMedSearch(e.target.value)}
          />
        </div>

        <select className="status-dropdown" value={medStatus} onChange={(e) => setMedStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>

        <div className="sort-wrapper">
          {medSort.startsWith("-") ? <SortDesc size={14} /> : <SortAsc size={14} />}
          <select className="status-dropdown" value={medSort} onChange={(e) => setMedSort(e.target.value)}>
            <option value="name">Name A–Z</option>
            <option value="-name">Name Z–A</option>
            <option value="stock">Stock ↑</option>
            <option value="-stock">Stock ↓</option>
          </select>
        </div>

        {hasFilters && (
          <button className="btn-clear-filter" onClick={() => { setMedSearch(""); setMedCategory(""); setMedStatus(""); setMedPage(1); }}>
            <X size={13} /> Clear
          </button>
        )}

        <span className="inv-total-label">{medTotal} result{medTotal !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {medError && (
        <div className="error-banner" style={{ marginBottom: 16, borderRadius: 8 }}>
          <span>{medError}</span>
          <button className="btn-retry" onClick={fetchMedicines}>Retry</button>
        </div>
      )}

      {/* ── Medicine Grid ──────────────────────────────────────── */}
      {medLoading ? (
        <div className="med-grid-loading">
          <div className="spinner" />
          <span>Loading medicines…</span>
        </div>
      ) : medicines.length === 0 ? (
        <div className="med-empty">
          <Package size={40} strokeWidth={1.2} />
          <p>No medicines found</p>
          {hasFilters && <span>Try adjusting your search or filters</span>}
        </div>
      ) : (
        <div className="med-grid">
          {medicines.map((med) => {
            // API availability: "Available" | "Low Stock" | "Out of Stock"
            const meta = getStatusMeta(med.availability);
            return (
              <div key={med.id} className={`med-card med-card--${meta.cls}`}>
                <div className="med-card__header">
                  <div className="med-card__icon-wrap">
                    <Pill size={18} />
                  </div>
                  <span className={`med-status-dot med-status-dot--${meta.cls}`} title={meta.label} />
                </div>

                <div className="med-card__body">
                  <p className="med-name">{med.name}</p>
                  {med.generic_name && (
                    <p className="med-generic">{med.generic_name}</p>
                  )}
                  <p className="med-id">
                    {med.medication_id && <span>{med.medication_id}</span>}
                    {med.batch_number  && <span> · {med.batch_number}</span>}
                  </p>
                </div>

                <div className="med-card__meta">
                  {/* category comes as a string directly from the API */}
                  {med.category && (
                    <span className="med-tag">{med.category}</span>
                  )}
                  {med.unit && (
                    <span className="med-tag med-tag--form">{med.unit}</span>
                  )}
                </div>

                <div className="med-card__footer">
                  <div className="med-stock-row">
                    <span className="med-stock-label">Current Stock</span>
                    <span className={`med-stock-val med-stock-val--${meta.cls}`}>
                      {med.current_stock ?? "—"} {med.unit || "units"}
                    </span>
                  </div>
                  {med.reorder_level !== undefined && (
                    <div className="med-reorder-row">
                      <span className="med-stock-label">Reorder Level</span>
                      <span className="med-reorder-val">{med.reorder_level} {med.unit || "units"}</span>
                    </div>
                  )}
                  {med.expiry_date && (
                    <div className="med-reorder-row">
                      <span className="med-stock-label">Expires</span>
                      <span className="med-reorder-val">
                        {new Date(med.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {med.selling_price !== undefined && (
                    <div className="med-reorder-row">
                      <span className="med-stock-label">Price</span>
                      <span className="med-reorder-val">₹{parseFloat(med.selling_price).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="med-status-row">
                    <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Medicine Pagination ────────────────────────────────── */}
      {!medLoading && medTotal > MED_PAGE_SIZE && (
        <div className="pagination" style={{ marginTop: 0, borderRadius: "0 0 12px 12px", borderTop: "1px solid #e2e8f0" }}>
          <span className="pagination-info">
            Showing {((medPage - 1) * MED_PAGE_SIZE) + 1}–{Math.min(medPage * MED_PAGE_SIZE, medTotal)} of {medTotal} medicines
          </span>
          <div className="pagination-controls">
            <button className="page-btn" onClick={() => setMedPage((p) => Math.max(1, p - 1))} disabled={medPage === 1}>
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalMedPages }, (_, i) => i + 1).map((pg) => (
              <button key={pg} className={`page-btn ${pg === medPage ? "active" : ""}`} onClick={() => setMedPage(pg)}>
                {pg}
              </button>
            ))}
            <button className="page-btn" onClick={() => setMedPage((p) => Math.min(totalMedPages, p + 1))} disabled={medPage === totalMedPages}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const ROWS_PER_PAGE = 4;

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions]   = useState([]);
  const [summary, setSummary]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  // Filters
  const [searchQuery, setSearchQuery]       = useState("");
  const [statusFilter, setStatusFilter]     = useState("");
  const [fromDate, setFromDate]             = useState("");
  const [toDate, setToDate]                 = useState("");

  // Pagination
  const [currentPage, setCurrentPage]       = useState(1);

  // Modals
  const [isCreateOpen, setIsCreateOpen]     = useState(false);
  const [selectedRx, setSelectedRx]         = useState(null);
  const [patientDetail, setPatientDetail]   = useState(null);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [isViewOpen, setIsViewOpen]         = useState(false);

  // ── Fetch all prescriptions ──────────────────────────────────────────────
  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorApi.getPrescriptions();
      if (data?.success) {
        setPrescriptions(data.prescriptions || []);
        setSummary(data.summary || null);
      } else {
        setPrescriptions(data?.results || data || []);
      }
    } catch (err) {
      console.error("Failed to fetch prescriptions", err);
      setError("Failed to load prescriptions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, fromDate, toDate]);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = prescriptions.filter((rx) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      rx.prescription_id?.toLowerCase().includes(q) ||
      rx.patient_name?.toLowerCase().includes(q) ||
      rx.patient_mrn?.toLowerCase().includes(q) ||
      rx.medicine?.toLowerCase().includes(q);

    const matchesStatus =
      !statusFilter || rx.status?.toLowerCase() === statusFilter.toLowerCase();

    const rxDate = rx.prescribed_date ? new Date(rx.prescribed_date) : null;
    const matchesFrom = !fromDate || (rxDate && rxDate >= new Date(fromDate));
    const matchesTo   = !toDate   || (rxDate && rxDate <= new Date(toDate));

    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated   = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
  const startEntry  = filtered.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endEntry    = Math.min(currentPage * ROWS_PER_PAGE, filtered.length);

  // ── View Handler ─────────────────────────────────────────────────────────
  const handleView = async (rx) => {
    setSelectedRx(rx);
    setIsViewOpen(true);
    setPatientDetail(null);
    setDetailLoading(true);
    try {
      // We need the numeric patient_id; derive from patient_mrn or fall back
      // The API takes patient_id (numeric). We'll use the prescription `id` as patient is already stored
      // The API route is GET /api/doctor/prescriptions/?patient_id=<numeric_id>
      // The prescription_id field is "RX-18", the `id` field is 18 (prescription's own ID)
      // For patient lookup, we'll try to extract patient_id from mrn or use a best-effort search
      // Based on the sample: PAT001 → patient id 1, PAT013 → patient id 13
      const mrnNum = rx.patient_mrn?.replace(/\D/g, "");
      const detail = await doctorApi.getPatientPrescriptions(mrnNum);
      setPatientDetail(detail);
    } catch (err) {
      console.error("Failed to fetch patient detail", err);
      setPatientDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseView = () => {
    setIsViewOpen(false);
    setSelectedRx(null);
    setPatientDetail(null);
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = summary || {
    total_prescriptions: prescriptions.length,
    active_medications: prescriptions.filter((r) => r.status?.toLowerCase() === "active").length,
    patients_prescribed: new Set(prescriptions.map((r) => r.patient_mrn)).size,
    issued_today: prescriptions.filter((r) => {
      if (!r.prescribed_date) return false;
      return new Date(r.prescribed_date).toDateString() === new Date().toDateString();
    }).length,
  };

  return (
    <div className="prescriptions-container">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="prescriptions-header">
        <div className="header-titles">
          <h1>Prescription Management</h1>
          <p>Manage patient prescriptions, review medication history, and create new prescriptions</p>
        </div>
        <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
          <Plus size={18} />
          Create Prescription
        </button>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="card-icon card-icon-blue">💊</span>
          <span className="card-title">Total Prescriptions</span>
          <span className="card-value">{stats.total_prescriptions}</span>
        </div>
        <div className="summary-card">
          <span className="card-icon card-icon-green">✅</span>
          <span className="card-title">Active Medications</span>
          <span className="card-value">{stats.active_medications}</span>
        </div>
        <div className="summary-card">
          <span className="card-icon card-icon-purple">👤</span>
          <span className="card-title">Patients Prescribed</span>
          <span className="card-value">{stats.patients_prescribed}</span>
        </div>
        <div className="summary-card">
          <span className="card-icon card-icon-red">📅</span>
          <span className="card-title">Issued Today</span>
          <span className="card-value highlight-red">{stats.issued_today}</span>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="filters-row">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by medicine, patient name, MRN, or RX ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="date-picker-wrapper">
          <Calendar size={14} />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="From date" />
          <span className="date-sep">—</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} title="To date" />
        </div>
        <select className="status-dropdown" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Completed">Completed</option>
        </select>
        {(searchQuery || statusFilter || fromDate || toDate) && (
          <button
            className="btn-clear-filter"
            onClick={() => { setSearchQuery(""); setStatusFilter(""); setFromDate(""); setToDate(""); }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="table-container">
        <div className="table-header-row">
          <span className="table-title">Prescription History</span>
          <span className="table-count">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={fetchPrescriptions} className="btn-retry">Retry</button>
          </div>
        )}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Prescription ID</th>
                <th>Patient MRN</th>
                <th>Patient Name</th>
                <th>Prescribed Date</th>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="loading-cell">
                    <div className="table-loading">
                      <div className="spinner" />
                      <span>Loading prescriptions…</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-cell">
                    <div className="empty-state">
                      <span className="empty-icon">📋</span>
                      <span>No prescriptions found</span>
                      {(searchQuery || statusFilter) && (
                        <span className="empty-hint">Try adjusting your filters</span>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((rx) => (
                  <tr key={rx.id} className="table-row">
                    <td className="blue-link">{rx.prescription_id}</td>
                    <td className="mrn-cell">{rx.patient_mrn}</td>
                    <td className="name-cell">{rx.patient_name}</td>
                    <td>
                      {rx.prescribed_date
                        ? new Date(rx.prescribed_date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="medicine-cell">{rx.medicine}</td>
                    <td>{rx.dosage}</td>
                    <td>{rx.duration} {!isNaN(rx.duration) ? "days" : ""}</td>
                    <td>
                      <span className={`status-badge ${rx.status?.toLowerCase() || "active"}`}>
                        {rx.status || "Active"}
                      </span>
                    </td>
                    <td>
                      <button className="btn-view" onClick={() => handleView(rx)} title="View details">
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {startEntry}–{endEntry} of {filtered.length} records
            </span>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`page-btn ${page === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Medicine Inventory Overview ──────────────────────────────────── */}
      <MedicineInventorySection />

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <CreatePrescriptionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchPrescriptions}
      />

      <ViewPrescriptionModal
        isOpen={isViewOpen}
        onClose={handleCloseView}
        prescription={selectedRx}
        patientDetail={patientDetail}
        detailLoading={detailLoading}
      />
    </div>
  );
}
