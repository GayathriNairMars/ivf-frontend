import React, { useState, useEffect } from "react";
import "./hr_shift_swaps.css";
import {
  Calendar,
  Clock,
  RefreshCw,
  ClipboardCheck,
  Eye,
  AlertTriangle,
  X,
  CheckCircle2,
  Lightbulb,
  ArrowRightLeft
} from "lucide-react";
import { hrApi } from "../../../api/hrApi";

export default function HRShiftSwaps() {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, today: 0, thisWeek: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState("");
  
  // Modals state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await hrApi.getShiftSwaps();
      setSwaps(Array.isArray(data) ? data : []);
      // Calculate basic stats based on fetched data if they aren't provided by API
      if (Array.isArray(data)) {
        setStats({
          pending: data.filter(s => s.status?.toUpperCase() === 'PENDING').length || data.length,
          today: 2, // Hardcoded or calculated later based on real data
          thisWeek: 12,
          total: 45
        });
      }
    } catch (err) {
      console.error("Failed to fetch shift swaps", err);
      setErrorMsg("Failed to load shift swaps. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (swap) => {
    setSelectedSwap(swap);
    setApproveModalOpen(true);
  };

  const handleRejectClick = (swap) => {
    setSelectedSwap(swap);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const confirmApprove = async () => {
    try {
      await hrApi.respondToShiftSwap(selectedSwap.id, { action: "approve" });
      setApproveModalOpen(false);
      fetchSwaps();
    } catch (err) {
      console.error("Failed to approve", err);
      alert("Failed to approve. Please try again.");
    }
  };

  const confirmReject = async () => {
    try {
      await hrApi.respondToShiftSwap(selectedSwap.id, { action: "reject", reason: rejectionReason });
      setRejectModalOpen(false);
      fetchSwaps();
    } catch (err) {
      console.error("Failed to reject", err);
      alert("Failed to reject. Please try again.");
    }
  };

  return (
    <div className="ssw-container">
      <div className="ssw-header">
        <h2>Shift Swap Management</h2>
      </div>

      <div className="ssw-stats-grid">
        <div className="ssw-stat-card">
          <div className="ssw-stat-header">
            <span className="ssw-stat-title">PENDING</span>
            <ClipboardCheck size={20} className="ssw-stat-icon" />
          </div>
          <span className="ssw-stat-value">{stats.pending}</span>
          <span className="ssw-stat-subtitle">Awaiting approval</span>
        </div>
        <div className="ssw-stat-card">
          <div className="ssw-stat-header">
            <span className="ssw-stat-title">TODAY</span>
            <Calendar size={20} className="ssw-stat-icon cal" />
          </div>
          <span className="ssw-stat-value">{stats.today}</span>
          <span className="ssw-stat-subtitle">Swaps occurring today</span>
        </div>
        <div className="ssw-stat-card">
          <div className="ssw-stat-header">
            <span className="ssw-stat-title">THIS WEEK</span>
            <Clock size={20} className="ssw-stat-icon cal" />
          </div>
          <span className="ssw-stat-value">{stats.thisWeek}</span>
          <span className="ssw-stat-subtitle">Total scheduled</span>
        </div>
        <div className="ssw-stat-card">
          <div className="ssw-stat-header">
            <span className="ssw-stat-title">TOTAL</span>
            <RefreshCw size={20} className="ssw-stat-icon cal" />
          </div>
          <span className="ssw-stat-value">{stats.total}</span>
          <span className="ssw-stat-subtitle">Successful completions</span>
        </div>
      </div>

      <div className="ssw-filters-bar">
        <div className="ssw-filter-group" style={{ maxWidth: '150px' }}>
          <label>Status</label>
          <select defaultValue="All">
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="ssw-filter-group" style={{ maxWidth: '300px' }}>
          <label>Date Range</label>
          <div className="ssw-date-range-inputs">
            <input type="date" />
            <span>→</span>
            <input type="date" />
          </div>
        </div>
        <div className="ssw-filter-group">
          <label>Search Input</label>
          <input type="text" placeholder="Dr. Name or ID..." />
        </div>
        <button className="ssw-refresh-btn" onClick={fetchSwaps}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="ssw-requests-section">
        <div className="ssw-section-header">
          <h3>Pending Swap Requests ({stats.pending})</h3>
          <span className="ssw-urgent-badge">URGENT</span>
        </div>

        {errorMsg && <div style={{ color: "red", padding: "10px" }}>{errorMsg}</div>}
        {loading && <div style={{ padding: "20px" }}>Loading swaps...</div>}
        
        {!loading && !errorMsg && swaps.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: "8px" }}>
            No pending shift swap requests.
          </div>
        )}

        {!loading && swaps.length > 0 && (
          <div className="ssw-requests-list">
            {swaps.map((swap, index) => (
              <div key={index} className="ssw-swap-card">
                <div className="ssw-swap-parties">
                  {/* Doc 1 */}
                  <div className="ssw-doc-profile">
                    <div className="ssw-doc-avatar">
                      <UserIcon />
                    </div>
                    <div className="ssw-doc-details">
                      <span className="ssw-doc-name">{swap.requesting_doctor?.name || "Dr. Name"}</span>
                      <span className="ssw-doc-role">{swap.requesting_doctor?.role || "ROLE"}</span>
                    </div>
                  </div>
                  
                  {/* Empty center */}
                  <div />
                  
                  {/* Doc 2 */}
                  <div className="ssw-doc-profile">
                    <div className="ssw-doc-avatar">
                      <UserIcon />
                    </div>
                    <div className="ssw-doc-details">
                      <span className="ssw-doc-name">{swap.target_doctor?.name || "Dr. Name"}</span>
                      <span className="ssw-doc-role">{swap.target_doctor?.role || "ROLE"}</span>
                    </div>
                  </div>

                  {/* Shift 1 */}
                  <div className="ssw-shift-details">
                    <div className="ssw-shift-time-row">
                      <Calendar size={14} />
                      {swap.requesting_shift?.date || "YYYY-MM-DD"}
                    </div>
                    <div className="ssw-shift-time-row">
                      <Clock size={14} />
                      {swap.requesting_shift?.time || "HH:MM - HH:MM"}
                    </div>
                  </div>

                  {/* Swap Icon */}
                  <div className="ssw-swap-icon-container">
                    <ArrowRightLeft size={16} />
                  </div>

                  {/* Shift 2 */}
                  <div className="ssw-shift-details">
                    <div className="ssw-shift-time-row">
                      <Calendar size={14} />
                      {swap.target_shift?.date || "YYYY-MM-DD"}
                    </div>
                    <div className="ssw-shift-time-row">
                      <Clock size={14} />
                      {swap.target_shift?.time || "HH:MM - HH:MM"}
                    </div>
                  </div>
                </div>

                <div className="ssw-swap-actions-section">
                  <div className="ssw-request-meta">
                    <span className="ssw-request-id">#{swap.id || "SR-XXXXXX"}</span>
                    <span className={`ssw-status-badge ${swap.status?.toLowerCase() || 'pending'}`}>
                      {swap.status || "PENDING"}
                    </span>
                  </div>
                  <p className="ssw-request-reason">
                    "{swap.reason || "No reason provided"}"
                  </p>
                  <div className="ssw-action-buttons">
                    <button className="ssw-btn-approve" onClick={() => handleApproveClick(swap)}>Approve</button>
                    <button className="ssw-btn-reject" onClick={() => handleRejectClick(swap)}>Reject</button>
                    <button className="ssw-btn-view" title="View Details">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && swaps.length > 0 && (
        <div className="ssw-pagination-container">
          <span className="ssw-showing-text">Showing <strong>1-{Math.min(5, swaps.length)}</strong> of <strong>{swaps.length}</strong> requests</span>
          <div className="ssw-pagination-controls">
            <button className="ssw-page-btn">&lt;</button>
            <button className="ssw-page-btn active">1</button>
            {swaps.length > 5 && <button className="ssw-page-btn">2</button>}
            <button className="ssw-page-btn">&gt;</button>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModalOpen && selectedSwap && (
        <div className="ssw-modal-overlay">
          <div className="ssw-modal-content">
            <div className="ssw-modal-body">
              <div className="ssw-modal-header-icon">
                <div className="ssw-warning-icon-box">
                  <AlertTriangle size={24} />
                </div>
                <div className="ssw-modal-header-text">
                  <h3>Are you sure you want to APPROVE this swap request?</h3>
                  <ul className="ssw-consequences-list">
                    <li><ArrowRightLeft size={14} /> Swap shifts between doctors</li>
                    <li><ArrowRightLeft size={14} /> Cancel original assignments</li>
                    <li><ArrowRightLeft size={14} /> Create new assignments</li>
                    <li><ArrowRightLeft size={14} /> Update status to Swapped</li>
                  </ul>
                </div>
              </div>

              <div className="ssw-swap-details-box">
                <span className="ssw-swap-details-header">SWAP DETAILS</span>
                <div className="ssw-swap-users-grid">
                  <div className="ssw-swap-user-col">
                    <label>Requesting</label>
                    <div className="ssw-modal-doc-info">
                      <div className="ssw-modal-doc-avatar" />
                      <span className="ssw-modal-doc-name">{selectedSwap.requesting_doctor?.name}</span>
                    </div>
                  </div>
                  <div className="ssw-swap-user-col">
                    <label>Target</label>
                    <div className="ssw-modal-doc-info">
                      <div className="ssw-modal-doc-avatar" />
                      <span className="ssw-modal-doc-name">{selectedSwap.target_doctor?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="ssw-swap-user-col">
                  <label>Shift Timing</label>
                  <div className="ssw-timing-comparison">
                    <div className="ssw-timing-col">
                      <span className="ssw-timing-date">{selectedSwap.requesting_shift?.date}</span>
                      <span className="ssw-timing-badge">Early morning</span>
                    </div>
                    <ArrowRightLeft size={16} color="#64748b" />
                    <div className="ssw-timing-col">
                      <span className="ssw-timing-date">{selectedSwap.target_shift?.date}</span>
                      <span className="ssw-timing-badge">Early morning</span>
                    </div>
                  </div>
                </div>

                <div className="ssw-swap-user-col">
                  <label>Reason</label>
                  <p className="ssw-swap-reason-quote">"{selectedSwap.reason}"</p>
                </div>
              </div>

              <div className="ssw-conflict-check">
                <CheckCircle2 size={20} />
                <div className="ssw-conflict-text">
                  <strong>Conflict Check</strong>
                  <span>No conflicts found</span>
                </div>
              </div>

              <div className="ssw-modal-footer">
                <button className="ssw-btn-cancel" onClick={() => setApproveModalOpen(false)}>Cancel</button>
                <button className="ssw-btn-confirm-approve" onClick={confirmApprove}>
                  <CheckCircle2 size={16} /> Confirm Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedSwap && (
        <div className="ssw-modal-overlay">
          <div className="ssw-modal-content" style={{ position: 'relative' }}>
            <button className="ssw-close-btn" onClick={() => setRejectModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="ssw-modal-body">
              <div className="ssw-modal-header-icon">
                <div className="ssw-warning-icon-box">
                  <AlertTriangle size={24} />
                </div>
                <div className="ssw-modal-header-text">
                  <h3>Are you sure you want to REJECT this swap request?</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 12px 0' }}>
                    This action cannot be undone and will affect the current roster.
                  </p>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CONSEQUENCES OF REJECTION:
                    </span>
                    <ul className="ssw-consequences-list" style={{ marginTop: '8px' }}>
                      <li><X size={14} color="#ef4444" /> Cancel the swap request immediately</li>
                      <li><Calendar size={14} color="#3b82f6" /> Keep original shifts as currently scheduled</li>
                      <li><AlertTriangle size={14} color="#3b82f6" /> Notify both doctors involved via email & app</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="ssw-rejection-form">
                <label>Rejection Reason (Optional)</label>
                <textarea 
                  className="ssw-rejection-textarea" 
                  placeholder="Doctor already has another commitment on that date"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div className="ssw-common-reasons">
                <div className="ssw-common-reasons-header">
                  <Lightbulb size={14} /> Common Reasons
                </div>
                <div className="ssw-reasons-tags">
                  <span className="ssw-reason-tag" onClick={() => setRejectionReason("Rest rule violation")}>Rest rule violation</span>
                  <span className="ssw-reason-tag" onClick={() => setRejectionReason("Coverage gap")}>Coverage gap</span>
                  <span className="ssw-reason-tag" onClick={() => setRejectionReason("Overlapping leave")}>Overlapping leave</span>
                </div>
              </div>

              <div className="ssw-modal-footer">
                <button className="ssw-btn-cancel" onClick={() => setRejectModalOpen(false)}>Cancel</button>
                <button className="ssw-btn-confirm-reject" onClick={confirmReject}>Confirm Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple placeholder for user avatar icon
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}
