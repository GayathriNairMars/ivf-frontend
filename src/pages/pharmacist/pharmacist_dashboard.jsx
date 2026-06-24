import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import { 
  PlusCircle, 
  Settings, 
  Clock, 
  Activity, 
  AlertTriangle, 
  XSquare, 
  CheckCircle2, 
  TrendingUp,
  Package,
  Bell,
  Wallet,
  DollarSign,
  PieChart
} from "lucide-react";
import "./pharmacist_dashboard.css";

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, summaryRes] = await Promise.all([
          axios.get("/pharmacy/dashboard/"),
          axios.get("/pharmacy/dashboard/summary/")
        ]);

        if (dashboardRes.data.success) {
          setDashboardData(dashboardRes.data.dashboard);
        }
        if (summaryRes.data.success) {
          setSummaryData(summaryRes.data.summary);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-dashboard-loading">Loading Dashboard...</div>;
  }

  // Fallbacks if data fails to load
  const meds = summaryData?.medications || {};
  const fin = summaryData?.financial || {};
  
  const alerts = dashboardData?.alerts?.recent_alerts || [];
  const categories = dashboardData?.category_breakdown || [];
  const trends = dashboardData?.trends?.daily_trend || [];
  const expiringMeds = dashboardData?.expiry_metrics?.expiring_medications || [];
  const recentActivity = dashboardData?.recent_activity?.adjustments || [];
  const mostStocked = dashboardData?.top_items?.most_stocked || [];
  const lowestStock = dashboardData?.top_items?.lowest_stock || [];

  return (
    <div className="p-dashboard-container">
      {/* Header Banner */}
      <div className="p-header-banner">
        <div className="p-header-content">
          <h2 className="p-welcome-text">Welcome back, {user?.full_name || "Pharmacist"}</h2>
          <div className="p-header-badges">
            <span className="p-badge"><span className="material-symbols-outlined icon-small">store</span> Main Branch</span>
            <span className="p-badge"><span className="material-symbols-outlined icon-small">school</span> B.Pharm</span>
            <span className="p-badge"><span className="material-symbols-outlined icon-small">badge</span> LIC-12345</span>
          </div>
        </div>
        <div className="p-shift-status">
          <div className="p-shift-info">
            <span className="p-shift-label">SHIFT STATUS</span>
            <span className="p-shift-val">Active Now</span>
          </div>
          <div className="p-shift-icon">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="p-kpi-grid">
        <div className="p-kpi-card">
          <div className="p-kpi-header">
            <span className="p-kpi-title">Total Meds</span>
            <Package size={16} className="text-gray-400" />
          </div>
          <div className="p-kpi-value">{meds.total || 0}</div>
          <div className="p-kpi-sub text-green"><TrendingUp size={12}/> +3% this week</div>
        </div>
        <div className="p-kpi-card">
          <div className="p-kpi-header">
            <span className="p-kpi-title">In Stock</span>
            <CheckCircle2 size={16} className="text-gray-400" />
          </div>
          <div className="p-kpi-value">{meds.in_stock || 0}</div>
        </div>
        <div className="p-kpi-card">
          <div className="p-kpi-header">
            <span className="p-kpi-title">Out of Stock</span>
            <XSquare size={16} className="text-red-500" />
          </div>
          <div className="p-kpi-value text-red-500">{meds.out_of_stock || 0}</div>
        </div>
        <div className="p-kpi-card">
          <div className="p-kpi-header">
            <span className="p-kpi-title">Low Stock</span>
            <AlertTriangle size={16} className="text-orange-500" />
          </div>
          <div className="p-kpi-value text-orange-500">{meds.low_stock || 0}</div>
        </div>
        <div className="p-kpi-card">
          <div className="p-kpi-header">
            <span className="p-kpi-title">Critical</span>
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div className="p-kpi-value text-red-600">{meds.critical || 0}</div>
        </div>
        <div className="p-kpi-card bg-green-50 border-green">
          <div className="p-kpi-header">
            <span className="p-kpi-title text-green-700">Stock Health</span>
          </div>
          <div className="p-kpi-value text-green-700">80%</div>
          <div className="p-health-bar">
            <div className="p-health-fill" style={{ width: '80%' }}></div>
          </div>
        </div>
      </div>

      {/* Financial Metrics Row */}
      <div className="p-fin-grid">
        <div className="p-fin-card">
          <span className="p-fin-label">INVENTORY VALUE</span>
          <span className="p-fin-value">${(fin.total_value || 0).toLocaleString()}</span>
          <Wallet className="p-fin-icon" size={24} />
        </div>
        <div className="p-fin-card">
          <span className="p-fin-label">TOTAL COST</span>
          <span className="p-fin-value">${(fin.total_cost || 0).toLocaleString()}</span>
        </div>
        <div className="p-fin-card bg-green-light">
          <span className="p-fin-label">POTENTIAL PROFIT</span>
          <span className="p-fin-value">${(fin.potential_profit || 0).toLocaleString()}</span>
        </div>
        <div className="p-fin-card">
          <div className="p-margin-info">
            <span className="p-fin-label">PROFIT MARGIN</span>
            <span className="p-fin-value text-green-600">39.6%</span>
          </div>
          <div className="p-margin-chart">
             <svg viewBox="0 0 36 36" className="circular-chart green">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle" strokeDasharray="39.6, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
          </div>
        </div>
      </div>

      <div className="p-main-content-grid">
        {/* Left Column */}
        <div className="p-col-left">
          {/* Stock Alerts */}
          <div className="p-card">
            <div className="p-card-header">
              <h3 className="p-card-title"><Bell size={18}/> Stock Alerts</h3>
              <a href="#" className="p-card-link">View All Notifications</a>
            </div>
            <div className="p-alerts-list">
              {alerts.slice(0, 3).map((alert, idx) => (
                <div key={idx} className={`p-alert-item ${alert.alert_type === 'CRITICAL' ? 'alert-critical' : alert.alert_type === 'LOW_STOCK' ? 'alert-low' : 'alert-expiring'}`}>
                  <div className="p-alert-icon">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="p-alert-content">
                    <h4 className="p-alert-title">{alert.alert_type_display}: {alert.medication_name}</h4>
                    <p className="p-alert-desc">{alert.message}</p>
                  </div>
                  <button className={`p-alert-btn ${alert.alert_type === 'CRITICAL' ? 'btn-red' : alert.alert_type === 'LOW_STOCK' ? 'btn-orange' : 'btn-green'}`}>
                    {alert.alert_type === 'EXPIRING' ? '12 DAYS' : 'Restock'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Distribution */}
          <div className="p-card">
            <div className="p-card-header">
              <h3 className="p-card-title">Inventory Distribution by Category</h3>
            </div>
            <div className="p-dist-list">
              {categories.map((cat, idx) => {
                const colors = ['#059669', '#10b981', '#6b7280', '#6ee7b7'];
                return (
                  <div key={idx} className="p-dist-item">
                    <div className="p-dist-info">
                      <span className="p-dist-name">{cat.name.toUpperCase()}</span>
                      <span className="p-dist-val">{cat.medication_count} ITEMS</span>
                    </div>
                    <div className="p-dist-bar-bg">
                      <div className="p-dist-bar-fill" style={{ width: `${Math.min(100, (cat.medication_count / meds.total) * 100 * 5)}%`, backgroundColor: colors[idx % colors.length] }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Inventory Trends */}
          <div className="p-card">
            <div className="p-card-header">
              <h3 className="p-card-title">Inventory Trends (Last 7 Days)</h3>
              <div className="p-trend-legend">
                <span className="legend-item"><span className="dot dot-green"></span> Additions</span>
                <span className="legend-item"><span className="dot dot-red"></span> Sales</span>
              </div>
            </div>
            <div className="p-trend-chart-area">
               {/* Placeholder for chart */}
               <div className="p-trend-bars">
                 {trends.map((t, idx) => (
                   <div key={idx} className="p-trend-bar-group">
                      <div className="bar-wrapper">
                        <div className="bar-val bar-add" style={{height: `${t.additions * 10}px`}}></div>
                        <div className="bar-val bar-sale" style={{height: `${t.removals * 10}px`}}></div>
                      </div>
                      <span className="bar-label">{t.date.split(' ')[0]}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="p-col-right">
           {/* Expiry Status */}
           <div className="p-card">
             <div className="p-card-header">
               <h3 className="p-card-title">Expiry Status</h3>
             </div>
             <div className="p-expiry-chart">
                <svg viewBox="0 0 36 36" className="donut-chart">
                  <path className="donut-segment good" strokeDasharray="60, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="donut-segment warning" strokeDasharray="20, 100" strokeDashoffset="-60" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="donut-segment danger" strokeDasharray="10, 100" strokeDashoffset="-80" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="donut-segment none" strokeDasharray="10, 100" strokeDashoffset="-90" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="16" className="donut-total">{meds.total}</text>
                  <text x="18" y="22" className="donut-label">Items</text>
                </svg>
                <div className="p-expiry-legend">
                  <div className="legend-row">
                    <span><span className="dot dot-green"></span> Good: 1,100</span>
                    <span><span className="dot dot-orange"></span> 30 Days: 45</span>
                  </div>
                  <div className="legend-row">
                    <span><span className="dot dot-red"></span> Expired: 23</span>
                    <span><span className="dot dot-gray"></span> None: 66</span>
                  </div>
                </div>
             </div>
           </div>

           {/* Expiring Medications */}
           <div className="p-card">
              <h3 className="p-card-title-small">EXPIRING MEDICATIONS</h3>
              <div className="p-exp-list">
                {expiringMeds.map((med, idx) => (
                  <div key={idx} className="p-exp-item">
                    <span className="p-exp-name">{med.name}</span>
                    <span className={`p-exp-badge ${med.is_expired ? 'badge-red' : 'badge-orange'}`}>
                      {med.is_expired ? 'EXPIRED' : 'SOON'}
                    </span>
                  </div>
                ))}
              </div>
           </div>

           {/* Recent Activity */}
           <div className="p-card flex-1">
             <div className="p-card-header">
               <h3 className="p-card-title">Recent Activity</h3>
             </div>
             <div className="p-activity-list">
               {recentActivity.slice(0, 3).map((act, idx) => (
                 <div key={idx} className="p-activity-item">
                   <div className="p-activity-icon-wrapper">
                     <div className={`p-act-icon ${act.adjustment_type === 'ADD' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {act.adjustment_type === 'ADD' ? <PlusCircle size={14}/> : <TrendingUp size={14} />}
                     </div>
                     {idx !== 2 && <div className="p-act-line"></div>}
                   </div>
                   <div className="p-act-content">
                     <h4 className="p-act-title">{act.adjustment_type_display}</h4>
                     <p className="p-act-desc">{act.notes || `Adjusted ${act.quantity} units of ${act.medication_name}`}</p>
                     <span className="p-act-time">2 HOURS AGO</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="p-bottom-grid">
         <div className="p-card">
           <div className="p-card-header">
             <h3 className="p-card-title text-green-700"><span className="material-symbols-outlined">keyboard_arrow_up</span> Most Stocked</h3>
           </div>
           <table className="p-table">
             <thead>
               <tr>
                 <th>MEDICATION NAME</th>
                 <th className="text-right">QTY</th>
                 <th className="text-right">VALUE</th>
               </tr>
             </thead>
             <tbody>
               {mostStocked.map((item, idx) => (
                 <tr key={idx}>
                   <td className="font-medium text-gray-800">{item.name}</td>
                   <td className="text-right text-gray-600">{item.current_stock}</td>
                   <td className="text-right font-bold text-gray-800">${(item.current_stock * item.selling_price).toLocaleString()}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>

         <div className="p-card">
           <div className="p-card-header">
             <h3 className="p-card-title text-red-600"><span className="material-symbols-outlined">keyboard_arrow_down</span> Lowest Stock</h3>
           </div>
           <table className="p-table">
             <thead>
               <tr>
                 <th>MEDICATION NAME</th>
                 <th className="text-right">QTY</th>
                 <th className="text-right">STATUS</th>
               </tr>
             </thead>
             <tbody>
               {lowestStock.map((item, idx) => (
                 <tr key={idx}>
                   <td className="font-medium text-gray-800">{item.name}</td>
                   <td className="text-right text-red-600 font-bold">{item.current_stock}</td>
                   <td className="text-right">
                     <span className={`p-table-badge ${item.stock_status === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                       {item.stock_status}
                     </span>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}
