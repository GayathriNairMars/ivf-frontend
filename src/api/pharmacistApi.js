import api from "./axios";

export const pharmacistApi = {
  // Attendance
  getTodayAttendance: () => api.get("/attendance/my/").then(res => res.data),
  markAttendance: (payload) => api.post("/attendance/mark/", payload).then(res => res.data),
  updateAttendance: (payload) => api.put("/attendance/mark/", payload).then(res => res.data),
  getAttendanceHistory: (params) => api.get("/attendance/history/", { params }).then(res => res.data),
  getAttendanceStats: (params) => api.get("/attendance/stats/", { params }).then(res => res.data),

  // Inventory
  addInventory: (payload) => api.post("/pharmacy/inventory/", payload).then(res => res.data),

  // Prescriptions
  getPrescriptions: (params) => api.get("/pharmacy/prescriptions/", { params }).then(res => res.data),
  getPrescriptionDetails: (id) => api.get(`/pharmacy/prescriptions/${id}/`).then(res => res.data),
  updatePrescriptionStatus: (id, payload) => api.patch(`/pharmacy/prescriptions/${id}/`, payload).then(res => res.data),
  fulfillPrescription: (id, payload) => api.post(`/pharmacy/prescriptions/${id}/fulfill/`, payload).then(res => res.data),

  // Billing
  getBillingDashboard: () => api.get("/pharmacy/billing/dashboard/").then(res => res.data),
  getBillsList: (params) => api.get("/pharmacy/bills/", { params }).then(res => res.data),
  getBillDetail: (id) => api.get(`/pharmacy/bills/${id}/`).then(res => res.data),
  payBill: (id, payload) => api.post(`/pharmacy/bills/${id}/pay/`, payload).then(res => res.data),
  cancelBill: (id) => api.delete(`/pharmacy/bills/${id}/`).then(res => res.data),
  createBill: (payload) => api.post("/pharmacy/bills/", payload).then(res => res.data),
};

export default pharmacistApi;