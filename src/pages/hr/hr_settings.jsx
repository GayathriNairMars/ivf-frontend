import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import "./hr_settings.css";

// SVG Icons
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const CheckCircle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const XCircle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const LockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BuildingIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;

export default function HRSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", contact_number: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [passForm, setPassForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("hr/profile/");
      if (res.data.success) {
        setProfile(res.data.profile);
        setEditForm({
          name: res.data.profile.name || "",
          email: res.data.profile.email || "",
          contact_number: res.data.profile.contact_number || ""
        });
      } else {
        setError("Failed to load profile data.");
      }
    } catch (err) {
      setError("Error fetching profile. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handlePassChange = (e) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const res = await api.put("hr/profile/", editForm);
      if (res.data.success) {
        setProfile(res.data.profile);
        setIsEditing(false);
        showMessage("Profile updated successfully!");
      } else {
        showMessage("Failed to update profile.", "error");
      }
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to update profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm_password) {
      showMessage("New passwords do not match.", "error");
      return;
    }
    if (passForm.new_password.length < 8) {
      showMessage("Password must be at least 8 characters.", "error");
      return;
    }

    try {
      setIsChangingPass(true);
      const res = await api.post("hr/change-password/", {
        old_password: passForm.old_password,
        new_password: passForm.new_password,
        confirm_password: passForm.confirm_password
      });
      if (res.data.success || res.status === 200) {
        showMessage("Password changed successfully!");
        setPassForm({ old_password: "", new_password: "", confirm_password: "" });
      }
    } catch (err) {
      showMessage(err.response?.data?.error || "Failed to change password.", "error");
    } finally {
      setIsChangingPass(false);
    }
  };

  if (loading) return <div className="hrs-loading">Loading Profile Data...</div>;
  if (error) return <div className="hrs-loading" style={{ color: "#ef4444" }}>{error}</div>;
  if (!profile) return null;

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : "HR";
  };

  return (
    <div className="hr-settings-root">
      {msg && (
        <div className={`hrs-message ${msg.type}`}>
          {msg.text}
        </div>
      )}

      {/* Header Profile Card */}
      <div className="hrs-header-card">
        <div className="hrs-header-left">
          <div className="hrs-avatar-large">
            {getInitials(profile.name)}
          </div>
          <div className="hrs-user-details">
            <h1>
              {profile.name}
              {profile.is_active && <span className="hrs-badge-active">● Active</span>}
            </h1>
            <p className="hrs-role-text">
              {profile.is_department_head ? "Head of Department" : "HR Representative"}
            </p>
            <div className="hrs-meta-info">
              <span className="hrs-meta-item">
                <LockIcon /> Employee ID: <strong>{profile.employee_id}</strong>
              </span>
              <span className="hrs-meta-item">
                <UserIcon /> Username: <strong>{profile.name}</strong>
              </span>
            </div>
          </div>
        </div>
        {!isEditing && (
          <button className="hrs-edit-btn" onClick={() => setIsEditing(true)}>
            <EditIcon /> Edit Profile
          </button>
        )}
      </div>

      <div className="hrs-grid">
        {/* Left Column */}
        <div className="hrs-left-col">
          {/* Personal Information */}
          <div className="hrs-card">
            <div className="hrs-card-header">
              <div className="hrs-card-title"><UserIcon /> Personal Information</div>
            </div>
            
            {isEditing ? (
              <div className="hrs-edit-form">
                <div className="hrs-form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" value={editForm.name} onChange={handleEditChange} />
                </div>
                <div className="hrs-form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" value={editForm.email} onChange={handleEditChange} />
                </div>
                <div className="hrs-form-group">
                  <label>Contact Number</label>
                  <input type="text" name="contact_number" value={editForm.contact_number} onChange={handleEditChange} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="hrs-cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                  <button className="hrs-save-btn" onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hrs-info-grid">
                <div className="hrs-info-item">
                  <span className="hrs-info-label">Full Name</span>
                  <span className="hrs-info-value">{profile.name}</span>
                </div>
                <div className="hrs-info-item">
                  <span className="hrs-info-label">Email Address</span>
                  <span className="hrs-info-value">{profile.email}</span>
                </div>
                <div className="hrs-info-item">
                  <span className="hrs-info-label">Contact Number</span>
                  <span className="hrs-info-value">{profile.contact_number || "—"}</span>
                </div>
                <div className="hrs-info-item">
                  <span className="hrs-info-label">Department</span>
                  <span className="hrs-info-value">{profile.primary_department?.name || "HR"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Permissions */}
          <div className="hrs-card">
            <div className="hrs-card-header">
              <div className="hrs-card-title"><LockIcon /> Permissions & Access</div>
              <span style={{ fontSize: "12px", color: "#64748b" }}>* System Defined</span>
            </div>
            <div className="hrs-perm-grid">
              <div className={`hrs-perm-item ${profile.can_approve_leaves ? "granted" : "denied"}`}>
                <div className="hrs-perm-left">
                  {profile.can_approve_leaves ? <CheckCircle /> : <XCircle />} Approve Leaves
                </div>
                <span className="hrs-perm-badge">{profile.can_approve_leaves ? "Grant" : "Restricted"}</span>
              </div>
              <div className={`hrs-perm-item ${profile.can_view_salaries ? "granted" : "denied"}`}>
                <div className="hrs-perm-left">
                  {profile.can_view_salaries ? <CheckCircle /> : <XCircle />} View Salaries
                </div>
                <span className="hrs-perm-badge">{profile.can_view_salaries ? "Grant" : "Restricted"}</span>
              </div>
              <div className={`hrs-perm-item ${profile.can_terminate_staff ? "granted" : "denied"}`}>
                <div className="hrs-perm-left">
                  {profile.can_terminate_staff ? <CheckCircle /> : <XCircle />} Terminate Staff
                </div>
                <span className="hrs-perm-badge">{profile.can_terminate_staff ? "Grant" : "Restricted"}</span>
              </div>
              <div className={`hrs-perm-item ${profile.is_department_head ? "granted" : "denied"}`}>
                <div className="hrs-perm-left">
                  {profile.is_department_head ? <CheckCircle /> : <XCircle />} Department Head
                </div>
                <span className="hrs-perm-badge">{profile.is_department_head ? "Grant" : "Restricted"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="hrs-right-col">
          {/* Change Password */}
          <div className="hrs-card">
            <div className="hrs-card-header">
              <div className="hrs-card-title"><LockIcon /> Change Password</div>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="hrs-form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  name="old_password" 
                  value={passForm.old_password} 
                  onChange={handlePassChange} 
                  required 
                />
              </div>
              <div className="hrs-form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  name="new_password" 
                  value={passForm.new_password} 
                  onChange={handlePassChange} 
                  required 
                />
              </div>
              <div className="hrs-form-group">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  name="confirm_password" 
                  value={passForm.confirm_password} 
                  onChange={handlePassChange} 
                  required 
                />
              </div>
              <button 
                type="submit" 
                className="hrs-btn-primary" 
                disabled={isChangingPass || !passForm.old_password || !passForm.new_password || !passForm.confirm_password}
              >
                {isChangingPass ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Departments */}
          <div className="hrs-card">
            <div className="hrs-card-header">
              <div className="hrs-card-title"><BuildingIcon /> Departments</div>
            </div>
            <div className="hrs-dept-section">
              <div className="hrs-dept-label">Primary Department</div>
              <div className="hrs-dept-value">
                {profile.primary_department?.name || "Human Resources"}
              </div>
            </div>
            {profile.secondary_departments && profile.secondary_departments.length > 0 && (
              <div className="hrs-dept-section">
                <div className="hrs-dept-label">Managed Departments</div>
                <div className="hrs-dept-tags">
                  {profile.secondary_departments.map(d => (
                    <span key={d.id} className="hrs-dept-tag">{d.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="hrs-stats-row">
        <div className="hrs-stat-box blue">
          <span className="hrs-stat-title">Active Recruits</span>
          <span className="hrs-stat-value">12</span>
        </div>
        <div className="hrs-stat-box orange">
          <span className="hrs-stat-title">Pending Approvals</span>
          <span className="hrs-stat-value">{profile.statistics?.pending_leaves || 0}</span>
        </div>
        <div className="hrs-stat-box green">
          <span className="hrs-stat-title">Compliance Rate</span>
          <span className="hrs-stat-value">98%</span>
        </div>
        <div className="hrs-stat-box purple">
          <span className="hrs-stat-title">Total Leaves</span>
          <span className="hrs-stat-value">{profile.statistics?.total_leaves_taken || 0}</span>
        </div>
      </div>
    </div>
  );
}
