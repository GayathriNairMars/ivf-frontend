import axios from "axios";
 
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}
 
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/", // ✅ trailing slash
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
 
let csrfToken = null;
 
export async function initCsrf() {
  try {
    const res = await api.get("csrf/");
    csrfToken = res.data.csrfToken; 
  } catch (error) {
    console.error("Failed to initialize CSRF token", error);
  }
}
 
// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const token = getCookie("csrftoken") || csrfToken; // ✅ cookie first, stored token as fallback
      if (token) config.headers["X-CSRFToken"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
 
// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {                          // ✅ async so we can await initCsrf
    if (error.response) {
      if (error.response.status === 401) {
        console.error("Unauthorized! Redirecting to login...");
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/admin-login"
        ) {
          window.location.href = "/login";
        }
      } else if (error.response.status === 403) {
        console.error("Access Denied! Refreshing CSRF token...");
        await initCsrf();                     // ✅ auto-refresh token on 403
      } else if (error.response.status >= 500) {
        console.error("Server Error!");
      }
    } else if (error.request) {
      console.error("Network Error! Please check your connection.");
    }
    return Promise.reject(error);
  }
);
 
export default api;
