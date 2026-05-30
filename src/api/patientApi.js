import api from "./axios";

export const patientApi = {
  // --- PATIENTS ---
  getPatientsList: (params = "") => api.get(`/patients/?${params}`).then(res => res.data),
  getPatientStats: () => api.get("/patients/stats/").then(res => res.data),
  getPatientDetails: (id) => api.get(`/patients/${id}/`).then(res => res.data),
  getDoctors: () => api.get("/patients/doctors/").then(res => res.data),
  getPatients: () => api.get("/patients/").then(res => res.data), // generic fetch
  createPatient: (payload) => api.post("/patients/", payload).then(res => res.data),
  updatePatient: (id, payload) => api.patch(`/patients/${id}/`, payload).then(res => res.data),
  updatePatientStatus: (id, status) => api.post(`/patients/${id}/update-status/`, { status }).then(res => res.data),
  linkPartner: (id, partnerId) => api.post(`/patients/${id}/link-partner/`, { partner_id: partnerId }).then(res => res.data),
  unlinkPartner: (id) => api.post(`/patients/${id}/unlink-partner/`).then(res => res.data),

  // --- EMR (Electronic Medical Records) ---
  getEmrDashboardStats: () => api.get("/emr/dashboard-stats/").then(res => res.data),
  getEmrRecordsStatistics: () => api.get("/emr/records/statistics/").then(res => res.data),
  getEmrSummary: (patientId) => api.get(`/emr/patient/${patientId}/`).then(res => res.data),
  getEmrRecords: (patientId, params = "") => api.get(`/emr/patient/${patientId}/records/${params}`).then(res => res.data),
  getEmrRecordDetail: (patientId, recordId) => api.get(`/emr/patient/${patientId}/records/${recordId}/`).then(res => res.data),
  addEmrRecord: (patientId, payload, config = {}) => api.post(`/emr/patient/${patientId}/records/add/`, payload, config).then(res => res.data),
  deleteEmrRecord: (patientId, recordId) => api.delete(`/emr/patient/${patientId}/records/${recordId}/delete/`).then(res => res.data),
  updateEmrRecord: (patientId, recordId, payload) => api.patch(`/emr/patient/${patientId}/records/${recordId}/update/`, payload).then(res => res.data),
  
  getHistoryDocs: (patientId) => api.get(`/emr/patient/${patientId}/history/`).then(res => res.data),
  addHistoryDoc: (patientId, payload, config = {}) => api.post(`/emr/patient/${patientId}/history/add`, payload, config).then(res => res.data),
  deleteHistoryDoc: (docId) => api.delete(`/emr/history/${docId}/delete/`).then(res => res.data),
  
  getAllowedEmrTypes: () => api.get("/emr/allowed-types/").then(res => res.data),
};

export default patientApi;
