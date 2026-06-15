import api from './axios';

export const hrApi = {
  getStaff: async () => {
    const response = await api.get('/hr/staff/');
    return response.data;
  },

  toggleStaffStatus: async (staffId, action) => {
    // We assume the backend expects POST /hr/staff/ with id and action
    const response = await api.post('/hr/staff/', { id: staffId, action: action });
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
};

export default hrApi;