import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import "./pharmacist_settings.css";
import { Edit2, Calendar, LogIn, BarChart2, Clock, Info } from "lucide-react";
import arathyAvatar from "../../assets/arathy_avatar.png";

export default function PharmacistSettings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/pharmacy/profile/");
      if (res.data.success) {
        setProfile(res.data.profile);
      } else {
        setError("Failed to load profile data.");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching profile. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="ps-loading">Loading Profile Data...</div>;
  if (error) return <div className="ps-loading" style={{ color: "#ef4444" }}>{error}</div>;
  if (!profile) return null;

  return (
    <div className="ps-root">
      <h1 className="ps-page-title">Account Settings</h1>
      
      <div className="ps-tabs">
        <button 
          className={`ps-tab ${activeTab === "Profile" ? "active" : ""}`}
          onClick={() => setActiveTab("Profile")}
        >
          <span className="material-symbols-outlined ps-tab-icon" style={{fontVariationSettings: "'FILL' 0"}}>person</span> Profile
        </button>
        <button 
          className={`ps-tab ${activeTab === "Security" ? "active" : ""}`}
          onClick={() => setActiveTab("Security")}
        >
          <span className="material-symbols-outlined ps-tab-icon" style={{fontVariationSettings: "'FILL' 0"}}>security</span> Security
        </button>
      </div>

      <div className="ps-content">
        <div className="ps-main-panel">
          <div className="ps-profile-header">
            <div className="ps-avatar-wrapper">
              <img src={arathyAvatar} alt="Profile" className="ps-avatar" />
              <button className="ps-edit-avatar-btn">
                <Edit2 size={12} />
              </button>
            </div>
            <div className="ps-header-info">
              <h2>{profile.name}</h2>
              <p>{profile.is_department_head ? "Head Pharmacist" : "Pharmacist"} • ID: {profile.pharmacist_id}</p>
            </div>
          </div>

          <div className="ps-form-grid">
            <div className="ps-form-group">
              <label>Full Name</label>
              <input type="text" value={profile.name || ""} disabled />
            </div>
            <div className="ps-form-group">
              <label>Email Address</label>
              <input type="email" value={profile.email || ""} disabled />
            </div>
            <div className="ps-form-group">
              <label>Phone Number</label>
              <input type="text" value="+1-555-123-4567" disabled />
            </div>
            <div className="ps-form-group">
              <label>Role</label>
              <div className="ps-select-wrapper">
                <select disabled value={profile.role_display || "Pharmacist"}>
                  <option value={profile.role_display || "Pharmacist"}>{profile.role_display || "Pharmacist"}</option>
                </select>
              </div>
            </div>
            <div className="ps-form-group">
              <label>Employee ID</label>
              <input type="text" value={profile.pharmacist_id || ""} disabled />
            </div>
            <div className="ps-form-group">
              <label>License No</label>
              <input type="text" value={profile.license_number || ""} disabled />
            </div>
            <div className="ps-form-group">
              <label>Qualification</label>
              <input type="text" value={profile.qualification || ""} disabled />
            </div>
            <div className="ps-form-group">
              <label>Store Location</label>
              <input type="text" value={profile.store_location || ""} disabled />
            </div>
          </div>

          <div className="ps-form-actions">
            <button className="ps-btn-cancel">Cancel</button>
            <button className="ps-btn-save">Save Changes</button>
          </div>
        </div>

        <div className="ps-side-panel">
          <div className="ps-card" style={{ backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }}>
            <h3 style={{ color: '#065f46' }}>Platform Usage</h3>
            <div className="ps-usage-list">
              <div className="ps-usage-item">
                <div className="ps-usage-icon"><Calendar size={16} /></div>
                <div className="ps-usage-details">
                  <span className="ps-usage-label">Member Since</span>
                  <span className="ps-usage-value">Jan 15, 2026</span>
                </div>
              </div>
              <div className="ps-usage-item">
                <div className="ps-usage-icon"><LogIn size={16} /></div>
                <div className="ps-usage-details">
                  <span className="ps-usage-label">Last Login</span>
                  <span className="ps-usage-value">Today, 10:30 AM</span>
                </div>
              </div>
              <div className="ps-usage-item">
                <div className="ps-usage-icon"><BarChart2 size={16} /></div>
                <div className="ps-usage-details">
                  <span className="ps-usage-label">Total Logins</span>
                  <span className="ps-usage-value">156</span>
                </div>
              </div>
              <div className="ps-usage-item">
                <div className="ps-usage-icon"><Clock size={16} /></div>
                <div className="ps-usage-details">
                  <span className="ps-usage-label">Active Tenure</span>
                  <span className="ps-usage-value">6 Months</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ps-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} /> Recent Activity
            </h3>
            <ul className="ps-activity-list">
              <li>Updated stock for 'Insulin Aspart'</li>
              <li>Generated Monthly Narcotics Report</li>
              <li>Approved PO #ORD-9821</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
