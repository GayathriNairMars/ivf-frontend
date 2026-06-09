import api from './axios';

export const doctorApi = {
  getQueue: async () => {
    const response = await api.get('/doctor/queue/');
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
  }
};
