//REC edits basic patient info

import { useState } from "react";
import receptionistApi from "../../api/receptionistApi";

function Field({label,error,children}) {
	return (
		<div className="form-field">
			<label className="form-label">{label}</label>
			{children}
			{error && <span className="field-error">{error}</span>}
		</div>
	);
}

export default function PatientEditModal({patient,onClose,onSaved}) {
	const [form,setForm] = useState({
		phone: patient.phone || "",
		date_of_birth: patient.date_of_birth || "",
		gender: patient.gender || "",
		blood_group: patient.blood_group || "",
		address: patient.address || "",
		emergency_contact_name: patient.emergency_contact_name || "",
		emergency_contact_phone: patient.emergency_contact_phone || "",
	});
	const [errors,setErrors] = useState({});
	const [submitting,setSubmitting] = useState(false);
	const [success,setSuccess] = useState(false);

	const handleChange = e => {
		const {name,value} = e.target;
		setForm(prev => ({...prev,[name]:value}));
		setErrors(prev =>({...prev,[name]:""}));
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setSubmitting(true);
		try {
			await receptionistApi.updatePatient(patient.id, form);
			setSuccess(true);
			setTimeout(onSaved,1000);
		} catch (err) {
			const data = err.response?.data;
			if (data && typeof data ==="object") {
				const fe = {};
				Object.entries(data).forEach(([k,v]) => {fe[k] = Array.isArray(v)? v[0] : v;});
				setErrors(fe);
			} else {
				setErrors({general:"Failed to update. Please try again."});
			}
		} finally {setSubmitting(false);}
	};
	return (
		<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,}}>
			<div style={{background:"var(--surface)",borderRadius:12,padding:28,width:580,maxHeight:"85vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",}}>
			{/* Header */}
			<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
				<div>
					<h3 style={{margin:0}}>Edit Patient Info</h3>
					<p style={{margin:"4px 0 0", fontSize:"0.8rem",color:"var(--text-2)"}}>
						{patient.full_name} - {patient.patient_id}
					</p>
				</div>
				<button className="btn-secondary" onClick={onClose} style={{fontSize:"0.8rem"}}>Close</button>
				</div> 
				{success && <div className="success-banner" style={{marginBottom:16}}>Patient updated successfully!</div> }
				<form onSubmit={handleSubmit} noValidate>
					<div className="form-grid">
						<Field label="Phone" error={errors.phone}>
							<input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeeholder="e.g. 9876543210" />
						</Field>
						<Field label="Date of Birth" error={errors.date_of_birth}>
							<input className="form-input" type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
						</Field>
						<Field label="Gender" error={errors.gender}>
							<select className="form-input" name="gender" value={form.gender} onChange={handleChange}>
								<option value="">-Select-</option>
								<option value="M">Male</option>
								<option value="F">Female</option>
								<option value="O">Other</option>
							</select>
						</Field>
						<Field label="Blood Group" error={errors.blood_group}>
							<select className="form-input" name="blood_group" value={form.blood_group} onChange={handleChange}>
								<option value="">-Select-</option>
								{["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => (
									<option key={bg} value={bg}>{bg}</option>
								))}
							</select>
						</Field>
						<Field label="Address" error={errors.address}>
							<input className="form-input" name="address" value={form.address} onChange={handleChange} placeholder="Full Address" />
						</Field>
						<Field label="Emergency Contact Name" error={errors.emergency_contact_name}>
							<input className="form-input" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} />
						</Field>
						<Field label="Emergency Contact phone" error={errors.emergency_contact_phone}>
							<input className="form-input" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} />
						</Field>
					</div>
					{errors.general && <div className="error-banner" style={{marginTop:12}}>{errors.general}</div>}
					<div className="form-actions" style={{marginTop:20}}>
						<button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
						<button type="submit" className="btn-primary" disabled={submitting}>
							{submitting ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}