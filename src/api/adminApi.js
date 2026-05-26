import api from "./axios";

export const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get("/staff-management/dashboard/").then(res => res.data),
  sendHeartbeat: () => api.post("/staff-management/heartbeat/"),

  // Staff Management
  getStaffList: () => api.get("/staff-management/").then(res => res.data),
  getStaffDetails: (id) => api.get(`/staff-management/${id}/`).then(res => res.data),
  createStaff: (payload, config = {}) => api.post("/staff-management/", payload, config).then(res => res.data),
  updateStaff: (id, payload, config = {}) => api.post(`/staff-management/${id}/edit/`, payload, config).then(res => res.data),
  toggleStaffStatus: (id) => api.post(`/staff-management/${id}/toggle-status/`).then(res => res.data),
  getStaffAssignments: (id) => api.get(`/staff-management/${id}/assignments/`).then(res => res.data),

  // Departments
  getDepartments: () => api.get("/departments/").then(res => res.data),
  seedDepartments: () => api.post("/departments/seed/").then(res => res.data),
  getDepartmentStaff: (deptId) => api.get(`/departments/${deptId}/staff/`).then(res => res.data)
};

export default adminApi;
