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

export const embryologistApi ={
  // Profile / Settings
  getProfile: () => api.get("/embryology/profile/").then(res => res.data),
  updateProfile: (payload) => api.put("/embryology/profile/", payload).then(res => res.data),
  deleteProfile: () => api.delete("/embryology/profile/").then(res => res.data),
  changePassword: async (data) => {
    const response = await api.post('/embryology/change-password/', data);
    return response.data;
  },
};