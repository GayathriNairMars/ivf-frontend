import React, { useState, useEffect } from "react";
import { doctorApi } from "../../api/doctorApi";
import {
  Calendar, Clock, Briefcase, CheckCircle, XCircle,
  AlertCircle, TrendingUp, Home, AlarmClock,
} from "lucide-react";
import "./doctor_attendance.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTime = (timeStr) => {
  if (!timeStr || timeStr === "--:--" || timeStr === "null" || timeStr === null) return "--:--";
  const [h, m] = timeStr.split(":");
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, "0")}:${m} ${ampm}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatFullDate = (dateStr, dayName) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const month = d.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  return `${(dayName || "").toUpperCase()}, ${month} ${d.getDate()}, ${d.getFullYear()}`;
};

const timeNow = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_STATUSES = ["PRESENT", "ABSENT", "LATE", "ON_LEAVE", "HALF_DAY", "WORK_FROM_HOME"];

// Empty today — no record yet (fresh login, not yet checked in)
const EMPTY_TODAY = {
  check_in:  "--:--",
  check_out: "--:--",
  remarks:   "",
  status:    "Not Checked In",
  date:      "",
  hasRecord: false,   // ← key flag: no DB record exists yet
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function DoctorAttendance() {
  const [loading,       setLoading]       = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayData,     setTodayData]     = useState(null);
  const [historyData,   setHistoryData]   = useState([]);
  const [statsData,     setStatsData]     = useState(null);

  useEffect(() => { fetchData(); }, []);

  // ── Dummy fallback data (only used when ALL API calls fail) ────────────────

  const dummyHistory = [
    { date: "Jun 16, 2026", day: "Tuesday",  check_in: "09:12 AM", check_out: "05:04 PM", status: "Late",     hours: "7.8h" },
    { date: "Jun 15, 2026", day: "Monday",   check_in: "08:55 AM", check_out: "05:10 PM", status: "Present",  hours: "8.2h" },
    { date: "Jun 14, 2026", day: "Sunday",   check_in: "--:--",    check_out: "--:--",    status: "Holiday",  hours: "0.0h" },
    { date: "Jun 13, 2026", day: "Saturday", check_in: "09:05 AM", check_out: "01:00 PM", status: "Half Day", hours: "4.0h" },
    { date: "Jun 12, 2026", day: "Friday",   check_in: "08:58 AM", check_out: "05:00 PM", status: "Present",  hours: "8.0h" },
  ];

  const dummyStats = {
    todayStatus: "Not Checked In", todayTime: "--:-- - --:--",
    weekDays: "4/5 Days",   weekPercent:  "80% Attendance",
    monthDays: "18/22 Days", monthPercent: "82% Completion",
    attRate: "80%", attStatus: "Status: Good",
    distPresent: 66, distAbsent: 9,  distLate: 7,
    distLeave:    5, distHalfDay: 4, distWfh:  9,
    totalWorkingDays: 22, presentDays: 14, absentDays: 2,
    onLeave: 1, holidays: 4, lateCount: 2, halfDayCount: 1, wfhCount: 2,
  };

  // ── fetchData ─────────────────────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true);
    try {
      const todayRes = await doctorApi.getTodayAttendance().catch(() => null);
      const histRes  = await doctorApi.getAttendanceHistory({}).catch(() => null);
      const statsRes = await doctorApi.getAttendanceStats({}).catch(() => null);

      // ── Today attendance ──────────────────────────────────────────────────
      // If API returns success + attendance object → record exists in DB
      // If API returns 404 / no attendance → no record yet, show EMPTY_TODAY
      let parsedToday = EMPTY_TODAY;
      if (todayRes?.success && todayRes.attendance) {
        const att = todayRes.attendance;
        parsedToday = {
          user_name:att.user_name,
          check_in:  formatTime(att.check_in),
          check_out: formatTime(att.check_out),
          remarks:   att.remarks || "",
          status:    att.status_display || "Checked In",
          date:      formatFullDate(att.date, att.day_name),
          hasRecord: true,    // record exists in DB → Check In should be disabled
        };
      }
      setTodayData(parsedToday);

      // ── History ───────────────────────────────────────────────────────────
      let parsedHistory = dummyHistory;
      let histStats     = null;
      let histDateRange = null;
      if (histRes?.success) {
        if (histRes.history) {
          parsedHistory = histRes.history.map((row) => ({
            date:      formatDate(row.date),
            day:       row.day_name,
            check_in:  formatTime(row.check_in),
            check_out: formatTime(row.check_out),
            status:    row.status_display,
            hours:     row.working_hours + "h",
          }));
        }
        histStats     = histRes.statistics;
        histDateRange = histRes.date_range;
      }
      setHistoryData(parsedHistory);

      // ── Stats ─────────────────────────────────────────────────────────────
      let parsedStats = dummyStats;
      if (statsRes?.success && statsRes.monthly_stats) {
        const currentMonthNum = new Date().getMonth() + 1;
        const curMonthStats   =
          statsRes.monthly_stats.find((m) => m.month_num === currentMonthNum) ||
          statsRes.monthly_stats[0];

        const total    = histStats?.total_records || 1;
        const pPresent = Math.round(((histStats?.present        || 0) / total) * 100);
        const pAbsent  = Math.round(((histStats?.absent         || 0) / total) * 100);
        const pLate    = Math.round(((histStats?.late           || 0) / total) * 100);
        const pLeave   = Math.round(((histStats?.on_leave       || 0) / total) * 100);
        const pHalfDay = Math.round(((histStats?.half_day       || 0) / total) * 100);
        const pWfh     = Math.round(((histStats?.work_from_home || 0) / total) * 100);

        parsedStats = {
          todayStatus:      todayRes?.attendance?.status_display || "Not Checked In",
          todayTime:        `${formatTime(todayRes?.attendance?.check_in)} - ${formatTime(todayRes?.attendance?.check_out)}`,
          weekDays:         "4/5 Days",
          weekPercent:      "80% Attendance",
          monthDays:        `${curMonthStats?.present || 0}/${curMonthStats?.total_days || 30} Days`,
          monthPercent:     `${Math.round(((curMonthStats?.present || 0) / (curMonthStats?.total_days || 30)) * 100)}% Completion`,
          attRate:          `${histStats?.attendance_rate || 0}%`,
          attStatus:        (histStats?.attendance_rate || 0) > 75 ? "Status: Good" : "Status: Needs Improvement",
          distPresent: pPresent, distAbsent: pAbsent, distLate: pLate,
          distLeave: pLeave, distHalfDay: pHalfDay, distWfh: pWfh,
          totalWorkingDays: histDateRange?.total_days || 30,
          presentDays:      histStats?.present          || 0,
          absentDays:       histStats?.absent           || 0,
          onLeave:          histStats?.on_leave         || 0,
          holidays:         0,
          lateCount:        histStats?.late             || 0,
          halfDayCount:     histStats?.half_day         || 0,
          wfhCount:         histStats?.work_from_home   || 0,
        };
      }
      setStatsData(parsedStats);
    } catch (e) {
      console.error(e);
      setTodayData(EMPTY_TODAY);
      setHistoryData(dummyHistory);
      setStatsData(dummyStats);
    } finally {
      setLoading(false);
    }
  };

  // ── handleCheckIn — POST /api/attendance/mark/ ────────────────────────────
  // Only called when no record exists yet (hasRecord === false)

  const handleCheckIn = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    const payload = {
      check_in:  timeNow(),   // "09:00"
      check_out: null,
      status:    "PRESENT",
      remarks:   "Checked in",
    };
    try {
      await doctorApi.markAttendance(payload);  // POST
      await fetchData();
    } catch (e) {
      console.error("Check-in failed", e);
    } finally {
      setActionLoading(false);
    }
  };

  // ── handleCheckOut — PUT /api/attendance/mark/ ────────────────────────────
  // Only called after check-in exists (hasRecord === true, check_out === "--:--")

  const handleCheckOut = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    const payload = {
      check_out: timeNow(),   // "17:00" — only field needed
    };
    try {
      await doctorApi.updateAttendance(payload);  // PUT
      await fetchData();
    } catch (e) {
      console.error("Check-out failed", e);
    } finally {
      setActionLoading(false);
    }
  };

  // ── handleUpdate — PUT /api/attendance/mark/ ─────────────────────────────

  const handleUpdate = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    const payload = {
      check_in:  todayData?.check_in  !== "--:--" ? todayData.check_in  : null,
      check_out: todayData?.check_out !== "--:--" ? todayData.check_out : null,
      status:    "PRESENT",
      remarks:   todayData?.remarks || "",
    };
    try {
      await doctorApi.updateAttendance(payload);  // PUT
      await fetchData();
    } catch (e) {
      console.error("Update failed", e);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render guard ──────────────────────────────────────────────────────────

  if (loading || !statsData || !todayData) return <div className="p-6">Loading...</div>;

  // Derived button states — driven by hasRecord + check_out value
  const hasRecord    = todayData.hasRecord;                                      // POST was done
  const isCheckedOut = todayData.check_out && todayData.check_out !== "--:--";  // PUT was done

  // Check In  → enabled only when NO record exists yet
  // Check Out → enabled only when record exists but not yet checked out
  const canCheckIn  = !hasRecord;
  const canCheckOut = hasRecord && !isCheckedOut;

  // ── Attendance distribution rows ──────────────────────────────────────────

  const distItems = [
    { label: "Present",        pct: statsData.distPresent,  cls: "blue"   },
    { label: "Work From Home", pct: statsData.distWfh,      cls: "teal"   },
    { label: "Late",           pct: statsData.distLate,     cls: "orange" },
    { label: "On Leave",       pct: statsData.distLeave,    cls: "sky"    },
    { label: "Half Day",       pct: statsData.distHalfDay,  cls: "purple" },
    { label: "Absent",         pct: statsData.distAbsent,   cls: "red"    },
  ];

  // ─── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="doc-attendance-container">

      {/* ── Header ── */}
      <div className="da-header">
        <h2>Attendance Dashboard</h2>
        <p>Welcome back, {todayData.user_name}. Monitoring clinic operations for June 17, 2026.</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="da-top-cards">
        <div className="da-card top-kpi">
          <div className="kpi-content">
            <span className="kpi-label">Today Status</span>
            <span className="kpi-value text-blue-600">{statsData.todayStatus}</span>
            <span className="kpi-subtext">{statsData.todayTime}</span>
          </div>
          <div className="kpi-icon"><Calendar size={24} /></div>
        </div>
        <div className="da-card top-kpi">
          <div className="kpi-content">
            <span className="kpi-label">This Week</span>
            <span className="kpi-value">{statsData.weekDays}</span>
            <span className="kpi-subtext">{statsData.weekPercent}</span>
          </div>
          <div className="kpi-icon"><Briefcase size={24} /></div>
        </div>
        <div className="da-card top-kpi">
          <div className="kpi-content">
            <span className="kpi-label">This Month</span>
            <span className="kpi-value">{statsData.monthDays}</span>
            <span className="kpi-subtext">{statsData.monthPercent}</span>
          </div>
          <div className="kpi-icon"><Calendar size={24} /></div>
        </div>
        <div className="da-card top-kpi">
          <div className="kpi-content">
            <span className="kpi-label">Attendance Rate</span>
            <span className="kpi-value">{statsData.attRate}</span>
            <span className="kpi-subtext text-green-600">● {statsData.attStatus}</span>
          </div>
          <div className="kpi-icon"><TrendingUp size={24} /></div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="da-main-grid">

        {/* ── Left Column ── */}
        <div className="da-left-col">

          {/* Current Status Card */}
          <div className="da-card current-status-card">
            <div className="cs-header">
              <h3>Current Status</h3>
              <span className={`badge-checked-in ${!hasRecord ? "badge-not-checked-in" : ""}`}>
                {!hasRecord ? "Not Checked In" : isCheckedOut ? "Checked Out" : "Checked In"}
              </span>
            </div>

            <div className="cs-time-display">
              <span className="cs-label">
                {!hasRecord ? "Not yet checked in" : "Logged In at"}
              </span>
              <h1 className="cs-time">
                {todayData.check_in !== "--:--" ? todayData.check_in : "--:--"}
              </h1>
              <span className="cs-date">{todayData.date}</span>
            </div>

            <div className="cs-times">
              <div className="cs-time-box">
                <span className="cs-box-label">CHECK IN</span>
                <span className="cs-box-val">{todayData.check_in}</span>
              </div>
              <div className="cs-time-box text-right">
                <span className="cs-box-label">CHECK OUT</span>
                <span className="cs-box-val">{todayData.check_out}</span>
              </div>
            </div>

            <div className="cs-remarks">
              <span className="cs-label">REMARKS</span>
              <p>{todayData.remarks || "No remarks"}</p>
            </div>

            {/* ── Action Buttons ── */}
            <div className="cs-actions">
              {/* Check In — POST — only active when no record exists */}
              <button
                className={canCheckIn ? "btn-primary" : "btn-secondary"}
                disabled={!canCheckIn || actionLoading}
                onClick={handleCheckIn}
              >
                {actionLoading && canCheckIn ? "Checking In…" : "Check In"}
              </button>

              {/* Check Out — PUT — only active after check-in, before check-out */}
              <button
                className={canCheckOut ? "btn-primary" : "btn-secondary"}
                disabled={!canCheckOut || actionLoading}
                onClick={handleCheckOut}
              >
                {actionLoading && canCheckOut ? "Checking Out…" : "Check Out"}
              </button>
            </div>

            <div className="cs-actions-sub">
              <button
                className="btn-outline"
                disabled={!hasRecord || actionLoading}
                onClick={handleUpdate}
              >
                Update
              </button>
              <button
                className="btn-outline"
                disabled={!hasRecord || actionLoading}
                onClick={handleUpdate}
              >
                Correction
              </button>
            </div>
          </div>

          {/* ── Attendance Distribution Card (all 6 statuses) ── */}
          <div className="da-card att-dist-card">
            <h3>Attendance Distribution</h3>
            <div className="dist-bars">
              {distItems.map(({ label, pct, cls }) => (
                <div className="dist-item" key={label}>
                  <div className="dist-label">
                    <span>{label}</span>
                    <span className={
                      cls === "red"    ? "text-red-500"    :
                      cls === "orange" ? "text-orange-500" :
                      cls === "sky"    ? "text-sky-500"    :
                      cls === "purple" ? "text-purple-500" :
                      cls === "teal"   ? "text-teal-500"   :
                      "text-blue-600"
                    }>
                      {pct}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${cls}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="da-right-col">

          {/* Weekly Trend Card */}
          <div className="da-card weekly-trend-card">
            <div className="card-header-flex">
              <div>
                <h3>Weekly Attendance Trend</h3>
                <p>Jun 10 - Jun 17, 2026</p>
              </div>
              <div className="trend-nav">
                <button>&lt;</button>
                <button>&gt;</button>
              </div>
            </div>
            <div className="bar-chart-mock">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day, i) => {
                const heights = [80, 60, 85, 0, 80, 0, 0];
                const states  = ["present", "late", "present", "absent", "present", "none", "none"];
                const st      = states[i];
                return (
                  <div className="bar-col" key={day}>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ height: `${heights[i]}%` }} />
                    </div>
                    <span className="bar-day">{day}</span>
                    <span className="bar-icon">
                      {st === "present" && <CheckCircle size={14} className="text-green-500" />}
                      {st === "late"    && <Clock       size={14} className="text-orange-500" />}
                      {st === "absent"  && <XCircle     size={14} className="text-red-500" />}
                      {st === "none"    && <Calendar    size={14} className="text-gray-300" />}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent History Table */}
          <div className="da-card recent-history-card">
            <div className="card-header-flex">
              <h3>Recent Attendance History</h3>
              <button className="export-link">Export PDF ⭳</button>
            </div>
            <table className="da-table">
              <thead>
                <tr>
                  <th>DATE</th><th>DAY</th><th>CHECK IN</th>
                  <th>CHECK OUT</th><th>STATUS</th><th>HOURS</th><th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.date}</td>
                    <td>{row.day}</td>
                    <td>{row.check_in}</td>
                    <td>{row.check_out}</td>
                    <td>
                      <span className={`status-pill ${row.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="font-medium">{row.hours}</td>
                    <td><button className="view-link">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Bottom Row ── */}
          <div className="da-bottom-row">

            {/* Monthly Summary Card */}
            <div className="da-card monthly-summary-card">
              <div className="card-header-flex">
                <h3>Monthly Summary</h3>
                <span className="month-badge">June 2026</span>
              </div>
              <div className="summary-two-col">
                {/* Days breakdown */}
                <div>
                  <p className="summary-section-label">Days Breakdown</p>
                  <ul className="summary-list">
                    <li><span>Total Working Days</span><span className="font-bold">{statsData.totalWorkingDays}</span></li>
                    <li><span>Present Days</span><span className="font-bold text-green-600">{statsData.presentDays}</span></li>
                    <li><span>Absent Days</span><span className="font-bold text-red-500">{String(statsData.absentDays).padStart(2, "0")}</span></li>
                    <li><span>On Leave</span><span className="font-bold">{String(statsData.onLeave).padStart(2, "0")}</span></li>
                    <li><span>Holidays</span><span className="font-bold">{String(statsData.holidays).padStart(2, "0")}</span></li>
                  </ul>
                </div>
                {/* Status breakdown */}
                <div>
                  <p className="summary-section-label">Status Breakdown</p>
                  <ul className="summary-list">
                    <li>
                      <span className="summary-status-label"><CheckCircle size={14} className="text-green-500" /> Present</span>
                      <span className="font-bold">{statsData.presentDays}</span>
                    </li>
                    <li>
                      <span className="summary-status-label"><Home size={14} className="text-teal-500" /> Work From Home</span>
                      <span className="font-bold">{String(statsData.wfhCount).padStart(2, "0")}</span>
                    </li>
                    <li>
                      <span className="summary-status-label"><AlarmClock size={14} className="text-orange-500" /> Late Arrivals</span>
                      <span className="font-bold">{String(statsData.lateCount).padStart(2, "0")}</span>
                    </li>
                    <li>
                      <span className="summary-status-label"><Clock size={14} className="text-purple-500" /> Half Days</span>
                      <span className="font-bold">{String(statsData.halfDayCount).padStart(2, "0")}</span>
                    </li>
                    <li>
                      <span className="summary-status-label"><AlertCircle size={14} className="text-blue-500" /> On Leave</span>
                      <span className="font-bold">{String(statsData.onLeave).padStart(2, "0")}</span>
                    </li>
                    <li>
                      <span className="summary-status-label"><XCircle size={14} className="text-red-500" /> Absent</span>
                      <span className="font-bold text-red-500">{String(statsData.absentDays).padStart(2, "0")}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quality Care Card */}
            <div className="da-card quality-care-card">
              <div className="qc-icon"><Briefcase size={32} color="#1e3a8a" /></div>
              <h3>Quality Care Attendance</h3>
              <p>Your consistency ensures our patients receive the best care.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}