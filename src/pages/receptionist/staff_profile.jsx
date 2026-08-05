// Staff Profile View — Receptionist Portal
import { useState, useEffect } from "react";
import {
  ChevronRight, Mail, Phone, Building2, User,
  Briefcase, ShieldCheck, Calendar, Hash,
  ArrowLeft, Clock, CalendarCheck, Users, Stethoscope,
  Pencil, CheckCircle2
} from "lucide-react";
import receptionistApi from "../../api/receptionistApi";
import "./staff_directory.css";

const ROLE_COLORS = {
  GYN: { bg: "#eef2ff", color: "#4338ca" },
  ANE: { bg: "#f0fdf4", color: "#15803d" },
  END: { bg: "#fff7ed", color: "#c2410c" },
  REC: { bg: "#fdf4ff", color: "#7e22ce" },
  TEC: { bg: "#eff6ff", color: "#1d4ed8" },
  NUR: { bg: "#fdf2f8", color: "#9d174d" },
  ADM: { bg: "#f1f5f9", color: "#334155" },
  EMB: { bg: "#ecfdf5", color: "#065f46" },
  AND: { bg: "#fff1f2", color: "#be123c" },
  PHM: { bg: "#fefce8", color: "#854d0e" },
  HR:  { bg: "#eef2ff", color: "#4338ca" },
  SUP: { bg: "#1e1b4b", color: "#e0e7ff" },
};

const PERMISSION_LABELS = {
  is_department_head:        { label: "Department Head",      desc: "Manages and oversees the department" },
  can_manage_staff:          { label: "Manage Staff",          desc: "Can add, edit, or deactivate staff records" },
  can_view_reports:          { label: "View Reports",          desc: "Access to clinic-wide analytics and reports" },
  can_perform_egg_retrieval: { label: "Perform Egg Retrieval",  desc: "Authorized for egg retrieval procedures" },
  can_assist_ivf:            { label: "Assist IVF Procedures",  desc: "Authorized to assist in IVF procedures" },
};

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// Horizontal label/value row used inside Personal Information & Professional Details
function FieldRow({ label, value, link }) {
  return (
    <div className="sd-field-row">
      <span className="sd-field-row-label">{label}</span>
      <span className="sd-field-row-value">
        {link && value ? <a href={link}>{value}</a> : (value || "—")}
      </span>
    </div>
  );
}

