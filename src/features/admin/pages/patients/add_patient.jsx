import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/Client";
import { TREATMENT_TYPES } from "../../../../utils/constants";

function FormField({label,error,hint,children}) {
	return(
		<div className="form-field">
			<label className="form-label">{label}</label>
			{children}
			{hint && <span className="field-hint">{hint}</span>}
			{error && <span className="field-error">{error}</span>}
		</div>
	);
}

export default function AddPatient() {
	const navigate = useNavigate();
	const [form,setForm] = useState({
		full_name:"",email:"",password:"",phone:"",date_of_birth:"",gender:"",blood_group:"",address:"",emergency_contact_name:"",emergency_contact_phone:"",treatment_type:"",status:"PEN",assigned_doctor_id:"",notes:"",
	});
	const [doctors,setDoctors] = useState([]);
	const [errors,setErrors] = useState({});
	const [submitting,setSubmitting] = useState(false);
	const [success,setSuccess] = useState(false);
	const destination = user?.role === 'REC' ? '/receptionist':'/superadmin/patients';

	useEffect(() => {
		api.get("/patients/doctors/")
			 .then(({data}) => setDoctors(data))
			 .catch(() => {});
	}, []);
	const handleChange = e => {
		const {name,value} = e.target;
		setForm(prev => ({...prev,[name]:value}));
		setErrors(prev => ({...prev,[name]:""}));
	};

	const validate = () => {
		const errs = {};
		if(!form.full_name.trim()) errs.full_name = "Full name is required.";
		if(!form.email.trim()) errs.email = "Email is required.";
		else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email.";
		if (!form.password) errors.password = "Password is required.";
		else if (form.password.length < 6) errs.password = "Minimum 6 characters.";
		return errs;
	};
	
	const handleSubmit = async e => {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length > 0) {setErrors(errs); return;}
		setSubmitting(true);
		try{
			const payload = {...form};
			if (!payload.assigned_doctor_id) delete payload.assigned_doctor_id;
			if (!payload.date_of_birth) delete payload.date_of_birth;

			const {data} = await api.post("/patients/",payload );
			setSuccess(true);
			setTimeout(() => navigate(destination),1500);
		} catch(err) {
			const data = err.response?.data;
			if (data && typeof data === "object") {
				const fieldErrors = {};
				Object.entries(data).forEach(([k,v]) => {fieldErrors[k] = Array.isArray(v)? v[0] : v;});
				setErrors(fieldErrors);
			} else {
				setErrors({general:"Failed to register patient. Please try again."});
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="staff-form-page">
			<div className="form-page-header">
				<button className="btn-back" onClick={() => navigate(destination)} >
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
						<polyline points="15,18,9,12,15,6" />
					</svg>
					Back to Patients
				</button>
				<div className="form-page-titles">
					<h2 className="form-page-title">Register New Patient</h2>
					<p className="form-page-sub">Create a patient account and profile</p>
				</div>
			</div>

			{success && <div className="success-banner">Patient registered successfully! Redirecting to profile...</div>}
			<form onSubmit={handleSubmit} className="staff-form" noValidate>
				{/* Account */}
				<div className="form-card">
					<h3 className="form-section-title">Account Details</h3>
					<div className="form-grid">
						<FormField label="Full Name *" error={errors.full_name}>
							<input className="form-input" name="full_name" value={form.full_name} onChange={handleChange} placeholder="eg: Shravan A C" />
						</FormField>
						<FormField label="Email Address *" error={errors.email}>
							<input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="patient@gmail.com"/>
						</FormField>
						<FormField label="Temporary Password *" error={errors.password} hint="Patient will be prompted to change on first login">
							<input className="form-input" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 Characters" />
						</FormField>
						<FormField label="Phone">
							<input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" />
						</FormField>
					</div>
				</div>

				{/* Personal Info */}
				<div className="form-card">
					<h3 className="form-section-title">Personal Information</h3>
					<div className="form-grid">
						<FormField label="Date of Birth">
							<input className="form-input" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
						</FormField>
						<FormField label="Gender">
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
						<FormField label="Address">
							<input className="form-input" name="address" value={form.address} onChange={handleChange} placeholder="Street, City, State" />
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
								<option value="">--Select Treatment--</option>
								{TREATMENT_TYPES.map(t =>(
									<option key={t.value} value={t.value}>{t.label}</option>
								))}
							</select>
						</FormField>
						<FormField label="Initial Status">
							<select className="form-input" name="status" value={form.status} onChange={handleChange}>
								<option value="PEN">Pending</option>
								<option value="ACT">Active Treatment</option>
								<option value="HOL">On Hold</option>
							</select>
						</FormField>
						<FormField label="Initial Status">
							<select className="form-input" name="assigned_doctor_id" value={form.assigned_doctor_id} onChange={handleChange}>
								<option value="">--Select Doctor--</option>
								{doctors.map(d =>(
									<option key={d.id} value={d.id}>{d.full_name} {d.full_name} ({d.role})</option>
								))}
							</select>
						</FormField>
						<FormField label="Notes">
							<textarea className="form-input" name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Any initial notes..." />
						</FormField>
					</div>
				</div>
				{errors.general && <div className="error-banner">{errors.general}</div>}
				<div className="form-actions">
					<button type="button" className="btn-secondary" onClick={() => navigate(destination)} disabled={submitting}>Cancel</button>
					<button type="submit" className="btn-primary" disabled={submitting}>
						{submitting? "Registering...":"Register Patient"}
					</button>
				</div>
			</form>
		</div>
	);
}