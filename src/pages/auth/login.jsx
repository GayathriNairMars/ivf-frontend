import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useHospital } from "../../context/HospitalContext";
import { HospitalLogo } from "../../components/HospitalBrand";
import { Mail, Lock, Eye, EyeOff, Activity, Phone } from "lucide-react";

export default function LoginPage() {
  const { user, loading, login, logout } = useAuth();
  const { hospital } = useHospital();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Toggles for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Dynamic state for interactive transitions
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const [isBtnActive, setIsBtnActive] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  if (loading) return null;
  if (user) {
    if (user.role === "ADM") {
      return <Navigate to="/superadmin" replace />;
    } else if (user.role === "REC") {
      return <Navigate to="/receptionist" replace />;
    } else {
      return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
    }
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleToggleMode = (signUpState) => {
    setIsSignUp(signUpState);
    setForm({ email: "", phone: "", password: "", confirmPassword: "" });
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (isSignUp) {
      // Validate inputs for Sign Up
      if (!form.email || !form.phone || !form.password || !form.confirmPassword) {
        setError("All fields are required.");
        setSubmitting(false);
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        setSubmitting(false);
        return;
      }
      // Since registration is not enabled in this HIMS frontend demo, display warning banner
      setTimeout(() => {
        setError("Registration is not enabled in this demo.");
        setSubmitting(false);
      }, 800);
      return;
    }

    // Sign In Flow
    try {
      const { redirectUrl, user: loggedInUser } = await login(form.email, form.password);
      if (loggedInUser.role === 'ADM') {
        await logout();
        setError("Admin accounts must use the Admin Portal.");
        setSubmitting(false);
        return;
      }
      navigate(redirectUrl, { replace: true });
    } catch (err) {
      console.log("Login error:", err.response?.status, err.response?.data);
      const data = err.response?.data;
      if (typeof data?.detail === "string") {
        setError(data.detail);
      } else if (typeof data === "object") {
        setError(JSON.stringify(data));
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hims-login-layout">
      {/* Scope responsive styles locally inside a style tag */}
      <style>{`
        .hims-login-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #ffffff;
        }

        .hims-left-brand-panel {
          flex: 1.1;
          position: relative;
          background-image: linear-gradient(135deg, rgba(37, 99, 235, 0.88) 0%, rgba(30, 58, 138, 0.96) 100%), 
                            url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 80px;
          overflow: hidden;
        }

        .hims-right-form-panel {
          flex: 0.9;
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          overflow-y: auto;
        }

        .form-container {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          padding: 20px 0;
        }

        /* Responsive Breakpoint for Smaller Screens */
        @media (max-width: 992px) {
          .hims-left-brand-panel {
            display: none;
          }
          .hims-right-form-panel {
            flex: 1;
            padding: 24px;
          }
          .form-container {
            max-width: 400px;
            padding: 10px 0;
          }
        }
      `}</style>

      {/* Left Column: Visual branding and key marketing panel */}
      <div className="hims-left-brand-panel">
        {/* Subtle decorative concentric rings SVG */}
        <svg 
          style={{ 
            position: "absolute", 
            top: "-20px", 
            right: "-20px", 
            opacity: 0.15, 
            pointerEvents: "none",
            width: "360px",
            height: "360px"
          }} 
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="12" fill="none" stroke="white" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="24" fill="none" stroke="white" strokeWidth="0.6" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="36" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="0.4" strokeDasharray="2 4" />
        </svg>

        <div style={{ position: "relative", zIndex: 2, maxWidth: "540px" }}>
          {/* Logo Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
            <HospitalLogo variant="light" size={48} />
            <span style={{ fontSize: "32px", fontWeight: "700", letterSpacing: "1px", fontFamily: "inherit" }}>
              {hospital.hospital_name || "Hospital Management System"}
            </span>
          </div>

          {/* Underline Dash Pattern */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "40px" }}>
            <div style={{ height: "4px", width: "40px", background: "#ffffff", borderRadius: "2px" }}></div>
            <div style={{ height: "4px", width: "16px", background: "rgba(255, 255, 255, 0.45)", borderRadius: "2px" }}></div>
            <div style={{ height: "4px", width: "8px", background: "rgba(255, 255, 255, 0.3)", borderRadius: "2px" }}></div>
          </div>

          {/* Styled Pill Badge */}
          <div style={{ 
            background: "rgba(255, 255, 255, 0.2)", 
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "6px 16px", 
            borderRadius: "20px", 
            display: "inline-block", 
            fontSize: "14px", 
            fontWeight: "500", 
            marginBottom: "28px", 
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.25)"
          }}>
            Receptionist portal
          </div>

          {/* Main Title Heading */}
          <h1 style={{ 
            fontSize: "44px", 
            fontWeight: "800", 
            marginBottom: "20px", 
            lineHeight: "1.2", 
            color: "#ffffff",
            letterSpacing: "-0.8px",
            textAlign: "left"
          }}>
            Efficient Patient <br />
            <span style={{ color: "#a5b4fc" }}>Registration</span> & Front <br />
            Desk
          </h1>

          {/* Supporting Subtext */}
          <p style={{ 
            fontSize: "16px", 
            lineHeight: "1.6", 
            color: "rgba(255, 255, 255, 0.85)", 
            fontWeight: "400",
            maxWidth: "460px",
            textAlign: "left"
          }}>
            Experience clinical precision with our unified healthcare platform. Streamline appointments, coordinate visits, and optimize your workflow.
          </p>
        </div>
      </div>

      {/* Right Column: Interactive authentication form */}
      <div className="hims-right-form-panel">
        <div className="form-container">
          
          {/* Welcome Capsule Badge (Only visible on Sign In Page) */}
          {!isSignUp && (
            <div style={{ alignSelf: "flex-start" }}>
              <div style={{ 
                background: "#eff6ff", 
                color: "#2563eb", 
                padding: "5px 14px", 
                borderRadius: "20px", 
                fontSize: "13px", 
                fontWeight: "600", 
                display: "inline-block", 
                marginBottom: "24px" 
              }}>
                Welcome back
              </div>
            </div>
          )}

          {/* Header Texts */}
          <h2 style={{ fontSize: "32px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0", letterSpacing: "-0.5px", textAlign: "left" }}>
            {isSignUp ? "Sign up" : "Sign in"}
          </h2>
          <p style={{ color: "#64748b", fontSize: "15px", margin: "0 0 32px 0", textAlign: "left" }}>
            Access your hospital administration workspace
          </p>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Email Address Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155", textAlign: "left" }}>
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ 
                  position: "absolute", 
                  left: "14px", 
                  top: "50%", 
                  transform: "translateY(-50%)", 
                  color: focusedField === "email" ? "#2563eb" : "#94a3b8", 
                  display: "flex",
                  transition: "color 0.2s"
                }}>
                  <Mail size={20} />
                </div>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus={!isSignUp}
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your email"
                  disabled={submitting}
                  required
                  style={{ 
                    width: "100%", 
                    padding: "14px 14px 14px 46px", 
                    border: focusedField === "email" ? "1.5px solid #2563eb" : "1px solid #cbd5e1", 
                    borderRadius: "8px", 
                    fontSize: "15px", 
                    outline: "none", 
                    boxSizing: "border-box", 
                    color: "#1e293b",
                    backgroundColor: "#ffffff",
                    boxShadow: focusedField === "email" ? "0 0 0 4px rgba(37, 99, 235, 0.12)" : "none",
                    transition: "all 0.2s"
                  }}
                />
              </div>
            </div>

            {/* Phone Number Input (Only visible on Sign Up view) */}
            {isSignUp && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155", textAlign: "left" }}>
                  Phone number
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ 
                    position: "absolute", 
                    left: "14px", 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    color: focusedField === "phone" ? "#2563eb" : "#94a3b8", 
                    display: "flex",
                    transition: "color 0.2s"
                  }}>
                    <Phone size={20} />
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your phone number"
                    disabled={submitting}
                    required={isSignUp}
                    style={{ 
                      width: "100%", 
                      padding: "14px 14px 14px 46px", 
                      border: focusedField === "phone" ? "1.5px solid #2563eb" : "1px solid #cbd5e1", 
                      borderRadius: "8px", 
                      fontSize: "15px", 
                      outline: "none", 
                      boxSizing: "border-box", 
                      color: "#1e293b",
                      backgroundColor: "#ffffff",
                      boxShadow: focusedField === "phone" ? "0 0 0 4px rgba(37, 99, 235, 0.12)" : "none",
                      transition: "all 0.2s"
                    }}
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                  Password
                </label>
                {!isSignUp && (
                  <a 
                    href="#" 
                    onClick={(e) => e.preventDefault()}
                    style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none", fontWeight: "600", transition: "color 0.2s" }}
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ 
                  position: "absolute", 
                  left: "14px", 
                  top: "50%", 
                  transform: "translateY(-50%)", 
                  color: focusedField === "password" ? "#2563eb" : "#94a3b8", 
                  display: "flex",
                  transition: "color 0.2s"
                }}>
                  <Lock size={20} />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  disabled={submitting}
                  required
                  style={{ 
                    width: "100%", 
                    padding: "14px 44px 14px 46px", 
                    border: focusedField === "password" ? "1.5px solid #2563eb" : "1px solid #cbd5e1", 
                    borderRadius: "8px", 
                    fontSize: "15px", 
                    outline: "none", 
                    boxSizing: "border-box", 
                    color: "#1e293b",
                    backgroundColor: "#ffffff",
                    boxShadow: focusedField === "password" ? "0 0 0 4px rgba(37, 99, 235, 0.12)" : "none",
                    transition: "all 0.2s"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: "absolute", 
                    right: "14px", 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    color: "#94a3b8", 
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    display: "flex", 
                    padding: 0,
                    outline: "none"
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Re-enter Password Input (Only visible on Sign Up view) */}
            {isSignUp && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155", textAlign: "left" }}>
                  Re-enter password
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ 
                    position: "absolute", 
                    left: "14px", 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    color: focusedField === "confirmPassword" ? "#2563eb" : "#94a3b8", 
                    display: "flex",
                    transition: "color 0.2s"
                  }}>
                    <Lock size={20} />
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Re-enter your password"
                    disabled={submitting}
                    required={isSignUp}
                    style={{ 
                      width: "100%", 
                      padding: "14px 44px 14px 46px", 
                      border: focusedField === "confirmPassword" ? "1.5px solid #2563eb" : "1px solid #cbd5e1", 
                      borderRadius: "8px", 
                      fontSize: "15px", 
                      outline: "none", 
                      boxSizing: "border-box", 
                      color: "#1e293b",
                      backgroundColor: "#ffffff",
                      boxShadow: focusedField === "confirmPassword" ? "0 0 0 4px rgba(37, 99, 235, 0.12)" : "none",
                      transition: "all 0.2s"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ 
                      position: "absolute", 
                      right: "14px", 
                      top: "50%", 
                      transform: "translateY(-50%)", 
                      color: "#94a3b8", 
                      background: "none", 
                      border: "none", 
                      cursor: "pointer", 
                      display: "flex", 
                      padding: 0,
                      outline: "none"
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {/* Keep Me Signed In Checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0 4px 0" }}>
              <input 
                type="checkbox" 
                id="keepSigned" 
                style={{ 
                  width: "18px", 
                  height: "18px", 
                  borderRadius: "4px", 
                  border: "1px solid #cbd5e1", 
                  cursor: "pointer",
                  accentColor: "#2563eb"
                }} 
              />
              <label 
                htmlFor="keepSigned" 
                style={{ fontSize: "14px", color: "#475569", cursor: "pointer", userSelect: "none", fontWeight: "500" }}
              >
                Keep me signed in
              </label>
            </div>

            {/* Error Banner */}
            {error && (
              <div style={{ 
                background: "#fef2f2", 
                border: "1px solid #fca5a5", 
                color: "#b91c1c", 
                padding: "12px 16px", 
                borderRadius: "8px", 
                fontSize: "14px", 
                fontWeight: "500",
                textAlign: "left"
              }}>
                {error}
              </div>
            )}

            {/* Submit Button (Sign In text in both, as requested in design mock) */}
            <button
              type="submit"
              disabled={submitting}
              onMouseEnter={() => setIsBtnHovered(true)}
              onMouseLeave={() => { setIsBtnHovered(false); setIsBtnActive(false); }}
              onMouseDown={() => setIsBtnActive(true)}
              onMouseUp={() => setIsBtnActive(false)}
              style={{ 
                width: "100%", 
                padding: "14px", 
                background: submitting ? "#93c5fd" : (isBtnActive ? "#1d4ed8" : (isBtnHovered ? "#1d4ed8" : "#2563eb")), 
                color: "white", 
                border: "none", 
                borderRadius: "8px", 
                fontSize: "16px", 
                fontWeight: "600", 
                cursor: submitting ? "not-allowed" : "pointer", 
                boxShadow: submitting ? "none" : "0 4px 14px rgba(37, 99, 235, 0.25)",
                transition: "all 0.2s"
              }}
            >
              {submitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Footer Navigation Section */}
          <div style={{ marginTop: "32px", borderTop: "1px solid #f1f5f9", paddingTop: "24px", textAlign: "center" }}>
            {isSignUp ? (
              <>
                <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 12px 0" }}>
                  Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); handleToggleMode(false); }} style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>Sign in</a>
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 12px 0" }}>
                  Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); handleToggleMode(true); }} style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>Sign up</a>
                </p>
              </>
            )}
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", marginTop: "12px", gap: "16px" }}>
              <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                Are you an Admin? <a href="/admin-login" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>Admin login →</a>
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
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
