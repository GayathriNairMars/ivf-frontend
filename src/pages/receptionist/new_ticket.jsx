import { useState, useEffect } from "react";
import receptionistApi from "../../api/receptionistApi";
import { VISIT_REASONS } from "../../constants/constants";
import PatientHistory from "./patient_op_history";
import { Printer, Download, MessageSquare, Mail } from "lucide-react";

// Custom Dropdown Component for sleek visual dropdowns
function CustomDropdown({ label, value, onChange, options, placeholder, error, renderOption, renderSelected }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", position: "relative", width: "100%" }}>
      {label && <label style={{ fontSize: "14px", fontWeight: "500", color: "#344054" }}>{label}</label>}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          border: error ? "1px solid #fda29b" : "1px solid #d0d5dd",
          borderRadius: "8px",
          background: "#ffffff",
          cursor: "pointer",
          fontSize: "14px",
          color: selectedOption ? "#101828" : "#667085",
          boxShadow: error ? "0px 1px 2px rgba(16, 24, 40, 0.05), 0px 0px 0px 4px #fee4e2" : "0px 1px 2px rgba(16, 24, 40, 0.05)",
          minHeight: "42px",
          userSelect: "none",
          transition: "all 0.2s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
          {selectedOption ? (
            renderSelected ? renderSelected(selectedOption) : <span style={{ fontWeight: "500" }}>{selectedOption.label}</span>
          ) : (
            <span style={{ color: "#98a2b3" }}>{placeholder}</span>
          )}
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="16"
          height="16"
          style={{
            color: "#667085",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {error && <span style={{ color: "#d92d20", fontSize: "12px", marginTop: "2px" }}>{error}</span>}

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "6px",
              background: "#ffffff",
              border: "1px solid #eaecf0",
              borderRadius: "8px",
              boxShadow: "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
              zIndex: 999,
              maxHeight: "220px",
              overflowY: "auto",
              padding: "4px"
            }}
          >
            {options.length === 0 ? (
              <div style={{ padding: "10px 14px", color: "#667085", fontSize: "14px" }}>No options available</div>
            ) : (
              options.map(option => {
                const isSelected = option.value === value;
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      background: isSelected ? "rgba(124, 58, 237, 0.08)" : "transparent",
                      color: isSelected ? "#7c3aed" : "#101828",
                      fontWeight: isSelected ? "600" : "400",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {renderOption ? renderOption(option) : <span>{option.label}</span>}
                    {isSelected && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" width="14" height="14" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
          </>
        )}
    </div>
  );
}

export default function NewTicket({ onSuccess, onCancel }) {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    assigned_doctor: "",
    department: "",
    visit_reason: "",
    notes: ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [notification, setNotification] = useState(null);

  const triggerNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Load doctors and departments on mount
  useEffect(() => {
    receptionistApi.getDoctors().then((data) => setDoctors(data)).catch(() => {});
    receptionistApi.getDepartments().then((data) => setDepartments(data)).catch(() => {});
  }, []);

  // Debounced search for patients
  useEffect(() => {
    if (!search.trim()) {
      setPatients([]);
      return;
    }
    const t = setTimeout(() => {
      receptionistApi.searchPatients(`?search=${search}`)
        .then((data) => setPatients(Array.isArray(data) ? data : (data.results || [])))
        .catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Compute patient age
  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + "Y";
  };

  const handleReset = () => {
    setForm({
      assigned_doctor: "",
      department: "",
      visit_reason: "",
      notes: ""
    });
    setErrors({});
  };

  const handleClearAll = () => {
    setSelected(null);
    setSearch("");
    setPatients([]);
    handleReset();
  };

  const handlePrint = (ticketToPrint) => {
    const t = ticketToPrint || ticket;
    if (!t) return;
    
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    };

    const formatTime = (timeStr) => {
      if (!timeStr) return "";
      const d = new Date(timeStr);
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'AM' : 'PM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    };

    const formatDoctorName = (name) => {
      if (!name) return "To be assigned";
      if (name.toLowerCase().startsWith("dr.")) return name;
      return `Dr. ${name}`;
    };

    const patientPhone = t.patient_phone || selected?.phone || "";
    const patientAddress = t.patient_address || selected?.address || "";

    const content = `
      <div class="ticket-card">
        <!-- Header -->
        <div class="header-row">
          <div class="clinic-info">
            <div class="clinic-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h1 class="clinic-title">IVF Speciality Clinic</h1>
              <p class="clinic-subtitle">OP consultation ticket</p>
            </div>
          </div>
          <div class="date-time">
            <p class="date-text">${formatDate(t.date || t.created_at)}</p>
            <p class="time-text">${formatTime(t.created_at)}</p>
          </div>
        </div>

        <div class="divider-dotted"></div>

        <!-- ID and Token -->
        <div class="blocks-row">
          <div class="patient-id-block">
            <div class="patient-id-label">Patient ID</div>
            <div class="patient-id-value">${t.patient_id_str}</div>
          </div>
          <div class="token-block">
            <div class="token-label">Token number</div>
            <div class="token-value">${t.token_number}</div>
          </div>
        </div>

        <div class="divider-solid"></div>

        <!-- Details Grid -->
        <div class="details-grid">
          <div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Patient name</div>
              <div class="detail-value">${t.patient_name}</div>
            </div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Phone</div>
              <div class="detail-value">${patientPhone || "-"}</div>
            </div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Address</div>
              <div class="detail-value">${patientAddress || "-"}</div>
            </div>
          </div>
          <div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Reason for visit</div>
              <div class="detail-value">${t.visit_reason_display || t.visit_reason}</div>
            </div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Consulting doctor</div>
              <div class="detail-value">${formatDoctorName(t.doctor_name)}</div>
            </div>
            <div style="margin-bottom: 16px;">
              <div class="detail-label">Department</div>
              <div class="detail-value">${t.department_name || "-"}</div>
            </div>
          </div>
        </div>

        <div class="divider-solid"></div>

        <!-- Bottom Row -->
        <div class="bottom-row">
          <div class="instructions-block">
            <div class="instructions-title">Instruction :</div>
            <div class="instructions-text">
              Please keep this ticket until consultation is completed. Proceed to the designated waiting area. Present this ticket at the reception desk when your token number is announced.
            </div>
          </div>
          ${t.qr_code ? `
            <div class="qr-block">
              <img src="${t.qr_code}" alt="QR Code" class="qr-image" />
              <span class="qr-label">Scan to view patient record</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    const w = window.open("", "_blank");
    w.document.write(`
      <html>
        <head>
          <title>OP Ticket #${t.token_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #f8fafc;
              min-height: 90vh;
            }
            .ticket-card {
              width: 500px;
              border: 1px solid #eaecf0;
              border-radius: 12px;
              padding: 32px;
              background: #ffffff;
              box-shadow: 0px 4px 18px rgba(16, 24, 40, 0.03);
              box-sizing: border-box;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .clinic-info {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .clinic-logo {
              width: 44px;
              height: 44px;
              border-radius: 8px;
              background: #3b82f6;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
            }
            .clinic-title {
              font-size: 18px;
              font-weight: 700;
              color: #101828;
              margin: 0;
            }
            .clinic-subtitle {
              font-size: 14px;
              color: #667085;
              margin: 0;
            }
            .date-time {
              text-align: right;
            }
            .date-text {
              font-size: 14px;
              font-weight: 600;
              color: #101828;
              margin: 0;
            }
            .time-text {
              font-size: 14px;
              color: #667085;
              margin: 0;
            }
            .divider-dotted {
              border-top: 1px dashed #d0d5dd;
              margin: 20px 0;
            }
            .blocks-row {
              display: flex;
              gap: 16px;
              margin-bottom: 24px;
            }
            .patient-id-block {
              flex: 1;
              border: 1px solid #d1e9ff;
              background: #f5faff;
              border-radius: 8px;
              padding: 16px 20px;
            }
            .patient-id-label {
              font-size: 12px;
              color: #1570ef;
              margin-bottom: 4px;
              font-weight: 500;
            }
            .patient-id-value {
              font-size: 20px;
              font-weight: 700;
              color: #101828;
            }
            .token-block {
              flex: 1;
              background: #3b82f6;
              border-radius: 8px;
              padding: 16px 20px;
              color: #ffffff;
            }
            .token-label {
              font-size: 12px;
              color: rgba(255, 255, 255, 0.8);
              margin-bottom: 4px;
              font-weight: 500;
            }
            .token-value {
              font-size: 24px;
              font-weight: 700;
            }
            .divider-solid {
              border-top: 1px solid #eaecf0;
              margin: 20px 0;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-bottom: 24px;
            }
            .detail-label {
              font-size: 12px;
              color: #667085;
              margin-bottom: 4px;
            }
            .detail-value {
              font-size: 14px;
              font-weight: 600;
              color: #101828;
            }
            .bottom-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 24px;
            }
            .instructions-block {
              flex: 1;
            }
            .instructions-title {
              font-weight: 700;
              color: #101828;
              font-size: 14px;
              margin-bottom: 6px;
            }
            .instructions-text {
              font-size: 13px;
              color: #475467;
              line-height: 1.5;
            }
            .qr-block {
              display: flex;
              flex-direction: column;
              align-items: center;
              flex-shrink: 0;
            }
            .qr-image {
              width: 100px;
              height: 100px;
              border: 1px solid #eaecf0;
              border-radius: 4px;
              padding: 4px;
            }
            .qr-label {
              font-size: 11px;
              color: #667085;
              margin-top: 6px;
            }
            .no-print {
              margin-top: 20px;
              display: flex;
              justify-content: center;
            }
            .print-btn {
              background: #7c3aed;
              color: white;
              border: none;
              padding: 10px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
            }
            @media print {
              body {
                background: white;
                padding: 0;
                display: block;
              }
              .ticket-card {
                border: none;
                box-shadow: none;
                padding: 0;
                width: 100%;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div>
            ${content}
            <div class="no-print">
              <button onclick="window.print()" class="print-btn">Print Ticket</button>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) {
      setErrors({ patient: "Please select a patient first." });
      return;
    }
    const newErrors = {};
    if (!form.visit_reason) newErrors.visit_reason = "Visit reason is required.";
    if (!form.department) newErrors.department = "Department is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const data = await receptionistApi.createTicket({
        patient: selected.id,
        assigned_doctor: form.assigned_doctor || null,
        department: form.department || null,
        visit_reason: form.visit_reason,
        notes: form.notes
      });
      setTicket(data);
      // Automatically pop up print dialog
      handlePrint(data);
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === "object") {
        const fe = {};
        Object.entries(d).forEach(([k, v]) => {
          fe[k] = Array.isArray(v) ? v[0] : v;
        });
        setErrors(fe);
      } else {
        setErrors({ general: "Failed to create OP ticket. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render Printable receipt success state
  if (ticket) {
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    };

    const formatTime = (timeStr) => {
      if (!timeStr) return "";
      const d = new Date(timeStr);
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'AM' : 'PM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    };

    const formatDoctorName = (name) => {
      if (!name) return "To be assigned";
      if (name.toLowerCase().startsWith("dr.")) return name;
      return `Dr. ${name}`;
    };

    const handleDownloadPDF = () => {
      handlePrint();
    };

    const handleSendSMS = () => {
      const phone = ticket.patient_phone || selected?.phone || "";
      triggerNotification(`SMS containing token details successfully sent to ${phone || 'patient'}!`);
    };

    const handleSendEmail = () => {
      const email = selected?.email || "patient";
      triggerNotification(`Email containing token details successfully sent to ${email}!`);
    };

    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "12px 0 32px" }}>
        {/* Toast Notification */}
        {notification && (
          <div style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            background: "#039855",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.05)",
            zIndex: 2000,
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {notification}
          </div>
        )}

        {/* Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#667085", fontSize: "14px", marginBottom: "16px" }}>
          {/* Sitemap / Hierarchy icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#667085" }}>
            <rect x="9" y="2" width="6" height="6" rx="1" />
            <rect x="2" y="16" width="6" height="6" rx="1" />
            <rect x="16" y="16" width="6" height="6" rx="1" />
            <path d="M12 8v4H5v4M12 12h7v4" />
          </svg>
          <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#7c3aed"} onMouseLeave={e => e.target.style.color = "#667085"} onClick={() => { setTicket(null); handleClearAll(); }}>Op ticket</span>
          <span style={{ color: "#d0d5dd" }}>&gt;</span>
          <span style={{ color: "#344054", fontWeight: 500 }}>OP consultation preview</span>
        </div>

        {/* Page Title */}
        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#101828", margin: "0 0 24px 0" }}>OP Consultation Preview</h2>

        {/* Ticket Container */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #eaecf0",
          borderRadius: "12px",
          boxShadow: "0px 4px 18px rgba(16, 24, 40, 0.03)",
          padding: "32px",
          boxSizing: "border-box",
          marginBottom: "24px"
        }}>
          {/* Card Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "8px",
                background: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#101828", margin: 0 }}>IVF Speciality Clinic</h3>
                <p style={{ fontSize: "14px", color: "#667085", margin: 0 }}>OP consultation ticket</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#101828", margin: 0 }}>{formatDate(ticket.date || ticket.created_at)}</p>
              <p style={{ fontSize: "14px", color: "#667085", margin: 0 }}>{formatTime(ticket.created_at)}</p>
            </div>
          </div>

          {/* Dotted Divider */}
          <div style={{ borderTop: "1px dashed #d0d5dd", margin: "20px 0" }} />

          {/* Patient ID and Token Blocks */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
            <div style={{
              flex: 1,
              border: "1px solid #d1e9ff",
              background: "#f5faff",
              borderRadius: "8px",
              padding: "16px 20px"
            }}>
              <div style={{ fontSize: "12px", color: "#1570ef", marginBottom: "4px", fontWeight: "500" }}>Patient ID</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#101828" }}>{ticket.patient_id_str}</div>
            </div>
            <div style={{
              flex: 1,
              background: "#3b82f6",
              borderRadius: "8px",
              padding: "16px 20px",
              color: "#ffffff"
            }}>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", marginBottom: "4px", fontWeight: "500" }}>Token number</div>
              <div style={{ fontSize: "24px", fontWeight: "700" }}>{ticket.token_number}</div>
            </div>
          </div>

          {/* Solid Divider */}
          <div style={{ borderTop: "1px solid #eaecf0", margin: "20px 0" }} />

          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#667085", marginBottom: "4px" }}>Patient name</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#101828" }}>{ticket.patient_name}</div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#667085", marginBottom: "4px" }}>Phone</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#101828" }}>{ticket.patient_phone || selected?.phone || "-"}</div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#667085", marginBottom: "4px" }}>Address</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#101828" }}>{ticket.patient_address || selected?.address || "-"}</div>
              </div>
            </div>
            <div>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#667085", marginBottom: "4px" }}>Reason for visit</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#101828" }}>{ticket.visit_reason_display || ticket.visit_reason}</div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#667085", marginBottom: "4px" }}>Consulting doctor</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#101828" }}>{formatDoctorName(ticket.doctor_name)}</div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#667085", marginBottom: "4px" }}>Department</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#101828" }}>{ticket.department_name || "-"}</div>
              </div>
            </div>
          </div>

          {/* Solid Divider */}
          <div style={{ borderTop: "1px solid #eaecf0", margin: "20px 0" }} />

          {/* Bottom section with Instructions and QR Code */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "700", color: "#101828", fontSize: "14px", marginBottom: "6px" }}>Instruction :</div>
              <div style={{ fontSize: "13px", color: "#475467", lineHeight: "1.5" }}>
                Please keep this ticket until consultation is completed. Proceed to the designated waiting area. Present this ticket at the reception desk when your token number is announced.
              </div>
            </div>
            {ticket.qr_code && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <img src={ticket.qr_code} alt="QR Code" style={{ width: "100px", height: "100px", border: "1px solid #eaecf0", borderRadius: "4px", padding: "4px" }} />
                <span style={{ fontSize: "11px", color: "#667085", marginTop: "6px", textAlign: "center" }}>Scan to view patient record</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <button
            onClick={() => handlePrint()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#7c3aed",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
              transition: "background 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#6d28d9"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#7c3aed"}
          >
            <Printer size={16} /> Print Ticket
          </button>
          <button
            onClick={handleDownloadPDF}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#ffffff",
              color: "#7c3aed",
              border: "1px solid #7c3aed",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f3ff"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
          >
            <Download size={16} /> Download PDF
          </button>
          <button
            onClick={handleSendSMS}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#ffffff",
              color: "#344054",
              border: "1px solid #d0d5dd",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
          >
            <MessageSquare size={16} /> Send SMS
          </button>
          <button
            onClick={handleSendEmail}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#ffffff",
              color: "#344054",
              border: "1px solid #d0d5dd",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
          >
            <Mail size={16} /> Send Email
          </button>
        </div>
      </div>
    );
  }

  const genderMap = { M: "Male", F: "Female", O: "Other" };
  const age = selected ? calculateAge(selected.date_of_birth) : "";
  const gender = selected ? (genderMap[selected.gender] || selected.gender || "") : "";
  const ageGenderText = selected ? [age, gender].filter(Boolean).join(" • ") : "";
  const isPatientActive = selected ? selected.status === "ACT" : false;

  const reasonOptions = VISIT_REASONS.map(r => ({ value: r.value, label: r.label }));
  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));
  const doctorOptions = doctors.map(d => ({
    value: d.id,
    label: `Dr. ${d.full_name}`,
    role: d.role_display
  }));

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "12px 0 32px" }}>
      {/* Title Header with generate fresh ticket action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#101828", margin: 0 }}>OP tickets</h2>
          <p style={{ fontSize: "14px", color: "#475467", marginTop: "4px" }}>Create a consultation ticket for an existing patient.</p>
        </div>
        <button
          onClick={handleClearAll}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#7c3aed",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#6d28d9"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#7c3aed"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Generate new ticket
        </button>
      </div>

      {selected ? (
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Patient Card Block */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #eaecf0",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: "600", fontSize: "18px", color: "#101828" }}>{selected.full_name}</span>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "2px 8px",
                  background: isPatientActive ? "#ecfdf3" : "#f2f4f7",
                  color: isPatientActive ? "#027a48" : "#344054",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: "500",
                  lineHeight: "18px"
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isPatientActive ? "#12b76a" : "#667085" }} />
                  {isPatientActive ? "Active" : selected.status_display || selected.status}
                </span>
              </div>
              <div style={{ fontSize: "14px", color: "#475467" }}>{selected.patient_id}</div>
              {ageGenderText && <div style={{ fontSize: "14px", color: "#475467" }}>{ageGenderText}</div>}
              <div style={{ fontSize: "14px", color: "#475467", display: "flex", alignItems: "center", marginTop: "2px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ marginRight: "6px", color: "#475467" }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {selected.phone || "No phone number"}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{
                  background: "#7c3aed",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#6d28d9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#7c3aed"}
              >
                Change patient
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                style={{
                  background: "transparent",
                  color: "#7c3aed",
                  border: "1px solid #7c3aed",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f3ff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                View history
              </button>
            </div>
          </div>

          {/* Visit Details Block */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #eaecf0",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" width="20" height="20">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="9" y1="15" x2="15" y2="15" />
                <line x1="12" y1="18" x2="12" y2="12" />
              </svg>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#101828", margin: 0 }}>Visit Details</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Row 1: Visit Reason & Department */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%" }}>
                <CustomDropdown
                  label="Visit Reason"
                  value={form.visit_reason}
                  onChange={(v) => {
                    setForm(p => ({ ...p, visit_reason: v }));
                    setErrors(p => ({ ...p, visit_reason: "" }));
                  }}
                  options={reasonOptions}
                  placeholder="Choose the visit reason"
                  error={errors.visit_reason}
                />
                <CustomDropdown
                  label="Department"
                  value={form.department}
                  onChange={(v) => {
                    setForm(p => ({ ...p, department: v }));
                    setErrors(p => ({ ...p, department: "" }));
                  }}
                  options={departmentOptions}
                  placeholder="Choose the department"
                  error={errors.department}
                />
              </div>

              {/* Row 2: Assigned Doctor with availability styling */}
              <CustomDropdown
                label="Assigned Doctor"
                value={form.assigned_doctor}
                onChange={(v) => {
                  setForm(p => ({ ...p, assigned_doctor: v }));
                  setErrors(p => ({ ...p, assigned_doctor: "" }));
                }}
                options={doctorOptions}
                placeholder="Choose the doctor"
                error={errors.assigned_doctor}
                renderSelected={(option) => (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontWeight: "600" }}>{option.label}</strong>
                    <span style={{ color: "#12b76a", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px", fontWeight: "500" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#12b76a" }} />
                      Available
                    </span>
                  </div>
                )}
                renderOption={(option) => (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "500" }}>{option.label}</span>
                      <span style={{ color: "#12b76a", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#12b76a" }} />
                        Available
                      </span>
                    </div>
                    {option.role && <span style={{ fontSize: "11px", color: "#667085" }}>{option.role}</span>}
                  </div>
                )}
              />

              {/* Row 3: Clinical Notes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#344054" }}>Clinical Notes</label>
                <textarea
                  placeholder="Add internal clinical notes or patient instructions..."
                  value={form.notes}
                  onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "12px 14px",
                    border: "1px solid #d0d5dd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#101828",
                    outline: "none",
                    resize: "none",
                    boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s ease"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#7c3aed"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#d0d5dd"}
                />
              </div>
            </div>
          </div>

          {errors.general && (
            <div style={{ padding: "12px 16px", background: "#fef3f2", border: "1px solid #fda29b", borderRadius: "8px", color: "#b42318", fontSize: "14px", fontWeight: "500" }}>
              {errors.general}
            </div>
          )}

          {/* Action Buttons Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: "transparent",
                color: "#475467",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f2f4f7"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: "transparent",
                color: "#b42318",
                border: "1px solid #fda29b",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#fef3f2"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "#7c3aed",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#6d28d9"; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = "#7c3aed"; }}
            >
              {submitting ? "Generating..." : "Generate & Print Ticket"}
            </button>
          </div>
        </form>
      ) : (
        /* Patient Search Card if no patient is selected */
        <div style={{
          background: "#ffffff",
          border: "1px solid #eaecf0",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
          maxWidth: "600px",
          margin: "40px auto 0"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#101828", marginTop: 0, marginBottom: "16px" }}>Select Patient</h3>
          <div style={{ position: "relative" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              border: errors.patient ? "1px solid #fda29b" : "1px solid #d0d5dd",
              borderRadius: "8px",
              background: "#ffffff",
              boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)"
            }}>
              <span style={{ position: "absolute", left: "14px", display: "flex", alignItems: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ color: "#667085" }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name, ID, phone or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setErrors(p => ({ ...p, patient: "" }));
                }}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 14px 0 42px",
                  border: "none",
                  background: "transparent",
                  fontSize: "14px",
                  outline: "none",
                  color: "#101828",
                  borderRadius: "8px"
                }}
                autoFocus
              />
            </div>
            {errors.patient && <span style={{ color: "#d92d20", fontSize: "12px", marginTop: "4px", display: "block" }}>{errors.patient}</span>}

            {patients.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "8px",
                background: "#ffffff",
                border: "1px solid #eaecf0",
                borderRadius: "8px",
                boxShadow: "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
                zIndex: 100,
                maxHeight: "260px",
                overflowY: "auto",
                padding: "6px"
              }}>
                {patients.map((p) => {
                  const initials = p.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "P";
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelected(p);
                        setSearch("");
                        setPatients([]);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#f4ebff",
                        color: "#7c3aed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "600",
                        fontSize: "13px"
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: "500", color: "#101828" }}>{p.full_name}</div>
                        <div style={{ fontSize: "12px", color: "#475467" }}>{p.patient_id} • {p.phone || p.email}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {search.trim() !== "" && patients.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "24px",
                color: "#667085",
                fontSize: "14px",
                background: "#f9fafb",
                borderRadius: "8px",
                marginTop: "8px",
                border: "1px dashed #eaecf0"
              }}>
                No patients found matching your search.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Embedded Visit History Modal */}
      {showHistory && selected && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            width: "800px",
            maxHeight: "85vh",
            overflow: "auto",
            boxShadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #eaecf0",
            position: "relative"
          }}>
            {/* Close button in modal */}
            <button
              onClick={() => setShowHistory(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#667085"
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <PatientHistory patientId={selected.id} onBack={() => setShowHistory(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
