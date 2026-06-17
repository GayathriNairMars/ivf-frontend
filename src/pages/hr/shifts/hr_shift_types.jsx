import React, { useState, useEffect } from "react";
import { hrApi } from "../../../api/hrApi";
import { 
  Plus, 
  LayoutTemplate, 
  CheckCircle2, 
  Clock,
  Edit2,
  Users,
  Trash2,
  X
} from "lucide-react";
import "./hr_shift_types.css";

export default function HRShiftTypes() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    shift_type: "MORNING",
    start_time: "08:00",
    end_time: "16:00",
    duration_hours: "8",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await hrApi.getShifts();
      if (response.success) {
        setShifts(response.shifts);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (shift = null) => {
    if (shift) {
      setEditMode(true);
      setCurrentShiftId(shift.id);
      const sTime = shift.start_time ? shift.start_time.substring(0, 5) : "";
      const eTime = shift.end_time ? shift.end_time.substring(0, 5) : "";
      setFormData({
        name: shift.name || "",
        shift_type: shift.shift_type || "MORNING",
        start_time: sTime,
        end_time: eTime,
        duration_hours: shift.duration_hours ? parseFloat(shift.duration_hours).toString() : "",
        description: shift.description || "",
      });
    } else {
      setEditMode(false);
      setCurrentShiftId(null);
      setFormData({
        name: "",
        shift_type: "MORNING",
        start_time: "08:00",
        end_time: "16:00",
        duration_hours: "8",
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        shift_type: formData.shift_type,
        start_time: formData.start_time.length === 5 ? formData.start_time + ":00" : formData.start_time,
        end_time: formData.end_time.length === 5 ? formData.end_time + ":00" : formData.end_time,
        duration_hours: parseFloat(formData.duration_hours),
        description: formData.description,
        is_active: true,
        requires_on_site: true,
      };

      if (editMode) {
        await hrApi.updateShift(currentShiftId, payload);
      } else {
        await hrApi.createShift(payload);
      }
      handleCloseModal();
      fetchShifts();
    } catch (error) {
      console.error("Error saving shift:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this shift type?")) {
      try {
        await hrApi.deleteShift(id);
        fetchShifts();
      } catch (error) {
        console.error("Error deleting shift:", error);
      }
    }
  };

  const totalDefinitions = shifts.length;
  const activeVariants = shifts.filter(s => s.is_active).length;
  const avgDuration = shifts.length > 0
    ? (shifts.reduce((acc, curr) => acc + parseFloat(curr.duration_hours), 0) / shifts.length).toFixed(1)
    : 0;

  const getShiftDotColor = (shiftType) => {
    switch (shiftType) {
      case 'MORNING': return '#eab308';
      case 'EVENING': return '#f97316';
      case 'NIGHT':   return '#3b82f6';
      case 'ONCALL':  return '#ef4444';
      default:        return '#22c55e';
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const getDepartmentLabel = (shiftType) => {
    switch (shiftType) {
      case 'NIGHT':  return { label: 'ER / ICU',     type: 'blue' };
      case 'ONCALL': return { label: 'Specialist',   type: 'red' };
      case 'CUSTOM': return { label: 'Support',      type: 'green' };
      default:       return { label: 'General Care', type: 'green' };
    }
  };

  return (
    <div className="shift-types-container">
      <div className="shift-types-header">
        <div className="header-text">
          <h1>Shift Types</h1>
          <p>Define and manage recurring shift configurations for healthcare staff.</p>
        </div>
        <button className="add-shift-btn" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          <span>Add New Shift Type</span>
        </button>
      </div>

      <div className="shift-metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">TOTAL DEFINITIONS</span>
            <span className="metric-value">{totalDefinitions.toString().padStart(2, '0')}</span>
          </div>
          <div className="metric-icon bg-blue">
            <LayoutTemplate size={20} />
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">ACTIVE VARIANTS</span>
            <span className="metric-value">{activeVariants.toString().padStart(2, '0')}</span>
          </div>
          <div className="metric-icon bg-blue-light">
            <CheckCircle2 size={20} />
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">AVG. DURATION</span>
            <span className="metric-value">{avgDuration}h</span>
          </div>
          <div className="metric-icon bg-gray">
            <Clock size={20} />
          </div>
        </div>
      </div>

      <div className="shift-table-wrapper">
        <table className="shift-table">
          <thead>
            <tr>
              <th>SHIFT NAME</th>
              <th>CODE</th>
              <th>TIME RANGE</th>
              <th>DURATION</th>
              <th>DEPARTMENT</th>
              <th className="actions-header">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : shifts.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No shift types found.</td></tr>
            ) : (
              shifts.map((shift) => {
                const dept = getDepartmentLabel(shift.shift_type);
                return (
                  <tr key={shift.id}>
                    <td>
                      <div className="shift-name">
                        <span className="dot" style={{ backgroundColor: getShiftDotColor(shift.shift_type) }} />
                        {shift.name || shift.shift_type_display?.split('(')[0].trim()}
                      </div>
                    </td>
                    <td><span className="code-badge">{shift.shift_type}</span></td>
                    <td><span className="time-range">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span></td>
                    <td>{parseFloat(shift.duration_hours)} hours</td>
                    <td><span className={`dept-badge ${dept.type}`}>{dept.label}</span></td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-btn" title="Edit" onClick={() => handleOpenModal(shift)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn" title="Assign Staff">
                          <Users size={16} />
                        </button>
                        <button className="action-btn delete" title="Delete" onClick={() => handleDelete(shift.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span className="showing-text">Showing {shifts.length} of {shifts.length} entries</span>
          <div className="page-controls">
            <button className="page-btn">Previous</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">Next</button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editMode ? "Edit Shift Type" : "Add New Shift Type"}</h2>
              <button className="close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="shift-form">
              <div className="form-group">
                <label>Shift Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Early Morning Shift"
                  required
                />
              </div>

              <div className="form-group">
                <label>Code (Shift Type)</label>
                <select name="shift_type" value={formData.shift_type} onChange={handleChange} required>
                  <option value="MORNING">MORNING</option>
                  <option value="EVENING">EVENING</option>
                  <option value="NIGHT">NIGHT</option>
                  <option value="ONCALL">ONCALL</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  name="duration_hours"
                  value={formData.duration_hours}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Description: editable on Add, read-only on Edit */}
              <div className="form-group">
                <label>Description</label>
                {editMode ? (
                  <div className="description-readonly">
                    {formData.description || <span className="description-empty">No description provided.</span>}
                  </div>
                ) : (
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g. Regular morning duty for general care staff"
                    rows={3}
                  />
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="save-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editMode ? "Save Changes" : "Create Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}