export default function StaffProfile({ staff: initialStaff, staffId, onBack, onEdit }) {
  const id = staffId || initialStaff?.id;

  const [staff, setStaff]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!id) { setError("No staff member specified."); setLoading(false); return; }
    setLoading(true);
    setError("");
    receptionistApi.getStaffDetail(id)
      .then(res => {
        const data = res?.staff || res;
        if (!data || !data.id) { setError("Staff member not found."); return; }
        setStaff(data);
      })
      .catch(() => setError("Failed to load staff profile."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="sd-profile-page">
        <div className="sd-prof-loading">
          <div className="sd-spinner" />
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="sd-profile-page">
        <div className="sd-alert">{error || "Staff member not found."}</div>
        <button className="sd-prof-btn-secondary" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Directory
        </button>
      </div>
    );
  }

  const roleClr   = ROLE_COLORS[staff.role] || ROLE_COLORS.ADM;
  const roleLabel = staff.role_display || staff.role || "Staff";
  const isActive  = staff.is_active !== false;
  const initials  = getInitials(staff.full_name || "?");
  const profile   = staff.profile || {};
  const perms     = staff.permissions || {};
  const stats     = staff.statistics || {};

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—";
  const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  // Department chips — mark the primary one distinctly
  const deptChips = (staff.departments || []).map(name => ({
    name,
    isPrimary: staff.primary_department && name === staff.primary_department.name,
  }));

  const permEntries = Object.keys(PERMISSION_LABELS).filter(k => k in perms);

  return (
    <div className="sd-profile-page">

      {/* Breadcrumb */}
      <div className="sd-breadcrumb">
        <button className="sd-bc-btn" onClick={onBack}>Staff Directory</button>
        <ChevronRight size={13} className="sd-bc-sep" />
        <span className="sd-bc-current">{staff.full_name}</span>
      </div>

      {/* Page action row */}
      <div className="sd-profile-actions">
        <button className="sd-prof-btn-secondary" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Staff Directory
        </button>
        <div className="sd-profile-action-btns">
          {staff.email && (
            <a href={`mailto:${staff.email}`} className="sd-prof-btn-secondary">
              <Mail size={14} /> Send Email
            </a>
          )}
          <button className="sd-prof-btn-primary" onClick={() => onEdit && onEdit(staff)}>
            <Pencil size={14} /> Edit Staff
          </button>
        </div>
      </div>

      {/* ── Identity banner — full width ─────────────────────── */}
      <div className="sd-identity-banner-card">
        <div className="sd-identity-decor" />

        <div className="sd-identity-banner-left">
          <div className="sd-identity-banner-avatar-wrap">
            <div className="sd-identity-banner-avatar" style={{ background: roleClr.bg, color: roleClr.color }}>
              {initials}
            </div>
            <span className={`sd-identity-status ${isActive ? "active" : "inactive"}`} />
          </div>

          <div className="sd-identity-banner-info">
            <div className="sd-identity-banner-name-row">
              <h2 className="sd-identity-banner-name">{staff.full_name}</h2>
              <span className={`sd-active-pill ${isActive ? "active" : "inactive"}`}>
                ● {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="sd-identity-banner-subtitle">
              {roleLabel}
              {staff.primary_department?.name && (
                <>
                  <span className="sd-meta-sep">|</span>
                  {staff.primary_department.name}
                </>
              )}
            </p>

            <div className="sd-identity-banner-meta">
              {profile.employee_id && (
                <span className="sd-meta-item">
                  <Hash size={13} /> {profile.employee_id}
                </span>
              )}
              {staff.email && (
                <>
                  <span className="sd-meta-sep">|</span>
                  <span className="sd-meta-item">
                    <Mail size={13} />
                    <a href={`mailto:${staff.email}`}>{staff.email}</a>
                  </span>
                </>
              )}
              <span className="sd-meta-sep">|</span>
              <span className="sd-meta-item">
                <Phone size={13} /> {profile.contact_number || "—"}
              </span>
              <span className="sd-meta-sep">|</span>
              <span className="sd-meta-item">
                <Calendar size={13} /> Joined {formatDate(staff.date_joined)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content area + right sidebar ─────────────────── */}
      <div className="sd-profile-grid">

        <div className="sd-profile-main">
          {/* Personal Information */}
          <div className="sd-info-card">
            <div className="sd-info-card-title">
              <User size={16} /> Personal Information
            </div>
            <div className="sd-field-list">
              <FieldRow label="Full Name"   value={staff.full_name} />
              <FieldRow label="Email"       value={staff.email} link={staff.email ? `mailto:${staff.email}` : undefined} />
              <FieldRow label="Phone"       value={profile.contact_number} link={profile.contact_number ? `tel:${profile.contact_number}` : undefined} />
              <FieldRow label="Joined Date" value={formatDate(staff.date_joined)} />
              <FieldRow label="Last Login"  value={formatDateTime(staff.last_login)} />
            </div>
          </div>

          {/* Professional Information */}
          <div className="sd-info-card">
            <div className="sd-info-card-title">
              <Briefcase size={16} /> Professional Details
            </div>
            <div className="sd-field-list">
              <FieldRow label="Employee ID"      value={profile.employee_id} />
              <FieldRow label="Role"              value={roleLabel} />
              <FieldRow label="Specialization"    value={profile.specialization} />
              <FieldRow label="Primary Department" value={staff.primary_department?.name} />
              <div className="sd-field-row">
                <span className="sd-field-row-label">Status</span>
                <span className={`sd-active-pill sd-active-pill-inline ${isActive ? "active" : "inactive"}`}>
                  ● {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Activity / Statistics — spans both main columns */}
          <div className="sd-info-card sd-card-span-2">
            <div className="sd-info-card-title">
              <Stethoscope size={16} /> Clinical Activity
            </div>
            <div className="sd-clinical-stats">
              <div className="sd-clinical-stat-box sd-stat-blue">
                <div className="sd-clinical-stat-icon"><Calendar size={18} /></div>
                <div className="sd-clinical-stat-val">{stats.total_appointments ?? 0}</div>
                <div className="sd-clinical-stat-lbl">Total Appointments</div>
              </div>
              <div className="sd-clinical-stat-box sd-stat-green">
                <div className="sd-clinical-stat-icon"><Users size={18} /></div>
                <div className="sd-clinical-stat-val">{stats.total_patients ?? 0}</div>
                <div className="sd-clinical-stat-lbl">Total Patients</div>
              </div>
              <div className="sd-clinical-stat-box sd-stat-purple">
                <div className="sd-clinical-stat-icon"><CheckCircle2 size={18} /></div>
                <div className="sd-clinical-stat-val">{stats.completed_consultations ?? 0}</div>
                <div className="sd-clinical-stat-lbl">Completed Consultations</div>
              </div>
              <div className="sd-clinical-stat-box sd-stat-orange">
                <div className="sd-clinical-stat-icon"><Clock size={18} /></div>
                <div className="sd-clinical-stat-val">{stats.pending_consultations ?? 0}</div>
                <div className="sd-clinical-stat-lbl">Pending Consultations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar — Department Assignments + Permissions stacked tightly */}
        <div className="sd-profile-sidebar">

          {/* Department Assignments */}
          <div className="sd-info-card">
            <div className="sd-info-card-title">
              <Building2 size={16} /> Department Assignments
            </div>
            {deptChips.length > 0 ? (
              <div className="sd-dept-list">
                {deptChips.map((d, i) => (
                  <div key={i} className="sd-dept-mini-box">
                    <div className="sd-dept-mini-icon">
                      <Building2 size={16} color="var(--rec-primary,#4f46e5)" />
                    </div>
                    <div className="sd-dept-mini-text">
                      <div className="sd-dept-mini-name">{d.name}</div>
                      <div className="sd-dept-mini-sub">{d.isPrimary ? "Primary Assignment" : "Assignment"}</div>
                    </div>
                    {d.isPrimary && staff.primary_department?.code && (
                      <span className="sd-dept-mini-chip">{staff.primary_department.code}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="sd-empty-inline">No department assignments.</p>
            )}
          </div>

          {/* Permissions */}
          {permEntries.length > 0 && (
            <div className="sd-info-card">
              <div className="sd-info-card-title">
                <ShieldCheck size={16} /> Permissions &amp; Certifications
              </div>
              <div className="sd-perm-list">
                {permEntries.map((key) => {
                  const meta    = PERMISSION_LABELS[key];
                  const enabled = !!perms[key];
                  return (
                    <div key={key} className="sd-perm-row">
                      <div className="sd-perm-left">
                        <div className="sd-perm-icon-wrap">
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <div className="sd-perm-name">{meta.label}</div>
                          <div className="sd-perm-desc">{meta.desc}</div>
                        </div>
                      </div>
                      <span className={`sd-perm-tag ${enabled ? "on" : "off"}`}>
                        {enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}