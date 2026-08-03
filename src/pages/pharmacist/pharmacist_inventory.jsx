import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import "./pharmacist_inventory.css";

export default function PharmacistInventory( {onNavigate} ) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    total: 0, in_stock: 0, low_stock: 0, critical: 0, out_of_stock: 0
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let url = `/pharmacy/inventory/?page=${page}&page_size=${pageSize}`;
      if (search) url += `&search=${search}`;
      if (statusFilter && statusFilter !== "Status") url += `&status=${statusFilter}`;
      if (categoryFilter && categoryFilter !== "Category") url += `&category=${categoryFilter}`;
      
      const response = await axios.get(url);
      const res = response.data;
      if (res.success) {
        setInventory(res.data || []);
        setTotalCount(res.pagination?.total || 0);
        setSummary(res.summary || {
          total: 0, in_stock: 0, low_stock: 0, critical: 0, out_of_stock: 0
        });
      } else {
        setInventory(res.results || []);
        setTotalCount(res.count || 0);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, pageSize, search, statusFilter, categoryFilter]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setPage(1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "IN_STOCK":
        return <span className="inv-badge inv-badge-in-stock">IN STOCK</span>;
      case "LOW_STOCK":
        return (
          <span className="inv-badge inv-badge-low-stock">
            <span className="material-symbols-outlined">warning</span> LOW STOCK
          </span>
        );
      case "CRITICAL":
        return (
          <span className="inv-badge inv-badge-critical">
            <span className="material-symbols-outlined">error</span> CRITICAL
          </span>
        );
      case "OUT_OF_STOCK":
        return <span className="inv-badge inv-badge-out">OUT OF STOCK</span>;
      default:
        return <span className="inv-badge">{status}</span>;
    }
  };

  const getStockClass = (status) => {
    if (status === "CRITICAL" || status === "OUT_OF_STOCK") return "inv-stock-error";
    if (status === "LOW_STOCK") return "inv-stock-warning";
    return "inv-stock-normal";
  };

  return (
    <div className="inv-container">
      {/* Header Section */}
      <div className="inv-header">
        <div className="inv-title-area">
          <h2 className="inv-title">
            <span className="material-symbols-outlined inv-title-icon">inventory_2</span>
            Inventory Dashboard
          </h2>
          <p className="inv-subtitle">Real-time medication stock tracking and allocation.</p>
        </div>
        <div className="inv-filters">
          <div className="inv-search-box">
            <span className="material-symbols-outlined inv-search-icon">search</span>
            <input 
              type="text" 
              className="inv-search-input" 
              placeholder="Search medications, IDs..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="inv-filter-dropdowns">
            <select className="inv-select" value={categoryFilter} onChange={handleCategoryChange}>
              <option value="">Category</option>
              <option value="1">Hormonal</option>
              <option value="2">Fertility</option>
            </select>
            <select className="inv-select" value={statusFilter} onChange={handleStatusChange}>
              <option value="">Status</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="CRITICAL">Critical</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="inv-actions">
        <div className="inv-action-buttons">
          <button className="inv-btn inv-btn-primary" onClick={() => onNavigate('add_inventory')}>
            <span className="material-symbols-outlined">add</span> Add Medication
          </button>
          <button className="inv-btn inv-btn-secondary">
            <span className="material-symbols-outlined">upload_file</span> Import
          </button>
          <button className="inv-btn inv-btn-secondary">
            <span className="material-symbols-outlined">download</span> Export
          </button>
          <button className="inv-btn-icon" onClick={fetchInventory}>
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
        <div className="inv-status-pills">
          <span className="inv-pill inv-pill-all" onClick={() => {setStatusFilter(""); setPage(1)}}>All ({totalCount})</span>
          <span className="inv-pill inv-pill-in-stock" onClick={() => {setStatusFilter("IN_STOCK"); setPage(1)}}>In Stock</span>
          <span className="inv-pill inv-pill-low-stock" onClick={() => {setStatusFilter("LOW_STOCK"); setPage(1)}}>Low Stock</span>
          <span className="inv-pill inv-pill-critical" onClick={() => {setStatusFilter("CRITICAL"); setPage(1)}}>Critical</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <p className="inv-stat-title">Total Inventory</p>
          <div className="inv-stat-value-area">
            <span className="inv-stat-value">{(summary.total || 0).toString().padStart(2, '0')}</span>
            <span className="inv-stat-badge">+{(summary.total || 0)} Total</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <p className="inv-stat-title">In Stock</p>
          <span className="inv-stat-value text-secondary">{(summary.in_stock || 0).toString().padStart(2, '0')}</span>
        </div>
        <div className="inv-stat-card">
          <p className="inv-stat-title">Low Stock</p>
          <span className="inv-stat-value text-warning">{(summary.low_stock || 0).toString().padStart(2, '0')}</span>
        </div>
        <div className="inv-stat-card">
          <p className="inv-stat-title">Critical/Empty</p>
          <span className="inv-stat-value text-error">{((summary.critical || 0) + (summary.out_of_stock || 0)).toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="inv-table-container">
        <div className="inv-table-wrapper">
          <table className="inv-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Med ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Expiry</th>
                <th>Price</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">Loading inventory...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-error">{error}</td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">No medications found.</td>
                </tr>
              ) : (
                inventory.map((item, index) => (
                  <tr key={item.id} className="inv-table-row">
                    <td className="font-medium text-gray">{((page - 1) * pageSize) + index + 1}</td>
                    <td className="font-mono font-semibold">{item.medication_id || `MED-${item.id}`}</td>
                    <td className="font-semibold">{item.name}</td>
                    <td className="text-gray">{item.category_name || item.category || '-'}</td>
                    <td className={`font-bold ${getStockClass(item.stock_status)}`}>{item.current_stock}</td>
                    <td className={item.stock_status === 'CRITICAL' || item.stock_status === 'OUT_OF_STOCK' ? 'text-error font-medium' : 'text-gray'}>
                      {item.expiry_date ? new Date(item.expiry_date).toISOString().split('T')[0] : '-'}
                    </td>
                    <td className="font-medium">${item.selling_price || '0.00'}</td>
                    <td>{getStatusBadge(item.stock_status)}</td>
                    <td>
                      <div className="inv-row-actions">
                        <button className="inv-action-btn"><span className="material-symbols-outlined">edit</span></button>
                        <button className="inv-action-btn"><span className="material-symbols-outlined">history</span></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="inv-pagination">
          <div className="inv-page-info">
            Showing <span className="font-bold">{inventory.length > 0 ? ((page - 1) * pageSize) + 1 : 0}-{Math.min(page * pageSize, totalCount)}</span> of <span className="font-bold">{totalCount}</span> medications
          </div>
          <div className="inv-page-controls">
            <div className="inv-page-buttons">
              <span className="inv-page-label">Page</span>
              <div className="inv-page-btn-group">
                <button 
                  className="inv-page-arrow" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="inv-page-current">{page}</span>
                <button 
                  className="inv-page-arrow"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * pageSize >= totalCount}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="inv-page-size">
              <span className="inv-page-label">Show</span>
              <select className="inv-page-size-select" value={pageSize} onChange={(e) => {setPageSize(Number(e.target.value)); setPage(1);}}>
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
