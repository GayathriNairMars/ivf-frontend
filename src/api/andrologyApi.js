import api from "./axios";

export const AndrologyApi ={
  // Profile / Settings
  getProfile: () => api.get("/andrology/profile/").then(res => res.data),
  updateProfile: (payload) => api.put("/andrology/profile/", payload).then(res => res.data),
  deleteProfile: () => api.delete("/andrology/profile/").then(res => res.data),
  changePassword: async (data) => {
    const response = await api.post('/andrology/change-password/', data);
    return response.data;
  },
};

export default AndrologyApi;