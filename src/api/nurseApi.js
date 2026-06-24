import api from "./axios";

export const nurseApi = {
  //Vitals
  // Get vital details for a specific vital record
  getVitalDetails: (id) => api.get(`/nurse/vitals/${id}/`).then(res => res.data),
  // Update existing vital record
  updateVital: (id, payload) => api.put(`/nurse/vitals/${id}/`, payload).then(res => res.data),
  // Create new vital record
  createVital: (payload) => api.post(`/nurse/vitals/`, payload).then(res => res.data),
  // List all vitals (with optional params)
  getVitalsList: (params = "") => api.get(`/nurse/vitals/?${params}`).then(res => res.data),
  // Get vitals history for a specific patient
  getPatientVitals: (patientId) => api.get(`/nurse/vitals/?patient=${patientId}`).then(res => res.data),

  // Attendance
  getTodayAttendance: () => api.get("/attendance/my/").then(res => res.data),
  markAttendance: (payload) => api.post("/attendance/mark/", payload).then(res => res.data),
  updateAttendance: (payload) => api.put("/attendance/mark/", payload).then(res => res.data),
  getAttendanceHistory: (params) => api.get("/attendance/history/", { params }).then(res => res.data),
  getAttendanceStats: (params) => api.get("/attendance/stats/", { params }).then(res => res.data),

};

export default nurseApi;
