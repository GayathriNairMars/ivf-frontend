import api from './axios';

export const hrApi = {
  getStaff: async (params) => {
    const response = await api.get('/hr/staff/', { params });
    return response.data;
  },

  toggleStaffStatus: async (staffId, action) => {
    const response = await api.post('/hr/staff/', { staff_id: staffId, action: action });
    return response.data;
  },
  createStaff: (payload, config = {}) => api.post("/hr/staff/add/", payload, config).then(res => res.data),
  // Departments
  getDepartments: () => api.get("/departments/").then(res => res.data),
  addDepartment: (payload) => api.post("/departments/", payload).then(res => res.data),
  updateDepartment: (id, payload) => api.patch(`/departments/${id}/`, payload).then(res => res.data),
  seedDepartments: () => api.post("/departments/seed/").then(res => res.data),
  getDepartmentStaff: (deptId) => api.get(`/departments/${deptId}/staff/`).then(res => res.data),
  setDepartmentHead: (deptId, staffId) => api.post(`/departments/${deptId}/set-head/`, { staff_id: staffId }).then(res => res.data),
  clearDepartmentHead: (deptId) => api.post(`/departments/${deptId}/set-head/`, { staff_id: null }).then(res => res.data),

  // Shifts
  getShifts: () => api.get("/hr/shifts/").then(res => res.data),
  createShift: (payload) => api.post("/hr/shifts/", payload).then(res => res.data),
  updateShift: (id, payload) => api.put(`/hr/shifts/${id}/`, payload).then(res => res.data),
  deleteShift: (id) => api.delete(`/hr/shifts/${id}/`).then(res => res.data),

  // Shift Assignments
  getShiftAssignments: (params) => api.get("/hr/shift-assignments/", { params }).then(res => res.data),
  assignShift: (payload) => api.post("/hr/shift-assignments/", payload).then(res => res.data),
  bulkAssignShifts: (payload) => api.post("/hr/shift-assignments/bulk/", payload).then(res => res.data),
  deleteShiftAssignment: (id) => api.delete(`/hr/shift-assignments/${id}/`).then(res => res.data),
};

export default hrApi;