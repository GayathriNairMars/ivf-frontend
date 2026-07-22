import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  FlaskConical,
  AlertCircle,
  RefreshCw,
  Printer,
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  Clock4,
  Zap,
  FileText,
  ShieldCheck,
  User2,
  CalendarDays,
  Stethoscope,
} from "lucide-react";
import { doctorApi } from "../../api/doctorApi";
import "./doctor_lab.css";

/* ─── Utility helpers ────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#ec4899","#14b8a6","#f97316","#6366f1",
];

function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name = "") {
  return name.trim().split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function fmtDate(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return dt; }
}

function fmtDateTime(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return dt; }
}

/* ─── Status / Priority helpers ──────────────────────────────────────────── */
function statusClass(s = "") {
  const m = { ORDERED:"ordered", IN_PROGRESS:"in-progress", COMPLETED:"completed", CANCELLED:"cancelled" };
  return m[s.toUpperCase()] || "ordered";
}

function priorityClass(p = "") {
  const m = { URGENT:"urgent", STAT:"stat", ROUTINE:"routine" };
  return m[p.toUpperCase()] || "routine";
}

/* ══════════════════════════════════════════════════════════════════════════
   ORDER LAB TEST MODAL
   ══════════════════════════════════════════════════════════════════════════ */
function OrderLabTestModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    patient_id: "",
    test_type_id: "",
    priority: "ROUTINE",
    notes: "",
  });
  const [patientQuery, setPatientQuery] = useState("");
  const [patientLabel, setPatientLabel] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const patientTimerRef = useRef(null);
  const patientWrapRef  = useRef(null);

  // Load all available tests on open
  useEffect(() => {
    if (!isOpen) return;
    setTestsLoading(true);
    doctorApi.getAvailableTests({})
      .then(res => setTests(res?.tests || []))
      .catch(() => setTests([]))
      .finally(() => setTestsLoading(false));
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (patientWrapRef.current && !patientWrapRef.current.contains(e.target)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({ patient_id:"", test_type_id:"", priority:"ROUTINE", notes:"" });
    setPatientQuery(""); setPatientLabel("");
    setPatientResults([]); setShowPatientDropdown(false);
    setSelectedTest(null); setError("");
  };

  const handleClose = () => { resetForm(); onClose(); };

  // Patient search debounce
  const handlePatientInput = (val) => {
    setPatientQuery(val);
    setPatientLabel(val);
    setFormData(f => ({ ...f, patient_id: "" }));
    setShowPatientDropdown(true);
    clearTimeout(patientTimerRef.current);
    if (val.trim().length < 2) { setPatientResults([]); return; }
    patientTimerRef.current = setTimeout(async () => {
      setPatientLoading(true);
      try {
        const res = await doctorApi.getPatients({ search: val.trim(), page_size: 10 });
        const list = res?.patients || res?.data || res?.results || (Array.isArray(res) ? res : []);
        setPatientResults(list);
      } catch { setPatientResults([]); }
      finally { setPatientLoading(false); }
    }, 350);
  };

  const selectPatient = (p) => {
    setFormData(f => ({ ...f, patient_id: p.id }));
    setPatientLabel(`${p.full_name || p.name} (${p.patient_id || p.mrn || "—"})`);
    setPatientQuery(`${p.full_name || p.name}`);
    setShowPatientDropdown(false);
  };

  const handleTestChange = (e) => {
    const id = parseInt(e.target.value, 10);
    setFormData(f => ({ ...f, test_type_id: id }));
    setSelectedTest(tests.find(t => t.id === id) || null);
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.patient_id) { setError("Please select a patient."); return; }
    if (!formData.test_type_id) { setError("Please select a test type."); return; }
    setSubmitting(true);
    try {
      const res = await doctorApi.createLabOrder({
        patient_id:   formData.patient_id,
        test_type_id: formData.test_type_id,
        priority:     formData.priority,
        notes:        formData.notes.trim() || undefined,
      });
      onSuccess && onSuccess(res?.order);
      resetForm();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to place order. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const PRIORITY_OPTIONS = [
    { key: "URGENT",  label: "Urgent",  cls: "active-urgent" },
    { key: "ROUTINE", label: "Routine", cls: "active-routine" },
    { key: "STAT",    label: "STAT",    cls: "active-stat" },
  ];

  return (
    <div className="lab-modal-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="lab-modal">
        {/* Header */}
        <div className="lab-modal-head">
          <div className="lab-modal-head-left">
            <div className="lab-modal-icon">
              <FlaskConical size={20} />
            </div>
            <div>
              <h2>Order Lab Test</h2>
              <p>Fill in the details to request a lab test</p>
            </div>
          </div>
          <button className="lab-modal-close" onClick={handleClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="lab-modal-body">
          {error && (
            <div className="lab-error-banner" style={{ borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <AlertCircle size={15} />
                {error}
              </div>
              <button className="lab-btn-icon" onClick={() => setError("")}><X size={14}/></button>
            </div>
          )}

          {/* Patient + Test Type row */}
          <div className="lab-form-row">
            {/* Patient */}
            <div className="lab-form-group" style={{ position:"relative" }} ref={patientWrapRef}>
              <label>Patient *</label>
              <div style={{ position:"relative" }}>
                <input
                  type="text"
                  placeholder="Search patient name or ID…"
                  value={patientQuery}
                  onChange={e => handlePatientInput(e.target.value)}
                  onFocus={() => patientQuery.trim().length >= 2 && setShowPatientDropdown(true)}
                  autoComplete="off"
                />
                {showPatientDropdown && (
                  <div className="lab-patient-dropdown">
                    {patientLoading ? (
                      <div className="lab-dropdown-msg">Searching…</div>
                    ) : patientResults.length === 0 ? (
                      <div className="lab-dropdown-msg">No patients found</div>
                    ) : patientResults.map(p => (
                      <div
                        key={p.id}
                        className="lab-patient-option"
                        onMouseDown={() => selectPatient(p)}
                      >
                        <div className="lab-patient-opt-name">{p.full_name || p.name}</div>
                        <div className="lab-patient-opt-sub">
                          ID: {p.patient_id || p.mrn || "—"} · {p.email || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formData.patient_id && (
                <div style={{ fontSize:11, color:"#10b981", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                  <CheckCircle2 size={11}/> Patient selected
                </div>
              )}
            </div>

            {/* Test Type */}
            <div className="lab-form-group">
              <label>Test Type *</label>
              {testsLoading ? (
                <div className="lab-loading-tests">
                  <div className="lab-spinner-sm" />
                  Loading tests…
                </div>
              ) : (
                <select value={formData.test_type_id} onChange={handleTestChange}>
                  <option value="">Select test type…</option>
                  {tests.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="lab-form-group">
            <label>Priority Level</label>
            <div className="lab-priority-group">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={`lab-priority-btn ${formData.priority === opt.key ? opt.cls : ""}`}
                  onClick={() => setFormData(f => ({ ...f, priority: opt.key }))}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="lab-form-group">
            <label>Clinical Notes</label>
            <textarea
              placeholder="Add clinical notes for the lab technician…"
              value={formData.notes}
              onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Test Fields Preview */}
          {selectedTest && selectedTest.fields && selectedTest.fields.length > 0 && (
            <div className="lab-fields-preview">
              <div className="lab-fields-preview-head">
                <ClipboardList size={15} />
                Test Fields <span style={{ fontWeight:400, color:"#64748b", fontSize:12 }}>(Will be filled by Lab)</span>
              </div>
              {selectedTest.fields.map((f, i) => (
                <div className="lab-field-row" key={f.id || i}>
                  <span className="lab-field-name">{i + 1}. {f.label}</span>
                  <span className="lab-field-placeholder">Waiting for lab results</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="lab-modal-footer">
          <button className="lab-btn-secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button className="lab-btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <><div className="lab-spinner-sm" style={{ borderTopColor:"#fff" }} /> Ordering…</>
            ) : (
              <><FlaskConical size={15}/> Order Test</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LAB ORDER DETAIL VIEW
   ══════════════════════════════════════════════════════════════════════════ */
function LabOrderDetail({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]  = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await doctorApi.getLabOrderDetail(orderId);
      setOrder(res?.order || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load lab order details.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="lab-detail-container">
        <div className="lab-detail-loading">
          <div className="lab-spinner-lg" />
          <span>Loading lab order…</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="lab-detail-container">
        <button className="lab-breadcrumb-link" onClick={onBack} style={{ marginBottom:20 }}>
          <ArrowLeft size={15}/> Back to Lab Tests
        </button>
        <div className="lab-error-banner" style={{ borderRadius:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <AlertCircle size={15}/> {error || "Order not found."}
          </div>
          <button className="lab-btn-secondary" onClick={load} style={{ padding:"6px 14px", fontSize:13 }}>
            <RefreshCw size={13}/> Retry
          </button>
        </div>
      </div>
    );
  }

  const sClass = statusClass(order.status);
  const pClass = priorityClass(order.priority);

  return (
    <div className="lab-detail-container">
      {/* Breadcrumb */}
      <div className="lab-breadcrumb">
        <button className="lab-breadcrumb-link" onClick={onBack}>
          <ArrowLeft size={13}/> Lab Tests
        </button>
        <span className="lab-breadcrumb-sep">›</span>
        <span className="lab-breadcrumb-current">Order #{order.id}</span>
      </div>

      {/* Page Header */}
      <div className="lab-detail-header">
        <div className="lab-detail-title-area">
          <div className="lab-detail-title">
            <h1>{order.test_type?.name || "Lab Test"}</h1>
            <span className={`lab-status-pill ${sClass}`}>
              {order.status_display || order.status}
            </span>
            {order.priority && order.priority !== "ROUTINE" && (
              <span className={`lab-status-pill ${pClass}`}>
                {order.priority_display || order.priority}
              </span>
            )}
          </div>
          <div className="lab-detail-subtitle">
            <FlaskConical size={13}/>
            Test Code: <strong>{order.test_type?.code || "—"}</strong>
            &nbsp;·&nbsp;
            <CalendarDays size={13}/>
            {fmtDateTime(order.test_date || order.created_at)}
          </div>
        </div>

        <div className="lab-detail-actions">
          <button className="lab-btn-print" onClick={handlePrint}>
            <Printer size={15}/> Print Report
          </button>
        </div>
      </div>

      {/* Patient & Order Info Card */}
      <div className="lab-info-card">
        <div className="lab-info-grid">
          <div className="lab-info-item">
            <div className="lab-info-label"><User2 size={11} style={{ display:"inline", marginRight:4 }}/>Patient Name</div>
            <div className="lab-info-value" style={{ fontSize:16, fontWeight:600, color:"#0f172a" }}>
              {order.patient?.name || "—"}
            </div>
          </div>
          <div className="lab-info-item">
            <div className="lab-info-label"><FlaskConical size={11} style={{ display:"inline", marginRight:4 }}/>Test Name</div>
            <div className="lab-info-value">{order.test_type?.name || "—"}</div>
          </div>
          <div className="lab-info-item">
            <div className="lab-info-label">Test Code</div>
            <div className="lab-info-value" style={{ fontFamily:"'Courier New', monospace", letterSpacing:"0.04em" }}>
              {order.test_type?.code || "—"}
            </div>
          </div>
          <div className="lab-info-item">
            <div className="lab-info-label"><Stethoscope size={11} style={{ display:"inline", marginRight:4 }}/>Ordered By</div>
            <div className="lab-info-value">{order.ordered_by || "—"}</div>
          </div>
          <div className="lab-info-item">
            <div className="lab-info-label"><CalendarDays size={11} style={{ display:"inline", marginRight:4 }}/>Ordered At</div>
            <div className="lab-info-value">{fmtDateTime(order.created_at)}</div>
          </div>
          <div className="lab-info-item">
            <div className="lab-info-label">Last Updated</div>
            <div className="lab-info-value">{fmtDateTime(order.updated_at)}</div>
          </div>
          {order.updated_by && (
            <div className="lab-info-item">
              <div className="lab-info-label">Updated By</div>
              <div className="lab-info-value">{order.updated_by}</div>
            </div>
          )}
          {order.patient?.email && (
            <div className="lab-info-item">
              <div className="lab-info-label">Patient Email</div>
              <div className="lab-info-value">{order.patient.email}</div>
            </div>
          )}
          <div className="lab-info-item">
            <div className="lab-info-label">Priority</div>
            <div className="lab-info-value">
              <span className={`lab-status-pill ${pClass}`} style={{ fontSize:11 }}>
                {order.priority_display || order.priority || "Routine"}
              </span>
            </div>
          </div>
        </div>

        {order.test_type?.description && (
          <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
            <div className="lab-info-label" style={{ marginBottom:6 }}>Test Description</div>
            <p style={{ margin:0, fontSize:13, color:"#64748b", lineHeight:1.6 }}>{order.test_type.description}</p>
          </div>
        )}
      </div>

      {/* Results Table */}
      {order.field_values && order.field_values.length > 0 && (
        <div className="lab-results-card">
          <div className="lab-results-card-header">
            <div className="lab-results-card-title">
              <ClipboardList size={16} color="#3b82f6"/>
              Test Results: {order.test_type?.code || ""}
            </div>
            <span className={`lab-status-pill ${sClass}`} style={{ fontSize:11 }}>
              {order.status_display || order.status}
            </span>
          </div>
          <table className="lab-results-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Field Key</th>
                <th>Result</th>
                <th>Type</th>
                <th>Required</th>
              </tr>
            </thead>
            <tbody>
              {order.field_values.map((fv, i) => (
                <tr key={fv.id || i}>
                  <td>
                    <div className="lab-param-name">{fv.label}</div>
                  </td>
                  <td>
                    <code style={{ fontSize:12, background:"#f1f5f9", padding:"2px 6px", borderRadius:4, color:"#475569" }}>
                      {fv.field_key}
                    </code>
                  </td>
                  <td>
                    <div className="lab-result-value">
                      {fv.formatted_value || fv.value || (
                        <span style={{ color:"#94a3b8", fontStyle:"italic", fontWeight:400, fontSize:13 }}>Pending</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="lab-result-type" style={{ textTransform:"capitalize" }}>
                      {fv.field_type || "—"}
                    </div>
                  </td>
                  <td>
                    {fv.is_required ? (
                      <span style={{ color:"#10b981", fontSize:12, fontWeight:600 }}>Yes</span>
                    ) : (
                      <span style={{ color:"#94a3b8", fontSize:12 }}>No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes + Verification */}
      <div className="lab-detail-bottom">
        {/* Clinical Notes */}
        <div className="lab-notes-card">
          <div className="lab-notes-card-title">
            <FileText size={15} color="#3b82f6"/>
            Clinical Notes
          </div>
          {order.notes ? (
            <div className="lab-notes-text">{order.notes}</div>
          ) : (
            <p style={{ margin:0, color:"#94a3b8", fontSize:13 }}>No clinical notes added.</p>
          )}
        </div>

        {/* Verification */}
        <div className="lab-verify-card">
          <div className="lab-verify-card-title">
            <ShieldCheck size={15} color="#10b981"/>
            Order Details
          </div>
          <div className="lab-verify-row">
            <span className="lab-verify-label">Ordered By</span>
            <span className="lab-verify-val">{order.ordered_by || "—"}</span>
          </div>
          {order.updated_by && (
            <div className="lab-verify-row">
              <span className="lab-verify-label">Updated By</span>
              <span className="lab-verify-val">{order.updated_by}</span>
            </div>
          )}
          <div className="lab-verify-row">
            <span className="lab-verify-label">Order Status</span>
            <span className="lab-verify-val">
              <span className={`lab-status-pill ${sClass}`} style={{ fontSize:11 }}>
                {order.status_display || order.status}
              </span>
            </span>
          </div>
          <div className="lab-verify-row">
            <span className="lab-verify-label">Priority</span>
            <span className="lab-verify-val">
              <span className={`lab-status-pill ${pClass}`} style={{ fontSize:11 }}>
                {order.priority_display || order.priority}
              </span>
            </span>
          </div>
          <div className="lab-verify-row">
            <span className="lab-verify-label">Created</span>
            <span className="lab-verify-val">{fmtDateTime(order.created_at)}</span>
          </div>
          <div className="lab-verify-row">
            <span className="lab-verify-label">Last Updated</span>
            <span className="lab-verify-val">{fmtDateTime(order.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LAB MANAGEMENT LIST (Main Component)
   ══════════════════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 10;

export default function DoctorLabManagement() {
  // View state: "list" | "detail"
  const [view, setView]         = useState("list");
  const [detailId, setDetailId] = useState(null);

  // List state
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [priorityFilter, setPriority] = useState("");

  // Stats
  const [stats, setStats] = useState({ total:0, pending:0, completed:0, urgent:0 });

  // Modal
  const [showModal, setShowModal] = useState(false);

  const searchTimer = useRef(null);

  const fetchOrders = useCallback(async (pg = 1, s = search, st = statusFilter, pr = priorityFilter) => {
    setLoading(true); setError("");
    try {
      const res = await doctorApi.getLabOrders({ status: st, priority: pr, search: s, page: pg, page_size: PAGE_SIZE });
      const list = res?.orders || res?.results || (Array.isArray(res) ? res : []);
      const cnt  = res?.count ?? res?.total ?? list.length;
      setOrders(list);
      setTotal(cnt);

      // Derive stats from current page results (or use API-provided if available)
      if (res?.stats) {
        setStats(res.stats);
      } else {
        // Compute from the full count if filters are empty; otherwise accumulate
        setStats(prev => ({
          total:     (!st && !pr && !s) ? cnt : prev.total,
          pending:   list.filter(o => ["ORDERED","IN_PROGRESS"].includes(o.status?.toUpperCase())).length,
          completed: list.filter(o => o.status?.toUpperCase() === "COMPLETED").length,
          urgent:    list.filter(o => o.priority?.toUpperCase() === "URGENT").length,
        }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load lab orders.");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchOrders(1, search, statusFilter, priorityFilter); }, []); // eslint-disable-line

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchOrders(1, val, statusFilter, priorityFilter);
    }, 400);
  };

  const handleFilterChange = (type, val) => {
    const s = type === "status" ? val : statusFilter;
    const p = type === "priority" ? val : priorityFilter;
    if (type === "status")   setStatus(val);
    if (type === "priority") setPriority(val);
    setPage(1);
    fetchOrders(1, search, s, p);
  };

  const handlePageChange = (pg) => {
    setPage(pg);
    fetchOrders(pg, search, statusFilter, priorityFilter);
  };

  const handleViewOrder = (id) => {
    setDetailId(id);
    setView("detail");
  };

  const handleBackToList = () => {
    setView("list");
    setDetailId(null);
  };

  const handleOrderSuccess = () => {
    fetchOrders(1, search, statusFilter, priorityFilter);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /* ── DETAIL VIEW ── */
  if (view === "detail" && detailId) {
    return <LabOrderDetail orderId={detailId} onBack={handleBackToList} />;
  }

  /* ── LIST VIEW ── */
  const statCards = [
    { label:"Total Lab Tests",  value: total || stats.total, icon:<ClipboardList size={22}/>, cls:"total" },
    { label:"Pending Tests",    value: stats.pending,        icon:<Clock4 size={22}/>,        cls:"pending" },
    { label:"Completed Tests",  value: stats.completed,      icon:<CheckCircle2 size={22}/>,  cls:"done" },
    { label:"Urgent Orders",    value: stats.urgent,         icon:<Zap size={22}/>,           cls:"urgent" },
  ];

  const pageNums = [];
  for (let i = 1; i <= totalPages; i++) pageNums.push(i);
  const visiblePages = pageNums.slice(Math.max(0, page - 3), Math.min(totalPages, page + 2));

  return (
    <div className="lab-container">
      {/* Header */}
      <div className="lab-header">
        <div className="lab-header-titles">
          <h1>Lab Management</h1>
          <p>View and manage lab test orders for your patients</p>
        </div>
        <button className="lab-btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16}/> Order Test
        </button>
      </div>

      {/* Stat Cards */}
      <div className="lab-stats-grid">
        {statCards.map(c => (
          <div className="lab-stat-card" key={c.label}>
            <div className={`lab-stat-icon ${c.cls}`}>{c.icon}</div>
            <div className="lab-stat-text">
              <span className="lab-stat-label">{c.label}</span>
              <span className="lab-stat-value">{loading ? "—" : c.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="lab-filters-row">
        <div className="lab-search-wrapper">
          <Search size={15}/>
          <input
            type="text"
            placeholder="Search by patient name or ID…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        <select
          className="lab-select"
          value={statusFilter}
          onChange={e => handleFilterChange("status", e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ORDERED">Ordered</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          className="lab-select"
          value={priorityFilter}
          onChange={e => handleFilterChange("priority", e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="STAT">STAT</option>
          <option value="ROUTINE">Routine</option>
        </select>
        <button
          className="lab-btn-icon"
          title="Refresh"
          onClick={() => fetchOrders(page, search, statusFilter, priorityFilter)}
        >
          <RefreshCw size={15}/>
        </button>
      </div>

      {/* Table */}
      <div className="lab-table-container">
        <div className="lab-table-header-row">
          <span className="lab-table-title">Lab Orders</span>
          <span className="lab-table-count">{total} orders</span>
        </div>

        {error && (
          <div className="lab-error-banner">
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <AlertCircle size={15}/> {error}
            </div>
            <button className="lab-btn-secondary" onClick={() => fetchOrders(page, search, statusFilter, priorityFilter)}
              style={{ padding:"5px 12px", fontSize:13 }}>
              Retry
            </button>
          </div>
        )}

        <div className="lab-table-wrapper">
          <table className="lab-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Test Type</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Ordered At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="lab-loading-cell">
                    <div className="lab-spinner"/>
                    <div style={{ fontSize:13 }}>Loading lab orders…</div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="lab-empty-cell">
                    <div className="lab-empty-icon">🧪</div>
                    <div className="lab-empty-msg">No lab orders found</div>
                    <div className="lab-empty-hint">
                      {search || statusFilter || priorityFilter
                        ? "Try adjusting your filters"
                        : "Click Order Test to create your first lab order"}
                    </div>
                  </td>
                </tr>
              ) : orders.map(order => {
                const sClass = statusClass(order.status);
                const pClass = priorityClass(order.priority);
                const patName = order.patient_name || order.patient?.name || "—";
                return (
                  <tr className="lab-table-row" key={order.id}>
                    <td>
                      <span style={{ fontFamily:"'Courier New', monospace", fontSize:13, color:"#3b82f6", fontWeight:600 }}>
                        #{order.id}
                      </span>
                    </td>
                    <td>
                      <div className="lab-patient-cell">
                        <div
                          className="lab-avatar"
                          style={{ background: avatarColor(patName) }}
                          title={patName}
                        >
                          {initials(patName)}
                        </div>
                        <div>
                          <div className="lab-patient-name">{patName}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight:500, color:"#0f172a" }}>
                        {order.test_name || order.test_type?.name || "—"}
                      </div>
                      {(order.test_code || order.test_type?.code) && (
                        <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>
                          {order.test_code || order.test_type?.code}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`lab-badge ${sClass}`}>
                        {order.status_display || order.status || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`lab-badge ${pClass}`}>
                        {order.priority_display || order.priority || "—"}
                      </span>
                    </td>
                    <td style={{ color:"#64748b", fontSize:13 }}>
                      {fmtDate(order.ordered_at || order.created_at)}
                    </td>
                    <td>
                      <button
                        className="lab-btn-view"
                        onClick={() => handleViewOrder(order.id)}
                        title="View lab order details"
                      >
                        <Eye size={13}/> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="lab-pagination">
            <span className="lab-pagination-info">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} entries
            </span>
            <div className="lab-pagination-controls">
              <button
                className="lab-page-btn"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft size={14}/>
              </button>
              {visiblePages.map(pg => (
                <button
                  key={pg}
                  className={`lab-page-btn ${pg === page ? "active" : ""}`}
                  onClick={() => handlePageChange(pg)}
                >
                  {pg}
                </button>
              ))}
              <button
                className="lab-page-btn"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Lab Test Modal */}
      <OrderLabTestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleOrderSuccess}
      />
    </div>
  );
}
