import React, { useState, useEffect, useRef } from "react";
import pharmacistApi from "../../api/pharmacistApi";
import {
  FileText, CheckCircle2, Clock, XCircle, Printer,
  CreditCard, Wallet, Shield, Smartphone, ChevronLeft,
  Loader2, AlertTriangle, ReceiptText, BadgeCheck, Building2
} from "lucide-react";
import "./bill_detail.css";

/* ──────────────────────────────────────────────
   PrintInvoice – renders a proper A4 receipt
   ────────────────────────────────────────────── */
function PrintInvoice({ bill }) {
  const formatDate = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="print-invoice-page">
      {/* Header */}
      <div className="print-header">
        <div className="print-clinic-info">
          <Building2 size={20} className="print-clinic-icon" />
          <div>
            <h2 className="print-clinic-name">IVF Hospital & Pharmacy</h2>
            <p className="print-clinic-sub">Medical &amp; Fertility Centre • Licensed Pharmacy</p>
          </div>
        </div>
        <div className="print-invoice-meta">
          <div className="print-meta-row">
            <span className="print-meta-label">Invoice No.</span>
            <span className="print-meta-val">{bill.bill_number}</span>
          </div>
          <div className="print-meta-row">
            <span className="print-meta-label">Date</span>
            <span className="print-meta-val">{formatDate(bill.created_at)}</span>
          </div>
          <div className="print-meta-row">
            <span className="print-meta-label">Status</span>
            <span className={`print-status-chip print-chip-${bill.status?.toLowerCase()}`}>
              {bill.status}
            </span>
          </div>
        </div>
      </div>

      <div className="print-divider" />

      {/* Patient details */}
      <div className="print-patient-section">
        <div className="print-section-label">BILLED TO</div>
        <div className="print-patient-name">{bill.patient?.full_name || "—"}</div>
        <div className="print-patient-sub">
          {bill.patient?.patient_id && <span>ID: {bill.patient.patient_id}</span>}
          {bill.patient?.phone && <span> &nbsp;•&nbsp; {bill.patient.phone}</span>}
          {bill.patient?.email && <span> &nbsp;•&nbsp; {bill.patient.email}</span>}
        </div>
      </div>

      {/* Line items */}
      <table className="print-items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Medicine</th>
            <th className="text-center">Qty</th>
            <th className="text-right">Unit Price</th>
            <th className="text-right">Discount</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {(bill.items || []).map((item, i) => (
            <tr key={item.id}>
              <td>{i + 1}</td>
              <td>
                <strong>{item.medication_name}</strong>
                {item.dosage && <div className="print-dosage">{item.dosage}</div>}
              </td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">₹{Number(item.unit_price).toFixed(2)}</td>
              <td className="text-right">{item.discount > 0 ? `-₹${Number(item.discount).toFixed(2)}` : "—"}</td>
              <td className="text-right"><strong>₹{Number(item.line_total).toFixed(2)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="print-totals">
        <div className="print-total-row">
          <span>Subtotal</span>
          <span>₹{Number(bill.subtotal).toFixed(2)}</span>
        </div>
        {bill.discount_amount > 0 && (
          <div className="print-total-row text-red">
            <span>Discount ({bill.discount_percentage}%)</span>
            <span>-₹{Number(bill.discount_amount).toFixed(2)}</span>
          </div>
        )}
        <div className="print-total-row">
          <span>GST ({bill.tax_percentage}%)</span>
          <span>₹{Number(bill.tax_amount).toFixed(2)}</span>
        </div>
        <div className="print-total-divider" />
        <div className="print-total-row print-grand-total">
          <span>TOTAL AMOUNT</span>
          <span>₹{Number(bill.total_amount).toFixed(2)}</span>
        </div>
        <div className="print-total-row print-paid-row">
          <span>Amount Paid</span>
          <span>₹{Number(bill.total_paid || 0).toFixed(2)}</span>
        </div>
        {parseFloat(bill.balance_due) > 0 && (
          <div className="print-total-row print-balance-row">
            <span>Balance Due</span>
            <span>₹{Number(bill.balance_due).toFixed(2)}</span>
          </div>
        )}
      </div>

      {bill.notes && (
        <div className="print-notes">
          <strong>Notes:</strong> {bill.notes}
        </div>
      )}

      <div className="print-footer">
        <p>Thank you for choosing IVF Hospital &amp; Pharmacy.</p>
        <p>This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main BillDetail component
   ────────────────────────────────────────────── */
export default function BillDetail({ billId, onBack }) {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payNote, setPayNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Print state
  const [showPrint, setShowPrint] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchBill = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await pharmacistApi.getBillDetail(billId);
        if (res && res.success && res.data) {
          setBill(res.data);
        } else {
          setError("Bill not found or server returned an empty response.");
        }
      } catch (err) {
        setError("Unable to load bill details. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    if (billId) fetchBill();
    else setError("No bill ID provided.");
  }, [billId]);

  const handlePayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { setPayError("Enter a valid payment amount."); return; }
    if (bill && amount > parseFloat(bill.balance_due || 0)) {
      setPayError("Amount exceeds balance due."); return;
    }
    setPayLoading(true);
    setPayError("");
    try {
      const res = await pharmacistApi.payBill(bill.id, {
        amount,
        payment_method: payMethod,
        transaction_id: `TXN-${Date.now().toString().slice(-6)}`,
        notes: payNote || "Payment recorded"
      });
      if (res && res.success && res.data) {
        setBill(res.data);
      } else {
        setBill(prev => ({
          ...prev,
          total_paid: (parseFloat(prev.total_paid) + amount).toFixed(2),
          balance_due: Math.max(0, parseFloat(prev.balance_due) - amount).toFixed(2),
          status: parseFloat(prev.balance_due) - amount <= 0 ? "PAID" : "PARTIAL",
          payments: [...(prev.payments || []), {
            id: Date.now(), amount, payment_method: payMethod,
            transaction_id: `TXN-${Date.now().toString().slice(-6)}`,
            created_at: new Date().toISOString(), notes: payNote
          }]
        }));
      }
      setShowPayModal(false);
      setPayAmount(""); setPayNote(""); setPayMethod("CASH");
    } catch (err) {
      setPayError("Failed to record payment. Please try again.");
    } finally {
      setPayLoading(false);
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) { alert("Please enter a reason for cancellation."); return; }
    setCancelLoading(true);
    try {
      const res = await pharmacistApi.cancelBill(bill.id, { reason: cancelReason });
      if (res && res.success && res.data) {
        setBill(res.data);
      } else {
        setBill(prev => ({ ...prev, status: "CANCELLED" }));
      }
      setShowCancelModal(false);
      setCancelReason("");
    } catch (err) {
      setBill(prev => ({ ...prev, status: "CANCELLED" }));
      setShowCancelModal(false);
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setShowPrint(false);
    }, 300);
  };

  const getStatusBadge = (status) => {
    const map = {
      PAID:      { label: "Paid",      className: "badge-paid" },
      PARTIAL:   { label: "Partial",   className: "badge-partial" },
      PENDING:   { label: "Pending",   className: "badge-pending" },
      CANCELLED: { label: "Cancelled", className: "badge-cancelled" }
    };
    const s = map[status] || { label: status, className: "badge-pending" };
    return <span className={`bill-status-badge ${s.className}`}>{s.label}</span>;
  };

  const payMethodIcon = (method) => {
    const icons = {
      CASH: <Wallet size={14} />, CARD: <CreditCard size={14} />,
      INSURANCE: <Shield size={14} />, ONLINE: <Smartphone size={14} />
    };
    return icons[method] || <CreditCard size={14} />;
  };

  const formatDate = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  // ─── Render states ───
  if (loading) {
    return (
      <div className="bill-state-container">
        <Loader2 className="state-spinner" size={36} />
        <p>Loading bill details…</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="bill-state-container bill-state-error">
        <AlertTriangle size={36} />
        <p>{error || "Bill not found."}</p>
        <button onClick={onBack} className="btn-back-error">← Back to Billing</button>
      </div>
    );
  }

  const isCancelled = bill.status === "CANCELLED";
  const isPaid = bill.status === "PAID";

  return (
    <>
      {/* ── Print overlay (screen-hidden, shows on print) ── */}
      {showPrint && (
        <div className="print-only" ref={printRef}>
          <PrintInvoice bill={bill} />
        </div>
      )}

      <div className="bill-detail-container no-print">

        {/* ── Header ── */}
        <div className="bill-detail-header">
          <div className="header-left">
            <button className="btn-back-header" onClick={onBack}>
              <ChevronLeft size={16} /> Back to Billing
            </button>
            <h1>
              <ReceiptText size={22} />
              {bill.bill_number}
            </h1>
            <p className="bill-created-date">{formatDate(bill.created_at)}</p>
          </div>

          <div className="header-actions">
            {getStatusBadge(bill.status)}
            <button className="hdr-btn hdr-btn-ghost" onClick={handlePrint}>
              <Printer size={15} /> Print Invoice
            </button>
            {!isCancelled && !isPaid && (
              <button className="hdr-btn hdr-btn-primary" onClick={() => setShowPayModal(true)}>
                <CreditCard size={15} /> Record Payment
              </button>
            )}
            {!isCancelled && (
              <button className="hdr-btn hdr-btn-danger" onClick={() => setShowCancelModal(true)}>
                <XCircle size={15} /> Cancel Bill
              </button>
            )}
          </div>
        </div>

        {/* ── Cancelled banner ── */}
        {isCancelled && (
          <div className="cancelled-banner">
            <XCircle size={16} />
            This bill has been cancelled and is no longer valid.
          </div>
        )}

        {/* ── Main two-column layout ── */}
        <div className="bill-detail-body">

          {/* Left column: Invoice */}
          <div className="bill-left-col">

            {/* Patient */}
            <div className="detail-card">
              <div className="detail-card-title">
                <BadgeCheck size={15} /> Patient Information
              </div>
              <div className="patient-info-grid">
                <div className="info-cell">
                  <span className="info-label">Full Name</span>
                  <span className="info-value purple">{bill.patient?.full_name || "—"}</span>
                </div>
                <div className="info-cell">
                  <span className="info-label">Patient ID</span>
                  <span className="info-value">{bill.patient?.patient_id || `PAT-${bill.patient?.id || "—"}`}</span>
                </div>
                <div className="info-cell">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{bill.patient?.phone || "—"}</span>
                </div>
                <div className="info-cell">
                  <span className="info-label">Email</span>
                  <span className="info-value text-ellipsis">{bill.patient?.email || "—"}</span>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="detail-card">
              <div className="detail-card-title">
                <FileText size={15} /> Prescription Items
              </div>
              <div className="invoice-table-wrap">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Discount</th>
                      <th className="text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bill.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-row">No items on this bill.</td>
                      </tr>
                    ) : (
                      (bill.items || []).map(item => (
                        <tr key={item.id}>
                          <td>
                            <div className="item-name">{item.medication_name}</div>
                            {item.dosage && <div className="item-dosage">{item.dosage}</div>}
                          </td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                          <td className="text-right text-danger">
                            {item.discount > 0 ? `-₹${Number(item.discount).toFixed(2)}` : "—"}
                          </td>
                          <td className="text-right text-bold">₹{Number(item.line_total).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {bill.notes && (
              <div className="bill-notes-box">
                <span className="notes-lbl">Notes: </span>{bill.notes}
              </div>
            )}
          </div>

          {/* Right column: Summary + Payments */}
          <div className="bill-right-col">

            {/* Bill Totals */}
            <div className="detail-card">
              <div className="detail-card-title">Bill Summary</div>
              <div className="summary-lines">
                <div className="summary-line">
                  <span>Subtotal</span>
                  <span>₹{Number(bill.subtotal || 0).toFixed(2)}</span>
                </div>
                {parseFloat(bill.discount_amount) > 0 && (
                  <div className="summary-line text-danger">
                    <span>Discount ({bill.discount_percentage}%)</span>
                    <span>-₹{Number(bill.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-line">
                  <span>GST ({bill.tax_percentage}%)</span>
                  <span>₹{Number(bill.tax_amount || 0).toFixed(2)}</span>
                </div>
                <div className="summary-sep" />
                <div className="summary-line summary-total">
                  <span>Total Amount</span>
                  <span className="purple">₹{Number(bill.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="summary-line">
                  <span>Amount Paid</span>
                  <span className="text-success">₹{Number(bill.total_paid || 0).toFixed(2)}</span>
                </div>
                {parseFloat(bill.balance_due) > 0 && (
                  <div className="summary-line">
                    <span>Balance Due</span>
                    <span className="text-orange fw-600">₹{Number(bill.balance_due).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="detail-card">
              <div className="detail-card-title">Payment History</div>
              {(bill.payments || []).length === 0 ? (
                <p className="no-data-msg">No payments recorded yet.</p>
              ) : (
                <div className="payments-list">
                  {(bill.payments || []).map((pmt) => (
                    <div key={pmt.id} className="pmt-item">
                      <div className="pmt-icon-wrap">{payMethodIcon(pmt.payment_method)}</div>
                      <div className="pmt-body">
                        <span className="pmt-amount">₹{Number(pmt.amount).toFixed(2)}</span>
                        <span className="pmt-method">{pmt.payment_method}</span>
                        {pmt.transaction_id && <span className="pmt-txn">{pmt.transaction_id}</span>}
                        <span className="pmt-date">{formatDate(pmt.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ═══════ Pay Modal ═══════ */}
      {showPayModal && (
        <div className="bd-overlay">
          <div className="bd-modal">
            <div className="bd-modal-hdr">
              <h3><CreditCard size={16} /> Record Payment</h3>
              <button className="bd-close-btn" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePayment} className="bd-modal-body">
              <div className="balance-chip">
                Balance Due: <strong>₹{Number(bill.balance_due || 0).toFixed(2)}</strong>
              </div>
              <div className="bd-field">
                <label>Payment Amount *</label>
                <div className="bd-amount-row">
                  <span className="bd-currency">₹</span>
                  <input
                    type="number" step="0.01" min="0.01"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder={Number(bill.balance_due || 0).toFixed(2)}
                    required
                  />
                </div>
              </div>
              <div className="bd-field">
                <label>Payment Method</label>
                <div className="bd-methods">
                  {["CASH", "CARD", "INSURANCE", "ONLINE"].map(m => (
                    <button type="button" key={m}
                      className={`bd-method-btn ${payMethod === m ? "active" : ""}`}
                      onClick={() => setPayMethod(m)}>
                      {payMethodIcon(m)} {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bd-field">
                <label>Notes (optional)</label>
                <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)}
                  placeholder="e.g. Second instalment" />
              </div>
              {payError && <div className="bd-err"><AlertTriangle size={13} /> {payError}</div>}
              <div className="bd-footer">
                <button type="button" className="bd-btn-sec" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="bd-btn-pri" disabled={payLoading}>
                  {payLoading ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ Cancel Modal ═══════ */}
      {showCancelModal && (
        <div className="bd-overlay">
          <div className="bd-modal">
            <div className="bd-modal-hdr bd-modal-hdr--danger">
              <h3><XCircle size={16} /> Cancel Bill</h3>
              <button className="bd-close-btn" onClick={() => setShowCancelModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCancel} className="bd-modal-body">
              <div className="cancel-warn">
                <AlertTriangle size={15} />
                <span>This action cannot be undone. The bill will be permanently marked as cancelled.</span>
              </div>
              <div className="bd-field">
                <label>Reason for Cancellation *</label>
                <textarea rows={3} value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Provide a reason…" required />
              </div>
              <div className="bd-footer">
                <button type="button" className="bd-btn-sec" onClick={() => setShowCancelModal(false)}>Keep Bill</button>
                <button type="submit" className="bd-btn-danger" disabled={cancelLoading}>
                  {cancelLoading ? <Loader2 size={13} className="spin" /> : <XCircle size={13} />}
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
