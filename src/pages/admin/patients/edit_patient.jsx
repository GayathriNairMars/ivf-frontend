import { useState,useEffect } from "react";
import { useNavigate,useParams } from "react-router-dom";
import patientApi from "../../../api/patientApi";
import { TREATMENT_TYPES } from "../../../constants/constants";
import "./patient.css"
import "../staff/staff.css"


function FormField({label,error,children}) {
	return(
		<div className="form-field">
			<label className="form-label">{label}</label>
				{children}
				{error && <span className="field-error">{error}</span>}
		</div>
	);
}

export default function EditPatient() {
	const {id} = useParams();
	const navigate =useNavigate();
	const [patient,setPatient] = useState(null);
	const [loading,setLoading] = useState(true);
	const [form,setForm] = useState({});
	const [doctors,setDoctors] = useState([]);
	const [allPatients,setAllPatients] = useState([]);
	const [partnerSearch,setPartnerSearch] = useState("");
	const [errors,setErrors] = useState({});
	const [submitting,setSubmitting] = useState(false);
	const [success,setSuccess] = useState(false);

	useEffect(() => {
		Promise.all([
			patientApi.getPatientDetails(id),
			patientApi.getDoctors(),
			patientApi.getPatients(),
		]).then(([patient, doctors, allPatients]) => {
  		setPatient(patient);
  		setForm({
  		  phone:                    patient.phone || "",
  		  date_of_birth:            patient.date_of_birth || "",
  		  gender:                   patient.gender || "",
  		  blood_group:              patient.blood_group || "",
  		  address:                  patient.address || "",
  		  emergency_contact_name:   patient.emergency_contact_name || "",
  		  emergency_contact_phone:  patient.emergency_contact_phone || "",
  		  treatment_type:           patient.treatment_type || "",
  		  status:                   patient.status || "",
  		  assigned_doctor_id:       patient.assigned_doctor_id || "",
  		  notes:                    patient.notes || "",
  		});
  		setDoctors(doctors);
  		setAllPatients(allPatients.filter(ap => ap.id !== parseInt(id)));
		}).catch(() => navigate("/superadmin/patients"))
		.finally(() => setLoading(false));
	}, [id]);

	const handleChange = e => {
		const {name,value} =e.target;
		setForm(prev => ({...prev,[name]:value}));
		setErrors(prev => ({...prev,[name]:""}));
	};
	const handleSubmit = async e =>{
		e.preventDefault();
		setSubmitting(true);
		try{
			const payload = {...form};
			if (!payload.assigned_doctor_id) delete payload.assigned_doctor_id;
			if(!payload.date_of_birth) delete payload.date_of_birth;
			await patientApi.updatePatient(id, payload);
			setSuccess(true);
			setTimeout(() => navigate(`/superadmin/patients/${id}`),1500);
		} catch(err) {
			const data = err.response?.data;
			if (data &&typeof data === 'object') {
				const fieldErrors = {};
				Object.entries(data).forEach(([k,v]) =>{fieldErrors[k] = Array.isArray(v)? v[0] : v;});
				setErrors(fieldErrors);
			} else {
				setErrors({general : "Failed to update patient."});
			}
		} finally {
			setSubmitting(false);
		}
	};
	const handleLinkPartner = async (partnerId) =>{
		try {
			await patientApi.linkPartner(id, partnerId);
			const partner = allPatients.find(p => p.id === partnerId);
			setPatient(prev => ({
				...prev,
				partner_info:{
					id: partnerId,
					patient_id: partner?.patient_id,
					full_name: partner?.user?.full_name,
					email: partner?.user?.email,
				}
			}));
		} catch(err) {
			const msg = err.response?.data?.detail || err.response?.data?.error;
			if (msg) {
				setErrors({general:msg})
			} else {
				setErrors({general:"Failed to link partner."});
			}
		}
	};

	const handleUnlinkPartner = async () => {
		try {
			await patientApi.unlinkPartner(id);
			setPatient(prev => ({...prev,partner_info:null}));
		} catch {
			alert("Failed to unlink partner.")
		}
	};

	if (loading) return <div className="staff-loading"><div className="spinner" /><span>Loading...</span></div>;
	if (!patient) return null;

	const filteredPartners = allPatients.filter(p => {
		if (!p.user) return false;
		if (!partnerSearch) return true;
		return(
			p.user?.full_name?.toLowerCase().includes(partnerSearch.toLowerCase()) ||
			p.patient_id?.toLowerCase().includes(partnerSearch.toLowerCase())
			);
		}).slice(0,8);

	return(
		<div className="staff-form-page">
			<div className="form-page-header">
				<button className="btn-back" onClick={() => navigate(`/superadmin/patients`)}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
						<polyline points ="15,18,9,12,15,6" />
					</svg>
					Back To Profile
				</button>
				<div className="form-page-titles">
					<h2 className="form-page-title">Edit Patient</h2>
					<p className="form-page-sub">Updating {patient.user?.full_name} - {patient.patient_id}</p>
				</div>
			</div>
			{success && <div className="success-banner">✅ Patient updated successfully!</div>}
			<form onSubmit={handleSubmit} className="staff-form" noValidate>
				{/* Personal Info */}
				<div className="form-card">
					<h3 className="form-section-title">Personal Information</h3>
					<div className="form-grid">
						<FormField label="Phone " error={errors.phone}>
							<input className="form-input"
							name="phone"
							value={form.phone} 
							onChange={handleChange} />
						</FormField>
						<FormField label="Date of Birth ">
							<input className="form-input" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
						</FormField>
						<FormField label="Gender ">
							<select className="form-input" name="gender" value={form.gender} onChange={handleChange}>
								<option value="">--Select--</option>
								<option value="M">Male</option>
								<option value="F">Female</option>
								<option value="O">Other</option>
							</select>
						</FormField>
						<FormField label="Blood Group">
							<select className="form-input" name="blood_group" value={form.blood_group} onChange={handleChange}>
								<option value="">--Select--</option>
								{["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => (
									<option key={bg} value={bg}>{bg}</option>
								))}
							</select>
						</FormField>
						<FormField label="Address" error={errors.address}>
							<input className="form-input" name="address" value={form.address} onChange={handleChange} />
						</FormField>
						<FormField label="Emergency Contact Name">
							<input className="form-input" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} />
						</FormField>
						<FormField label="Emergency Contact Phone">
							<input className="form-input" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} />
						</FormField>
					</div>
				</div>
				{/* Treatment */}
        <div className="form-card">
          <h3 className="form-section-title">Treatment Details</h3>
          <div className="form-grid">
            <FormField label="Treatment Type">
              <select className="form-input" name="treatment_type" value={form.treatment_type} onChange={handleChange}>
                <option value="">— Select —</option>
                {TREATMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select className="form-input" name="status" value={form.status} onChange={handleChange}>
                <option value="PEN">Pending</option>
                <option value="ACT">Active Treatment</option>
                <option value="HOL">On Hold</option>
                <option value="COM">Completed</option>
                <option value="CAN">Cancelled</option>
              </select>
            </FormField>
            <FormField label="Assigned Doctor">
              <select className="form-input" name="assigned_doctor_id" value={form.assigned_doctor_id} onChange={handleChange}>
                <option value="">— None —</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.role})</option>)}
              </select>
            </FormField>
            <FormField label="Notes">
              <textarea className="form-input" name="notes" value={form.notes} onChange={handleChange} rows={3} />
            </FormField>
          </div>
        </div>
 
        {/* Partner Linkage */}
        <div className="form-card">
          <h3 className="form-section-title">Partner / Couple Linkage</h3>
          {patient.partner_info ? (
            <div className="partner-linked">
              <div className="staff-name-cell">
                <div className="staff-avatar" style={{ background: "#ec4899" }}>
                  {patient.partner_info.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <div className="staff-name">{patient.partner_info.full_name}</div>
                  <div className="email-cell">{patient.partner_info.patient_id} · {patient.partner_info.email}</div>
                </div>
              </div>
              <button type="button" className="btn-secondary" style={{ fontSize: "0.8rem" }} onClick={handleUnlinkPartner}>
                Unlink Partner
              </button>
            </div>
          ) : (
            <>
              <p className="field-hint" style={{ marginBottom: 12 }}>Search and link a partner patient for couple treatment.</p>
              <input className="link-form-input" type="text" placeholder="Search by name or patient ID…"
                value={partnerSearch} onChange={e => setPartnerSearch(e.target.value)} style={{ marginBottom: 12 }} />
              {partnerSearch && (
                <div className="partner-search-results">
                  {filteredPartners.length === 0 ? (
                    <p className="field-hint">No patients found.</p>
                  ) : filteredPartners.map(p => (
                    <div key={p.id} className="partner-result-row">
                      <div className="staff-name-cell">
                        <div className="staff-avatar" style={{ background: "#0ea5e9", width: 30, height: 30, fontSize: "0.7rem" }}>
                          {p.user?.full_name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div>
                          <div className="staff-name" style={{ fontSize: "0.85rem" }}>{p.user?.full_name}</div>
                          <div className="email-cell">{p.patient_id}</div>
                        </div>
                      </div>
                      <button type="button" className="btn-edit" onClick={() => handleLinkPartner(p.id)}>
                        Link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
 
        {errors.general && <div className="error-banner">{errors.general}</div>}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(`/superadmin/patients/`)} disabled={submitting}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}