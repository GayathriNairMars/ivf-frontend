import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { embryologistApi } from "../../api/cryoApi";
import "./settings.css";
import { Edit2, Calendar, LogIn, BarChart2, Clock, Info, ShieldAlert, Trash2 } from "lucide-react";
import arathyAvatar from "../../assets/arathy_avatar.png";

export default function EmbryologistSettings() {
	const { logout } = useAuth();
	const [activeTab, setActiveTab] = useState("Profile");
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// Profile Form State — matches the actual /embryology/profile/ response
	// (full_name, contact_number, specialization, years_of_experience).
	// There is no email/employee_id/role_display/etc. in this API's response.
	const [formData, setFormData] = useState({
		full_name: "",
		contact_number: "",
		specialization: "",
		years_of_experience: "",
	});

	// Security Password Form State
	const [securityData, setSecurityData] = useState({
		old_password: "",
		new_password: "",
		confirm_password: "",
	});

	useEffect(() => {
		fetchProfile();
	}, []);

	// The API wraps the real payload as { success, data: { user, profile } }.
	// user carries identity fields (full_name, email, role_display, is_active,
	// date_joined); profile carries the embryologist-specific fields
	// (employee_id, contact_number, specialization, years_of_experience).
	// We merge both into one flat object for the UI.
	const mergeProfilePayload = (payload) => {
		if (!payload || !payload.data) return null;
		const { user = {}, profile: prof = {} } = payload.data;
		return { ...user, ...prof };
	};

	const fetchProfile = async () => {
		try {
			setLoading(true);
			setMessage(null);
			const res = await embryologistApi.getProfile();
			const merged = mergeProfilePayload(res);
			if (res?.success && merged) {
				setProfile(merged);
				setFormData({
					full_name: merged.full_name || "",
					contact_number: merged.contact_number || "",
					specialization: merged.specialization || "",
					years_of_experience: merged.years_of_experience ?? "",
				});
			} else {
				setMessage({ type: "error", text: "Failed to load profile data." });
			}
		} catch (err) {
			console.error(err);
			setMessage({ type: "error", text: "Error fetching profile. Please try again later." });
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSecurityChange = (e) => {
		const { name, value } = e.target;
		setSecurityData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSaveProfile = async (e) => {
		e.preventDefault();
		if (!formData.full_name.trim()) {
			setMessage({ type: "error", text: "Full Name is required." });
			return;
		}

		try {
			setSaving(true);
			setMessage(null);
			const res = await embryologistApi.updateProfile(formData);
			const merged = mergeProfilePayload(res);
			setMessage({ type: "success", text: "Profile updated successfully!" });
			setProfile(merged || { ...profile, ...formData });
		} catch (err) {
			console.error(err);
			const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Error updating profile. Please try again.";
			setMessage({ type: "error", text: errorMsg });
		} finally {
			setSaving(false);
		}
	};

	const handleCancelProfile = () => {
		if (profile) {
			setFormData({
				full_name: profile.full_name || "",
				contact_number: profile.contact_number || "",
				specialization: profile.specialization || "",
				years_of_experience: profile.years_of_experience ?? "",
			});
			setMessage(null);
		}
	};

	const handleSaveSecurity = async (e) => {
		e.preventDefault();
		if (!securityData.old_password || !securityData.new_password) {
			setMessage({ type: "error", text: "Both current password and new password are required." });
			return;
		}
		if (securityData.new_password !== securityData.confirm_password) {
			setMessage({ type: "error", text: "New passwords do not match." });
			return;
		}

		try {
			setSaving(true);
			setMessage(null);
			// Use the dedicated change-password endpoint (not updateProfile) —
			// it expects old_password, new_password, AND confirm_password.
			await embryologistApi.changePassword({
				old_password: securityData.old_password,
				new_password: securityData.new_password,
				confirm_password: securityData.confirm_password,
			});
			setMessage({ type: "success", text: "Password changed successfully!" });
			setSecurityData({ old_password: "", new_password: "", confirm_password: "" });
		} catch (err) {
			console.error(err);
			const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Error updating password. Please verify current password.";
			setMessage({ type: "error", text: errorMsg });
		} finally {
			setSaving(false);
		}
	};

	const handleCancelSecurity = () => {
		setSecurityData({ old_password: "", new_password: "", confirm_password: "" });
		setMessage(null);
	};

	const handleDeleteProfile = async () => {
		try {
			setSaving(true);
			setMessage(null);
			await embryologistApi.deleteProfile();
			// This is the Embryologist portal — logout/redirect must point here,
			// not to the lab-tech portal.
			await logout("embryology/logout/");
			window.location.href = "/embryologist-login";
		} catch (err) {
			console.error(err);
			const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Error deactivating profile. Please try again later.";
			setMessage({ type: "error", text: errorMsg });
		} finally {
			setSaving(false);
			setShowDeleteConfirm(false);
		}
	};

	if (loading) {
		return <div className="ls-loading">Loading settings profile...</div>;
	}

	if (!profile) {
		return (
			<div className="ls-loading ls-error-load">
				<p>{message?.text || "Could not retrieve profile data."}</p>
				<button onClick={fetchProfile} className="ls-btn-save" style={{ marginTop: "1rem" }}>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="ls-root">
			<h1 className="ls-page-title">Account Settings</h1>

			{message && (
				<div className={`ls-alert ls-alert-${message.type}`}>
					<Info size={16} />
					<span>{message.text}</span>
				</div>
			)}

			<div className="ls-tabs">
				<button
					className={`ls-tab ${activeTab === "Profile" ? "active" : ""}`}
					onClick={() => {
						setActiveTab("Profile");
						setMessage(null);
					}}
				>
					<span className="material-symbols-outlined ls-tab-icon">person</span> Profile
				</button>
				<button
					className={`ls-tab ${activeTab === "Security" ? "active" : ""}`}
					onClick={() => {
						setActiveTab("Security");
						setMessage(null);
					}}
				>
					<span className="material-symbols-outlined ls-tab-icon">security</span> Security
				</button>
			</div>

			<div className="ls-content">
				<div className="ls-main-panel">
					{activeTab === "Profile" ? (
						<form onSubmit={handleSaveProfile}>
							<div className="ls-profile-header">
								<div className="ls-avatar-wrapper">
									<img src={arathyAvatar} alt="Profile" className="ls-avatar" />
									<button type="button" className="ls-edit-avatar-btn" title="Change Avatar (disabled)">
										<Edit2 size={12} />
									</button>
								</div>
								<div className="ls-header-info">
									<h2>{profile.full_name}</h2>
									<p>
										{profile.role_display || "Embryologist"} • ID: {profile.employee_id || "N/A"}
									</p>
								</div>
							</div>

							<div className="ls-form-grid">
								<div className="ls-form-group">
									<label htmlFor="full_name">Full Name</label>
									<input
										id="full_name"
										name="full_name"
										type="text"
										value={formData.full_name}
										onChange={handleInputChange}
										disabled={saving}
										placeholder="Enter full name"
									/>
								</div>

								<div className="ls-form-group">
									<label htmlFor="contact_number">Contact Number</label>
									<input
										id="contact_number"
										name="contact_number"
										type="text"
										value={formData.contact_number}
										onChange={handleInputChange}
										disabled={saving}
										placeholder="Enter contact number"
									/>
								</div>

								<div className="ls-form-group">
									<label htmlFor="specialization">Specialization</label>
									<input
										id="specialization"
										name="specialization"
										type="text"
										value={formData.specialization}
										onChange={handleInputChange}
										disabled={saving}
										placeholder="e.g. Senior Embryologist & ICSI Specialist"
									/>
								</div>

								<div className="ls-form-group">
									<label htmlFor="years_of_experience">Years of Experience</label>
									<input
										id="years_of_experience"
										name="years_of_experience"
										type="number"
										min="0"
										value={formData.years_of_experience}
										onChange={handleInputChange}
										disabled={saving}
										placeholder="e.g. 10"
									/>
								</div>

								<div className="ls-form-group">
									<label>Email Address</label>
									<input type="text" value={profile.email || ""} disabled />
								</div>

								<div className="ls-form-group">
									<label>Role</label>
									<input type="text" value={profile.role_display || ""} disabled />
								</div>

								<div className="ls-form-group">
									<label>Employee ID</label>
									<input type="text" value={profile.employee_id || "N/A"} disabled />
								</div>

								<div className="ls-form-group">
									<label>Account Status</label>
									<input type="text" value={profile.is_active ? "Active" : "Inactive"} disabled />
								</div>
							</div>

							<div className="ls-form-actions">
								<button
									type="button"
									className="ls-btn-cancel"
									onClick={handleCancelProfile}
									disabled={saving}
								>
									Cancel
								</button>
								<button type="submit" className="ls-btn-save" disabled={saving}>
									{saving ? "Saving..." : "Save Changes"}
								</button>
							</div>

							<div className="ls-danger-zone">
								<div className="ls-danger-info">
									<h3>Danger Zone</h3>
									<p>
										Deactivating your account will disable your login. This profile cannot be recovered
										directly by you.
									</p>
								</div>
								<button
									type="button"
									className="ls-btn-danger"
									onClick={() => setShowDeleteConfirm(true)}
									disabled={saving}
								>
									<Trash2 size={16} /> Deactivate Profile
								</button>
							</div>
						</form>
					) : (
						<form onSubmit={handleSaveSecurity}>
							<div className="ls-profile-header">
								<div className="ls-avatar-wrapper ls-security-shield">
									<span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#0d9488" }}>
										lock
									</span>
								</div>
								<div className="ls-header-info">
									<h2>Security Credentials</h2>
									<p>Manage your password and authentication settings</p>
								</div>
							</div>

							<div className="ls-security-form">
								<div className="ls-form-group">
									<label htmlFor="old_password">Current Password</label>
									<input
										id="old_password"
										name="old_password"
										type="password"
										value={securityData.old_password}
										onChange={handleSecurityChange}
										disabled={saving}
										placeholder="Enter current password"
									/>
								</div>

								<div className="ls-form-group">
									<label htmlFor="new_password">New Password</label>
									<input
										id="new_password"
										name="new_password"
										type="password"
										value={securityData.new_password}
										onChange={handleSecurityChange}
										disabled={saving}
										placeholder="Enter new password"
									/>
								</div>

								<div className="ls-form-group">
									<label htmlFor="confirm_password">Confirm New Password</label>
									<input
										id="confirm_password"
										name="confirm_password"
										type="password"
										value={securityData.confirm_password}
										onChange={handleSecurityChange}
										disabled={saving}
										placeholder="Confirm new password"
									/>
								</div>
							</div>

							<div className="ls-form-actions" style={{ marginTop: "32px" }}>
								<button
									type="button"
									className="ls-btn-cancel"
									onClick={handleCancelSecurity}
									disabled={saving}
								>
									Cancel
								</button>
								<button type="submit" className="ls-btn-save" disabled={saving}>
									{saving ? "Updating..." : "Update Password"}
								</button>
							</div>
						</form>
					)}
				</div>

				<div className="ls-side-panel">
					<div className="ls-card ls-card-accent">
						<h3>Profile Snapshot</h3>
						<div className="ls-usage-list">
							<div className="ls-usage-item">
								<div className="ls-usage-icon">
									<Calendar size={16} />
								</div>
								<div className="ls-usage-details">
									<span className="ls-usage-label">Member Since</span>
									<span className="ls-usage-value">
										{profile.date_joined
											? new Date(profile.date_joined).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
											: "N/A"}
									</span>
								</div>
							</div>
							<div className="ls-usage-item">
								<div className="ls-usage-icon">
									<BarChart2 size={16} />
								</div>
								<div className="ls-usage-details">
									<span className="ls-usage-label">Years of Experience</span>
									<span className="ls-usage-value">{profile.years_of_experience ?? "N/A"}</span>
								</div>
							</div>
							<div className="ls-usage-item">
								<div className="ls-usage-icon">
									<Calendar size={16} />
								</div>
								<div className="ls-usage-details">
									<span className="ls-usage-label">Specialization</span>
									<span className="ls-usage-value">{profile.specialization || "N/A"}</span>
								</div>
							</div>
							<div className="ls-usage-item">
								<div className="ls-usage-icon">
									<LogIn size={16} />
								</div>
								<div className="ls-usage-details">
									<span className="ls-usage-label">Contact Number</span>
									<span className="ls-usage-value">{profile.contact_number || "N/A"}</span>
								</div>
							</div>
						</div>
					</div>

					<div className="ls-card">
						<h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
							<Info size={16} /> Recent Activity
						</h3>
						<ul className="ls-activity-list">
							<li>Logged attendance today</li>
							<li>Assigned to Embryology Department</li>
							<li>Updated specialization profile</li>
						</ul>
					</div>
				</div>
			</div>

			{showDeleteConfirm && (
				<div className="ls-modal-overlay">
					<div className="ls-modal-content">
						<div className="ls-modal-header">
							<ShieldAlert size={24} className="ls-danger-icon" />
							<h2>Confirm Deactivation</h2>
						</div>
						<div className="ls-modal-body">
							<p>
								Are you absolutely sure you want to deactivate your profile <strong>{profile.full_name}</strong>?
							</p>
							<p style={{ marginTop: "8px", fontSize: "13px", color: "#64748b" }}>
								This action is irreversible. You will be logged out and will no longer be able to log in to this portal.
							</p>
						</div>
						<div className="ls-modal-actions">
							<button
								type="button"
								className="ls-btn-modal-cancel"
								onClick={() => setShowDeleteConfirm(false)}
								disabled={saving}
							>
								No, Keep Profile
							</button>
							<button
								type="button"
								className="ls-btn-modal-confirm"
								onClick={handleDeleteProfile}
								disabled={saving}
							>
								{saving ? "Deactivating..." : "Yes, Deactivate"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}