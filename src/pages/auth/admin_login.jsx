import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useHospital } from "../../context/HospitalContext";
import { HospitalLogo } from "../../components/HospitalBrand";
import { Mail, Lock, Eye, EyeOff, Activity, Phone } from "lucide-react";

export default function AdminLoginPage() {
  const { user, loading, login, logout } = useAuth();
  const { hospital } = useHospital();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (loading) return null;
  if (user && !loggingOut) {
    if (user.role === "ADM") return <Navigate to="/superadmin" replace />;
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

    if (isSignUp) {
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        setSubmitting(false);
        return;
      }
      // Registration logic goes here, for now we will just show an error as we don't have register endpoint defined in auth context
      setError("Registration is not enabled in this demo.");
      setSubmitting(false);
      return;
    }

    try {
      const { user: loggedInUser } = await login(form.email, form.password);
      if (loggedInUser.role !== "ADM") {
        setLoggingOut(true);
        await logout();
        setLoggingOut(false);
        setError("This portal is for Administrators only.");
        setSubmitting(false);
        return;
      }
      navigate("/superadmin", { replace: true });
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
      {/* Left Side - Blue Branding */}
      <div style={{
        flex: "1",
        background: "linear-gradient(135deg, rgba(37,99,235,0.85) 0%, rgba(30,58,138,0.95) 100%), url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2000&auto=format&fit=crop')",
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

          {!isSignUp && (
            <div style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", display: "inline-block", fontSize: "14px", fontWeight: "500", marginBottom: "24px", backdropFilter: "blur(4px)" }}>
              Admin portal
            </div>
          )}

          <h1 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "16px", lineHeight: "1.3" }}>
            Intelligent Healthcare Ecosystem
          </h1>
          <p style={{ fontSize: "15px", lineHeight: "1.6", color: "rgba(255,255,255,0.8)" }}>
            A centralized platform engineered for clinical precision, patient care optimization, and seamless hospital operations. Experience the future of medical administration.
          </p>
        </div>
      </div>

      {/* Right Side - Login / Signup Form */}
      <div style={{ flex: "1", background: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {!isSignUp && (
            <div style={{ background: "#eff6ff", color: "#3b82f6", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "500", display: "inline-block", marginBottom: "24px" }}>
              Welcome back
            </div>
          )}

          <h2 style={{ fontSize: "28px", fontWeight: "600", color: "#0f172a", margin: "0 0 8px 0" }}>{isSignUp ? "Sign up" : "Sign in"}</h2>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 32px 0" }}>Access your hospital administration workspace</p>

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

            {isSignUp && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#475569", marginBottom: "8px" }}>Phone number</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                    <Phone size={18} />
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    disabled={submitting}
                    required={isSignUp}
                    style={{ width: "100%", padding: "12px 12px 12px 40px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "15px", outline: "none", boxSizing: "border-box", color: "#334155" }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#475569" }}>Password</label>
                {!isSignUp && <a href="#" style={{ fontSize: "13px", color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}>Forgot password?</a>}
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
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

            {isSignUp && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#475569", marginBottom: "8px" }}>Re-enter password</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                    <Lock size={18} />
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    disabled={submitting}
                    required={isSignUp}
                    style={{ width: "100%", padding: "12px 40px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "15px", outline: "none", boxSizing: "border-box", color: "#334155" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
              <input type="checkbox" id="keepSigned" style={{ width: "16px", height: "16px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer" }} />
              <label htmlFor="keepSigned" style={{ fontSize: "14px", color: "#475569", cursor: "pointer" }}>Keep me signed in</label>
            </div>

            {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px", borderRadius: "8px", fontSize: "14px", marginBottom: "20px" }}>{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              style={{ width: "100%", padding: "12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "500", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, transition: "background 0.2s" }}
            >
              {submitting ? (isSignUp ? "Signing Up..." : "Signing In...") : (isSignUp ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <div style={{ marginTop: "40px", borderTop: "1px solid #e2e8f0", paddingTop: "24px", textAlign: "center" }}>
            {isSignUp ? (
              <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                Already have an account? <button onClick={() => { setIsSignUp(false); setError(""); }} style={{ color: "#3b82f6", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "14px", textDecoration: "none" }}>Sign in</button>
              </p>
            ) : (
              <>
                <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 12px 0" }}>
                  Don't have an account? <button onClick={() => { setIsSignUp(true); setError(""); }} style={{ color: "#8b5cf6", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "14px", textDecoration: "none" }}>Sign up</button>
                </p>
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", marginTop: "12px", gap: "16px" }}>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    Are you a Staff? <a href="/login" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}>Staff login →</a>
                  </p>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    Are you a Doctor? <a href="/doctor-login" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}>Doctor login →</a>
                  </p>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    Are you an HR? <a href="/hr-login" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}>HR login →</a>
                  </p>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    Are you a Lab Tech? <a href="/lab-login" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}>Lab login →</a>
                  </p>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    Are you a Pharmacist? <a href="/pharmacist-login" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}>Pharmacist login →</a>
                  </p>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    Are you a Nurse? <a href="/nurse-login" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}>Nurse login →</a>
                  </p>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    Are you an Embryologist? <a href="/embryologist-login" style={{ color: "#8b5cf6", textDecoration: "none", fontWeight: "500" }}>Embryologist login →</a>
                  </p>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    Are you an Andrologist? <a href="/andrologist-login" style={{ color: "#8b5cf6", textDecoration: "none", fontWeight: "500" }}>Andrologist login →</a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}