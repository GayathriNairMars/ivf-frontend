import React, { useState, useEffect } from "react";
import pharmacistApi from "../../api/pharmacistApi";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Calendar, 
  RotateCcw,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ClipboardList
} from "lucide-react";
import "./pharmacist_prescriptions.css";

// Statuses for which the "Fulfill" action no longer makes sense —
// the order is already in a terminal/complete state.
const TERMINAL_STATUSES = ["FULFILLED", "CANCELLED"];

export default function PharmacistPrescriptions({ onSelectOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("-created_at");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Summary Metrics
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    fulfilled: 0,
    partially_fulfilled: 0,
    out_of_stock: 0,
    cancelled: 0
  });

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        page_size: pageSize,
        sort_by: sortBy
      };

      if (search) params.search = search;
      if (status) params.status = status;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await pharmacistApi.getPrescriptions(params);
      
      if (response.success) {
        setOrders(response.data || []);
        if (response.summary) {
          setSummary(response.summary);
        }
        if (response.pagination) {
          setTotalPages(response.pagination.total_pages || 1);
          setTotalCount(response.pagination.total || 0);
        }
      } else {
        setError("Failed to fetch prescriptions");
      }
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
      setError("An error occurred while fetching prescription orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, status, sortBy, dateFrom, dateTo]);

  // Debounced search trigger or manual search trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setSortBy("-created_at");
    setPage(1);
  };

  const getStatusBadge = (statusStr) => {
    const s = statusStr?.toUpperCase() || "";
    switch (s) {
      case "PENDING":
        return <span className="rx-status rx-status-pending">Pending</span>;
      case "PROCESSING":
        return <span className="rx-status rx-status-processing">Processing</span>;
      case "FULFILLED":
        return <span className="rx-status rx-status-fulfilled">Fulfilled</span>;
      case "PARTIALLY_FULFILLED":
        return <span className="rx-status rx-status-partial">Partially Fulfilled</span>;
      case "OUT_OF_STOCK":
        return <span className="rx-status rx-status-oos">Out Of Stock</span>;
      case "CANCELLED":
        return <span className="rx-status rx-status-cancelled">Cancelled</span>;
      default:
        return <span className="rx-status rx-status-default">{statusStr || "Unknown"}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="rx-container">
      {/* Title area */}
      <div className="rx-header">
        <div className="rx-title-area">
          <h2 className="rx-title">
            <ClipboardList className="rx-title-icon" />
            Prescription Orders
          </h2>
          <p className="rx-subtitle">Manage medication fulfillment and doctor prescriptions</p>
        </div>

        <button className="rx-btn-refresh" onClick={fetchOrders} title="Refresh lists">
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="rx-stats-grid">
        <div className="rx-stat-card card-total">
          <div className="rx-stat-header">
            <span className="rx-stat-title">Total Orders</span>
            <FileText size={18} className="rx-stat-icon" />
          </div>
          <div className="rx-stat-value">{summary.total}</div>
        </div>
        <div className="rx-stat-card card-pending">
          <div className="rx-stat-header">
            <span className="rx-stat-title">Pending</span>
            <Clock size={18} className="rx-stat-icon" />
          </div>
          <div className="rx-stat-value">{summary.pending}</div>
        </div>
        <div className="rx-stat-card card-processing">
          <div className="rx-stat-header">
            <span className="rx-stat-title">Processing</span>
            <RefreshCw size={18} className="rx-stat-icon" />
          </div>
          <div className="rx-stat-value">{summary.processing}</div>
        </div>
        <div className="rx-stat-card card-fulfilled">
          <div className="rx-stat-header">
            <span className="rx-stat-title">Fulfilled</span>
            <CheckCircle size={18} className="rx-stat-icon" />
          </div>
          <div className="rx-stat-value">{summary.fulfilled + (summary.partially_fulfilled || 0)}</div>
        </div>
        <div className="rx-stat-card card-oos">
          <div className="rx-stat-header">
            <span className="rx-stat-title">Out of Stock</span>
            <AlertTriangle size={18} className="rx-stat-icon" />
          </div>
          <div className="rx-stat-value">{summary.out_of_stock}</div>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="rx-filters-card">
        <form onSubmit={handleSearchSubmit} className="rx-search-row">
          <div className="rx-search-input-wrapper">
            <Search className="rx-search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search by Patient MRN, Name or Medication..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rx-search-input"
            />
          </div>
          <button type="submit" className="rx-btn-search">Search</button>
        </form>

        <div className="rx-advanced-filters">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={status} 
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rx-filter-select"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
              <option value="OUT_OF_STOCK">Out Of Stock</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select 
              value={sortBy} 
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="rx-filter-select"
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="medication_name">Medication Name</option>
              <option value="patient__name">Patient Name</option>
            </select>
          </div>

          <div className="filter-group">
            <label>From Date</label>
            <div className="rx-date-input-wrapper">
              <Calendar size={14} className="rx-date-icon" />
              <input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="rx-date-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>To Date</label>
            <div className="rx-date-input-wrapper">
              <Calendar size={14} className="rx-date-icon" />
              <input 
                type="date" 
                value={dateTo} 
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="rx-date-input"
              />
            </div>
          </div>

          <button type="button" className="rx-btn-reset" onClick={resetFilters}>
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="rx-table-container">
        <div className="rx-table-wrapper">
          <table className="rx-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Patient Details</th>
                <th>Prescribed Medicine</th>
                <th>Requested Qty</th>
                <th>Fulfilled / Rem.</th>
                <th>Doctor</th>
                <th>Created At</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5">
                    <div className="loader-container">
                      <RefreshCw size={24} className="spin rx-loader-icon" />
                      <p>Loading prescription orders...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 rx-error-msg">
                    {error}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-gray-500">
                    No prescription orders found matching criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isTerminal = TERMINAL_STATUSES.includes(order.status?.toUpperCase());
                  return (
                    <tr key={order.id} className="rx-table-row" onClick={() => onSelectOrder(order.id)}>
                      <td className="font-mono font-semibold">{order.order_id}</td>
                      <td>
                        <div className="rx-patient-cell">
                          <span className="rx-patient-name">{order.patient?.name || "Unknown Patient"}</span>
                          <span className="rx-patient-mrn">{order.patient?.mrn || "No MRN"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="rx-medication-cell">
                          <span className="rx-med-name">{order.medication_name}</span>
                          {order.notes && <span className="rx-med-notes" title="Dosage instruction">{order.notes}</span>}
                        </div>
                      </td>
                      <td>{order.requested_quantity} {order.medication?.unit || ""}</td>
                      <td>
                        <span className="rx-qty-fulfilled">{order.fulfilled_quantity}</span>
                        <span className="rx-qty-divider">/</span>
                        <span className="rx-qty-remaining">{order.remaining_quantity}</span>
                      </td>
                      <td className="text-gray-700">{order.doctor?.name || "Dr. -"}</td>
                      <td className="text-gray-500">{formatDate(order.created_at)}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        {isTerminal ? (
                          <span className="rx-action-none">—</span>
                        ) : (
                          <button 
                            onClick={() => onSelectOrder(order.id)}
                            className="rx-btn-action"
                          >
                            Fulfill
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

        {/* Pagination Footer */}
        <div className="rx-pagination">
          <div className="rx-page-info">
            Showing <span className="font-bold">{orders.length > 0 ? ((page - 1) * pageSize) + 1 : 0}-{Math.min(page * pageSize, totalCount)}</span> of <span className="font-bold">{totalCount}</span> prescription orders
          </div>

          <div className="rx-page-controls">
            <div className="rx-page-buttons">
              <span className="rx-page-label">Page</span>
              <div className="rx-page-btn-group">
                <button 
                  className="rx-page-arrow" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="rx-page-current">{page}</span>
                <button 
                  className="rx-page-arrow"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="rx-page-size">
              <span className="rx-page-label">Show</span>
              <select 
                className="rx-page-size-select" 
                value={pageSize} 
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}