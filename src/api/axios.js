import axios from "axios";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://w8wdjgw6-8000.inc1.devtunnels.ms/api",
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
    const token = getCookie("csrftoken");
    const method = config.method?.toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      if (token) config.headers["X-CSRFToken"] = token;
    }
    // Note: If you are using JWT or bearer tokens, add them here:
    // const authToken = localStorage.getItem("token");
    // if (authToken) config.headers["Authorization"] = `Bearer ${authToken}`;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for common error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Handle unauthorized access (e.g., redirect to login)
        console.error("Unauthorized! Redirecting to login...");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/admin-login") {
            window.location.href = "/login";
        }
      } else if (error.response.status === 403) {
        console.error("Access Denied!");
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
