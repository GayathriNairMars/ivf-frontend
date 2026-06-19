import axios from "axios";
 
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}
 
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
 
let csrfToken = null;
 
export async function initCsrf() {
  try {
    const res = await api.get("csrf/");
    csrfToken = res.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error("Failed to initialize CSRF token", error);
    return null;
  }
}
 
// ── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      if (config._csrfRetry && config.headers["X-CSRFToken"]) {
        return config;
      }
      // Always prefer the in-memory token; fall back to the live cookie
      const token = csrfToken || getCookie("csrftoken");
      if (token) {
        config.headers["X-CSRFToken"] = token;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const status = error.response.status;
      const data   = error.response.data;

      // ── CSRF 403: refresh token then retry ONCE ──────────────────────────
      const isCsrfError =
        status === 403 &&
        !originalRequest._csrfRetry &&
        (typeof data === "object"
          ? JSON.stringify(data).toLowerCase().includes("csrf")
          : String(data).toLowerCase().includes("csrf"));

      if (isCsrfError) {
        originalRequest._csrfRetry = true;               // prevent infinite loop
        console.warn("CSRF token stale — refreshing and retrying…");

        const newToken = await initCsrf();

        if (newToken) {
          // Inject the fresh token into the retried request
          originalRequest.headers["X-CSRFToken"] = newToken;
        } else {
          // Cookie may have been set by the CSRF endpoint even if the
          // response body was empty, so try the cookie as well.
          const cookieToken = getCookie("csrftoken");
          if (cookieToken) {
            originalRequest.headers["X-CSRFToken"] = cookieToken;
          }
        }

        return api(originalRequest);                      // ✅ retry original call
      }

      // ── Auth 401 ─────────────────────────────────────────────────────────
      if (status === 401) {
        console.error("Unauthorized — redirecting to login…");
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/admin-login" &&
          window.location.pathname !== "/hr-login"
        ) {
          window.location.href = "/login";
        }
      }

      // ── Server error ──────────────────────────────────────────────────────
      if (status >= 500) {
        console.error("Server Error!", error.response.data);
      }
    } else if (error.request) {
      console.error("Network Error — no response received.");
    }

    return Promise.reject(error);
  }
);
 
export default api;
