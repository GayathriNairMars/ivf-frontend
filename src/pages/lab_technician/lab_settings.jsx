import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import labApi from "../../api/labApi";
import "./lab_settings.css";
import { Edit2, Calendar, LogIn, BarChart2, Clock, Info, ShieldAlert, Trash2 } from "lucide-react";
import arathyAvatar from "../../assets/arathy_avatar.png";

export default function LabSettings() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("Profile");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    specialization: "",
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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await labApi.getProfile();
      if (res.success) {
        setProfile(res.profile);
        setFormData({
          full_name: res.profile.full_name || "",
          email: res.profile.email || "",
          specialization: res.profile.specialization || "",
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
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setMessage({ type: "error", text: "Full Name and Email Address are required." });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      const res = await labApi.updateProfile(formData);
      if (res.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setProfile(res.profile || { ...profile, ...formData });
      } else {
        setMessage({ type: "error", text: res.message || "Failed to update profile." });
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error updating profile. Please try again.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelProfile = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        specialization: profile.specialization || "",
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
      const res = await labApi.updateProfile({
        old_password: securityData.old_password,
        new_password: securityData.new_password,
      });
      if (res.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setSecurityData({ old_password: "", new_password: "", confirm_password: "" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed to update password." });
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error updating password. Please verify current password.";
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
      const res = await labApi.deleteProfile();
      if (res.success) {
        // Logout user and redirect
        await logout("lab/logout/");
        window.location.href = "/lab-login";
      } else {
        setMessage({ type: "error", text: res.message || "Failed to deactivate profile." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Error deactivating profile. Please try again later." });
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  // Helper function to calculate active tenure from assign date
  const getActiveTenure = (dateStr) => {
    if (!dateStr) return "N/A";
    const assignedDate = new Date(dateStr);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - assignedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} Day${diffDays > 1 ? "s" : ""}`;
    }
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} Month${diffMonths > 1 ? "s" : ""}`;
    }
    const diffYears = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    return `${diffYears} Yr${diffYears > 1 ? "s" : ""} ${remainingMonths} Mo${remainingMonths > 1 ? "s" : ""}`;
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateStr).toLocaleDateString(undefined, options);
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
                    {profile.role_display || "Lab Technician"} • ID: {profile.employee_id || "N/A"}
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
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={saving}
                    placeholder="Enter email address"
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
                    placeholder="e.g. Hematology, Pathology"
                  />
                </div>

                <div className="ls-form-group">
                  <label>Role</label>
                  <input type="text" value={profile.role_display || "Lab Technician"} disabled />
                </div>

                <div className="ls-form-group">
                  <label>Employee ID</label>
                  <input type="text" value={profile.employee_id || ""} disabled />
                </div>

                <div className="ls-form-group">
                  <label>Technical Certification</label>
                  <input
                    type="text"
                    value={profile.technical_certification || "None Specified"}
                    disabled
                  />
                </div>

                <div className="ls-form-group">
                  <label>Department Head</label>
                  <input type="text" value={profile.is_department_head ? "Yes" : "No"} disabled />
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
            <h3>Platform Usage</h3>
            <div className="ls-usage-list">
              <div className="ls-usage-item">
                <div className="ls-usage-icon">
                  <Calendar size={16} />
                </div>
                <div className="ls-usage-details">
                  <span className="ls-usage-label">Member Since</span>
                  <span className="ls-usage-value">{formatDate(profile.date_assigned)}</span>
                </div>
              </div>
              <div className="ls-usage-item">
                <div className="ls-usage-icon">
                  <LogIn size={16} />
                </div>
                <div className="ls-usage-details">
                  <span className="ls-usage-label">Last Login</span>
                  <span className="ls-usage-value">Today, 10:30 AM</span>
                </div>
              </div>
              <div className="ls-usage-item">
                <div className="ls-usage-icon">
                  <BarChart2 size={16} />
                </div>
                <div className="ls-usage-details">
                  <span className="ls-usage-label">Total Logins</span>
                  <span className="ls-usage-value">156</span>
                </div>
              </div>
              <div className="ls-usage-item">
                <div className="ls-usage-icon">
                  <Clock size={16} />
                </div>
                <div className="ls-usage-details">
                  <span className="ls-usage-label">Active Tenure</span>
                  <span className="ls-usage-value">{getActiveTenure(profile.date_assigned)}</span>
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
              <li>Assigned to Lab Department</li>
              <li>Updated certification profile</li>
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
