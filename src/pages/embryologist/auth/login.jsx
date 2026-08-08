import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useHospital } from "../../../context/HospitalContext";
import { HospitalLogo } from "../../../components/HospitalBrand";
import { Mail, Lock, Eye, EyeOff, Microscope, FlaskConical } from "lucide-react";

// Teal/Cyan accent for "Forgot password" and links (distinct from purple CTA)
const ACCENT = "#8b5cf6";   // violet-500 - main brand
const ACCENT_DARK = "#7c3aed"; // violet-600 - hover
const BADGE_BG = "#f5f3ff";    // violet-50
const BADGE_FG = "#7c3aed";    // violet-600

export default function EmbryologistLoginPage() {
  const { user, loading, login, logout } = useAuth();
  const { hospital } = useHospital();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (loading) return null;
  if (user && !loggingOut) {
    if (user.role === "EMB") return <Navigate to="/emb" replace />;
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
      const result = await login(form.email, form.password, "embryology/login/");
      const loggedInUser = result.user;

      if (loggedInUser.role !== "EMB") {
        setLoggingOut(true);
        await logout();
        setLoggingOut(false);
        setError("This portal is for Embryologists only.");
        setSubmitting(false);
        return;
      }
      navigate(result.redirectUrl || "/emb", { replace: true });
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

  // Shared input style
  const inputStyle = {
    width: "100%",
    padding: "12px 12px 12px 42px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    color: "#1e293b",
    fontFamily: "Inter, sans-serif",
    background: "#fafafa",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100%",
      fontFamily: "'Inter', sans-serif",
      overflow: "hidden",
    }}>

      {/* ── Left Panel ── */}
      <div style={{
        flex: "1",
        background: `linear-gradient(135deg, rgba(76,29,149,0.90) 0%, rgba(55,48,163,0.95) 60%, rgba(17,24,39,0.97) 100%), url('/embryo_portal_bg.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 56px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative glowing orbs */}
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: "320px", height: "320px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", left: "-60px",
          width: "280px", height: "280px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "45%", left: "60%",
          width: "180px", height: "180px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,181,253,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Top: Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
            <HospitalLogo variant="light" size={48} />
            <span style={{ fontSize: "28px", fontWeight: "800", color: "white" }}>
              {hospital.hospital_name || "Hospital Management System"}
            </span>
          </div>

          {/* Decorative bar */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "32px" }}>
            <div style={{ height: "3px", width: "36px", background: "white", borderRadius: "3px" }} />
            <div style={{ height: "3px", width: "14px", background: "rgba(255,255,255,0.45)", borderRadius: "3px" }} />
            <div style={{ height: "3px", width: "7px", background: "rgba(255,255,255,0.25)", borderRadius: "3px" }} />
          </div>

          {/* Portal badge */}
          <div style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.25)",
            padding: "5px 14px",
            borderRadius: "20px",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "13px",
            fontWeight: "600",
            marginBottom: "28px",
            letterSpacing: "0.5px",
          }}>
            <Microscope size={14} />
            Embryology Portal
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "30px",
            fontWeight: "700",
            marginBottom: "16px",
            lineHeight: "1.35",
            letterSpacing: "-0.5px",
          }}>
            Precision Science,<br />
            <span style={{ color: "#c4b5fd" }}>Life-Changing Results</span>
          </h1>
          <p style={{ fontSize: "15px", lineHeight: "1.7", color: "rgba(255,255,255,0.78)", maxWidth: "360px" }}>
            A dedicated workspace for embryologists to manage IVF protocols, 
            track embryo development, perform ICSI procedures, and collaborate 
            with the clinical team for the best patient outcomes.
          </p>
        </div>

        {/* Bottom: Feature cards */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { icon: "🧫", label: "Embryo Tracking" },
              { icon: "🔬", label: "ICSI Procedures" },
              { icon: "❄️",  label: "Cryopreservation" },
            ].map((feat) => (
              <div key={feat.label} style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: "500",
              }}>
                <span style={{ fontSize: "18px" }}>{feat.icon}</span>
                {feat.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{
        flex: "1",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 48px",
        overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>

          {/* Welcome badge */}
          <div style={{
            background: BADGE_BG,
            color: BADGE_FG,
            padding: "5px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "600",
            display: "inline-block",
            marginBottom: "24px",
            letterSpacing: "0.2px",
          }}>
            Welcome Embryologist
          </div>

          <h2 style={{
            fontSize: "30px",
            fontWeight: "700",
            color: "#0f172a",
            margin: "0 0 8px 0",
            letterSpacing: "-0.5px",
          }}>
            Sign in
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 36px 0", lineHeight: "1.5" }}>
            Access your embryology portal workspace
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}>
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: "13px", top: "50%",
                  transform: "translateY(-50%)", color: "#94a3b8", display: "flex",
                }}>
                  <Mail size={18} />
                </div>
                <input
                  id="emb-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={submitting}
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = ACCENT;
                    e.target.style.boxShadow = `0 0 0 3px rgba(139,92,246,0.12)`;
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "#fafafa";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                  Password
                </label>
                <a href="#" style={{ fontSize: "13px", color: ACCENT, textDecoration: "none", fontWeight: "500" }}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: "13px", top: "50%",
                  transform: "translateY(-50%)", color: "#94a3b8", display: "flex",
                }}>
                  <Lock size={18} />
                </div>
                <input
                  id="emb-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={submitting}
                  required
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = ACCENT;
                    e.target.style.boxShadow = `0 0 0 3px rgba(139,92,246,0.12)`;
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "#fafafa";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "13px", top: "50%",
                    transform: "translateY(-50%)", color: "#94a3b8",
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Keep me signed in */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px" }}>
              <input
                type="checkbox"
                id="emb-keepSigned"
                style={{
                  width: "16px", height: "16px",
                  borderRadius: "4px", border: "1.5px solid #cbd5e1",
                  cursor: "pointer", accentColor: ACCENT,
                }}
              />
              <label htmlFor="emb-keepSigned" style={{ fontSize: "14px", color: "#64748b", cursor: "pointer" }}>
                Keep me signed in
              </label>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "#fef2f2",
                color: "#991b1b",
                border: "1px solid #fecaca",
                padding: "12px 14px",
                borderRadius: "8px",
                fontSize: "14px",
                marginBottom: "20px",
                lineHeight: "1.4",
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="emb-signin-btn"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "13px",
                background: submitting
                  ? "#a78bfa"
                  : `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer",
                letterSpacing: "0.3px",
                boxShadow: submitting ? "none" : "0 4px 14px rgba(139,92,246,0.35)",
                transition: "all 0.2s",
              }}
            >
              {submitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Links footer */}
          <div style={{
            marginTop: "36px",
            borderTop: "1px solid #f1f5f9",
            paddingTop: "28px",
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "center",
            }}>
              {[
                { label: "Are you a Staff?", text: "Staff login →", href: "/login" },
                { label: "Are you an Admin?", text: "Admin login →", href: "/admin-login" },
                { label: "Are you a Doctor?", text: "Doctor login →", href: "/doctor-login" },
                { label: "Are you a Lab Tech?", text: "Lab login →", href: "/lab-login" },
                { label: "Are you a Nurse?", text: "Nurse login →", href: "/nurse-login" },
              ].map((link) => (
                <p key={link.href} style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  {link.label}{" "}
                  <a href={link.href} style={{ color: ACCENT, textDecoration: "none", fontWeight: "600" }}>
                    {link.text}
                  </a>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
