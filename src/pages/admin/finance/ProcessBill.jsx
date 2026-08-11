import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import financeApi from "../../../api/financeApi";
import "./finance.css";

const SOURCE_TYPES = [
  { value: "PHARMACY",  label: "Pharmacy",  code: "4100" },
  { value: "LAB",       label: "Laboratory", code: "4200" },
  { value: "RADIOLOGY", label: "Radiology",  code: "4300" },
  { value: "OPD",       label: "OPD",        code: "4400" },
];

const PAYMENT_TYPES = [
  { value: "CASH",   label: "Cash" },
  { value: "CREDIT", label: "Credit" },
];

const initialForm = {
  source_type: "PHARMACY",
  source_id:   "",
  total_amount: "",
  revenue_account_code: "4100",
  payment_type: "CASH",
};

export default function ProcessBill() {
  const navigate = useNavigate();
  const [form, setForm]         = useState(initialForm);
  const [submitting, setSubmit] = useState(false);
  const [toast, setToast]       = useState(null);
  const [lastResult, setResult] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSourceChange = (e) => {
    const src = e.target.value;
    const match = SOURCE_TYPES.find((s) => s.value === src);
    setForm((f) => ({
      ...f,
      source_type: src,
      revenue_account_code: match?.code ?? f.revenue_account_code,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.source_id.trim())    return "Bill / Source ID is required.";
    if (!form.total_amount || isNaN(Number(form.total_amount)) || Number(form.total_amount) <= 0)
      return "Total amount must be a positive number.";
    if (!form.revenue_account_code.trim()) return "Revenue account code is required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { showToast(err, "error"); return; }

    try {
      setSubmit(true);
      const result = await financeApi.processBill({
        source_type: form.source_type,
        source_id:   form.source_id.trim(),
        total_amount: form.total_amount,
        revenue_account_code: form.revenue_account_code.trim(),
        payment_type: form.payment_type,
      });
      setResult(result);
      showToast("Bill posted to General Ledger successfully!", "success");
      setForm(initialForm);
    } catch (e) {
      const msg = e?.response?.data
        ? Object.values(e.response.data).flat().join(" ")
        : "Failed to process bill.";
      showToast(msg, "error");
    } finally {
      setSubmit(false);
    }
  };

  const handleReset = () => { setForm(initialForm); setResult(null); };

  return (
    <div className="dashboard-content">
      <div className="fin-page-header">
        <div>
          <h2>Process New Bill</h2>
          <p>Push a billing entry to the General Ledger (GL)</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={() => navigate("/superadmin/finance/journal-entries")}>
            View Journal Entries
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* Form */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <h3>Bill Details</h3>
              <p>Fill in the billing information to post a transaction</p>
            </div>
          </div>
          <div className="fin-card-body">
            <form onSubmit={handleSubmit}>
              <div className="fin-form-grid">
                {/* Source Type */}
                <div className="fin-form-field">
                  <label className="fin-form-label">Department / Source Type *</label>
                  <select
                    name="source_type"
                    className="fin-form-select"
                    value={form.source_type}
                    onChange={handleSourceChange}
                    required
                  >
                    {SOURCE_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <span className="fin-form-hint">Choose the billing department</span>
                </div>

                {/* Bill / Source ID */}
                <div className="fin-form-field">
                  <label className="fin-form-label">Bill / Source ID *</label>
                  <input
                    type="text"
                    name="source_id"
                    className="fin-form-input"
                    placeholder="e.g. PX-2026-001"
                    value={form.source_id}
                    onChange={handleChange}
                    required
                  />
                  <span className="fin-form-hint">Your internal unique invoice/bill number</span>
                </div>

                {/* Total Amount */}
                <div className="fin-form-field">
                  <label className="fin-form-label">Total Amount (₹) *</label>
                  <input
                    type="number"
                    name="total_amount"
                    className="fin-form-input"
                    placeholder="e.g. 1500.50"
                    step="0.01"
                    min="0.01"
                    value={form.total_amount}
                    onChange={handleChange}
                    required
                  />
                  <span className="fin-form-hint">Must be greater than 0</span>
                </div>

                {/* Revenue Account Code */}
                <div className="fin-form-field">
                  <label className="fin-form-label">Revenue Account Code *</label>
                  <input
                    type="text"
                    name="revenue_account_code"
                    className="fin-form-input"
                    placeholder="e.g. 4100"
                    value={form.revenue_account_code}
                    onChange={handleChange}
                    required
                  />
                  <span className="fin-form-hint">
                    4100=Pharmacy · 4200=Lab · 4300=Radiology · 4400=OPD
                  </span>
                </div>

                {/* Payment Type */}
                <div className="fin-form-field full-width">
                  <label className="fin-form-label">Payment Type</label>
                  <div style={{ display: "flex", gap: 12 }}>
                    {PAYMENT_TYPES.map((pt) => (
                      <label
                        key={pt.value}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          padding: "10px 20px",
                          borderRadius: 8,
                          border: `1.5px solid ${form.payment_type === pt.value ? "var(--accent)" : "var(--border)"}`,
                          background: form.payment_type === pt.value ? "rgba(68,116,246,0.06)" : "#fff",
                          fontWeight: form.payment_type === pt.value ? 600 : 400,
                          color: form.payment_type === pt.value ? "var(--accent)" : "var(--text-2)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="payment_type"
                          value={pt.value}
                          checked={form.payment_type === pt.value}
                          onChange={handleChange}
                          style={{ display: "none" }}
                        />
                        {pt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="fin-form-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-outline" onClick={handleReset} disabled={submitting}>
                  Reset
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Posting…" : "Post to General Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Side info + result */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Account reference */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div><h3>Account Codes</h3></div>
            </div>
            <div className="fin-quick-stats">
              {SOURCE_TYPES.map((s) => (
                <div className="fin-qs-row" key={s.value}>
                  <div className="fin-qs-left">
                    <div className="fin-qs-dot" style={{
                      background:
                        s.value === "PHARMACY"  ? "#4474f6"
                      : s.value === "LAB"       ? "#12b76a"
                      : s.value === "RADIOLOGY" ? "#f97316"
                      : "#7c3aed"
                    }} />
                    <span className="fin-qs-dept">{s.label}</span>
                  </div>
                  <span className="fin-qs-amount" style={{ fontFamily: "monospace" }}>{s.code}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Last result */}
          {lastResult && (
            <div className="fin-card" style={{ borderColor: "#12b76a" }}>
              <div className="fin-card-header" style={{ background: "#ecfdf3" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#12b76a" }}>
                  <CheckCircle size={18} />
                  <h3 style={{ color: "#166534" }}>Last Entry Posted</h3>
                </div>
              </div>
              <div className="fin-modal-body">
                {Object.entries(lastResult).slice(0, 8).map(([k, v]) => (
                  <div className="fin-detail-row" key={k}>
                    <span className="fin-detail-key">{k.replace(/_/g, " ")}</span>
                    <span className="fin-detail-val">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fin-toast ${toast.type}`}>
          {toast.type === "success"
            ? <CheckCircle size={16} />
            : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
