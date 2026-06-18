import React, { useState, useEffect } from "react";
import { doctorApi } from "../../api/doctorApi";
import { Calendar, Clock, BarChart2, Briefcase, CheckCircle, XCircle, AlertCircle, TrendingUp } from "lucide-react";
import "./doctor_attendance.css";

// Helper to format time "09:00:00" -> "09:00 AM"
const formatTime = (timeStr) => {
  if (!timeStr || timeStr === "--:--") return "--:--";
  const [h, m] = timeStr.split(':');
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
};

// Helper to format date "2026-06-17" -> "Jun 17, 2026"
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper to format full date "2026-06-17" + "Wednesday" -> "WEDNESDAY, JUNE 17, 2026"
const formatFullDate = (dateStr, dayName) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  const day = d.getDate();
  const year = d.getFullYear();
  return `${(dayName || "").toUpperCase()}, ${month} ${day}, ${year}`;
};

export default function DoctorAttendance() {
  const [loading, setLoading] = useState(false);
  const [todayData, setTodayData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const dummyToday = {
    check_in: "09:00 AM",
    check_out: "--:--",
    remarks: "Working on patient consultations",
    status: "Checked In",
    date: "WEDNESDAY, JUNE 17, 2026"
  };

  const dummyHistory = [
    { date: "Jun 16, 2026", day: "Tuesday", check_in: "09:12 AM", check_out: "05:04 PM", status: "Late", hours: "7.8h" },
    { date: "Jun 15, 2026", day: "Monday", check_in: "08:55 AM", check_out: "05:10 PM", status: "Present", hours: "8.2h" },
    { date: "Jun 14, 2026", day: "Sunday", check_in: "--:--", check_out: "--:--", status: "Holiday", hours: "0.0h" },
    { date: "Jun 13, 2026", day: "Saturday", check_in: "09:05 AM", check_out: "01:00 PM", status: "Half Day", hours: "4.0h" },
    { date: "Jun 12, 2026", day: "Friday", check_in: "08:58 AM", check_out: "05:00 PM", status: "Present", hours: "8.0h" },
  ];

  const dummyStats = {
    todayStatus: "Present", todayTime: "09:00 - 17:00",
    weekDays: "4/5 Days", weekPercent: "80% Attendance",
    monthDays: "18/22 Days", monthPercent: "82% Completion",
    attRate: "80%", attStatus: "Status: Good",
    distPresent: 73, distAbsent: 10, distLate: 7,
    totalWorkingDays: 22, presentDays: 18, absentDays: 2, onLeave: 1, holidays: 4
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const todayRes = await doctorApi.getTodayAttendance().catch(() => null);
      const histRes = await doctorApi.getAttendanceHistory({}).catch(() => null);
      const statsRes = await doctorApi.getAttendanceStats({}).catch(() => null);

      let parsedToday = dummyToday;
      if (todayRes?.success && todayRes.attendance) {
        const att = todayRes.attendance;
        parsedToday = {
          check_in: formatTime(att.check_in),
          check_out: formatTime(att.check_out),
          remarks: att.remarks || "No remarks",
          status: att.status_display || "Checked In",
          date: formatFullDate(att.date, att.day_name)
        };
      }
      setTodayData(parsedToday);

      let parsedHistory = dummyHistory;
      let histStats = null;
      let histDateRange = null;
      if (histRes?.success) {
        if (histRes.history) {
          parsedHistory = histRes.history.map(row => ({
            date: formatDate(row.date),
            day: row.day_name,
            check_in: formatTime(row.check_in),
            check_out: formatTime(row.check_out),
            status: row.status_display,
            hours: row.working_hours + "h"
          }));
        }
        histStats = histRes.statistics;
        histDateRange = histRes.date_range;
      }
      setHistoryData(parsedHistory);

      let parsedStats = dummyStats;
      if (statsRes?.success && statsRes.monthly_stats) {
        // Find current month stats
        const currentMonthNum = new Date().getMonth() + 1;
        const curMonthStats = statsRes.monthly_stats.find(m => m.month_num === currentMonthNum) || statsRes.monthly_stats[0];
        
        const total = histStats?.total_records || 1;
        const pPresent = Math.round(((histStats?.present || 0) / total) * 100) || 0;
        const pAbsent = Math.round(((histStats?.absent || 0) / total) * 100) || 0;
        const pLate = Math.round(((histStats?.late || 0) / total) * 100) || 0;

        parsedStats = {
          todayStatus: todayRes?.attendance?.status_display || "Not Checked In",
          todayTime: `${formatTime(todayRes?.attendance?.check_in)} - ${formatTime(todayRes?.attendance?.check_out)}`,
          weekDays: "4/5 Days", // Mocked as API doesn't provide weekly
          weekPercent: "80% Attendance",
          monthDays: `${curMonthStats?.present || 0}/${curMonthStats?.total_days || 30} Days`,
          monthPercent: `${Math.round(((curMonthStats?.present || 0)/(curMonthStats?.total_days || 30))*100)}% Completion`,
          attRate: `${histStats?.attendance_rate || 0}%`,
          attStatus: (histStats?.attendance_rate || 0) > 75 ? "Status: Good" : "Status: Needs Improvement",
          distPresent: pPresent,
          distAbsent: pAbsent,
          distLate: pLate,
          totalWorkingDays: histDateRange?.total_days || 30,
          presentDays: histStats?.present || 0,
          absentDays: histStats?.absent || 0,
          onLeave: histStats?.on_leave || 0,
          holidays: 0 // Mocked
        };
      }
      setStatsData(parsedStats);

    } catch (e) {
      console.error(e);
      setTodayData(dummyToday);
      setHistoryData(dummyHistory);
      setStatsData(dummyStats);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInOut = async (actionType) => {
    try {
      await doctorApi.markAttendance({ action: actionType });
      fetchData();
    } catch (e) {
      console.log("Mock mark attendance", actionType);
    }
  };

  const handleUpdate = async () => {
    try {
      await doctorApi.updateAttendance({ action: "update" });
      fetchData();
    } catch (e) {
      console.log("Mock update attendance");
    }
  };

  if (loading || !statsData || !todayData) return <div className="p-6">Loading...</div>;

  const isCheckedIn = todayData.check_in && todayData.check_in !== "--:--";
  const isCheckedOut = todayData.check_out && todayData.check_out !== "--:--";

  return (
    <div className="doc-attendance-container">
      <div className="da-header">
        <h2>Attendance Dashboard</h2>
        <p>Welcome back, Dr. Anjali. Monitoring clinic operations for June 17, 2026.</p>
      </div>

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

      <div className="da-main-grid">
        <div className="da-left-col">
          <div className="da-card current-status-card">
            <div className="cs-header">
              <h3>Current Status</h3>
              <span className="badge-checked-in">Checked In</span>
            </div>
            
            <div className="cs-time-display">
              <span className="cs-label">Logged In at</span>
              <h1 className="cs-time">09:00 AM</h1>
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
              <p>{todayData.remarks}</p>
            </div>

            <div className="cs-actions">
              <button 
                className={!isCheckedIn ? "btn-primary" : "btn-secondary"} 
                disabled={isCheckedIn}
                onClick={() => handleCheckInOut("check_in")}
              >
                Check In
              </button>
              <button 
                className={isCheckedIn && !isCheckedOut ? "btn-primary" : "btn-secondary"} 
                disabled={!isCheckedIn || isCheckedOut}
                onClick={() => handleCheckInOut("check_out")}
              >
                Check Out
              </button>
            </div>
            <div className="cs-actions-sub">
              <button className="btn-outline" onClick={handleUpdate}>Update</button>
              <button className="btn-outline" onClick={handleUpdate}>Correction</button>
            </div>
          </div>

          <div className="da-card att-dist-card">
            <h3>Attendance Distribution</h3>
            <div className="dist-bars">
              <div className="dist-item">
                <div className="dist-label">
                  <span>Present</span>
                  <span>{statsData.distPresent}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill blue" style={{width: `${statsData.distPresent}%`}}></div></div>
              </div>
              <div className="dist-item">
                <div className="dist-label">
                  <span>Absent</span>
                  <span className="text-red-500">{statsData.distAbsent}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill red" style={{width: `${statsData.distAbsent}%`}}></div></div>
              </div>
              <div className="dist-item">
                <div className="dist-label">
                  <span>Late</span>
                  <span className="text-orange-500">{statsData.distLate}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill orange" style={{width: `${statsData.distLate}%`}}></div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="da-right-col">
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
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => {
                const heights = [80, 60, 85, 0, 80, 0, 0];
                const states = ['present', 'late', 'present', 'absent', 'present', 'none', 'none'];
                const st = states[i];
                return (
                  <div className="bar-col" key={day}>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ height: `${heights[i]}%` }}></div>
                    </div>
                    <span className="bar-day">{day}</span>
                    <span className="bar-icon">
                      {st === 'present' && <CheckCircle size={14} className="text-green-500" />}
                      {st === 'late' && <Clock size={14} className="text-orange-500" />}
                      {st === 'absent' && <XCircle size={14} className="text-red-500" />}
                      {st === 'none' && <Calendar size={14} className="text-gray-300" />}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="da-card recent-history-card">
            <div className="card-header-flex">
              <h3>Recent Attendance History</h3>
              <button className="export-link">Export PDF ⭳</button>
            </div>
            
            <table className="da-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>DAY</th>
                  <th>CHECK IN</th>
                  <th>CHECK OUT</th>
                  <th>STATUS</th>
                  <th>HOURS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.date}</td>
                    <td>{row.day}</td>
                    <td>{row.check_in}</td>
                    <td>{row.check_out}</td>
                    <td><span className={`status-pill ${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span></td>
                    <td className="font-medium">{row.hours}</td>
                    <td><button className="view-link">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="da-bottom-row">
            <div className="da-card monthly-summary-card">
              <div className="card-header-flex">
                <h3>Monthly Summary</h3>
                <span className="month-badge">June 2026</span>
              </div>
              <ul className="summary-list">
                <li><span>Total Working Days</span> <span className="font-bold">{statsData.totalWorkingDays}</span></li>
                <li><span>Present Days</span> <span className="font-bold text-green-600">{statsData.presentDays}</span></li>
                <li><span>Absent Days</span> <span className="font-bold text-red-500">0{statsData.absentDays}</span></li>
                <li><span>On Leave</span> <span className="font-bold">0{statsData.onLeave}</span></li>
                <li><span>Holidays</span> <span className="font-bold">0{statsData.holidays}</span></li>
              </ul>
            </div>
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
