import api from "./axios";

export const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get("/staff-management/dashboard/").then(res => res.data),
  sendHeartbeat: () => api.post("/staff-management/heartbeat/"),

  // Staff Management
  getStaffList: () => api.get("/staff-management/").then(res => res.data),
  getStaffDetails: (id) => api.get(`/staff-management/${id}/`).then(res => res.data),
  createStaff: (payload, config = {}) => api.post("/staff-management/", payload, config).then(res => res.data),
  updateStaff: (id, payload, config = {}) => api.patch(`/staff-management/${id}/`, payload, config).then(res => res.data),
  toggleStaffStatus: (id) => api.post(`/staff-management/${id}/toggle-status/`).then(res => res.data),
  getStaffAssignments: (id) => api.get(`/staff-management/${id}/assignments/`).then(res => res.data),

  // Departments
  getDepartments: () => api.get("/departments/").then(res => res.data),
  addDepartment: (payload) => api.post("/departments/", payload).then(res => res.data),
  updateDepartment: (id, payload) => api.patch(`/departments/${id}/`, payload).then(res => res.data),
  seedDepartments: () => api.post("/departments/seed/").then(res => res.data),
  getDepartmentStaff: (deptId) => api.get(`/departments/${deptId}/staff/`).then(res => res.data),
  setDepartmentHead: (deptId, staffId) => api.post(`/departments/${deptId}/set-head/`, { staff_id: staffId }).then(res => res.data),
  clearDepartmentHead: (deptId) => api.post(`/departments/${deptId}/set-head/`, { staff_id: null }).then(res => res.data),

  // Lab Management
  getLabStatistics: () => api.get("/lab/statistics/").then(res => res.data),
  getTestTypes: () => api.get("/lab/test-types/").then(res => res.data),
  getTestTypeDetails: (id) => api.get(`/lab/test-types/${id}/`).then(res => res.data),
  createTestType: (payload) => api.post("/lab/test-types/", payload).then(res => res.data),
  updateTestType: (id, payload) => api.put(`/lab/test-types/${id}/`, payload).then(res => res.data),
  toggleTestType: (id) => api.delete(`/lab/test-types/${id}/`).then(res => res.data),

  // Hospital Settings
  getPublicHospitalSettings: () => api.get("/hospital/settings/public/").then(res => res.data),
  getHospitalSettings: () => api.get("/hospital/settings/").then(res => res.data),
  getHospitalSettingsById: (id) => api.get(`/hospital/settings/${id}/`).then(res => res.data),
  updateHospitalSettings: (id, payload, config = {}) => api.patch(`/hospital/settings/${id}/`, payload, config).then(res => res.data),
  putHospitalSettings: (id, payload, config = {}) => api.put(`/hospital/settings/${id}/`, payload, config).then(res => res.data),
};

export default adminApi;
