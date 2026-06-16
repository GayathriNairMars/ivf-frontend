import React, { useState, useEffect } from "react";
import { hrApi } from "../../../api/hrApi";
import { 
  Plus, 
  Search, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  User, 
  X,
  Users,
  RefreshCw,
  Info
} from "lucide-react";
import { ROLE_LABELS } from "../../../constants/constants";
import "./hr_assign_shifts.css";

export default function HRAssignShifts() {
  // Main data states
  const [assignments, setAssignments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters for the main list
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterDoctorId, setFilterDoctorId] = useState("");

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Single Assignment form state
  const [singleDocSearch, setSingleDocSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [assignShiftId, setAssignShiftId] = useState("");
  const [assignDate, setAssignDate] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [conflictWarning, setConflictWarning] = useState("");
  const [singleSubmitting, setSingleSubmitting] = useState(false);
  const [singleError, setSingleError] = useState("");

  // Bulk Assignment form state
  const [bulkSelectedDocs, setBulkSelectedDocs] = useState([]);
  const [bulkShiftId, setBulkShiftId] = useState("");
  const [bulkStartDate, setBulkStartDate] = useState("");
  const [bulkEndDate, setBulkEndDate] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState("");

  // Set default dates on load (Current week: Monday to Sunday)
  useEffect(() => {
    const today = new Date();
    
    // Get Monday of current week
    const day = today.getDay();
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diffToMonday));
    const sunday = new Date(today.setDate(monday.getDate() + 6));

    const yyyyMmDd = (d) => d.toISOString().split("T")[0];

    setFilterStartDate(yyyyMmDd(monday));
    setFilterEndDate(yyyyMmDd(sunday));
    
    // Form default date set to today
    setAssignDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Fetch data
  useEffect(() => {
    if (filterStartDate && filterEndDate) {
      fetchAssignments();
    }
  }, [filterStartDate, filterEndDate, filterDoctorId]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch shift types
      const shiftRes = await hrApi.getShifts();
      if (shiftRes && shiftRes.success) {
        setShifts(shiftRes.shifts || []);
      }

      // Fetch doctors (staff filtered by END, GYN, ANE)
      const staffRes = await hrApi.getStaff({ role: "END,GYN,ANE" });
      const doctorRoles = ["END", "GYN", "ANE"];
      let allStaff = [];
      if (staffRes && staffRes.success) {
        allStaff = staffRes.staff || [];
      } else if (Array.isArray(staffRes)) {
        allStaff = staffRes;
      }
      const activeDocs = allStaff.filter(
        (s) => s.is_active && doctorRoles.includes(s.role)
      );
      setDoctors(activeDocs);
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        start_date: filterStartDate,
        end_date: filterEndDate,
      };
      if (filterDoctorId) {
        params.doctor_id = filterDoctorId;
      }
      const res = await hrApi.getShiftAssignments(params);
      if (res && res.success) {
        setAssignments(res.assignments || []);
      } else if (Array.isArray(res)) {
        setAssignments(res);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error("Failed to fetch shift assignments", err);
      setError("Failed to fetch shift assignments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Perform single conflict check when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && assignDate) {
      checkSingleConflict();
    } else {
      setConflictWarning("");
    }
  }, [selectedDoctor, assignDate, assignShiftId]);

  const checkSingleConflict = async () => {
    try {
      const res = await hrApi.getShiftAssignments({
        start_date: assignDate,
        end_date: assignDate,
        doctor_id: selectedDoctor.id,
      });
      const existing = res.assignments || res || [];
      if (existing.length > 0) {
        const first = existing[0];
        const shiftName = first.shift_type_display || first.shift_name || "another shift";
        setConflictWarning(
          `${selectedDoctor.name || selectedDoctor.full_name} is already assigned to ${shiftName} on this date (${assignDate}).`
        );
      } else {
        setConflictWarning("");
      }
    } catch (err) {
      console.error("Conflict check failed", err);
    }
  };

  // Single Assignment Submission
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      setSingleError("Please select a doctor.");
      return;
    }
    if (!assignShiftId) {
      setSingleError("Please select a shift.");
      return;
    }
    if (!assignDate) {
      setSingleError("Please select an assign date.");
      return;
    }

    setSingleSubmitting(true);
    setSingleError("");
    try {
      const payload = {
        doctor_id: parseInt(selectedDoctor.id),
        shift_id: parseInt(assignShiftId),
        shift_date: assignDate,
        notes: assignNotes
      };
      const res = await hrApi.assignShift(payload);
      if (res && (res.success || res.id)) {
        showToast("Shift assigned successfully!");
        closeAssignModal();
        fetchAssignments();
      } else {
        setSingleError(res.message || "Failed to assign shift.");
      }
    } catch (err) {
      console.error("Failed to assign shift", err);
      setSingleError(err.response?.data?.message || err.response?.data?.error || "Error occurred while assigning shift.");
    } finally {
      setSingleSubmitting(false);
    }
  };

  // Bulk Assignment Submission
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (bulkSelectedDocs.length === 0) {
      setBulkError("Please select at least one doctor.");
      return;
    }
    if (!bulkShiftId) {
      setBulkError("Please select a shift.");
      return;
    }
    if (!bulkStartDate || !bulkEndDate) {
      setBulkError("Please specify from and to dates.");
      return;
    }
    if (new Date(bulkStartDate) > new Date(bulkEndDate)) {
      setBulkError("From Date cannot be after To Date.");
      return;
    }

    setBulkSubmitting(true);
    setBulkError("");

    const dateList = getDatesInRange(bulkStartDate, bulkEndDate);
    const assignmentsPayload = [];

    bulkSelectedDocs.forEach((docId) => {
      dateList.forEach((date) => {
        assignmentsPayload.push({
          doctor_id: parseInt(docId),
          shift_id: parseInt(bulkShiftId),
          shift_date: date,
        });
      });
    });

    try {
      const res = await hrApi.bulkAssignShifts({ assignments: assignmentsPayload });
      if (res && (res.success || res.created_count !== undefined)) {
        showToast(`Successfully assigned ${res.created_count || assignmentsPayload.length} shifts!`);
        closeBulkModal();
        fetchAssignments();
      } else {
        setBulkError(res.message || "Failed to assign bulk shifts.");
      }
    } catch (err) {
      console.error("Failed to assign bulk shifts", err);
      setBulkError(err.response?.data?.message || err.response?.data?.error || "Error occurred while bulk assigning shifts.");
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Cancel/Delete assignment
  const handleCancelAssignment = async (id, doctorName, date) => {
    if (window.confirm(`Are you sure you want to cancel the shift for ${doctorName} on ${date}?`)) {
      try {
        await hrApi.deleteShiftAssignment(id);
        showToast("Shift assignment cancelled.");
        fetchAssignments();
      } catch (err) {
        console.error("Failed to delete assignment", err);
        alert("Failed to cancel assignment. Please try again.");
      }
    }
  };

  // Helper: show toast message
  const showToast = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  // Helper: get dates array in range
  const getDatesInRange = (start, end) => {
    const dates = [];
    if (!start || !end) return dates;
    const current = new Date(start);
    const last = new Date(end);
    let iterations = 0;
    while (current <= last && iterations < 62) { // safety cap 2 months
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
      iterations++;
    }
    return dates;
  };

  // Close modals & reset forms
  const closeAssignModal = () => {
    setIsAssignOpen(false);
    setSingleDocSearch("");
    setSelectedDoctor(null);
    setAssignShiftId("");
    setAssignNotes("");
    setConflictWarning("");
    setSingleError("");
  };

  const closeBulkModal = () => {
    setIsBulkOpen(false);
    setBulkSelectedDocs([]);
    setBulkShiftId("");
    setBulkStartDate("");
    setBulkEndDate("");
    setBulkError("");
  };

  // Bulk modal selections helper
  const handleSelectAllDocs = (select) => {
    if (select) {
      setBulkSelectedDocs(doctors.map((d) => d.id));
    } else {
      setBulkSelectedDocs([]);
    }
  };

  const handleToggleDocSelection = (docId) => {
    setBulkSelectedDocs((prev) => {
      if (prev.includes(docId)) {
        return prev.filter((id) => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  // Filter doctors for single assign
  const filteredSingleDoctors = singleDocSearch.trim()
    ? doctors.filter((d) =>
        (d.name || d.full_name || "").toLowerCase().includes(singleDocSearch.toLowerCase()) ||
        (ROLE_LABELS[d.role] || d.role).toLowerCase().includes(singleDocSearch.toLowerCase())
      )
    : [];

  // Computed summary fields for single assign
  const getSelectedShiftDuration = () => {
    const s = shifts.find((sh) => String(sh.id) === String(assignShiftId));
    return s ? `${parseFloat(s.duration_hours)} hours` : "-";
  };

  const getSelectedShiftName = () => {
    const s = shifts.find((sh) => String(sh.id) === String(assignShiftId));
    return s ? `${s.name || s.shift_type} (${formatTime(s.start_time)} - ${formatTime(s.end_time)})` : "-";
  };

  // Bulk preview details calculation
  const getBulkPreviewList = () => {
    if (bulkSelectedDocs.length === 0 || !bulkShiftId || !bulkStartDate || !bulkEndDate) {
      return [];
    }
    const dates = getDatesInRange(bulkStartDate, bulkEndDate);
    const selectedShiftObj = shifts.find((sh) => String(sh.id) === String(bulkShiftId));
    const shiftLabel = selectedShiftObj 
      ? `${selectedShiftObj.name || selectedShiftObj.shift_type} (${formatTime(selectedShiftObj.start_time)} - ${formatTime(selectedShiftObj.end_time)})` 
      : "Selected Shift";

    const preview = [];
    bulkSelectedDocs.forEach((docId) => {
      const doc = doctors.find((d) => d.id === docId);
      if (doc) {
        dates.forEach((dt) => {
          preview.push({
            id: `${docId}-${dt}`,
            doctorName: doc.name || doc.full_name,
            role: ROLE_LABELS[doc.role] || doc.role,
            date: dt,
            shift: shiftLabel,
          });
        });
      }
    });
    return preview;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      weekday: "short"
    });
  };

  const bulkPreviewList = getBulkPreviewList();

  return (
    <div className="assign-shifts-container">
      {/* Toast Notification */}
      {successMessage && (
        <div className="toast-success">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="assign-shifts-header">
        <div className="header-info">
          <h1>Assign Shifts</h1>
          <p>Schedule duty shifts for reproductive endocrinologists, gynecologists, and anesthesiologists.</p>
        </div>
        <div className="header-actions">
          <button className="btn-bulk" onClick={() => setIsBulkOpen(true)}>
            <span>📋 Bulk Assignment</span>
          </button>
          <button className="btn-primary" onClick={() => setIsAssignOpen(true)}>
            <Plus size={18} />
            <span>Assign Doctor</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="assign-filter-panel">
        <div className="filter-group">
          <label>📅 From Date</label>
          <input 
            type="date" 
            value={filterStartDate} 
            onChange={(e) => setFilterStartDate(e.target.value)} 
          />
        </div>
        <div className="filter-group">
          <label>📅 To Date</label>
          <input 
            type="date" 
            value={filterEndDate} 
            onChange={(e) => setFilterEndDate(e.target.value)} 
          />
        </div>
        <div className="filter-group filter-doctor">
          <label>👨‍⚕️ Filter by Doctor</label>
          <select 
            value={filterDoctorId} 
            onChange={(e) => setFilterDoctorId(e.target.value)}
          >
            <option value="">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name || doc.full_name} ({ROLE_LABELS[doc.role] || doc.role})
              </option>
            ))}
          </select>
        </div>
        <button className="btn-refresh" title="Refresh list" onClick={fetchAssignments}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table grid */}
      <div className="assignments-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={24} className="animate-spin" />
            <p>Loading shift assignments...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertTriangle size={24} />
            <p>{error}</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <Info size={32} />
            <p>No shift assignments scheduled for the selected dates.</p>
            <p className="subtext">Click 'Assign Doctor' or 'Bulk Assignment' to schedule shifts.</p>
          </div>
        ) : (
          <table className="assignments-table">
            <thead>
              <tr>
                <th>DOCTOR NAME</th>
                <th>ROLE</th>
                <th>SHIFT DETAIL</th>
                <th>ASSIGN DATE</th>
                <th>NOTES</th>
                <th className="actions-header">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((asg) => {
                const shiftDetail = shifts.find((s) => String(s.id) === String(asg.shift_id));
                const doctorDetail = doctors.find((d) => String(d.id) === String(asg.doctor_id));
                const name = asg.doctor_name || (doctorDetail ? (doctorDetail.name || doctorDetail.full_name) : `Doctor ID ${asg.doctor_id}`);
                const role = asg.doctor_role || (doctorDetail ? doctorDetail.role : "-");
                const shiftName = asg.shift_type_display || asg.shift_name || (shiftDetail ? `${shiftDetail.name} (${formatTime(shiftDetail.start_time)} - ${formatTime(shiftDetail.end_time)})` : `Shift ID ${asg.shift_id}`);
                
                return (
                  <tr key={asg.id}>
                    <td>
                      <div className="doctor-avatar-name">
                        <div className="doc-avatar">
                          <User size={14} />
                        </div>
                        <span className="doc-name">{name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${role}`}>
                        {ROLE_LABELS[role] || role}
                      </span>
                    </td>
                    <td>
                      <div className="shift-badge-detail">
                        <Clock size={13} />
                        <span>{shiftName}</span>
                      </div>
                    </td>
                    <td className="cell-date">{formatDisplayDate(asg.shift_date)}</td>
                    <td className="cell-notes">{asg.notes || <span className="no-notes">-</span>}</td>
                    <td>
                      <div className="actions-cell">
                        <button 
                          className="btn-cancel" 
                          title="Cancel assignment" 
                          onClick={() => handleCancelAssignment(asg.id, name, formatDisplayDate(asg.shift_date))}
                        >
                          <Trash2 size={15} />
                          <span>Cancel Shift</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ============================================================ */}
      {/* SINGLE ASSIGNMENT MODAL */}
      {/* ============================================================ */}
      {isAssignOpen && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center sticky top-0 bg-white z-10 modal-header-custom">
              <h3 className="font-headline-md text-headline-md text-primary">Assign Doctor to Shift</h3>
              <button className="close-modal text-secondary hover:text-primary" onClick={closeAssignModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="p-lg form-custom">
              {/* Step 1: Select Doctor */}
              <div className="mb-md form-group">
                <label className="font-body-sm text-secondary block mb-2 font-bold">👨‍⚕️ Select Doctor *</label>
                <div className="relative mb-2 search-wrapper">
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg outline-none" 
                    placeholder="Search doctor by name..." 
                    value={singleDocSearch}
                    onChange={(e) => {
                      setSingleDocSearch(e.target.value);
                      if (selectedDoctor && (selectedDoctor.name || selectedDoctor.full_name) !== e.target.value) {
                        setSelectedDoctor(null);
                      }
                    }}
                  />
                  <Search className="search-icon absolute right-3 top-2.5 text-secondary" size={18} />
                </div>
                
                {/* Search suggestion box */}
                {!selectedDoctor && singleDocSearch.trim() && (
                  <div className="border border-outline-variant rounded-lg max-h-48 overflow-y-auto custom-scrollbar list-suggestion">
                    {filteredSingleDoctors.length === 0 ? (
                      <div className="p-3 text-sm text-secondary text-center">No active doctors found</div>
                    ) : (
                      filteredSingleDoctors.map((doc) => (
                        <div 
                          key={doc.id} 
                          className="suggestion-item p-2 hover:bg-slate-100 cursor-pointer text-sm"
                          onClick={() => {
                            setSelectedDoctor(doc);
                            setSingleDocSearch(doc.name || doc.full_name || "");
                          }}
                        >
                          <strong>{doc.name || doc.full_name}</strong> — <span className="text-secondary">{ROLE_LABELS[doc.role] || doc.role}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {selectedDoctor && (
                  <p className="text-sm text-secondary mt-1 selected-doc-info">
                    Selected: <span className="font-bold text-primary">{selectedDoctor.name || selectedDoctor.full_name} ({ROLE_LABELS[selectedDoctor.role] || selectedDoctor.role})</span>
                  </p>
                )}
              </div>

              {/* Step 2: Select Shift */}
              <div className="mb-md form-group">
                <label className="font-body-sm text-secondary block mb-2 font-bold">⏰ Select Shift *</label>
                <select 
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg outline-none"
                  value={assignShiftId}
                  onChange={(e) => setAssignShiftId(e.target.value)}
                >
                  <option value="">Select Shift Type</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.shift_type} ({formatTime(s.start_time)} - {formatTime(s.end_time)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Select Date */}
              <div className="mb-md form-group">
                <label className="font-body-sm text-secondary block mb-2 font-bold">📅 Assign Date *</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg outline-none" 
                  value={assignDate}
                  onChange={(e) => setAssignDate(e.target.value)}
                />
              </div>

              {/* Step 4: Notes */}
              <div className="mb-md form-group">
                <label className="font-body-sm text-secondary block mb-2">📝 Notes (Optional)</label>
                <textarea 
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg outline-none" 
                  rows="2" 
                  placeholder="Add any notes about this assignment..."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                />
              </div>

              {/* Step 5: Conflict Check */}
              {conflictWarning && (
                <div className="conflict-check-banner p-3 rounded-lg mb-md bg-red-50 border border-red-200 text-red-700 flex gap-2 items-center">
                  <AlertTriangle size={18} className="flex-shrink-0" />
                  <span className="text-sm font-semibold">{conflictWarning}</span>
                </div>
              )}

              {/* Summary */}
              <div className="bg-surface-container-low p-3 rounded-lg mb-md summary-card-custom">
                <p className="font-bold text-primary font-title">📊 Assignment Summary</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm summary-grid">
                  <div><span className="text-secondary">Doctor:</span> <span className="font-bold text-dark">{selectedDoctor ? selectedDoctor.full_name : "-"}</span></div>
                  <div><span className="text-secondary">Shift:</span> <span className="font-bold text-dark">{assignShiftId ? getSelectedShiftName() : "-"}</span></div>
                  <div><span className="text-secondary">Date:</span> <span className="font-bold text-dark">{assignDate ? formatDisplayDate(assignDate) : "-"}</span></div>
                  <div><span className="text-secondary">Duration:</span> <span className="font-bold text-dark">{assignShiftId ? getSelectedShiftDuration() : "-"}</span></div>
                </div>
              </div>

              {singleError && (
                <div className="bg-error-container text-error p-3 rounded-lg mb-md text-sm error-alert">
                  {singleError}
                </div>
              )}

              <div className="flex gap-md pt-2 border-t border-outline-variant footer-actions">
                <button type="button" className="flex-1 px-4 py-2 border border-outline-variant rounded-lg hover:bg-slate-50 transition-all btn-cancel-modal" onClick={closeAssignModal}>Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg transition-all font-bold btn-submit" disabled={singleSubmitting}>
                  {singleSubmitting ? "Assigning..." : "Assign Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BULK ASSIGNMENT MODAL */}
      {/* ============================================================ */}
      {isBulkOpen && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center sticky top-0 bg-white z-10 modal-header-custom">
              <h3 className="font-headline-md text-headline-md text-primary">📋 Bulk Shift Assignment</h3>
              <button className="close-modal text-secondary hover:text-primary" onClick={closeBulkModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="p-lg form-custom">
              {/* Step 1: Select Doctors */}
              <div className="mb-md form-group">
                <label className="font-body-sm text-secondary block mb-2 font-bold">👨‍⚕️ Select Doctors *</label>
                <div className="flex items-center gap-2 mb-2 select-actions">
                  <button type="button" onClick={() => handleSelectAllDocs(true)} className="text-xs px-2 py-1 bg-secondary-container rounded hover:bg-primary hover:text-white transition-colors">Select All</button>
                  <button type="button" onClick={() => handleSelectAllDocs(false)} className="text-xs px-2 py-1 bg-secondary-container rounded hover:bg-primary hover:text-white transition-colors">Deselect All</button>
                  <span className="text-xs text-secondary ml-2 font-semibold">{bulkSelectedDocs.length} doctors selected</span>
                </div>
                <div className="border border-outline-variant rounded-lg max-h-48 overflow-y-auto custom-scrollbar list-checkboxes-docs">
                  {doctors.length === 0 ? (
                    <div className="p-3 text-center text-secondary text-sm">No active doctors available</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {doctors.map((doc) => (
                        <label key={doc.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer text-sm font-medium">
                          <input 
                            type="checkbox"
                            checked={bulkSelectedDocs.includes(doc.id)}
                            onChange={() => handleToggleDocSelection(doc.id)}
                          />
                          <span>{doc.name || doc.full_name} ({ROLE_LABELS[doc.role] || doc.role})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Select Shift */}
              <div className="mb-md form-group">
                <label className="font-body-sm text-secondary block mb-2 font-bold">⏰ Select Shift *</label>
                <select 
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg outline-none"
                  value={bulkShiftId}
                  onChange={(e) => setBulkShiftId(e.target.value)}
                >
                  <option value="">Select Shift Type</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.shift_type} ({formatTime(s.start_time)} - {formatTime(s.end_time)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Date Range */}
              <div className="grid grid-cols-2 gap-md mb-md range-grid">
                <div className="form-group">
                  <label className="font-body-sm text-secondary block mb-1 font-bold">📅 From Date *</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg outline-none"
                    value={bulkStartDate}
                    onChange={(e) => setBulkStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="font-body-sm text-secondary block mb-1 font-bold">📅 To Date *</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg outline-none"
                    value={bulkEndDate}
                    onChange={(e) => setBulkEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview */}
              {bulkPreviewList.length > 0 && (
                <div className="bg-surface-container-low p-3 rounded-lg mb-md preview-box">
                  <p className="font-bold text-primary font-title">📊 Assignment Preview ({bulkPreviewList.length} shifts to create)</p>
                  <div className="mt-2 preview-scroll custom-scrollbar">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Doctor</th>
                          <th>Role</th>
                          <th>Date</th>
                          <th>Shift</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkPreviewList.map((item) => (
                          <tr key={item.id}>
                            <td><strong>{item.doctorName}</strong></td>
                            <td><span className="badge-light">{item.role}</span></td>
                            <td>{formatDisplayDate(item.date)}</td>
                            <td>{item.shift}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bulkError && (
                <div className="bg-error-container text-error p-3 rounded-lg mb-md text-sm error-alert">
                  {bulkError}
                </div>
              )}

              <div className="flex gap-md pt-2 border-t border-outline-variant footer-actions">
                <button type="button" className="flex-1 px-4 py-2 border border-outline-variant rounded-lg hover:bg-slate-50 transition-all btn-cancel-modal" onClick={closeBulkModal}>Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg transition-all font-bold btn-submit" disabled={bulkSubmitting}>
                  {bulkSubmitting ? "Assigning..." : "Assign All Shifts"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
