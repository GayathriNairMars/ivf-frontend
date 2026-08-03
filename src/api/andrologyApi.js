import api from "./axios";

export const AndrologyApi ={
  // Profile / Settings
  getProfile: () => api.get("/andrology/profile/").then(res => res.data),
  updateProfile: (payload) => api.put("/andrology/profile/", payload).then(res => res.data),
  deleteProfile: () => api.delete("/andrology/profile/").then(res => res.data),
  changePassword: async (data) => {
    const response = await api.post('/andrology/change-password/', data);
    return response.data;
  },
  // Attendance
  getTodayAttendance: () => api.get("/attendance/my/").then(res => res.data),
  markAttendance: (payload) => api.post("/attendance/mark/", payload).then(res => res.data),
  updateAttendance: (payload) => api.put("/attendance/mark/", payload).then(res => res.data),
  getAttendanceHistory: (params) => api.get("/attendance/history/", { params }).then(res => res.data),
  getAttendanceStats: (params) => api.get("/attendance/stats/", { params }).then(res => res.data),
};

export default AndrologyApi;