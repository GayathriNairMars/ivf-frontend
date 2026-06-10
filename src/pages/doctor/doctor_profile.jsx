import React, { useState, useEffect } from "react";
import { doctorApi } from "../../api/doctorApi";
import "./doctor_profile.css";

export default function DoctorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorApi.getProfile();
      if (data.success) {
        setProfile(data.profile);
      } else {
        setError("Failed to load profile data.");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Unable to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="dp-container">
        <div className="dp-loading">
          <div className="dp-loading-spinner" />
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dp-container">
        <div className="dp-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
          <button className="dp-retry-btn" onClick={fetchProfile}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const primaryDept = profile.departments?.[0] || null;

  return (
    <div className="dp-container">
      {/* Header */}
      <div className="dp-page-header">
        <div>
          <h1 className="dp-page-title">My profile</h1>
          <p className="dp-page-subtitle">
            View your account, department information, and department team structure.
          </p>
        </div>
        <div className="dp-header-actions">
          <button className="dp-btn dp-btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Change Password
          </button>
          <button className="dp-btn dp-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="dp-profile-card">
        {/* Left: Avatar section */}
        <div className="dp-avatar-section">
          <div className="dp-avatar-wrapper">
            <div className="dp-avatar-circle">
              <span className="dp-avatar-initials">{getInitials(profile.name)}</span>
            </div>
            <span className="dp-online-dot" />
          </div>
          <h2 className="dp-doctor-name">Dr. {profile.name}</h2>
          <p className="dp-doctor-role">{profile.role_display}</p>
          <span className={`dp-status-badge ${profile.is_active ? "active" : "inactive"}`}>
            <span className="dp-status-dot" />
            {profile.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Divider */}
        <div className="dp-card-divider" />

        {/* Middle: Professional details */}
        <div className="dp-details-section">
          <h3 className="dp-section-label">Professional details</h3>
          <div className="dp-details-grid">
            <div className="dp-detail-item">
              <span className="dp-detail-label">Doctor ID</span>
              <span className="dp-detail-value">{profile.employee_id || "—"}</span>
            </div>
            <div className="dp-detail-item">
              <span className="dp-detail-label">Email address</span>
              <span className="dp-detail-value">{profile.email}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="dp-card-divider" />

        {/* Right: Employment details */}
        <div className="dp-details-section">
          <h3 className="dp-section-label">Employment details</h3>
          <div className="dp-details-grid">
            <div className="dp-detail-item">
              <span className="dp-detail-label">Current role</span>
              <span className="dp-detail-value">{profile.role_display}</span>
            </div>
            <div className="dp-detail-item">
              <span className="dp-detail-label">Date joined</span>
              <span className="dp-detail-value">{formatDate(profile.date_joined)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Department Overview */}
      {primaryDept && (
        <div className="dp-dept-section">
          <div className="dp-dept-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <h3>Department Overview</h3>
          </div>
          <div className="dp-dept-grid">
            <div className="dp-dept-item">
              <span className="dp-dept-label">Department</span>
              <span className="dp-dept-value">{primaryDept.name}</span>
            </div>
            <div className="dp-dept-item dp-dept-item-bordered">
              <span className="dp-dept-label">ID Code</span>
              <span className="dp-dept-value">{primaryDept.code}</span>
            </div>
            <div className="dp-dept-item dp-dept-item-bordered">
              <span className="dp-dept-label">Designation</span>
              <span className="dp-dept-value">{primaryDept.role === "PRIMARY" ? "Primary" : primaryDept.role}</span>
            </div>
            <div className="dp-dept-item dp-dept-item-bordered">
              <span className="dp-dept-label">Dept. Head</span>
              <span className="dp-dept-value">{profile.is_department_head ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Capabilities */}
      <div className="dp-capabilities-section">
        <div className="dp-capabilities-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h3>Capabilities</h3>
        </div>
        <div className="dp-capabilities-grid">
          <div className={`dp-capability-chip ${profile.can_perform_egg_retrieval ? "enabled" : "disabled"}`}>
            <span className="dp-cap-dot" />
            Egg Retrieval
          </div>
          <div className={`dp-capability-chip ${profile.can_assist_ivf ? "enabled" : "disabled"}`}>
            <span className="dp-cap-dot" />
            IVF Assist
          </div>
          <div className={`dp-capability-chip ${profile.is_department_head ? "enabled" : "disabled"}`}>
            <span className="dp-cap-dot" />
            Department Head
          </div>
        </div>
      </div>
    </div>
  );
}
