import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import {
  Search, ShoppingCart, Trash2, CheckCircle, ArrowLeft,
  RefreshCw, ChevronLeft, ChevronRight, Printer, ShoppingBag,
  Package, CreditCard, Minus, Plus
} from "lucide-react";
import "./direct_dispensing.css";

const TAX_RATE = 0.10;

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateInvoiceNo() {
  return `OTC-${Date.now().toString().slice(-6)}`;
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toFixed(2)}`;
}

function StockBadge({ status, stock }) {
  if (status === "OUT_OF_STOCK" || stock === 0)
    return <span className="dd-stock-badge badge-out">● 0 Units (OOS)</span>;
  if (status === "LOW_STOCK" || status === "CRITICAL")
    return <span className="dd-stock-badge badge-low">▲ {stock} Units (Low)</span>;
  return <span className="dd-stock-badge badge-in">● {stock} Units</span>;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DirectDispensing() {
  // View states: "select" | "checkout" | "receipt"
  const [view, setView] = useState("select");

  // Medicine catalogue
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalCount, setTotalCount] = useState(0);

  // Cart
  const [cart, setCart] = useState([]); // [{med, qty}]

  // Checkout form
  const [buyerName, setBuyerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Receipt data
  const [receipt, setReceipt] = useState(null);

  // ── Fetch Medicines ──────────────────────────────────────────────────────
  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/pharmacy/inventory/?page=${page}&page_size=${pageSize}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (sortBy) url += `&ordering=${sortBy}`;

      const res = await api.get(url);
      const data = res.data;

      if (data.success) {
        setMedicines(data.data || []);
        setTotalCount(data.pagination?.total || 0);
      } else {
        setMedicines(data.results || []);
        setTotalCount(data.count || 0);
      }
    } catch (err) {
      console.error("Failed to load medicines", err);
      setError("Failed to load medicines. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, statusFilter, categoryFilter, sortBy]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // ── Cart Helpers ─────────────────────────────────────────────────────────
  const addToCart = (med) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.med.id === med.id);
      if (existing) return prev; // already in cart
      return [...prev, { med, qty: 1 }];
    });
  };

  const removeFromCart = (medId) => {
    setCart((prev) => prev.filter((i) => i.med.id !== medId));
  };

  const updateQty = (medId, qty) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.med.id !== medId) return i;
        const max = i.med.current_stock || 999;
        const clamped = Math.max(1, Math.min(max, Number(qty) || 1));
        return { ...i, qty: clamped };
      })
    );
  };

  const clearCart = () => setCart([]);

  const isInCart = (medId) => cart.some((i) => i.med.id === medId);

  // ── Totals ───────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((sum, { med, qty }) => {
    const price = parseFloat(med.selling_price || 0);
    return sum + price * qty;
  }, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  // ── Checkout / Dispense ──────────────────────────────────────────────────
  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const invoiceNo = generateInvoiceNo();
    const dispenseDate = new Date().toISOString();
    const errors = [];

    // Deduct stock for each cart item via the adjust endpoint
    for (const { med, qty } of cart) {
      try {
        await api.post(`/pharmacy/inventory/${med.id}/adjust/`, {
          adjustment_type: "REMOVE",
          quantity: qty,
          reason: "DISPENSE",
          reference: invoiceNo,
          notes: notes || `OTC dispense — ${buyerName || "Walk-in customer"}`,
        });
      } catch (err) {
        errors.push(med.name);
        console.error(`Stock adjustment failed for ${med.name}:`, err);
      }
    }

    setSubmitting(false);

    if (errors.length > 0) {
      setSubmitError(
        `Failed to adjust stock for: ${errors.join(", ")}. Please check inventory.`
      );
      return;
    }

    setReceipt({
      invoiceNo,
      date: dispenseDate,
      buyerName: buyerName || "Walk-in Customer",
      paymentMethod,
      notes,
      items: cart.map(({ med, qty }) => ({
        name: med.name,
        genericName: med.generic_name || "",
        qty,
        unitPrice: parseFloat(med.selling_price || 0),
        total: parseFloat(med.selling_price || 0) * qty,
      })),
      subtotal,
      tax,
      total,
    });

    setView("receipt");
  };

  const handleReset = () => {
    setCart([]);
    setBuyerName("");
    setPaymentMethod("CASH");
    setNotes("");
    setReceipt(null);
    setSubmitError(null);
    setView("select");
    fetchMedicines();
  };

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(search);
  };

  // ── Render: Medicine Selection View ─────────────────────────────────────
  if (view === "select") {
    return (
      <div className="dd-container">
        {/* Header */}
        <div className="dd-header">
          <div className="dd-title-area">
            <h2 className="dd-title">
              <ShoppingBag className="dd-title-icon" />
              Medicine Selection
            </h2>
            <p className="dd-subtitle">
              Dispense medicines without prescription — no patient required
            </p>
          </div>
          <button className="dd-btn-refresh" onClick={fetchMedicines}>
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Main Grid */}
        <div className="dd-grid">
          {/* LEFT: Medicine Catalog */}
          <div className="dd-left-panel">
            {/* Filters */}
            <div className="dd-filters-card">
              <form className="dd-search-row" onSubmit={handleSearchSubmit}>
                <div className="dd-search-input-wrapper">
                  <Search className="dd-search-icon" size={16} />
                  <input
                    type="text"
                    className="dd-search-input"
                    placeholder="Search name, generic, or batch..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button type="submit" className="dd-btn-search">Search</button>
              </form>

              <div className="dd-filter-row">
                <div className="dd-filter-group">
                  <label>Category</label>
                  <select
                    className="dd-filter-select"
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">All Categories</option>
                    <option value="1">Hormonal</option>
                    <option value="2">Fertility</option>
                    <option value="3">Analgesics</option>
                    <option value="4">Antibiotics</option>
                    <option value="5">Vitamins</option>
                  </select>
                </div>

                <div className="dd-filter-group">
                  <label>Status</label>
                  <select
                    className="dd-filter-select"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">Any Status</option>
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>

                <div className="dd-filter-group">
                  <label>Sort By</label>
                  <select
                    className="dd-filter-select"
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  >
                    <option value="name">Name (A–Z)</option>
                    <option value="-name">Name (Z–A)</option>
                    <option value="selling_price">Price (Low–High)</option>
                    <option value="-selling_price">Price (High–Low)</option>
                    <option value="-current_stock">Stock (High–Low)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medicine Table */}
            <div className="dd-table-container">
              <div className="dd-table-wrapper">
                <table className="dd-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Generic Name</th>
                      <th>Stock</th>
                      <th>Price</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5">
                          <div className="dd-loader">
                            <RefreshCw size={22} className="dd-loader-icon spin" />
                            <p>Loading medicines...</p>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="5" className="dd-table-empty" style={{ color: "#dc2626" }}>
                          {error}
                        </td>
                      </tr>
                    ) : medicines.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="dd-table-empty">
                          No medicines found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      medicines.map((med) => {
                        const isOOS =
                          med.stock_status === "OUT_OF_STOCK" ||
                          med.current_stock === 0;
                        const selected = isInCart(med.id);
                        return (
                          <tr key={med.id} className="dd-table-row">
                            <td>
                              <div className="dd-med-name-cell">
                                <span className="dd-med-name">{med.name}</span>
                                {med.batch_number && (
                                  <span className="dd-med-batch">
                                    Batch: #{med.batch_number}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="dd-generic-name">
                                {med.generic_name || "—"}
                              </span>
                            </td>
                            <td>
                              <StockBadge
                                status={med.stock_status}
                                stock={med.current_stock}
                              />
                            </td>
                            <td>
                              <span className="dd-price">
                                {formatCurrency(med.selling_price)} /{" "}
                                {med.unit || "unit"}
                              </span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {isOOS ? (
                                <button className="dd-btn-out" disabled>
                                  Stock Out
                                </button>
                              ) : (
                                <button
                                  className={`dd-btn-select${selected ? " selected" : ""}`}
                                  onClick={() => !selected && addToCart(med)}
                                  disabled={selected}
                                >
                                  {selected ? "✓ Added" : "Select"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="dd-pagination">
                <div className="dd-page-info">
                  Showing{" "}
                  <strong>
                    {medicines.length > 0 ? (page - 1) * pageSize + 1 : 0}–
                    {Math.min(page * pageSize, totalCount)}
                  </strong>{" "}
                  of <strong>{totalCount}</strong> medicines
                </div>
                <div className="dd-page-controls">
                  <button
                    className="dd-page-arrow"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="dd-page-current">{page}</span>
                  <button
                    className="dd-page-arrow"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Cart */}
          <div className="dd-right-panel">
            <div className="dd-cart-card">
              <div className="dd-cart-header">
                <h3>Selected Items</h3>
                <span className="dd-cart-badge">{cart.length}</span>
              </div>

              <div className="dd-cart-items">
                {cart.length === 0 ? (
                  <div className="dd-cart-empty">
                    <ShoppingCart size={32} color="#cbd5e1" />
                    <span>No items selected yet.<br/>Click "Select" on a medicine.</span>
                  </div>
                ) : (
                  cart.map(({ med, qty }) => (
                    <div key={med.id} className="dd-cart-item">
                      <div className="dd-cart-item-details">
                        <span className="dd-cart-item-name">{med.name}</span>
                        <span className="dd-cart-item-price">
                          {formatCurrency(med.selling_price)} / {med.unit || "unit"}
                        </span>
                      </div>

                      <div className="dd-qty-wrapper">
                        <button
                          className="dd-btn-qty"
                          onClick={() => updateQty(med.id, qty - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          className="dd-qty-input"
                          value={qty}
                          min={1}
                          max={med.current_stock || 999}
                          onChange={(e) => updateQty(med.id, e.target.value)}
                        />
                        <button
                          className="dd-btn-qty"
                          onClick={() => updateQty(med.id, qty + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        className="dd-btn-delete"
                        onClick={() => removeFromCart(med.id)}
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totals + Checkout */}
            <div className="dd-totals-card">
              <div className="dd-summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="dd-summary-row">
                <span>Tax (10%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="dd-total-row">
                <span>Total Cost</span>
                <span className="dd-total-price">{formatCurrency(total)}</span>
              </div>

              <button
                className="dd-btn-checkout"
                onClick={() => setView("checkout")}
                disabled={cart.length === 0}
              >
                Proceed to Checkout →
              </button>
              <button
                className="dd-btn-clear"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Checkout View ─────────────────────────────────────────────────
  if (view === "checkout") {
    return (
      <div className="dd-container">
        <div className="dd-header">
          <div className="dd-title-area">
            <h2 className="dd-title">
              <CreditCard className="dd-title-icon" />
              Checkout
            </h2>
            <p className="dd-subtitle">Review items and complete payment</p>
          </div>
        </div>

        <div className="dd-checkout-wrapper">
          {/* Order Summary */}
          <div className="dd-checkout-card">
            <h3 className="dd-checkout-card-title">
              <Package size={18} color="#7c3aed" />
              Order Summary
            </h3>

            {cart.map(({ med, qty }) => (
              <div key={med.id} className="dd-checkout-item-row">
                <div>
                  <div className="dd-checkout-item-name">{med.name}</div>
                  <div className="dd-checkout-item-meta">
                    {qty} × {formatCurrency(med.selling_price)}
                  </div>
                </div>
                <div className="dd-checkout-item-total">
                  {formatCurrency(parseFloat(med.selling_price || 0) * qty)}
                </div>
              </div>
            ))}

            <div className="dd-checkout-total-row">
              <span>Total (incl. 10% tax)</span>
              <span className="dd-checkout-total-price">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="dd-checkout-card">
            <h3 className="dd-checkout-card-title">
              <CreditCard size={18} color="#7c3aed" />
              Payment Details
            </h3>

            <div className="dd-form-group">
              <label>Customer / Buyer Name (optional)</label>
              <input
                type="text"
                className="dd-input"
                placeholder="Walk-in customer"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>

            <div className="dd-form-group">
              <label>Payment Method</label>
              <select
                className="dd-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card / Debit</option>
                <option value="UPI">UPI / Mobile Pay</option>
                <option value="INSURANCE">Insurance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="dd-form-group">
              <label>Notes / Reference (optional)</label>
              <input
                type="text"
                className="dd-input"
                placeholder="e.g. Patient reference, special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {submitError && (
              <div style={{
                background: "#fee2e2",
                color: "#dc2626",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "13.5px",
                marginBottom: "12px"
              }}>
                {submitError}
              </div>
            )}

            <div className="dd-actions-row">
              <button
                className="dd-btn-back"
                onClick={() => { setSubmitError(null); setView("select"); }}
              >
                <ArrowLeft size={15} /> Back
              </button>
              <button
                className="dd-btn-confirm"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={15} className="spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} /> Confirm Payment & Dispense
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Receipt / Success View ────────────────────────────────────────
  if (view === "receipt" && receipt) {
    return (
      <div className="dd-container">
        <div className="dd-header">
          <div className="dd-title-area">
            <h2 className="dd-title">
              <CheckCircle className="dd-title-icon" />
              Dispensing Complete
            </h2>
            <p className="dd-subtitle">Medicines have been dispensed and stock updated</p>
          </div>
        </div>

        <div className="dd-receipt-wrapper">
          <div className="dd-receipt-card">
            {/* Success banner */}
            <div className="dd-receipt-success">
              <div className="dd-success-icon">
                <CheckCircle size={30} />
              </div>
              <h3>Dispensing Successful!</h3>
              <p>Inventory has been updated. Receipt is ready.</p>
            </div>

            {/* Invoice meta */}
            <div className="dd-receipt-meta">
              <div className="dd-receipt-meta-row">
                <span>Invoice No.</span>
                <strong>{receipt.invoiceNo}</strong>
              </div>
              <div className="dd-receipt-meta-row">
                <span>Date &amp; Time</span>
                <strong>
                  {new Date(receipt.date).toLocaleString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </strong>
              </div>
              <div className="dd-receipt-meta-row">
                <span>Customer</span>
                <strong>{receipt.buyerName}</strong>
              </div>
              <div className="dd-receipt-meta-row">
                <span>Payment</span>
                <strong>{receipt.paymentMethod}</strong>
              </div>
              {receipt.notes && (
                <div className="dd-receipt-meta-row">
                  <span>Notes</span>
                  <strong>{receipt.notes}</strong>
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="dd-receipt-items-section">
              <div className="dd-receipt-items-header">
                <span>Medicine</span>
                <span>Amount</span>
              </div>
              {receipt.items.map((item, i) => (
                <div key={i} className="dd-receipt-item-row">
                  <div className="dd-receipt-item-info">
                    <span className="dd-receipt-item-name">{item.name}</span>
                    <span className="dd-receipt-item-qty">
                      {item.qty} × {formatCurrency(item.unitPrice)}
                    </span>
                  </div>
                  <span className="dd-receipt-item-amount">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}

              <div className="dd-receipt-grand-total">
                <span>Grand Total (incl. tax)</span>
                <span>{formatCurrency(receipt.total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="dd-receipt-actions">
              <button className="dd-btn-print" onClick={() => window.print()}>
                <Printer size={15} /> Print Receipt
              </button>
              <button className="dd-btn-done" onClick={handleReset}>
                <ShoppingBag size={15} /> Dispense New
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
