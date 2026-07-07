import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, Shield, RefreshCw, FileText, Info } from "lucide-react";
import adminApi from "../../../api/adminApi";
import "./lab.css";

export default function TestTypesList() {
  const navigate = useNavigate();
  const [testTypes, setTestTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getTestTypes();
      const types = data?.test_types ?? [];
      setTestTypes(types);
      setFilteredTypes(types);
    } catch (error) {
      console.error("Failed to fetch test types", error);
      // No mock fallback — just show empty state
      setTestTypes([]);
      setFilteredTypes([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTypes();
  }, []);

  const handleApplyFilters = () => {
    let result = [...testTypes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t => t.name.toLowerCase().includes(q) || (t.code && t.code.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") {
      const activeVal = statusFilter === "active";
      result = result.filter(t => t.is_active === activeVal);
    }
    setFilteredTypes(result);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setFilteredTypes(testTypes);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test type?")) return;
    try {
      await adminApi.deleteTestType(id);
      setTestTypes(prev => prev.filter(t => t.id !== id));
      setFilteredTypes(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to delete test type", error);
    }
  };

  // Map icon strings to simple symbols
  const renderIconSymbol = (iconName, color) => {
    let sym = "📋";
    if (iconName?.includes("droplet")) sym = "💧";
    else if (iconName?.includes("heart")) sym = "❤️";
    else if (iconName?.includes("flask") || iconName?.includes("beaker")) sym = "🧪";
    else if (iconName?.includes("dna")) sym = "🧬";
    else if (iconName?.includes("virus") || iconName?.includes("gear")) sym = "🔬";

    return (
      <span 
        style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          justifyContent: "center",
          background: color ? `${color}15` : "#f1f5f9",
          color: color || "var(--text)",
          width: "28px",
          height: "28px",
          borderRadius: "6px",
          marginRight: "10px",
          fontSize: "14px"
        }}
      >
        {sym}
      </span>
    );
  };

  return (
    <div className="lab-section">
      {/* Header */}
      <div className="lab-header-container">
        <div>
          <h2 className="lab-main-title">Test Types Management</h2>
          <p className="lab-main-subtitle">Configure and manage clinical laboratory test profiles.</p>
        </div>
        <div className="lab-header-right">
          <button 
            className="btn-primary" 
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
            onClick={() => navigate("/superadmin/lab/create-test-type")}
          >
            <Plus size={16} />
            Create New Test
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="lab-filters-row">
        <div className="lab-filters-left">
          <div className="filter-group">
            <label>Search</label>
            <div className="search-wrapper-lab">
              <Search className="search-icon-lab" size={16} />
              <input 
                type="text" 
                placeholder="Search test types..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleApplyFilters()}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <div className="select-wrapper-lab">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Active</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="filters-btn-group">
          <button className="btn-apply-filters" onClick={handleApplyFilters}>Apply</button>
          <button className="btn-reset-filters" onClick={handleResetFilters}>Reset</button>
        </div>
      </div>

      {/* Table Card */}
      <div className="panel" style={{ padding: "0" }}>
        <table className="sessions-table">
          <thead>
            <tr>
              <th style={{ width: "60px", textAlign: "center" }}>#</th>
              <th>Name</th>
              <th>Fields</th>
              <th>Records</th>
              <th>Status</th>
              <th style={{ width: "120px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>Loading test types...</td>
              </tr>
            ) : filteredTypes.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-3)" }}>
                  No test types found.
                </td>
              </tr>
            ) : (
              filteredTypes.map((type, idx) => (
                <tr key={type.id}>
                  <td style={{ textAlign: "center", color: "var(--text-3)", fontWeight: "500" }}>{idx + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {renderIconSymbol(type.icon, type.color)}
                      <span style={{ fontWeight: "600", color: "var(--text)" }}>{type.name}</span>
                    </div>
                  </td>
                  <td>{type.field_count || type.fields?.length || 0} fields</td>
                  <td>{type.record_count || 0} records</td>
                  <td>
                    <span 
                      className={`status-badge-new ${type.is_active ? "active" : "inactive"}`}
                      style={{
                        background: type.is_active ? "#ecfdf3" : "#f2f4f7",
                        color: type.is_active ? "#12b76a" : "#667085"
                      }}
                    >
                      <span className="status-dot" style={{ background: type.is_active ? "#12b76a" : "#667085" }}></span>
                      {type.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                      <button 
                        className="btn-more-actions" 
                        onClick={() => navigate(`/superadmin/lab/test-types/edit/${type.id}`)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-more-actions"
                        style={{ color: "#f04438" }}
                        onClick={() => handleDelete(type.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Footer */}
        <div className="pagination">
          <div className="pagination-text">
            Showing <span>1-{filteredTypes.length}</span> of <span>{filteredTypes.length}</span> test types
          </div>
          <div className="pagination-controls">
            <button className="page-btn" disabled>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button className="page-btn active">1</button>
            <button className="page-btn" disabled>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="info-cards-grid">
        <div className="info-card dark">
          <div className="info-card-icon">
            <Info size={20} />
          </div>
          <div className="info-card-details">
            <h4>Standards Compliance</h4>
            <p>All test types must follow ISO 15189 clinical laboratory standards for reporting and naming conventions.</p>
          </div>
        </div>

        <div className="info-card blue">
          <div className="info-card-icon">
            <RefreshCw size={20} />
          </div>
          <div className="info-card-details">
            <h4>Automatic Sync</h4>
            <p>Changes to test fields will automatically reflect in all future patient records across the clinical ecosystem.</p>
          </div>
        </div>

        <div className="info-card sky">
          <div className="info-card-icon">
            <Shield size={20} />
          </div>
          <div className="info-card-details">
            <h4>Audit Logging</h4>
            <p>Every modification to clinical test definitions is logged for HIPAA and healthcare compliance requirements.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
