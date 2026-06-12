import { createContext,useContext,useState,useEffect,useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({children}){
   const [user,setUser] = useState(null);
   const [loading,setLoading] = useState(true);

   useEffect(()=>{
       async function init(){
	try{
	    await api.get("/csrf/");
	    const {data} = await api.get("/me/");
	    setUser(data);
	} catch {
	    setUser(null);
	} finally {
	    setLoading(false);
	}
       }
       init();
   },[]);

   const login=useCallback(async(email,password, endpoint="/login/")=>{
      const {data} = await api.post(endpoint,{email,password});
      setUser(data.user);
      return { redirectUrl: data.redirect_url, user:data.user};
   },[]);

   const logout = useCallback(async () => {
        try {
            await api.get("/csrf/");
            const res = await api.post("/logout/");
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
      <AuthContext.Provider value={{user, loading, login, logout}}>
	{children}
      </AuthContext.Provider>
   );
}

export function useAuth(){
     const ctx = useContext(AuthContext);
     if (!ctx) throw new Error("useAuth must be used inside <AuthProvider></AuthProvider>");
     return ctx;
}
