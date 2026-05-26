import { useState,useEffect } from "react";
import { useNavigate,Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios";

export default function LoginPage(){
    const { user,loading,login,logout } = useAuth();
    const navigate=useNavigate();

    const [form,setForm] = useState({email:"",password:""});
    const[error,setError]= useState("");
    const[submitting,setSubmitting] = useState(false);

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
       setForm((prev) =>({ ...prev, [e.target.name]: e.target.value}));
       setError("");
    };
    const handleSubmit = async (e) =>{
       e.preventDefault();
       setSubmitting(true);
       setError("");
       try {
           const{ redirectUrl, user:loggedInUser } = await login(form.email,form.password);
           if (loggedInUser.role === 'ADM') {
            await logout();
            setError("Admin accounts must use the Admin Portal.");
            setSubmitting(false);
            return;
           }
           navigate(redirectUrl, { replace:true });
       } catch(err) {
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

   return(
    <div className="login-page">
      <div className="login-card">
         <div className="login-logo">
          <span className="logo-mark">IVF</span>
          <span className="logo-text">HIMS</span>
         </div>
       <h1>Sign in to your account</h1>
       <p className="login-sutitle">Hospital Information Management System</p>
       <form onSubmit={handleSubmit} noValidate>
          <div className="field">
	   <label htmlFor="email">Email Address</label>
	   <input
	    id="email"
	    name="email"
	    type="email"
	    autoComplete="email"
	    autoFocus
	    value={form.email}
	    onChange={handleChange}
	    placeholder="you@hospital.com"
	    disabled={submitting}
	    required
	    />
             </div>
             <div className="field">
	   <label htmlFor="password">Password</label>
	   <input 
	    id="password"
	    name="password"
	    type="password"
	    autoComplete="current-password"
	    value={form.password}
	    onChange={handleChange}
	    placeholder="Enter Your password"
	    disabled={submitting}
	    required
	    />
             </div>

             {error && <div className="error-banner" role="alert">{error}</div>}
             <button type="submit" className="submit-btn" disabled={submitting}>
	            {submitting? "Signing in...":"Sign in"}
             </button>
          </form>
          <p style={{marginTop:"1rem",fontSize:"0.8rem",textAlign:"center",color:"#718096"}}>
            Admin?{" "}
            <a href="/admin-login" style={{color:"#0f4c8a",fontWeight:600}}>
            Use Admin Portal →
            </a>
          </p>
         </div>
      </div>
   );
}  
