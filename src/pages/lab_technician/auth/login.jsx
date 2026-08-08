import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useHospital } from "../../../context/HospitalContext";
import { HospitalLogo } from "../../../components/HospitalBrand";
import { Mail, Lock, Eye, EyeOff, FlaskConical } from "lucide-react";

export default function LabLoginPage() {
  const { user, loading, login, logout } = useAuth();
  const { hospital } = useHospital();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState();
  const [showPassword, setShowPassword] = useState(false);

  if (loading) return null;
  if (user && !loggingOut) {
    if (user.role === "TEC") return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
    return <Navigate to="/login" replace />;
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Call login with the Lab-specific endpoint
      const { redirectUrl, user: loggedInUser } = await login(form.email, form.password, "lab/login/");
      if (loggedInUser.role !== "TEC") {
        setLoggingOut(true);
        await logout();
        setLoggingOut(false);
        setError("This portal is for Lab Technicians only.");
        setSubmitting(false);
        return;
      }
      navigate(redirectUrl, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (typeof data?.detail === "string") {
        setError(data.detail);
      } else if (typeof data === "object") {
        setError(data.detail || "Invalid credentials.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", fontFamily: "Inter, sans-serif" }}>
      {/* Left Side - Teal Branding for Lab */}
      <div style={{
        flex: "1",
        background: "linear-gradient(135deg, rgba(13,148,136,0.85) 0%, rgba(15,118,110,0.95) 100%), url('https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2000&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px",
        position: "relative"
      }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: "500px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <HospitalLogo variant="light" size={48} />
            <span style={{ fontSize: "28px", fontWeight: "700" }}>{hospital.hospital_name || "Hospital Management System"}</span>
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "40px" }}>
            <div style={{ height: "3px", width: "32px", background: "white", borderRadius: "2px" }}></div>
            <div style={{ height: "3px", width: "12px", background: "rgba(255,255,255,0.5)", borderRadius: "2px" }}></div>
            <div style={{ height: "3px", width: "6px", background: "rgba(255,255,255,0.5)", borderRadius: "2px" }}></div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", display: "inline-block", fontSize: "14px", fontWeight: "500", marginBottom: "24px", backdropFilter: "blur(4px)" }}>
            Lab Technician Portal
          </div>

          <h1 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "16px", lineHeight: "1.3" }}>
            Laboratory Information System
          </h1>
          <p style={{ fontSize: "15px", lineHeight: "1.6", color: "rgba(255,255,255,0.8)" }}>
            Advanced diagnostic tracking, test analysis, and secure lab results management for comprehensive patient care.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={{ flex: "1", background: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ background: "#ccfbf1", color: "#0d9488", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "500", display: "inline-block", marginBottom: "24px" }}>
            Welcome back Technician
          </div>

          <h2 style={{ fontSize: "28px", fontWeight: "600", color: "#0f172a", margin: "0 0 8px 0" }}>Sign in</h2>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 32px 0" }}>Access your laboratory administration workspace</p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#475569", marginBottom: "8px" }}>Email address</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                  <Mail size={18} />
                </div>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={submitting}
                  required
                  style={{ width: "100%", padding: "12px 12px 12px 40px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "15px", outline: "none", boxSizing: "border-box", color: "#334155" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#475569" }}>Password</label>
                <a href="#" style={{ fontSize: "13px", color: "#0d9488", textDecoration: "none", fontWeight: "500" }}>Forgot password?</a>
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={submitting}
                  required
                  style={{ width: "100%", padding: "12px 40px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "15px", outline: "none", boxSizing: "border-box", color: "#334155" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
              <input type="checkbox" id="keepSigned" style={{ width: "16px", height: "16px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer" }} />
              <label htmlFor="keepSigned" style={{ fontSize: "14px", color: "#475569", cursor: "pointer" }}>Keep me signed in</label>
            </div>

            {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px", borderRadius: "8px", fontSize: "14px", marginBottom: "20px" }}>{error}</div>}

            <button
               type="submit"
               disabled={submitting}
               style={{ width: "100%", padding: "12px", background: "#0d9488", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "500", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, transition: "background 0.2s" }}
             >
               {submitting ? "Signing In..." : "Sign In"}
             </button>
          </form>

          <div style={{ marginTop: "40px", borderTop: "1px solid #e2e8f0", paddingTop: "24px", textAlign: "center" }}>
             <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
               <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                 Are you an Admin? <a href="/admin-login" style={{ color: "#0d9488", textDecoration: "none", fontWeight: "500" }}>Admin login →</a>
               </p>
               <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                 Are you an HR? <a href="/hr-login" style={{ color: "#0d9488", textDecoration: "none", fontWeight: "500" }}>HR login →</a>
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
