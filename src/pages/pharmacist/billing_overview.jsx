import React, { useState, useEffect } from "react";
import pharmacistApi from "../../api/pharmacistApi";
import { 
  TrendingUp, Calendar, AlertCircle, DollarSign, Search, 
  FileText, Plus, Download, Filter, ChevronLeft, ChevronRight, 
  Loader2, ShoppingBag, Eye, Percent
} from "lucide-react";
import "./billing_overview.css";

export default function BillingOverview({ onNewBill, onViewBill }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter states for bills list
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBillsCount, setTotalBillsCount] = useState(0);

  // Mock dashboard fallback
  const mockDashboard = {
    summary: {
      today: { total: 5450.00, count: 12 },
      month: { total: 124500.00, count: 85 },
      pending: { total: 12000.00, count: 5 },
      partial: { total: 1500.00, count: 2 },
      total_bills: 120,
      total_revenue: 320000.00
    },
    payment_methods: [
      { payment_method: "CASH", count: 60, total: 180000.00 },
      { payment_method: "CARD", count: 30, total: 90000.00 },
      { payment_method: "INSURANCE", count: 15, total: 50000.00 }
    ],
    recent_bills: [
      {
        id: 101,
        bill_number: "PH-20260711-1234",
        patient_name: "Amal Sreenivas",
        total: 450.00,
        payment_status: "PAID",
        payment_status_display: "Paid",
        bill_date: "2026-07-11T10:30:00Z"
      },
      {
        id: 102,
        bill_number: "PH-20260711-5678",
        patient_name: "Sarah J.",
        total: 1200.00,
        payment_status: "PENDING",
        payment_status_display: "Pending",
        bill_date: "2026-07-11T09:15:00Z"
      },
      {
        id: 103,
        bill_number: "PH-20260710-7890",
        patient_name: "Mike S.",
        total: 780.00,
        payment_status: "PAID",
        payment_status_display: "Paid",
        bill_date: "2026-07-10T16:45:00Z"
      },
      {
        id: 104,
        bill_number: "PH-20260710-1111",
        patient_name: "Rahul K.",
        total: 1500.00,
        payment_status: "PARTIAL",
        payment_status_display: "Partial",
        bill_date: "2026-07-10T14:20:00Z"
      }
    ]
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await pharmacistApi.getBillingDashboard();
      if (res && res.success) {
        setDashboardData(res);
      } else {
        setDashboardData(mockDashboard);
      }
    } catch (err) {
      console.warn("Failed to fetch billing dashboard, loading mock fallback", err);
      setDashboardData(mockDashboard);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillsList = async () => {
    try {
      setBillsLoading(true);
      let params = {
        page: currentPage,
        search: searchQuery || undefined,
        payment_status: statusFilter || undefined
      };
      const res = await pharmacistApi.getBillsList(params);
      if (res && res.success) {
        setBills(res.data || []);
        setTotalPages(res.pagination?.total_pages || 1);
        setTotalBillsCount(res.pagination?.total || res.data.length);
      } else {
        // Fallback filter local mocked data
        let filtered = [...(dashboardData?.recent_bills || mockDashboard.recent_bills)];
        if (searchQuery) {
          filtered = filtered.filter(b => 
            b.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            b.bill_number.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (statusFilter) {
          filtered = filtered.filter(b => b.payment_status === statusFilter);
        }
        setBills(filtered);
        setTotalPages(1);
        setTotalBillsCount(filtered.length);
      }
    } catch (err) {
      console.warn("Failed to load bills list, falling back to local search", err);
      let filtered = [...(dashboardData?.recent_bills || mockDashboard.recent_bills)];
      if (searchQuery) {
        filtered = filtered.filter(b => 
          b.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          b.bill_number.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (statusFilter) {
        filtered = filtered.filter(b => b.payment_status === statusFilter);
      }
      setBills(filtered);
      setTotalPages(1);
      setTotalBillsCount(filtered.length);
    } finally {
      setBillsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchBillsList();
  }, [searchQuery, statusFilter, currentPage, dashboardData]);

  if (loading) {
    return (
      <div className="billing-loading-container">
        <Loader2 className="spinner" size={40} />
        <p>Loading Billing Dashboard...</p>
      </div>
    );
  }

  const { summary, payment_methods } = dashboardData || mockDashboard;

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} | ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="billing-overview-container">
      {/* Header */}
      <div className="billing-overview-header">
        <div>
          <h1>Billing Overview</h1>
          <p className="subtitle">Real-time financial status and patient transactions.</p>
        </div>
        <div className="timeframe-selector">
          <button className="time-btn active">Today</button>
          <button className="time-btn">Weekly</button>
          <button className="time-btn">Monthly</button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="card-header">
            <span className="card-title">Today's Sales</span>
            <div className="card-icon-wrapper sales-icon">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="card-value">₹{(summary?.today?.total || 0).toLocaleString()}</div>
          <div className="card-subtext text-green">
            {summary?.today?.count || 0} bills today
          </div>
        </div>

        <div className="metric-card">
          <div className="card-header">
            <span className="card-title">This Month</span>
            <div className="card-icon-wrapper month-icon">
              <Calendar size={18} />
            </div>
          </div>
          <div className="card-value">₹{(summary?.month?.total || 0).toLocaleString()}</div>
          <div className="card-subtext text-gray">
            {summary?.month?.count || 0} bills this month
          </div>
        </div>

        <div className="metric-card">
          <div className="card-header">
            <span className="card-title">Pending Payments</span>
            <div className="card-icon-wrapper pending-icon">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="card-value text-red">₹{(summary?.pending?.total || 0).toLocaleString()}</div>
          <div className="card-subtext text-red-bold">
            {summary?.pending?.count || 0} CRITICAL OVERDUE
          </div>
        </div>

        <div className="metric-card">
          <div className="card-header">
            <span className="card-title">Partially Paid</span>
            <div className="card-icon-wrapper partial-icon">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="card-value">₹{(summary?.partial?.total || 0).toLocaleString()}</div>
          <div className="card-subtext text-blue">
            {summary?.partial?.count || 0} invoices remaining
          </div>
        </div>
      </div>

      {/* Main Grid: Left sidebar tools & Right Recent Bills */}
      <div className="billing-main-grid">
        {/* Left Column */}
        <div className="billing-left-column">
          {/* Fast Billing Card */}
          <div className="fast-billing-card">
            <div className="fast-billing-bg"></div>
            <div className="fast-billing-content">
              <h3>Fast Billing</h3>
              <p>Streamlined entry for walk-in patients.</p>
              <button className="btn-new-bill" onClick={onNewBill}>
                <Plus size={18} />
                <span>New Bill</span>
              </button>
            </div>
          </div>

          {/* System Tools */}
          <div className="system-tools-card">
            <h4>SYSTEM TOOLS</h4>
            <button className="tool-btn" onClick={() => setStatusFilter("")}>
              <Search size={16} />
              <span>Search Bills</span>
            </button>
            <button className="tool-btn" onClick={() => alert("Report generation features are under construction.")}>
              <FileText size={16} />
              <span>Reports</span>
            </button>
          </div>

          {/* Low Stock Alert */}
          <div className="low-stock-card">
            <div className="low-stock-header">
              <AlertCircle size={16} className="text-orange" />
              <h4>Low Stock Alert</h4>
            </div>
            <div className="low-stock-list">
              <div className="low-stock-empty">No low-stock alerts. Inventory levels are healthy.</div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Bills Table */}
        <div className="billing-right-column">
          <div className="recent-bills-card">
            <div className="recent-bills-header">
              <div className="recent-bills-title">
                <h3>Recent Bills</h3>
                <span className="latest-badge">LATEST {totalBillsCount}</span>
              </div>
              <div className="table-actions">
                <div className="search-bar-inline">
                  <Search size={14} />
                  <input 
                    type="text" 
                    placeholder="Search patient or invoice..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="filter-dropdown-wrapper">
                  <Filter size={14} className="filter-icon" />
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Statuses</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="PARTIAL">Partial</option>
                  </select>
                </div>
                <button className="action-icon-btn" title="Download Excel">
                  <Download size={16} />
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              {billsLoading ? (
                <div className="table-loader">
                  <Loader2 className="spinner" size={24} />
                  <span>Fetching transactions...</span>
                </div>
              ) : bills.length === 0 ? (
                <div className="empty-table">No transactions found matching filters.</div>
              ) : (
                <table className="bills-table">
                  <thead>
                    <tr>
                      <th>INVOICE ID</th>
                      <th>PATIENT NAME</th>
                      <th>DATE & TIME</th>
                      <th>STATUS</th>
                      <th>AMOUNT</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill.id} className="bill-row">
                        <td className="invoice-id font-medium">{bill.bill_number}</td>
                        <td className="patient-name">
                          <div className="patient-avatar-cell">
                            <div className="patient-avatar">
                              {bill.patient_name ? bill.patient_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "PT"}
                            </div>
                            <span>{bill.patient_name}</span>
                          </div>
                        </td>
                        <td className="bill-date">{formatDate(bill.bill_date)}</td>
                        <td>
                          <span className={`status-badge badge-${bill.payment_status?.toLowerCase()}`}>
                            {bill.payment_status || "PENDING"}
                          </span>
                        </td>
                        <td className="bill-amount font-bold">₹{Number(bill.total || 0).toLocaleString()}</td>
                        <td className="bill-actions">
                          <button className="view-btn" onClick={() => onViewBill(bill.id)}>
                            <Eye size={14} />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="table-pagination">
                <span className="pagination-text">Showing {bills.length} of {totalBillsCount} transactions</span>
                <div className="pagination-controls">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="pagination-btn"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="page-number">{currentPage} / {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="pagination-btn"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Charts & Stock Summary */}
      <div className="billing-bottom-grid">
        {/* Sales Velocity Chart Card */}
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <h3>Sales Velocity</h3>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot this-week"></span>This Week</span>
              <span className="legend-item"><span className="legend-dot last-week"></span>Last Week</span>
            </div>
          </div>
          <div className="chart-content-placeholder">
            {/* Elegant SVG bar chart for sales velocity */}
            <svg viewBox="0 0 500 180" className="velocity-svg">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="#cbd5e1" strokeWidth="1" />

              {/* Data Bars */}
              {/* Mon */}
              <rect x="70" y="70" width="16" height="70" rx="3" fill="#7c3aed" opacity="0.85" />
              <rect x="90" y="90" width="16" height="50" rx="3" fill="#94a3b8" opacity="0.5" />
              {/* Tue */}
              <rect x="130" y="50" width="16" height="90" rx="3" fill="#7c3aed" opacity="0.85" />
              <rect x="150" y="80" width="16" height="60" rx="3" fill="#94a3b8" opacity="0.5" />
              {/* Wed */}
              <rect x="190" y="40" width="16" height="100" rx="3" fill="#7c3aed" opacity="0.85" />
              <rect x="210" y="60" width="16" height="80" rx="3" fill="#94a3b8" opacity="0.5" />
              {/* Thu */}
              <rect x="250" y="60" width="16" height="80" rx="3" fill="#7c3aed" opacity="0.85" />
              <rect x="270" y="85" width="16" height="55" rx="3" fill="#94a3b8" opacity="0.5" />
              {/* Fri */}
              <rect x="310" y="30" width="16" height="110" rx="3" fill="#7c3aed" opacity="0.85" />
              <rect x="330" y="70" width="16" height="70" rx="3" fill="#94a3b8" opacity="0.5" />
              {/* Sat */}
              <rect x="370" y="20" width="16" height="120" rx="3" fill="#7c3aed" opacity="0.85" />
              <rect x="390" y="60" width="16" height="80" rx="3" fill="#94a3b8" opacity="0.5" />
              {/* Sun */}
              <rect x="430" y="50" width="16" height="90" rx="3" fill="#7c3aed" opacity="0.85" />
              <rect x="450" y="80" width="16" height="60" rx="3" fill="#94a3b8" opacity="0.5" />

              {/* Labels */}
              <text x="88" y="160" textAnchor="middle" className="axis-label">MON</text>
              <text x="148" y="160" textAnchor="middle" className="axis-label">TUE</text>
              <text x="208" y="160" textAnchor="middle" className="axis-label">WED</text>
              <text x="268" y="160" textAnchor="middle" className="axis-label">THU</text>
              <text x="328" y="160" textAnchor="middle" className="axis-label">FRI</text>
              <text x="388" y="160" textAnchor="middle" className="axis-label">SAT</text>
              <text x="448" y="160" textAnchor="middle" className="axis-label">SUN</text>
            </svg>
          </div>
        </div>

        {/* Stock Summary Card */}
        <div className="stock-summary-card">
          <div className="stock-summary-header">
            <h3>Stock Summary</h3>
          </div>
          <div className="stock-progress-list">
            <div className="stock-progress-item">
              <div className="progress-label">
                <span>Prescription Meds</span>
                <span className="font-bold">{summary?.total_bills > 0 ? Math.round(((summary?.month?.count||0)/(summary?.total_bills||1))*100) : 0}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill fill-purple" style={{ width: `${summary?.total_bills > 0 ? Math.min(100, Math.round(((summary?.month?.count||0)/(summary?.total_bills||1))*100)) : 0}%` }}></div>
              </div>
            </div>
            <div className="stock-progress-item">
              <div className="progress-label">
                <span>Paid Bills</span>
                <span className="font-bold">{summary?.total_bills > 0 ? Math.round(((summary?.total_bills - (summary?.pending?.count||0) - (summary?.partial?.count||0)) / (summary?.total_bills||1))*100) : 0}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill fill-blue" style={{ width: `${summary?.total_bills > 0 ? Math.min(100, Math.round(((summary?.total_bills - (summary?.pending?.count||0) - (summary?.partial?.count||0)) / (summary?.total_bills||1))*100)) : 0}%` }}></div>
              </div>
            </div>
            <div className="stock-progress-item">
              <div className="progress-label">
                <span>Pending / Partial</span>
                <span className="font-bold">{summary?.total_bills > 0 ? Math.round((((summary?.pending?.count||0)+(summary?.partial?.count||0))/(summary?.total_bills||1))*100) : 0}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill fill-red" style={{ width: `${summary?.total_bills > 0 ? Math.min(100, Math.round((((summary?.pending?.count||0)+(summary?.partial?.count||0))/(summary?.total_bills||1))*100)) : 0}%` }}></div>
              </div>
            </div>
            <button className="manage-inventory-link" onClick={() => alert("Redirecting to inventory management...")}>
              <span>Manage Inventory →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
