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
};

export default labApi;