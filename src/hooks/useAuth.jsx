import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { initCsrf } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        // Use the shared initCsrf() (not a raw api.get) so the module-level
        // in-memory csrfToken in axios.js actually gets populated from the
        // response body. A plain api.get("/csrf/") only sets the browser
        // cookie — it leaves csrfToken null, so the very first state-changing
        // request (e.g. login) has no X-CSRFToken header, gets a 403, and
        // only succeeds on the interceptor's automatic retry.
        await initCsrf();
        const { data } = await api.get("/me/");
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const login = useCallback(async (email, password, endpoint = "/login/") => {
    const { data } = await api.post(endpoint, { email, password });
    setUser(data.user);
    return { redirectUrl: data.redirect_url, user: data.user };
  }, []);

  const logout = useCallback(async (endpoint = "/logout/") => {
    try {
      // Same fix here — make sure we have a fresh in-memory token before
      // the state-changing POST, instead of only refreshing the cookie.
      await initCsrf();
      const res = await api.post(endpoint);
      console.log("Logout response:", res.status, res.data);
    } catch (err) {
      console.log("Logout failed:", err.response?.status, err.response?.data);
    }
    setUser(null);
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider></AuthProvider>");
  return ctx;
}