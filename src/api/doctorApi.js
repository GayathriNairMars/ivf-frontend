import api from './axios';

export const doctorApi = {
  getQueue: async () => {
    const response = await api.get('/doctor/queue/');
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/doctor/dashboard/');
    return response.data;
  },

  startConsultation: async (ticketId) => {
    // We assume the API expects action and ticket_id
    const response = await api.post('/doctor/queue/', { action: 'start', ticket_id: ticketId });
    return response.data;
  },

  completeConsultation: async (ticketId) => {
    const response = await api.post('/doctor/queue/', { action: 'complete', ticket_id: ticketId });
    return response.data;
  },

  getCompletedPatients: async (page = 1, filters = {}) => {
    let url = `/doctor/completed/?page=${page}`;
    if (filters.date) url += `&date=${filters.date}`;
    if (filters.start_date) url += `&start_date=${filters.start_date}`;
    if (filters.end_date) url += `&end_date=${filters.end_date}`;
    const response = await api.get(url);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/doctor/profile/');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/doctor/profile/', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.post('/doctor/change-password/', data);
    return response.data;
  },

  getPatients: async ({ page = 1, page_size = 20, search = '', status = '',treatment='', sort_by = '' } = {}) => {
    let url = `/doctor/patients/?page=${page}&page_size=${page_size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (treatment) url += `&treatment=${encodeURIComponent(treatment)}`;
    if (sort_by) url += `&sort_by=${encodeURIComponent(sort_by)}`;
    const response = await api.get(url);
    return response.data;
  },
  getCalendar: (start, end) => api.get(`/doctor/calendar/`, { params: { start_date: start, end_date: end } }).then(res => res.data),

  getPrescriptions: async ({ search, start_date, end_date, status } = {}) => {
    let url = `/doctor/prescriptions/?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (start_date) url += `start_date=${start_date}&`;
    if (end_date) url += `end_date=${end_date}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;

    // Remove trailing '&' or '?'
    url = url.endsWith('&') || url.endsWith('?') ? url.slice(0, -1) : url;

    const response = await api.get(url);
    return response.data;
  },

  getPatientPrescriptions: async (patient_id) => {
    const response = await api.get(`/doctor/prescriptions/?patient_id=${patient_id}`);
    return response.data;
  },

  createPrescription: async (data) => {
    const response = await api.post('/doctor/prescriptions/', data);
    return response.data;
  },

  // ── Medicines ───────────────────────────────────────────────────────────
  getMedicines: async ({ search = '', category = '', status = '', sort_by = '', page = 1, page_size = 20 } = {}) => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('page_size', page_size);
    if (search)    params.set('search',    search);
    if (category)  params.set('category',  category);
    if (status)    params.set('status',    status);
    if (sort_by)   params.set('sort_by',   sort_by);
    const response = await api.get(`/doctor/medicines/?${params.toString()}`);
    return response.data;
  },

  getMedicineCategories: async () => {
    const response = await api.get('/doctor/medicines/categories/');
    return response.data;
  },

  // Attendance
  getTodayAttendance: () => api.get("/attendance/my/").then(res => res.data),
  markAttendance: (payload) => api.post("/attendance/mark/", payload).then(res => res.data),
  updateAttendance: (payload) => api.put("/attendance/mark/", payload).then(res => res.data),
  getAttendanceHistory: (params) => api.get("/attendance/history/", { params }).then(res => res.data),
  getAttendanceStats: (params) => api.get("/attendance/stats/", { params }).then(res => res.data),
};
