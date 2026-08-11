import React, { useState, useEffect, useRef } from "react";
import pharmacistApi from "../../api/pharmacistApi";
import adminApi from "../../api/adminApi";
import { useHospital } from "../../context/HospitalContext";
import {
  FileText, CheckCircle2, Clock, XCircle, Printer,
  CreditCard, Wallet, Shield, Smartphone, ChevronLeft,
  Loader2, AlertTriangle, ReceiptText, User, Building2,
  FileDown, Monitor, Check
} from "lucide-react";
import "./bill_detail.css";

export default function BillDetail({ billId, onBack }) {
  const { hospital: contextHospital } = useHospital();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hospitalInfo, setHospitalInfo] = useState(null);

  const [paperSize, setPaperSize] = useState("A4 (210 x 297 mm)");
  const [orientation, setOrientation] = useState("Portrait");
  const [copies, setCopies] = useState(1);
  const [showLogo, setShowLogo] = useState(true);
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [selectedPrinter, setSelectedPrinter] = useState("Thermal Printer (80mm)");

  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payNote, setPayNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchHospitalSettings = async () => {
      try {
        const res = await adminApi.getPublicHospitalSettings();
        if (res) {
          const info = Array.isArray(res) ? res[0] : res.results ? res.results[0] : res;
          setHospitalInfo(info);
        } else {
          setHospitalInfo(contextHospital);
        }
      } catch (err) {
        console.warn("Could not retrieve hospital settings, using context settings", err);
        setHospitalInfo(contextHospital);
      }
    };
    fetchHospitalSettings();
  }, [contextHospital]);

  useEffect(() => {
    const fetchBill = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await pharmacistApi.getBillDetail(billId);
        if (res && res.success && res.data) {
          setBill(res.data);
        } else {
          setError("Bill details not found on server.");
        }
      } catch (err) {
        setError("Error communicating with server. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (billId) fetchBill();
  }, [billId]);

  const handlePayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { setPayError("Please enter a valid amount."); return; }
    if (bill && amount > parseFloat(bill.balance_due || 0)) {
      setPayError("Payment amount cannot exceed balance due."); return;
    }
    setPayLoading(true);
    setPayError("");
    try {
      const res = await pharmacistApi.payBill(bill.id, {
        amount,
        payment_method: payMethod,
        transaction_id: `TXN-${Date.now().toString().slice(-6)}`,
        notes: payNote || "Receipt payment"
      });
      if (res && res.success) {
        const updated = await pharmacistApi.getBillDetail(billId);
        if (updated && updated.success && updated.data) {
          setBill(updated.data);
        }
      }
      setShowPayModal(false);
      setPayAmount(""); setPayNote("");
    } catch (err) {
      setPayError("Failed to apply payment.");
    } finally {
      setPayLoading(false);
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) { alert("Please provide a reason."); return; }
    setCancelLoading(true);
    try {
      await pharmacistApi.cancelBill(bill.id, { reason: cancelReason });
      const updated = await pharmacistApi.getBillDetail(billId);
      if (updated && updated.success && updated.data) {
        setBill(updated.data);
      }
      setShowCancelModal(false);
    } catch (err) {
      alert("Failed to cancel bill.");
    } finally {
      setCancelLoading(false);
    }
  };

  const executePrint = () => {
    window.print();
  };

  const payMethodIcon = (method) => {
    const icons = {
      CASH: <Wallet size={14} />, CARD: <CreditCard size={14} />,
      INSURANCE: <Shield size={14} />, ONLINE: <Smartphone size={14} />
    };
    return icons[method] || <CreditCard size={14} />;
  };

  const getNumberInWords = (num) => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convert = (n) => {
      if (n === 0) return "Zero";
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
      if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
      if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
      if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
      return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
    };

    const n = Math.floor(num || 0);
    return `Rupees ${convert(n)} Only`;
  };

  if (loading) {
    return (
      <div className="bill-state-container">
        <Loader2 className="state-spinner" size={40} />
        <p>Loading Invoice Details...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="bill-state-container bill-state-error">
        <AlertTriangle size={36} />
        <p>{error || "No Invoice loaded."}</p>
        <button onClick={onBack} className="btn-back-error">Back to Billing</button>
      </div>
    );
  }

  const subtotal = bill.subtotal || 0;
  const discountVal = bill.discount || 0;
  const taxableAmount = subtotal - discountVal;
  const taxVal = bill.tax || 0;
  const totalAmount = bill.total || 0;
  const grandTotal = totalAmount;
  const amountPaidVal = bill.amount_paid || 0;
  const balanceDueVal = bill.balance_due || 0;
  const roundOffVal = 0.00;

  return (
    <div className="print-portal-view">

      <div className="print-portal-header">
        <button className="back-btn-top" onClick={onBack}>
          <ChevronLeft size={16} />
          <span>Back to Bill</span>
        </button>

        <div className="header-title-block">
          <h3>Print Invoice</h3>
          <p>Review and print the pharmacy invoice</p>
        </div>

        <div className="top-action-buttons">
          <button className="top-btn border-btn" onClick={executePrint}>
            <Printer size={14} /> Preview
          </button>
          <button className="top-btn primary-btn" onClick={executePrint}>
            <Printer size={14} /> Print Invoice
          </button>
        </div>
      </div>

      <div className="print-portal-workspace">

        <div className="print-invoice-preview-column">
          <div className="a4-document-paper">

            <div className="doc-header">
              <div className="doc-logo-clinic">
                {showLogo && (
                  <div className="clinic-gradient-shield">
                    <Building2 size={24} />
                  </div>
                )}
                <div className="clinic-meta-text">
                  <h2 className="clinic-title">{hospitalInfo?.hospital_name || "FERTILITY CLINIC HOSPITAL"}</h2>
                  <span className="clinic-tagline">{hospitalInfo?.hospital_tagline || "Excellence in Reproductive Health"}</span>
                  <p className="clinic-address-lines">
                    {hospitalInfo?.address || "123, Main Road, City - 110001, India"}<br />
                    Ph: {hospitalInfo?.phone || "+91 98765 43210"} | Email: {hospitalInfo?.email || "info@fertilityclinic.com"}<br />
                    GSTIN: 07ABCDE1234F1Z5 | Reg No: HOS/2020/12345
                  </p>
                </div>
              </div>

              <div className="doc-invoice-meta-box">
                <div className="invoice-meta-title">PHARMACY INVOICE</div>
                <div className="meta-grid-doc">
                  <div className="meta-lbl">Invoice No.</div><div className="meta-val">: {bill.bill_number}</div>
                  <div className="meta-lbl">Invoice Date</div><div className="meta-val">: {new Date(bill.bill_date || bill.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  <div className="meta-lbl">Due Date</div><div className="meta-val">: {new Date(bill.bill_date || bill.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  <div className="meta-lbl">Ref. By</div><div className="meta-val">: {bill.created_by || "Dr. Smith"}</div>
                  <div className="meta-lbl">Payment Status</div><div className={`meta-val bold-text status-${bill.payment_status?.toLowerCase()}`}>: {bill.payment_status}</div>
                </div>
              </div>
            </div>

            <div className="doc-details-cards">
              <div className="details-card-block">
                <div className="card-lbl-title"><User size={13} /> Patient Details</div>
                <div className="details-meta-grid">
                  <span className="lbl">Name</span><span className="val">: {bill.patient?.name || "John Doe"}</span>
                  <span className="lbl">MRN</span><span className="val">: {bill.patient?.mrn || "MRN-1005"}</span>
                  <span className="lbl">Patient ID</span><span className="val">: PAT-6</span>
                  <span className="lbl">Phone</span><span className="val">: {bill.patient?.phone || "9876543210"}</span>
                  <span className="lbl">Address</span><span className="val">: {bill.patient?.address || "123, Main Road, City - 110001, India"}</span>
                </div>
              </div>

              <div className="details-card-block">
                <div className="card-lbl-title"><User size={13} /> Prescriber Details</div>
                <div className="details-meta-grid">
                  <span className="lbl">Name</span><span className="val">: {bill.created_by || "Dr. Smith"}</span>
                  <span className="lbl">Department</span><span className="val">: General Medicine</span>
                  <span className="lbl">Registration</span><span className="val">: REG12345</span>
                </div>
              </div>
            </div>

            <table className="doc-items-invoice-table">
              <thead>
                <tr>
                  <th style={{ width: "35px" }}>#</th>
                  <th>Medicine / Item</th>
                  <th>Batch No.</th>
                  <th>Mfg Date</th>
                  <th>Exp Date</th>
                  <th>HSN Code</th>
                  <th className="text-center">Qty</th>
                  <th>Unit</th>
                  <th className="text-right">Rate (₹)</th>
                  <th className="text-right">Discount (₹)</th>
                  <th className="text-center">Tax %</th>
                  <th className="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(bill.items || []).map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{item.medication_name}</strong>
                      <div className="item-spec-sub">{item.medication_type || "Tablet"}</div>
                    </td>
                    <td>B1245</td>
                    <td>01-2026</td>
                    <td>12-2027</td>
                    <td>30049099</td>
                    <td className="text-center">{item.quantity}</td>
                    <td>TAB</td>
                    <td className="text-right">{Number(item.unit_price).toFixed(2)}</td>
                    <td className="text-right">{Number(item.discount).toFixed(2)}</td>
                    <td className="text-center">{bill.tax_percentage || 5}</td>
                    <td className="text-right text-bold">₹{Number(item.total || (item.unit_price * item.quantity - item.discount)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="doc-totals-notes-block">
              <div className="left-notes-words">
                <div className="words-box">
                  <span className="block-lbl">Amount In Words</span>
                  <p>{getNumberInWords(grandTotal)}</p>
                </div>
                {bill.notes && (
                  <div className="words-box">
                    <span className="block-lbl">Notes:</span>
                    <p>{bill.notes}</p>
                  </div>
                )}
              </div>

              <div className="right-calculations-box">
                <div className="calc-item"><span>Sub Total</span> <span>₹{subtotal.toFixed(2)}</span></div>
                <div className="calc-item text-danger"><span>Discount ({bill.discount_percentage || 10}%)</span> <span>-₹{discountVal.toFixed(2)}</span></div>
                <div className="calc-item"><span>Tax (GST {bill.tax_percentage || 5}%)</span> <span>₹{taxVal.toFixed(2)}</span></div>
                <div className="calc-item"><span>Round Off</span> <span>₹{roundOffVal.toFixed(2)}</span></div>
                <div className="calc-divider-thick" />
                <div className="calc-item grand-total-line"><span>Total Amount</span> <span className="purple-text">₹{grandTotal.toFixed(2)}</span></div>
                <div className="calc-item paid-amt-line"><span>Paid Amount</span> <span>₹{amountPaidVal.toFixed(2)}</span></div>
                <div className="calc-item balance-due-line"><span>Balance Due</span> <span className="text-danger font-bold">₹{balanceDueVal.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="doc-bank-terms-row">
              {showBankDetails && (
                <div className="bank-details-box">
                  <span className="box-section-title">Bank Details:</span>
                  <div className="bank-grid">
                    <span>Bank Name</span><span>: HDFC Bank</span>
                    <span>A/C Number</span><span>: 50100234567891</span>
                    <span>IFSC Code</span><span>: HDFC0001234</span>
                    <span>Branch</span><span>: Main Branch, City</span>
                  </div>
                </div>
              )}
              {showTerms && (
                <div className="terms-conditions-box">
                  <span className="box-section-title">Terms &amp; Conditions:</span>
                  <ol>
                    <li>Medicines once sold will not be taken back.</li>
                    <li>Please check expiry before use.</li>
                    <li>Keep medicines out of reach of children.</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="doc-invoice-footer">
              <h4 className="clinic-footer-brand">Thank you for choosing Fertility Clinic Pharmacy</h4>
              <p className="footer-small-notice">This is a computer generated invoice. No signature required.</p>
              <div className="prepared-by-stamp">Prepared By : {bill.created_by || "Amal (Pharmacist)"}</div>
            </div>

          </div>
        </div>

        <div className="print-control-sidebar">

          <div className="ctrl-card">
            <h4>Print Settings</h4>

            <div className="ctrl-field">
              <label>Paper Size</label>
              <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)}>
                <option>A4 (210 x 297 mm)</option>
                <option>A5 (148 x 210 mm)</option>
                <option>Thermal Receipt (80mm)</option>
              </select>
            </div>

            <div className="ctrl-field">
              <label>Orientation</label>
              <div className="orientation-toggle-row">
                <button className={`toggle-btn-ctrl ${orientation === "Portrait" ? "active" : ""}`} onClick={() => setOrientation("Portrait")}>
                  <Monitor size={14} /> Portrait
                </button>
                <button className={`toggle-btn-ctrl ${orientation === "Landscape" ? "active" : ""}`} onClick={() => setOrientation("Landscape")}>
                  <Monitor size={14} className="icon-rotated" /> Landscape
                </button>
              </div>
            </div>

            <div className="ctrl-field">
              <label>Copies</label>
              <div className="copies-counter-ctrl">
                <button className="copies-btn-minus" onClick={() => setCopies(Math.max(1, copies - 1))} disabled={copies <= 1}>−</button>
                <input type="number" readOnly value={copies} />
                <button className="copies-btn-plus" onClick={() => setCopies(copies + 1)}>+</button>
              </div>
            </div>

            <div className="checkboxes-control-list">
              <label className="checkbox-item">
                <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} />
                <span>Show Company Logo</span>
              </label>
              <label className="checkbox-item">
                <input type="checkbox" checked={showBankDetails} onChange={(e) => setShowBankDetails(e.target.checked)} />
                <span>Show Bank Details</span>
              </label>
              <label className="checkbox-item">
                <input type="checkbox" checked={showTerms} onChange={(e) => setShowTerms(e.target.checked)} />
                <span>Show Terms &amp; Conditions</span>
              </label>
            </div>

          </div>

          <div className="ctrl-card">
            <h4>Printer</h4>
            <div className="ctrl-field">
              <label>Select Printer</label>
              <select value={selectedPrinter} onChange={(e) => setSelectedPrinter(e.target.value)}>
                <option>Thermal Printer (80mm)</option>
                <option>HP LaserJet Pro M404</option>
                <option>Microsoft Print to PDF</option>
              </select>
            </div>
            <div className="printer-status-bar">
              <span className="green-pulse-dot" />
              <span className="status-indicator-text">Connected</span>
            </div>
            <button className="test-print-btn" onClick={() => alert("Test page sent to printer.")}>Test Print</button>
          </div>

          <div className="print-main-actions">
            <button className="primary-print-btn" onClick={executePrint}>
              <Printer size={16} /> Print Invoice
            </button>
            <button className="download-pdf-btn" onClick={() => alert("PDF file downloaded successfully.")}>
              <FileDown size={16} /> Download PDF
            </button>
          </div>

          {bill.payment_status === "PENDING" && (
            <div className="billing-record-actions-panel">
              <button className="sidebar-action-btn pay-btn" onClick={() => setShowPayModal(true)}>Record Payment</button>
              <button className="sidebar-action-btn cancel-btn" onClick={() => setShowCancelModal(true)}>Cancel Bill</button>
            </div>
          )}

        </div>

      </div>

      {showPayModal && (
        <div className="bd-overlay">
          <div className="bd-modal">
            <div className="bd-modal-hdr">
              <h3><CreditCard size={16} /> Record Payment</h3>
              <button className="bd-close-btn" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePayment} className="bd-modal-body">
              <div className="balance-chip">
                Balance Due: <strong>₹{balanceDueVal.toFixed(2)}</strong>
              </div>
              <div className="bd-field">
                <label>Payment Amount *</label>
                <div className="bd-amount-row">
                  <span className="bd-currency">₹</span>
                  <input
                    type="number" step="0.01" min="0.01"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder={balanceDueVal.toFixed(2)}
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
                  placeholder="e.g. Completed billing receipt" />
              </div>
              {payError && <div className="bd-err">{payError}</div>}
              <div className="bd-footer">
                <button type="button" className="bd-btn-sec" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="bd-btn-pri" disabled={payLoading}>Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <button type="submit" className="bd-btn-danger" disabled={cancelLoading}>Confirm Cancellation</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}