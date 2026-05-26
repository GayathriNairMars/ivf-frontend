import api from "./axios";

export const receptionistApi = {
  // Dashboard & Queues
  getDashboardStats: () => api.get("/receptionist/dashboard/").then(res => res.data),
  getTodayTickets: () => api.get("/receptionist/tickets/today/").then(res => res.data),
  getTicketsToday: () => api.get("/receptionist/tickets/today").then(res => res.data), // duplicate path for exact match

  // Patients (Receptionist context)
  searchPatients: (searchParams) => api.get(`/receptionist/patients/${searchParams}`).then(res => res.data),
  getPatientTickets: (patientId) => api.get(`/receptionist/patients/${patientId}/tickets/`).then(res => res.data),
  getPatientHistory: (patientId) => api.get(`/receptionist/patients/${patientId}/history/`).then(res => res.data),
  
  // Tickets & Scheduling
  getDoctors: () => api.get("/receptionist/tickets/doctors/").then(res => res.data),
  getDepartments: () => api.get("/receptionist/tickets/departments/").then(res => res.data),
  createTicket: (payload) => api.post("/receptionist/tickets/", payload).then(res => res.data),
  updateTicketStatus: (ticketId, status) => api.patch(`/receptionist/tickets/${ticketId}/status/`, { status }).then(res => res.data),
};

export default receptionistApi;
