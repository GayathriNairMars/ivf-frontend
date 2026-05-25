import { useState } from "react";
import { useNavigate,Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import api from "../../../services/Client";

export default function AdminLoginPage() {
	const {user,loading,login,logout} = useAuth();
	const navigate = useNavigate();

	const [form,setForm] = useState({email:"",password:""});
	const [error,setError] = useState("");
	const [submitting,setSubmitting] = useState(false);
	const [loggingOut,setLoggingOut] = useState();

	if (loading) return null;
	if (user && !loggingOut) {
    if (user.role === "ADM") return <Navigate to="/superadmin" replace />;
    return <Navigate to="/login" replace />;
    }

	const handleChange = (e) => {
		setForm((prev) => ({...prev, [e.target.name]:e.target.value}));
		setError("");
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		setError("");
		try {
			const {user:loggedInUser} = await login(form.email,form.password);
			if (loggedInUser.role !== "ADM") {
				setLoggingOut(true);
				await logout();
				setLoggingOut(false);
				setError("This portal is for Administrators only.");
				setSubmitting(false);
				return;
			}
			navigate("/superadmin", {replace:true});
		} catch (err) {
			const data = err.response?.data;
			if (typeof data?.detail === "string") {
				setError(data.detail);
			} else if (typeof data === "object") {
				setError(data.detail);
			} else {
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="login-page" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
			<div className="login-card">
				<div className="login-logo">
					<span className="logo-mark" style={{ background: "#6366f1" }}>IVF</span>
					<span className="logo-text">HIMS</span>
				</div>
				<h1>Admin Portal</h1>
				<p className="login-subtitle" style={{ color: "#718096" }}>Restricted Access - Admins Only</p>
				<form onSubmit={handleSubmit} noValidate>
					<div className="field">
						<label htmlFor="email">Email Address</label>
						<input id="email"
							name="email"
							type="email"
							autoComplete="email"
							autoFocus
							value={form.email}
							onChange={handleChange}
							placeholder="admin@hospital.com"
							disabled={submitting}
							required
							/>
					</div>
					<div className="field">
						<label htmlFor="password">Password</label>
						<input id="password"
							name="password"
							type="password"
							autoComplete="current-password"
							value={form.password}
							onChange={handleChange}
							placeholder="Enter your password"
							disabled={submitting}
							required
							/>
					</div>
					{error && <div className="error-banner" role="alert">{error}</div>}
					<button  type="submit" className="submit-btn" disabled={submitting}>
						{submitting? "Signing in..." : "Sign in"}
					</button>
				</form>
				<p style={{ marginTop: "1rem", fontSize: "0.8rem", textAlign: "center", color: "#718096" }}>
					Not an admin?{" "}
          <a href="/login" style={{ color: "#6366f1", fontWeight: 600 }}>
            Staff login →
          </a>
        </p>
			</div>
		</div>
	)
}