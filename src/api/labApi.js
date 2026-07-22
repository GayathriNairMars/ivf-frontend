import api from "./axios";

export const labApi = {
  // Attendance
  getTodayAttendance: () => api.get("/attendance/my/").then(res => res.data),
  markAttendance: (payload) => api.post("/attendance/mark/", payload).then(res => res.data),
  updateAttendance: (payload) => api.put("/attendance/mark/", payload).then(res => res.data),
  getAttendanceHistory: (params) => api.get("/attendance/history/", { params }).then(res => res.data),
  getAttendanceStats: (params) => api.get("/attendance/stats/", { params }).then(res => res.data),
  
  // Profile / Settings
  getProfile: () => api.get("/lab/profile/").then(res => res.data),
  updateProfile: (payload) => api.put("/lab/profile/", payload).then(res => res.data),
  deleteProfile: () => api.delete("/lab/profile/").then(res => res.data),

  // Dashboard & Records
  getTestTypes: () => api.get("/lab/test-types/").then(res => res.data),
  getStatistics: () => api.get("/lab/statistics/").then(res => res.data),
  getRecentRecords: (params) => api.get("/lab/records/", { params }).then(res => res.data),
  getRecords: (params) => api.get("/lab/records/", { params }).then(res => res.data),
  createRecord: (payload) => api.post("/lab/records/", payload).then(res => res.data),
  getRecordDetails: (id) => api.get(`/lab/records/${id}/`).then(res => res.data),
  updateRecord: (id, payload) => api.put(`/lab/records/${id}/`, payload).then(res => res.data),
  deleteRecord: (id) => api.delete(`/lab/records/${id}/`).then(res => res.data),
  getPatientHistory: (patientId) => api.get("/lab/records/", { params: { patient: patientId } }).then(res => res.data),

  // Lab Orders
  getLabOrders: (params) => api.get("/lab/orders/", { params }).then(res => res.data),
  getLabOrderDetails: (id) => api.get(`/lab/orders/${id}/`).then(res => res.data),
  updateLabOrder: (id, payload) => api.put(`/lab/orders/${id}/`, payload).then(res => res.data),
  cancelLabOrder: (id) => api.post(`/lab/orders/${id}/cancel/`).then(res => res.data),
};

export default labApi;