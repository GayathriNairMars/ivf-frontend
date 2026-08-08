import React, { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";
import "./hospital.css";
import {
  Building2,
  Info,
  MapPin,
  Phone,
  Palette,
  Globe,
  Clock,
  Upload,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Share2,
  Sliders,
  ExternalLink
} from "lucide-react";

export default function HospitalManagement() {
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'branding' | 'contact' | 'localization'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
  const [settingsId, setSettingsId] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    hospital_name: "",
    hospital_short_name: "",
    hospital_tagline: "",
    phone: "",
    phone_secondary: "",
    email: "",
    email_secondary: "",
    address: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    website: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    youtube_url: "",
    linkedin_url: "",
    primary_color: "#7C3AED",
    primary_color_dark: "#5B21B6",
    secondary_color: "#EC4899",
    accent_color: "#0dcaf0",
    success_color: "#198754",
    warning_color: "#ffc107",
    danger_color: "#dc3545",
    footer_text: "",
    footer_links: [],
    timezone: "Asia/Kolkata",
    date_format: "d/m/Y",
    time_format: "h:i A",
    currency: "INR",
    currency_symbol: "₹",
    business_hours: {
      monday: "09:00-18:00",
      tuesday: "09:00-18:00",
      wednesday: "09:00-18:00",
      thursday: "09:00-18:00",
      friday: "09:00-18:00",
      saturday: "10:00-14:00",
      sunday: "Closed",
    },
    created_at: "",
    updated_at: "",
  });

  // Image files & previews
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [logoLightFile, setLogoLightFile] = useState(null);
  const [logoLightPreview, setLogoLightPreview] = useState(null);

  const [faviconFile, setFaviconFile] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);

  // Modal State for Business Hours
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [tempHours, setTempHours] = useState({});

  // Fetch Settings on Mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      let data = await adminApi.getHospitalSettings();
      // Handle list vs object response
      if (Array.isArray(data)) {
        data = data[0] || {};
      } else if (data && data.results && Array.isArray(data.results)) {
        data = data.results[0] || {};
      }

      if (data && data.id) {
        setSettingsId(data.id);
        setFormData({
          hospital_name: data.hospital_name || "",
          hospital_short_name: data.hospital_short_name || "",
          hospital_tagline: data.hospital_tagline || "",
          phone: data.phone || "",
          phone_secondary: data.phone_secondary || "",
          email: data.email || "",
          email_secondary: data.email_secondary || "",
          address: data.address || "",
          address_line2: data.address_line2 || "",
          city: data.city || "",
          state: data.state || "",
          postal_code: data.postal_code || "",
          country: data.country || "India",
          website: data.website || "",
          facebook_url: data.facebook_url || "",
          twitter_url: data.twitter_url || "",
          instagram_url: data.instagram_url || "",
          youtube_url: data.youtube_url || "",
          linkedin_url: data.linkedin_url || "",
          primary_color: data.primary_color || "#7C3AED",
          primary_color_dark: data.primary_color_dark || "#5B21B6",
          secondary_color: data.secondary_color || "#EC4899",
          accent_color: data.accent_color || "#0dcaf0",
          success_color: data.success_color || "#198754",
          warning_color: data.warning_color || "#ffc107",
          danger_color: data.danger_color || "#dc3545",
          footer_text: data.footer_text || "",
          footer_links: Array.isArray(data.footer_links) ? data.footer_links : [],
          timezone: data.timezone || "Asia/Kolkata",
          date_format: data.date_format || "d/m/Y",
          time_format: data.time_format || "h:i A",
          currency: data.currency || "INR",
          currency_symbol: data.currency_symbol || "₹",
          business_hours: data.business_hours || {
            monday: "09:00-18:00",
            tuesday: "09:00-18:00",
            wednesday: "09:00-18:00",
            thursday: "09:00-18:00",
            friday: "09:00-18:00",
            saturday: "10:00-14:00",
            sunday: "Closed",
          },
          created_at: data.created_at || "",
          updated_at: data.updated_at || "",
        });

        if (data.logo_url || data.logo) {
          setLogoPreview(data.logo_url || data.logo);
        }
        if (data.logo_light_url || data.logo_light) {
          setLogoLightPreview(data.logo_light_url || data.logo_light);
        }
        if (data.favicon_url || data.favicon) {
          setFaviconPreview(data.favicon_url || data.favicon);
        }
      }
    } catch (err) {
      console.error("Error fetching hospital settings:", err);
      showToast("error", "Failed to load hospital settings.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "logo") {
        setLogoFile(file);
        setLogoPreview(reader.result);
      } else if (type === "logo_light") {
        setLogoLightFile(file);
        setLogoLightPreview(reader.result);
      } else if (type === "favicon") {
        setFaviconFile(file);
        setFaviconPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Footer Links handlers
  const handleAddFooterLink = () => {
    setFormData((prev) => ({
      ...prev,
      footer_links: [...prev.footer_links, { label: "", url: "" }],
    }));
  };

  const handleFooterLinkChange = (index, field, value) => {
    const updated = [...formData.footer_links];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, footer_links: updated }));
  };

  const handleRemoveFooterLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      footer_links: prev.footer_links.filter((_, i) => i !== index),
    }));
  };

  // Business Hours Modal Handlers
  const handleOpenHoursModal = () => {
    setTempHours({ ...formData.business_hours });
    setIsHoursModalOpen(true);
  };

  const handleSaveHours = () => {
    setFormData((prev) => ({ ...prev, business_hours: tempHours }));
    setIsHoursModalOpen(false);
    showToast("success", "Business hours updated locally. Click Save Changes to submit.");
  };

  const handleHourChange = (day, val) => {
    setTempHours((prev) => ({ ...prev, [day]: val }));
  };

  // Save Settings to Backend
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      if (logoFile || logoLightFile || faviconFile) {
        const payload = new FormData();
        Object.keys(formData).forEach((key) => {
          if (key === "business_hours" || key === "footer_links") {
            payload.append(key, JSON.stringify(formData[key]));
          } else if (formData[key] !== null && formData[key] !== undefined) {
            payload.append(key, formData[key]);
          }
        });
        if (logoFile) payload.append("logo", logoFile);
        if (logoLightFile) payload.append("logo_light", logoLightFile);
        if (faviconFile) payload.append("favicon", faviconFile);

        const updated = await adminApi.updateHospitalSettings(settingsId, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (updated) {
          showToast("success", "Hospital settings updated successfully!");
          fetchSettings();
        }
      } else {
        const updated = await adminApi.updateHospitalSettings(settingsId, formData);
        if (updated) {
          showToast("success", "Hospital settings saved successfully!");
          fetchSettings();
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      showToast("error", err.response?.data?.detail || "Failed to save hospital settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="hosp-mgmt-loading">
        <div className="spinner"></div>
        <p>Loading hospital settings...</p>
      </div>
    );
  }

  return (
    <div className="hosp-mgmt-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`hosp-mgmt-toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* Header Bar */}
      <div className="hosp-mgmt-header">
        <div>
          <h1 className="hosp-mgmt-title">Hospital Management</h1>
          <p className="hosp-mgmt-subtitle">
            Manage hospital information, branding, and contact details
          </p>
        </div>
        <div className="hosp-mgmt-actions">
          <button
            type="button"
            className="btn-hosp-cancel"
            onClick={fetchSettings}
            disabled={saving}
          >
            <RotateCcw size={15} />
            Refresh
          </button>
          <button
            type="button"
            className="btn-hosp-save"
            onClick={handleSubmit}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="hosp-mgmt-tabs">
        <button
          className={`tab-item ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          General Information
        </button>
        <button
          className={`tab-item ${activeTab === "branding" ? "active" : ""}`}
          onClick={() => setActiveTab("branding")}
        >
          Branding & Visuals
        </button>
        <button
          className={`tab-item ${activeTab === "contact" ? "active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          Contact Details
        </button>
        <button
          className={`tab-item ${activeTab === "localization" ? "active" : ""}`}
          onClick={() => setActiveTab("localization")}
        >
          Localization & Business Hours
        </button>
      </div>

      {/* Tab 1: General Information */}
      {activeTab === "general" && (
        <div className="hosp-tab-content grid-layout">
          <div className="grid-main">
            {/* Basic Information Card */}
            <div className="hosp-card">
              <div className="hosp-card-header">
                <div className="header-icon-badge">
                  <Info size={16} />
                </div>
                <h3>Basic Information</h3>
              </div>
              <div className="hosp-card-body">
                <div className="form-group full-width">
                  <label>
                    Hospital Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    name="hospital_name"
                    value={formData.hospital_name}
                    onChange={handleChange}
                    placeholder="Enter full hospital name"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Short Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="hospital_short_name"
                      value={formData.hospital_short_name}
                      onChange={handleChange}
                      placeholder="e.g. SFC"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tagline</label>
                    <input
                      type="text"
                      name="hospital_tagline"
                      value={formData.hospital_tagline}
                      onChange={handleChange}
                      placeholder="e.g. Your Path to Parenthood"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.sunrisefertility.com"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Primary Color</label>
                    <div className="color-picker-input">
                      <input
                        type="color"
                        name="primary_color"
                        value={formData.primary_color}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="primary_color"
                        value={formData.primary_color}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Secondary Color</label>
                    <div className="color-picker-input">
                      <input
                        type="color"
                        name="secondary_color"
                        value={formData.secondary_color}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="secondary_color"
                        value={formData.secondary_color}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                    >
                      <option value="INR">INR - Indian Rupee (₹)</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                      <option value="AED">AED - UAE Dirham (د.إ)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Timezone</label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (GMT +05:30)</option>
                      <option value="UTC">UTC (GMT +00:00)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="timestamps-footer">
                  <div>
                    <span className="label">Created At</span>
                    <span className="value">
                      {formData.created_at
                        ? new Date(formData.created_at).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "01 Jan 2024, 10:30 AM"}
                    </span>
                  </div>
                  <div>
                    <span className="label">Updated At</span>
                    <span className="value">
                      {formData.updated_at
                        ? new Date(formData.updated_at).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "06 Aug 2026, 10:11 AM"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid-side">
            {/* Hospital Logo Card */}
            <div className="hosp-card">
              <div className="hosp-card-header">
                <h3>Hospital Logo (Main)</h3>
              </div>
              <div className="hosp-card-body align-center">
                <div className="logo-preview-box">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Hospital Logo" />
                  ) : (
                    <div className="logo-placeholder">
                      <Building2 size={36} color="#7C3AED" />
                      <span>No Logo Uploaded</span>
                    </div>
                  )}
                </div>
                <label className="btn-upload">
                  <Upload size={14} />
                  Change Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, "logo")}
                    hidden
                  />
                </label>
                <span className="upload-note">JPG, PNG or SVG. Max size 2MB</span>
              </div>
            </div>

            {/* Light Logo (Login Logo) Upload */}
            <div className="hosp-card">
              <div className="hosp-card-header">
                <h3>Light Logo (Login Logo)</h3>
              </div>
              <div className="hosp-card-body align-center">
                <div className="logo-preview-box dark-bg">
                  {logoLightPreview ? (
                    <img src={logoLightPreview} alt="Light Logo" />
                  ) : (
                    <div className="logo-placeholder light-text">
                      <Building2 size={36} color="#ffffff" />
                      <span>No Light Logo</span>
                    </div>
                  )}
                </div>
                <label className="btn-upload">
                  <Upload size={14} />
                  Change Light Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, "logo_light")}
                    hidden
                  />
                </label>
                <span className="upload-note">Used on dark themes and login page</span>
              </div>
            </div>

            {/* Favicon Card */}
            <div className="hosp-card">
              <div className="hosp-card-header">
                <h3>Favicon</h3>
              </div>
              <div className="hosp-card-body align-center">
                <div className="favicon-preview-box">
                  {faviconPreview ? (
                    <img src={faviconPreview} alt="Favicon" />
                  ) : (
                    <div className="favicon-placeholder">
                      <Building2 size={24} color="#7C3AED" />
                    </div>
                  )}
                </div>
                <label className="btn-upload">
                  <Upload size={14} />
                  Change Favicon
                  <input
                    type="file"
                    accept="image/x-icon,image/png"
                    onChange={(e) => handleImageChange(e, "favicon")}
                    hidden
                  />
                </label>
                <span className="upload-note">ICO, PNG. Max size 512KB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Branding & Visuals */}
      {activeTab === "branding" && (
        <div className="hosp-tab-content grid-layout-branding">
          <div className="grid-main">
            {/* Branding Colors & Style */}
            <div className="hosp-card">
              <div className="hosp-card-header">
                <div className="header-icon-badge">
                  <Palette size={16} />
                </div>
                <h3>Branding & Visual Identity</h3>
              </div>
              <div className="hosp-card-body">
                <div className="color-grid">
                  <div className="form-group">
                    <label>Primary Color</label>
                    <div className="color-picker-input">
                      <input
                        type="color"
                        name="primary_color"
                        value={formData.primary_color}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="primary_color"
                        value={formData.primary_color}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Primary Dark</label>
                    <div className="color-picker-input">
                      <input
                        type="color"
                        name="primary_color_dark"
                        value={formData.primary_color_dark}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="primary_color_dark"
                        value={formData.primary_color_dark}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Secondary Color</label>
                    <div className="color-picker-input">
                      <input
                        type="color"
                        name="secondary_color"
                        value={formData.secondary_color}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="secondary_color"
                        value={formData.secondary_color}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Accent Color</label>
                    <div className="color-picker-input">
                      <input
                        type="color"
                        name="accent_color"
                        value={formData.accent_color}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="accent_color"
                        value={formData.accent_color}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Colors */}
                <h4 className="section-subheading">Status Indicator Colors</h4>
                <div className="color-grid">
                  <div className="form-group">
                    <label>Success Color</label>
                    <div className="color-picker-input">
                      <input
                        type="color"
                        name="success_color"
                        value={formData.success_color}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="success_color"
                        value={formData.success_color}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Warning Color</label>
                    <div className="color-picker-input">
                      <input
                        type="color"
                        name="warning_color"
                        value={formData.warning_color}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="warning_color"
                        value={formData.warning_color}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Danger Color</label>
                    <div className="color-picker-input">
                      <input
                        type="color"
                        name="danger_color"
                        value={formData.danger_color}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="danger_color"
                        value={formData.danger_color}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Settings */}
                <h4 className="section-subheading">Footer Settings</h4>
                <div className="form-group full-width">
                  <label>Footer Text</label>
                  <input
                    type="text"
                    name="footer_text"
                    value={formData.footer_text}
                    onChange={handleChange}
                    placeholder="© 2025 Sunrise Fertility Center. All rights reserved."
                  />
                </div>

                <div className="form-group full-width">
                  <div className="flex-between">
                    <label>Footer Links</label>
                    <button
                      type="button"
                      className="btn-add-link"
                      onClick={handleAddFooterLink}
                    >
                      <Plus size={14} /> Add Link
                    </button>
                  </div>
                  {formData.footer_links.map((link, idx) => (
                    <div key={idx} className="footer-link-row">
                      <input
                        type="text"
                        placeholder="Label (e.g. Privacy Policy)"
                        value={link.label}
                        onChange={(e) =>
                          handleFooterLinkChange(idx, "label", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        placeholder="URL (e.g. /privacy)"
                        value={link.url}
                        onChange={(e) =>
                          handleFooterLinkChange(idx, "url", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="btn-del-link"
                        onClick={() => handleRemoveFooterLink(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid-side">
            {/* Triple Upload Box for Logos */}
            <div className="hosp-card">
              <div className="hosp-card-header">
                <h3>Logos & Icons</h3>
              </div>
              <div className="hosp-card-body gap-16">
                {/* 1. Main Logo */}
                <div className="logo-item-box">
                  <span className="logo-item-label">Main Logo</span>
                  <div className="logo-preview-sm">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Main Logo" />
                    ) : (
                      <span>No Main Logo</span>
                    )}
                  </div>
                  <label className="btn-upload btn-sm">
                    <Upload size={12} /> Upload Main
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, "logo")}
                      hidden
                    />
                  </label>
                </div>

                {/* 2. Light / Login Logo */}
                <div className="logo-item-box">
                  <span className="logo-item-label">Light / Login Logo (logo_light)</span>
                  <div className="logo-preview-sm dark-bg">
                    {logoLightPreview ? (
                      <img src={logoLightPreview} alt="Light Logo" />
                    ) : (
                      <span style={{ color: "#aaa" }}>No Light Logo</span>
                    )}
                  </div>
                  <label className="btn-upload btn-sm">
                    <Upload size={12} /> Upload Light Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, "logo_light")}
                      hidden
                    />
                  </label>
                </div>

                {/* 3. Favicon */}
                <div className="logo-item-box">
                  <span className="logo-item-label">Favicon Icon</span>
                  <div className="logo-preview-sm square">
                    {faviconPreview ? (
                      <img src={faviconPreview} alt="Favicon" />
                    ) : (
                      <span>No Favicon</span>
                    )}
                  </div>
                  <label className="btn-upload btn-sm">
                    <Upload size={12} /> Upload Favicon
                    <input
                      type="file"
                      accept="image/x-icon,image/png"
                      onChange={(e) => handleImageChange(e, "favicon")}
                      hidden
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Theme Live Preview */}
            <div className="hosp-card">
              <div className="hosp-card-header">
                <h3>Live Theme Preview</h3>
              </div>
              <div className="hosp-card-body">
                <div className="theme-preview-container">
                  <div
                    className="preview-header"
                    style={{ background: formData.primary_color }}
                  >
                    <div className="preview-logo">
                      {logoLightPreview ? (
                        <img src={logoLightPreview} alt="Preview" />
                      ) : (
                        <span className="text-white">
                          {formData.hospital_short_name || "HIMS"}
                        </span>
                      )}
                    </div>
                    <span className="preview-title">
                      {formData.hospital_name || "Hospital Portal"}
                    </span>
                  </div>
                  <div className="preview-body">
                    <div
                      className="preview-badge"
                      style={{ background: formData.secondary_color, color: "#fff" }}
                    >
                      Secondary Tag
                    </div>
                    <div className="preview-actions">
                      <button
                        style={{
                          background: formData.primary_color,
                          color: "#fff",
                          border: "none",
                        }}
                      >
                        Action Button
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Contact Details */}
      {activeTab === "contact" && (
        <div className="hosp-tab-content grid-layout">
          <div className="grid-main">
            {/* Communication Details Card */}
            <div className="hosp-card">
              <div className="hosp-card-header">
                <div className="header-icon-badge">
                  <Phone size={16} />
                </div>
                <h3>Communication Details</h3>
              </div>
              <div className="hosp-card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Phone <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="form-group">
                    <label>Secondary Phone</label>
                    <input
                      type="text"
                      name="phone_secondary"
                      value={formData.phone_secondary}
                      onChange={handleChange}
                      placeholder="+91 98765 43211"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="info@sunrisefertility.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Secondary Email</label>
                    <input
                      type="email"
                      name="email_secondary"
                      value={formData.email_secondary}
                      onChange={handleChange}
                      placeholder="appointments@sunrisefertility.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            <div className="hosp-card">
              <div className="hosp-card-header">
                <div className="header-icon-badge">
                  <MapPin size={16} />
                </div>
                <h3>Address Information</h3>
              </div>
              <div className="hosp-card-body">
                <div className="form-group full-width">
                  <label>
                    Address Line 1 <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123, Green Valley Road"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address Line 2</label>
                  <input
                    type="text"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    placeholder="Near City Hospital"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      City <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      State <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Maharashtra"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Country <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="India"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      PIN / Postal Code <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      placeholder="400001"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid-side">
            {/* Social Links Card */}
            <div className="hosp-card">
              <div className="hosp-card-header">
                <div className="header-icon-badge">
                  <Share2 size={16} />
                </div>
                <h3>Social Media Profiles</h3>
              </div>
              <div className="hosp-card-body">
                <div className="form-group full-width">
                  <label>Facebook URL</label>
                  <input
                    type="url"
                    name="facebook_url"
                    value={formData.facebook_url}
                    onChange={handleChange}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>Twitter / X URL</label>
                  <input
                    type="url"
                    name="twitter_url"
                    value={formData.twitter_url}
                    onChange={handleChange}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>Instagram URL</label>
                  <input
                    type="url"
                    name="instagram_url"
                    value={formData.instagram_url}
                    onChange={handleChange}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>YouTube URL</label>
                  <input
                    type="url"
                    name="youtube_url"
                    value={formData.youtube_url}
                    onChange={handleChange}
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>LinkedIn URL</label>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Localization & Business Hours */}
      {activeTab === "localization" && (
        <div className="hosp-tab-content grid-layout">
          <div className="grid-main">
            {/* Regional & System Formats Card */}
            <div className="hosp-card">
              <div className="hosp-card-header">
                <div className="header-icon-badge">
                  <Globe size={16} />
                </div>
                <h3>Localization & Formats</h3>
              </div>
              <div className="hosp-card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Currency Code</label>
                    <input
                      type="text"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      placeholder="INR"
                    />
                  </div>
                  <div className="form-group">
                    <label>Currency Symbol</label>
                    <input
                      type="text"
                      name="currency_symbol"
                      value={formData.currency_symbol}
                      onChange={handleChange}
                      placeholder="₹"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date Format</label>
                    <select
                      name="date_format"
                      value={formData.date_format}
                      onChange={handleChange}
                    >
                      <option value="d/m/Y">DD/MM/YYYY (e.g. 06/08/2026)</option>
                      <option value="Y-m-d">YYYY-MM-DD (e.g. 2026-08-06)</option>
                      <option value="m/d/Y">MM/DD/YYYY (e.g. 08/06/2026)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Time Format</label>
                    <select
                      name="time_format"
                      value={formData.time_format}
                      onChange={handleChange}
                    >
                      <option value="h:i A">12 Hours (e.g. 09:30 AM)</option>
                      <option value="H:i">24 Hours (e.g. 09:30)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>System Timezone</label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (GMT +05:30)</option>
                    <option value="UTC">UTC (GMT +00:00)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid-side">
            {/* Business Hours Summary & Edit Button */}
            <div className="hosp-card">
              <div className="hosp-card-header flex-between">
                <div className="flex-align-gap">
                  <div className="header-icon-badge">
                    <Clock size={16} />
                  </div>
                  <h3>Business Hours</h3>
                </div>
                <button
                  type="button"
                  className="btn-edit-hours"
                  onClick={handleOpenHoursModal}
                >
                  <Sliders size={14} />
                  Edit Schedule
                </button>
              </div>
              <div className="hosp-card-body">
                <div className="hours-list-summary">
                  {Object.entries(formData.business_hours || {}).map(
                    ([day, val]) => (
                      <div key={day} className="hours-item">
                        <span className="day-name">
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </span>
                        <span
                          className={`time-range ${
                            val === "Closed" ? "closed" : ""
                          }`}
                        >
                          {val}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Hours Modal Window */}
      {isHoursModalOpen && (
        <div className="hosp-modal-overlay">
          <div className="hosp-modal-content">
            <div className="hosp-modal-header">
              <div className="flex-align-gap">
                <Clock size={20} color="#7C3AED" />
                <h2>Edit Business Hours</h2>
              </div>
              <button
                className="btn-close-modal"
                onClick={() => setIsHoursModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="hosp-modal-body">
              <p className="modal-description">
                Configure opening and closing operational hours for each day of the week.
              </p>

              {/* Days List */}
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(
                (day) => {
                  const currentValue = tempHours[day] || "Closed";
                  const isClosed = currentValue === "Closed";

                  return (
                    <div key={day} className="modal-day-row">
                      <span className="modal-day-label">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </span>
                      <div className="modal-day-inputs">
                        <input
                          type="text"
                          className="time-input"
                          disabled={isClosed}
                          value={isClosed ? "" : currentValue}
                          onChange={(e) => handleHourChange(day, e.target.value)}
                          placeholder="09:00-18:00"
                        />
                        <button
                          type="button"
                          className={`btn-toggle-closed ${isClosed ? "active" : ""}`}
                          onClick={() =>
                            handleHourChange(
                              day,
                              isClosed ? "09:00-18:00" : "Closed"
                            )
                          }
                        >
                          {isClosed ? "Mark Open" : "Mark Closed"}
                        </button>
                      </div>
                    </div>
                  );
                }
              )}

              {/* Presets */}
              <div className="modal-presets">
                <span>Quick Presets:</span>
                <button
                  type="button"
                  onClick={() =>
                    setTempHours({
                      monday: "09:00-18:00",
                      tuesday: "09:00-18:00",
                      wednesday: "09:00-18:00",
                      thursday: "09:00-18:00",
                      friday: "09:00-18:00",
                      saturday: "10:00-14:00",
                      sunday: "Closed",
                    })
                  }
                >
                  Standard Mon-Sat
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTempHours({
                      monday: "00:00-23:59",
                      tuesday: "00:00-23:59",
                      wednesday: "00:00-23:59",
                      thursday: "00:00-23:59",
                      friday: "00:00-23:59",
                      saturday: "00:00-23:59",
                      sunday: "00:00-23:59",
                    })
                  }
                >
                  24 / 7 Emergency
                </button>
              </div>
            </div>

            <div className="hosp-modal-footer">
              <button
                type="button"
                className="btn-hosp-cancel"
                onClick={() => setIsHoursModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-hosp-save"
                onClick={handleSaveHours}
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
