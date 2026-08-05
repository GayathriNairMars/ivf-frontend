// Staff Directory — Receptionist Portal
import { useState, useEffect, useCallback } from "react";
import {
  Search, X, RefreshCw, Users, Mail, Phone,
  Building2, Stethoscope, UserCheck, ChevronRight
} from "lucide-react";
import receptionistApi from "../../api/receptionistApi";
import "./staff_directory.css";

/* ── Role mappings ──────────────────────────────────────────── */
const ROLE_LABELS = {
  GYN: "Gynaecologist",
  ANE: "Anaesthesiologist",
  END: "Endocrinologist",
  REC: "Receptionist",
  TEC: "Lab Technician",
  NUR: "Nurse",
  ADM: "Admin",
  EMB: "Embryologist",
  AND: "Andrologist",
  PHM: "Pharmacist",
  HR:  "HR",
  SUP: "Super Admin",
};

// Colour palette per role — subtle but distinct
const ROLE_COLORS = {
  GYN: { bg: "#eef2ff", color: "#4338ca", border: "#c7d2fe" },
  ANE: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  END: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  REC: { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
  TEC: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  NUR: { bg: "#fdf2f8", color: "#9d174d", border: "#fbcfe8" },
  ADM: { bg: "#f1f5f9", color: "#334155", border: "#cbd5e1" },
  EMB: { bg: "#ecfdf5", color: "#065f46", border: "#6ee7b7" },
  AND: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
  PHM: { bg: "#fefce8", color: "#854d0e", border: "#fde68a" },
  HR:  { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  SUP: { bg: "#1e1b4b", color: "#e0e7ff", border: "#3730a3" },
};

const ROLE_OPTIONS = [
  { value: "",    label: "All Roles"         },
  { value: "GYN", label: "Gynaecologist"     },
  { value: "ANE", label: "Anaesthesiologist" },
  { value: "END", label: "Endocrinologist"   },
  { value: "REC", label: "Receptionist"      },
  { value: "TEC", label: "Lab Technician"    },
  { value: "NUR", label: "Nurse"             },
  { value: "ADM", label: "Admin"             },
  { value: "EMB", label: "Embryologist"      },
  { value: "AND", label: "Andrologist"       },
  { value: "PHM", label: "Pharmacist"        },
  { value: "HR",  label: "HR"                },
];

const PAGE_SIZE = 20;       // matches ?page_size=20 in the API contract
const SEARCH_DEBOUNCE = 400; // ms — avoid firing a request per keystroke

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * extractStaffArray — handles all known API response shapes.
 * DRF's PageNumberPagination (the shape this endpoint returns) uses
 * { count, next, previous, results }, so `results` is checked first.
 * The rest are kept as fallbacks in case the shape ever changes.
 */
function extractStaffArray(data) {
  if (Array.isArray(data))           return data;
  if (Array.isArray(data.results))   return data.results;
  if (Array.isArray(data.staff))     return data.staff;
  if (Array.isArray(data.data))      return data.data;
  if (Array.isArray(data.members))   return data.members;
  if (Array.isArray(data.employees)) return data.employees;
  return [];
}

/** extractTotalCount — DRF gives `count`; keep older fallbacks too. */
function extractTotalCount(data, arr) {
  if (typeof data.count === "number") return data.count;
  if (typeof data.total === "number") return data.total;
  return arr.length;
}

/* ── Single staff card ──────────────────────────────────────── */
function StaffCard({ staff, onView }) {
  const roleLabel = ROLE_LABELS[staff.role] || staff.role || "Staff";
  const roleClr   = ROLE_COLORS[staff.role] || ROLE_COLORS.ADM;
  const isActive  = staff.is_active !== false;
  const initials  = getInitials(staff.full_name || staff.name || "?");

  return (
    <div className="sd-card">

      {/* ── Avatar strip at top ─── */}
      <div className="sd-card-top">
        {/* Initials avatar — no photo */}
        <div className="sd-initials-avatar" style={{ background: roleClr.bg, color: roleClr.color }}>
          {initials}
        </div>

        {/* Active indicator dot */}
        <span className={`sd-status-pill ${isActive ? "active" : "inactive"}`}>
          <span className="sd-status-pip" />
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* ── Card body ─────────────── */}
      <div className="sd-card-body">
        {/* Name — prominently styled */}
        <h3 className="sd-card-name">{staff.full_name || staff.name || "—"}</h3>

        {/* Role badge */}
        <span
          className="sd-role-chip"
          style={{ background: roleClr.bg, color: roleClr.color, borderColor: roleClr.border }}
        >
          {roleLabel}
        </span>

        {/* Designation / specialization */}
        {(staff.designation || staff.specialization) && (
          <p className="sd-card-designation">
            {staff.designation || staff.specialization}
          </p>
        )}

        {/* Divider */}
        <div className="sd-card-divider" />

        {/* Contact rows */}
        {(staff.email || staff.work_email) && (
          <div className="sd-contact-row">
            <Mail size={13} />
            <span className="sd-contact-text">{staff.email || staff.work_email}</span>
          </div>
        )}
        {(staff.phone || staff.mobile) && (
          <div className="sd-contact-row">
            <Phone size={13} />
            <span className="sd-contact-text">{staff.phone || staff.mobile}</span>
          </div>
        )}

        {/* Department chip */}
        {(staff.department_name || staff.department) && (
          <div className="sd-dept-chip-wrap">
            <span className="sd-dept-chip">
              <Building2 size={11} />
              {staff.department_name || staff.department}
            </span>
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────── */}
      <div className="sd-card-footer">
        <button className="sd-btn-view" onClick={() => onView(staff)}>
          <UserCheck size={13} /> View Profile
        </button>
        {(staff.email || staff.work_email) && (
          <a href={`mailto:${staff.email || staff.work_email}`} className="sd-btn-email">
            <Mail size={13} /> Email
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function StaffDirectory({ onView }) {
  const [staff, setStaff]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  // Raw text box value (updates every keystroke)
  const [search, setSearch]         = useState("");
  // Debounced value actually sent to the API
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [role, setRole]             = useState("");
  const [department, setDept]       = useState("");
  const [departments, setDepts]     = useState([]);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce the search box → debouncedSearch, and jump back to page 1
  // whenever the effective search term changes.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, department]);

  // Fetch dept list once — extract from department_counts or first-load staff array
  useEffect(() => {
    receptionistApi.getStaffDirectory({})
      .then(data => {
        // Try department_counts object first (our API returns this)
        if (data.department_counts && typeof data.department_counts === "object") {
          const depts = Object.entries(data.department_counts).map(([name]) => ({
            id: name,   // use name as id for filter param
            name,
          }));
          setDepts(depts);
          return;
        }
        // Fallback: extract from staff array
        const arr = extractStaffArray(data);
        const map = new Map();
        arr.forEach(s => {
          const key  = s.department_id || s.department;
          const name = s.department_name || s.department;
          if (key && name) map.set(key, { id: key, name });
        });
        setDepts([...map.values()]);
      })
      .catch(() => {});
  }, []);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: page,
        page_size: PAGE_SIZE,
      };
      if (debouncedSearch) params.search     = debouncedSearch;
      if (role)            params.role       = role;
      if (department)      params.department = department;

      const data = await receptionistApi.getStaffDirectory(params);

      const arr   = extractStaffArray(data);
      const count = extractTotalCount(data, arr);

      setStaff(arr);
      setTotal(count);
      setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
    } catch {
      setError("Failed to load staff directory. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, role, department, page]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  // Bypasses the debounce so hitting "Search" is instant.
  const handleSearch = (e) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setRole("");
    setDept("");
    setPage(1);
  };

  const activeCount  = staff.filter(s => s.is_active !== false).length;
  const doctorCount  = staff.filter(s => ["GYN","ANE","END"].includes(s.role)).length;
  const nurseCount   = staff.filter(s => s.role === "NUR").length;

  return (
    <div className="sd-page">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="sd-page-header">
        <div className="sd-page-header-text">
          <h2>Staff Directory</h2>
          <p>Central registry of all hospital personnel — browse, search and filter by role or department</p>
        </div>
        <div className="sd-header-meta">
          <span className="sd-total-chip">
            <Users size={13} /> {total} Members
          </span>
        </div>
      </div>

      {/* ── Summary strip ──────────────────────────────────────
      <div className="sd-summary-strip">
        <div className="sd-summary-item">
          <div className="sd-summary-icon" style={{ background: "#eef2ff" }}>
            <Users size={18} color="#4f46e5" />
          </div>
          <div>
            <span className="sd-summary-val">{total}</span>
            <span className="sd-summary-lbl">Total Staff</span>
          </div>
        </div>
        <div className="sd-summary-divider" />
        <div className="sd-summary-item">
          <div className="sd-summary-icon" style={{ background: "#f0fdf4" }}>
            <UserCheck size={18} color="#16a34a" />
          </div>
          <div>
            <span className="sd-summary-val">{activeCount}</span>
            <span className="sd-summary-lbl">Active</span>
          </div>
        </div>
        <div className="sd-summary-divider" />
        <div className="sd-summary-item">
          <div className="sd-summary-icon" style={{ background: "#eff6ff" }}>
            <Stethoscope size={18} color="#2563eb" />
          </div>
          <div>
            <span className="sd-summary-val">{doctorCount}</span>
            <span className="sd-summary-lbl">Doctors</span>
          </div>
        </div>
        <div className="sd-summary-divider" />
        <div className="sd-summary-item">
          <div className="sd-summary-icon" style={{ background: "#fdf4ff" }}>
            <Users size={18} color="#9333ea" />
          </div>
          <div>
            <span className="sd-summary-val">{nurseCount}</span>
            <span className="sd-summary-lbl">Nursing</span>
          </div>
        </div>
      </div> */}

      {/* ── Search & filter bar ──────────────────────────────── */}
      <form className="sd-filter-bar" onSubmit={handleSearch}>
        <div className="sd-search-wrap">
          <Search size={15} className="sd-search-icon" />
          <input
            type="text"
            className="sd-search-input"
            placeholder="Search by name, email, employee ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="sd-clear-btn" onClick={() => { setSearch(""); setDebouncedSearch(""); }}>
              <X size={13} />
            </button>
          )}
        </div>

        <select
          className="sd-select"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          {ROLE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {departments.length > 0 && (
          <select
            className="sd-select"
            value={department}
            onChange={e => setDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}

        <button type="submit" className="sd-btn-search">
          <Search size={14} /> Search
        </button>
        <button type="button" className="sd-btn-reset" onClick={handleReset} title="Reset">
          <RefreshCw size={14} />
        </button>
      </form>

      {/* Active filters pill row */}
      {(search || role || department) && (
        <div className="sd-active-filters">
          <span style={{ fontSize: 12, color: "var(--rec-text-muted)", fontWeight: 600 }}>Filters:</span>
          {search     && <span className="sd-filter-pill">{search} <button onClick={() => { setSearch(""); setDebouncedSearch(""); }}><X size={10}/></button></span>}
          {role       && <span className="sd-filter-pill">{ROLE_LABELS[role] || role} <button onClick={() => setRole("")}><X size={10}/></button></span>}
          {department && <span className="sd-filter-pill">{departments.find(d => d.id === department)?.name || `Dept #${department}`} <button onClick={() => setDept("")}><X size={10}/></button></span>}
          <button className="sd-clear-all" onClick={handleReset}>Clear all</button>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────── */}
      {error && <div className="sd-alert"><X size={15} /> {error}</div>}

      {/* ── Results header ───────────────────────────────────── */}
      {!loading && !error && (
        <div className="sd-results-header">
          <span className="sd-results-count">
            {total === 0 ? "No results" : `${total} result${total !== 1 ? "s" : ""} found`}
          </span>
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="sd-loading">
          <div className="sd-spinner" />
          <p>Loading staff directory…</p>
        </div>
      ) : staff.length === 0 ? (
        <div className="sd-empty">
          <Users size={52} color="#c7d2fe" />
          <p className="sd-empty-title">No staff members found</p>
          <p className="sd-empty-sub">Try adjusting your search terms or clearing filters.</p>
          <button className="sd-btn-search" style={{ marginTop: 12 }} onClick={handleReset}>
            <RefreshCw size={14} /> Clear Filters
          </button>
        </div>
      ) : (
        <div className="sd-grid">
          {staff.map(s => (
            <StaffCard key={s.id} staff={s} onView={onView} />
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="sd-pagination">
          <span className="sd-page-info">
            Page {page} of {totalPages} &nbsp;·&nbsp; {total} total
          </span>
          <div className="sd-page-btns">
            <button
              className="sd-page-btn"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >← Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = i + 1;
              return (
                <button
                  key={pg}
                  className={`sd-page-btn ${page === pg ? "active" : ""}`}
                  onClick={() => setPage(pg)}
                >{pg}</button>
              );
            })}
            <button
              className="sd-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}