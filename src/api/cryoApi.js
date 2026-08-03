import api from "./axios";

// ── Cryo Tank APIs ─────────────────────────────────────────────────────────────

export const createCryoTank = (payload) =>
  api.post("cryo/tanks/", payload);

export const listCryoTanks = () =>
  api.get("cryo/tanks/");

export const getCryoTank = (id) =>
  api.get(`cryo/tanks/${id}/`);

export const updateCryoTank = (id, payload) =>
  api.put(`cryo/tanks/${id}/`, payload);

export const deleteCryoTank = (id) =>
  api.delete(`cryo/tanks/${id}/`);

// ── Cryo Canister APIs ─────────────────────────────────────────────────────────

export const createCryoCanister = (payload) =>
  api.post("cryo/canisters/", payload);

export const listCryoCanisters = () =>
  api.get("cryo/canisters/");

export const getCryoCanister = (id) =>
  api.get(`cryo/canisters/${id}/`);

export const updateCryoCanister = (id, payload) =>
  api.put(`cryo/canisters/${id}/`, payload);

export const deleteCryoCanister = (id) =>
  api.delete(`cryo/canisters/${id}/`);

// ── Cryo Cane APIs ──────────────────────────────────────────────────────────

export const createCryoCane = (payload) =>
  api.post("cryo/canes/", payload);

export const listCryoCanes = () =>
  api.get("cryo/canes/");

export const getCryoCane = (id) =>
  api.get(`cryo/canes/${id}/`);

export const updateCryoCane = (id, payload) =>
  api.put(`cryo/canes/${id}/`, payload);

export const deleteCryoCane = (id) =>
  api.delete(`cryo/canes/${id}/`);

// ── Cryo Goblet APIs ──────────────────────────────────────────────────────────

export const createCryoGoblet = (payload) =>
  api.post("cryo/goblets/", payload);

export const listCryoGoblets = () =>
  api.get("cryo/goblets/");

export const getCryoGoblet = (id) =>
  api.get(`cryo/goblets/${id}/`);

export const updateCryoGoblet = (id, payload) =>
  api.put(`cryo/goblets/${id}/`, payload);

export const deleteCryoGoblet = (id) =>
  api.delete(`cryo/goblets/${id}/`);

// ── Cryo Sample APIs ─────────────────────────────────────────────────────────

export const getAvailablePositions = () =>
  api.get("cryo/available-positions/");

export const storeSample = (payload) =>
  api.post("cryo/samples/create/", payload);

// ── Stored Sample Management APIs ────────────────────────────────────────────

export const listStoredSamples = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.status) query.append("status", params.status);
  if (params.type)   query.append("type", params.type);
  if (params.tank)   query.append("tank", params.tank);
  const qs = query.toString();
  return api.get(`cryo/samples/${qs ? `?${qs}` : ""}`);
};

export const getStoredSample = (id) =>
  api.get(`cryo/samples/${id}/`);

export const updateStoredSample = (id, payload) =>
  api.patch(`cryo/samples/${id}/update/`, payload);

export const thawSample = (id, payload) =>
  api.post(`cryo/samples/${id}/thaw/`, payload);

export const deleteStoredSample = (id) =>
  api.delete(`cryo/samples/${id}/delete/`);

export const embryologistApi ={
  // Profile / Settings
  getProfile: () => api.get("/embryology/profile/").then(res => res.data),
  updateProfile: (payload) => api.put("/embryology/profile/", payload).then(res => res.data),
  deleteProfile: () => api.delete("/embryology/profile/").then(res => res.data),
  changePassword: async (data) => {
    const response = await api.post('/embryology/change-password/', data);
    return response.data;
  },
  
  // Attendance
  getTodayAttendance: () => api.get("/attendance/my/").then(res => res.data),
  markAttendance: (payload) => api.post("/attendance/mark/", payload).then(res => res.data),
  updateAttendance: (payload) => api.put("/attendance/mark/", payload).then(res => res.data),
  getAttendanceHistory: (params) => api.get("/attendance/history/", { params }).then(res => res.data),
  getAttendanceStats: (params) => api.get("/attendance/stats/", { params }).then(res => res.data),
};