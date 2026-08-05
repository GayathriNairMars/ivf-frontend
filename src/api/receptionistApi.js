import api from "./axios";
 
export const receptionistApi = {
  // Dashboard & Queues
  getDashboardStats: (params) => api.get("/receptionist/dashboard/", { params }).then(res => res.data),
  getTodayTickets: () => api.get("/receptionist/tickets/today/").then(res => res.data),
  
  // Patients (Receptionist context)
  searchPatients: (searchParams) => api.get(`/receptionist/patients/${searchParams}`).then(res => res.data),
  getPatientTickets: (patientId) => api.get(`/receptionist/patients/${patientId}/tickets/`).then(res => res.data),
  getPatientHistory: (patientId) => api.get(`/receptionist/patients/${patientId}/history/`).then(res => res.data),
  // Tickets & Scheduling
  getDoctors: () => api.get("/receptionist/tickets/doctors/").then(res => res.data),
  getDepartments: (type = null) => {
    const params = type ? { type: type } : {};
    return api.get("/receptionist/tickets/departments/", { params }).then(res => res.data);
  },
  createTicket: (payload) => api.post("/receptionist/tickets/", payload).then(res => res.data),
  updateTicketStatus: (ticketId, status) => api.patch(`/receptionist/tickets/${ticketId}/status/`, { status }).then(res => res.data),
  getStaffDetail: (id) => api.get(`/staff-management/${id}/staff-detail/`).then(res => res.data),
  getStaffDirectory: (params = {}) => api.get("/staff-management/staff-directory/", { params }) .then(res => res.data),
  //Appointments
  getDailyAppointments: (params) => api.get("/receptionist/appointments/daily/", { params }).then(res => res.data),
  getDepartmentList: () => api.get("/departments/").then(res => res.data),
  getDoctorList: () => api.get("/patients/doctors/").then(res => res.data),
  getPatients: () => api.get("/patients/").then(res => res.data),
  bookAppointment: (payload) => api.post("/receptionist/appointments/book/", payload).then(res => res.data),
  getAppointment: (id) => api.get(`/receptionist/appointments/${id}/detail/`).then(res => res.data),
  rescheduleAppointment: (id, payload) => api.patch(`/receptionist/appointments/reschedule/${id}/`, payload).then(res => res.data),
  searchAppointments: (query) => api.get('/receptionist/appointments/search/', { params: { q: query } }).then(res => res.data),
  getAvailableSlots: (doctorId, date) => api.get('/receptionist/appointments/available-slots/', { params: { doctor_id: doctorId, date: date } }).then(res => res.data),
  getCalendar: (id, start, end) => api.get(`/receptionist/appointments/calendar/${id}/`, { params: { start_date: start, end_date: end } }).then(res => res.data),
  cancelAppointment: (id, payload) => api.patch(`/receptionist/appointments/cancel/${id}/`, payload).then(res => res.data),

  // Lab Orders (Receptionist)
  getLabOrders: (params) => api.get("/lab/orders/", { params }).then(res => res.data),
  createLabOrder: (payload) => api.post("/lab/orders/create/", payload).then(res => res.data),
  getLabOrderDetail: (id) => api.get(`/lab/orders/${id}/`).then(res => res.data),
  cancelLabOrder: (id) => api.post(`/lab/orders/${id}/cancel/`).then(res => res.data),
  getAvailableTests: (query = "") => api.get(`/lab/test-types/?simple=true${query}`).then(res => res.data),
  getLabOrderOpticket: (id) => api.get(`/lab/orders/${id}/opticket/`).then(res => res.data),

  // Attendance
  getTodayAttendance: () => api.get("/attendance/my/").then(res => res.data),
  markAttendance: (payload) => api.post("/attendance/mark/", payload).then(res => res.data),
  updateAttendance: (payload) => api.put("/attendance/mark/", payload).then(res => res.data),
  getAttendanceHistory: (params) => api.get("/attendance/history/", { params }).then(res => res.data),
  getAttendanceStats: (params) => api.get("/attendance/stats/", { params }).then(res => res.data),
};
 
export default receptionistApi;