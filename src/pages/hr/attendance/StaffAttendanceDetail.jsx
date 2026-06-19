import React, { useState, useEffect } from 'react';
import hrApi from '../../../api/hrApi';
import { ArrowLeft, Download } from 'lucide-react';
import './hr_attendance.css'; // or we can create a new css

export default function StaffAttendanceDetail({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Inject tailwind script if not present (only for this view to support the user's specific HTML)
    let script = document.getElementById('tailwind-cdn');
    if (!script) {
      script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
      document.head.appendChild(script);
      
      const configScript = document.createElement('script');
      configScript.innerHTML = `
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "primary-fixed": "#d6e3ff", "error-container": "#ffdad6", "on-primary-container": "#c8daff", "surface-dim": "#d2dbe4",
                "surface-container": "#e6eff8", "surface-container-lowest": "#ffffff", "outline-variant": "#c2c6d4", "primary-container": "#005eb8",
                "background": "#f6faff", "tertiary-fixed-dim": "#ffb691", "error": "#ba1a1a", "tertiary": "#793100",
                "secondary-container": "#7af1fc", "secondary": "#006970", "surface-container-low": "#ecf5fe", "on-secondary-fixed": "#002022",
                "on-error-container": "#93000a", "tertiary-fixed": "#ffdbcb", "surface-container-highest": "#dbe4ed", "outline": "#727783",
                "on-surface": "#141d23", "on-surface-variant": "#424752", "on-primary": "#ffffff", "primary": "#00478d"
              }
            }
          }
        }
      `;
      document.head.appendChild(configScript);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [userId, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await hrApi.getStaffAttendance(userId, params);
      setData(res);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || "Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading details...</div>;
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button onClick={onClose} className="px-4 py-2 border border-outline rounded-lg hover:bg-surface-container">Go Back</button>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center">No data found</div>;
  }

  // API response shape: { success, staff, date_range, statistics, attendance }
  const staff       = data.staff       || { name: 'Staff Member', role: 'Unknown', id: userId };
  const stats       = data.statistics  || {};
  const dateRange   = data.date_range  || {};
  const records     = Array.isArray(data.attendance) ? data.attendance : [];

  return (
    <div className="bg-background min-h-screen font-sans">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
              <span onClick={onClose} className="cursor-pointer hover:text-primary">Attendance Management</span>
              <span>/</span>
              <span onClick={onClose} className="cursor-pointer hover:text-primary">All Attendance</span>
              <span>/</span>
              <span className="text-primary font-medium">View Attendance</span>
            </div>
            <h2 className="text-3xl font-bold text-on-surface">Staff Attendance</h2>
            <p className="text-on-surface-variant text-sm mt-1">{staff.name} • {staff.role_display || staff.role}</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant">
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="text-sm px-2 py-1 rounded bg-transparent border-none focus:ring-0" />
              <span className="mx-2 text-outline-variant">-</span>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="text-sm px-2 py-1 rounded bg-transparent border-none focus:ring-0" />
            </div>
            <button className="px-4 py-2 border border-outline rounded-lg text-on-surface text-sm hover:bg-surface-container transition-colors flex items-center gap-2 font-medium">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* KPI Cards */}
          <div className="col-span-12 lg:col-span-9 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32 hover:scale-[1.02] transition-transform cursor-pointer">
              <span className="text-sm font-semibold text-on-surface-variant">Total Days</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{dateRange.total_days || stats.total_records || records.length}</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32 hover:scale-[1.02] transition-transform cursor-pointer">
              <span className="text-sm font-semibold text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Present
              </span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{stats.present || 0}</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32 hover:scale-[1.02] transition-transform cursor-pointer">
              <span className="text-sm font-semibold text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Absent
              </span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{stats.absent || 0}</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32 hover:scale-[1.02] transition-transform cursor-pointer">
              <span className="text-sm font-semibold text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Late
              </span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{stats.late || 0}</span>
              </div>
            </div>
            <div className="bg-primary text-white p-4 rounded-xl shadow-sm flex flex-col justify-between h-32 hover:scale-[1.02] transition-transform cursor-pointer">
              <span className="text-sm font-semibold">Rate</span>
              <div className="flex flex-col">
                <span className="text-3xl font-bold">{Number(stats.attendance_rate || 0).toFixed(1)}%</span>
                <div className="w-full bg-white/20 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-white h-full" style={{ width: `${Math.min(stats.attendance_rate || 0, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="col-span-12 lg:col-span-3 lg:row-span-2 bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 flex items-center justify-center text-2xl font-bold text-gray-500 overflow-hidden border-4 border-primary-fixed">
              {staff.name ? staff.name.charAt(0) : 'S'}
            </div>
            <h3 className="text-xl font-bold">{staff.name}</h3>
            <p className="text-on-surface-variant text-xs mb-1">{staff.email}</p>
            <p className="text-on-surface-variant text-sm mb-4">ID: {staff.id}</p>
            
            <div className="w-full space-y-2 mb-6 text-left">
              <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-500 text-sm">Role</span>
                <span className="text-gray-800 text-sm font-medium">{staff.role_display || staff.role}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-500 text-sm">Date Range</span>
                <span className="text-gray-800 text-xs font-medium">{dateRange.start_date} → {dateRange.end_date}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="col-span-12 lg:col-span-9 bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center">
              <h4 className="text-lg font-bold">Daily Attendance Log</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Check In</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Check Out</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No attendance records found for this period.</td></tr>
                  ) : records.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{r.date}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{r.check_in ? r.check_in.slice(0,5) : '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{r.check_out ? r.check_out.slice(0,5) : '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{r.total_hours ? `${r.total_hours}h` : '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          r.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                          r.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                          r.status === 'LATE' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {r.status_display || r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
