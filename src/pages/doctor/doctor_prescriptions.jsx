import React, { useState, useEffect } from "react";
import { Search, Plus, Calendar, ChevronLeft, ChevronRight, ArrowUpRight, X } from "lucide-react";
import { doctorApi } from "../../api/doctorApi";
import "./doctor_prescriptions.css";

const CreatePrescriptionModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    patient_id: "",
    medicine: "",
    dosage: "",
    duration: "",
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await doctorApi.createPrescription(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create prescription", error);
      alert("Failed to create prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Prescription</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Patient ID</label>
            <input 
              type="text" 
              name="patient_id" 
              value={formData.patient_id} 
              onChange={handleChange} 
              required 
              placeholder="e.g. 1"
            />
          </div>
          <div className="form-group">
            <label>Medicine</label>
            <input 
              type="text" 
              name="medicine" 
              value={formData.medicine} 
              onChange={handleChange} 
              required 
              placeholder="e.g. Gonal-F"
            />
          </div>
          <div className="form-group">
            <label>Dosage</label>
            <input 
              type="text" 
              name="dosage" 
              value={formData.dosage} 
              onChange={handleChange} 
              required 
              placeholder="e.g. 300 IU"
            />
          </div>
          <div className="form-group">
            <label>Duration</label>
            <input 
              type="text" 
              name="duration" 
              value={formData.duration} 
              onChange={handleChange} 
              required 
              placeholder="e.g. 7 Days"
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Use mock data if API fails or doesn't return exactly what we need yet
  const mockPrescriptions = [
    { id: "RX-1024", patientMrn: "PAT-001", patientName: "Meera K", date: "10 Jun 2026", medicine: "Gonal-F", dosage: "300 IU", duration: "7 Days", status: "Active" },
    { id: "RX-1023", patientMrn: "PAT-245", patientName: "David Chen", date: "09 Jun 2026", medicine: "Metformin", dosage: "500 mg", duration: "30 Days", status: "Active" },
    { id: "RX-1019", patientMrn: "PAT-112", patientName: "Sarah Smith", date: "05 Jun 2026", medicine: "Amoxicillin", dosage: "250 mg", duration: "10 Days", status: "Active" }
  ];

  const mockInventory = [
    { name: "Gonal-F 300 IU", category: "Hormonal Therapy", stock: 58, availability: "Available" },
    { name: "Ovidrel 250 mcg", category: "Hormonal Therapy", stock: 4, availability: "Low stock" }
  ];

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      // Fetch from API
      const data = await doctorApi.getPrescriptions({ patient_id: 1 });
      if (data && data.success) {
        setPrescriptions(data.prescriptions || []);
        setPatientData(data.patient || null);
      } else {
        setPrescriptions(data.results || data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch prescriptions", error);
      // Fallback to mock data if API fails so UI doesn't completely break
      setPrescriptions(mockPrescriptions);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Calculate stats dynamically
  const totalPrescriptions = prescriptions.length;
  // If the API doesn't have status, we'll assume they are all 'active' for this example or skip
  const activeMedications = prescriptions.length; 
  const uniquePatients = patientData ? 1 : 0;
  const issuedToday = prescriptions.filter(rx => {
    const rxDate = new Date(rx.date);
    const today = new Date();
    return rxDate.toDateString() === today.toDateString();
  }).length;


  return (
    <div className="prescriptions-container">
      <div className="prescriptions-header">
        <div className="header-titles">
          <h1>Prescription management</h1>
          <p>Manage patient prescriptions, review medication history, and create new prescriptions</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Create Prescription
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <span className="card-title">Total prescriptions</span>
          <span className="card-value">{totalPrescriptions}</span>
        </div>
        <div className="summary-card">
          <span className="card-title">Active medications</span>
          <span className="card-value">{activeMedications}</span>
        </div>
        <div className="summary-card">
          <span className="card-title">Patients prescribed</span>
          <span className="card-value">{uniquePatients}</span>
        </div>
        <div className="summary-card">
          <span className="card-title">Issued today</span>
          <span className="card-value highlight-red">{issuedToday}</span>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input type="text" placeholder="Filter by medicine, generic, or ID..." />
        </div>
        <div className="date-picker-wrapper">
          <Calendar size={16} />
          <span>From Date</span>
          <span>—</span>
          <span>To Date</span>
        </div>
        <select className="status-dropdown">
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      <div className="table-container">
        <div className="table-header">Prescription History</div>
        <table>
          <thead>
            <tr>
              <th>Prescription ID</th>
              <th>Patient MRN</th>
              <th>Patient name</th>
              <th>Prescribed date</th>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((rx, idx) => (
              <tr key={idx}>
                <td className="blue-link">RX-{rx.id}</td>
                <td>{patientData ? patientData.mrn : "N/A"}</td>
                <td>{patientData ? patientData.name : "N/A"}</td>
                <td>{rx.date}</td>
                <td>{rx.medication || rx.medicine}</td>
                <td>{rx.dosage}</td>
                <td>{rx.duration}</td>
                <td>
                  <span className="status-badge active">
                    Active
                  </span>
                </td>
              </tr>
            ))}
            {prescriptions.length === 0 && !loading && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "32px" }}>No prescriptions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="inventory-header">
        <h2>Medicine Inventory Overview</h2>
        <button className="btn-primary">Request new medicine</button>
      </div>

      <div className="inventory-cards">
        <div className="inventory-card available">
          <span className="card-title">Available medicines</span>
          <span className="card-value">425</span>
        </div>
        <div className="inventory-card low-stock">
          <span className="card-title">Low stock warnings</span>
          <span className="card-value">401</span>
        </div>
        <div className="inventory-card out-of-stock">
          <span className="card-title">Out of stock</span>
          <span className="card-value">12</span>
        </div>
      </div>

      <div className="table-container" style={{ marginBottom: '20px' }}>
        <table>
          <thead>
            <tr>
              <th>Medicine name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Availability</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockInventory.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 500 }}>{item.name}</td>
                <td style={{ color: '#64748b' }}>{item.category}</td>
                <td className={item.stock < 10 ? 'text-red' : ''}>{item.stock} Units</td>
                <td>
                  <span className={`status-badge ${item.availability.toLowerCase().replace(' ', '-')}`}>
                    {item.availability}
                  </span>
                </td>
                <td>
                  <a href="#" className="action-link">
                    View medicine <ArrowUpRight size={14} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreatePrescriptionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchPrescriptions} 
      />
    </div>
  );
}
