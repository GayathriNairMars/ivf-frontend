import axios from "axios";

const api= axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "https://ivf-backend-ki9p.onrender.com/api",
    headers: { "Content-Type": "application/json"},
    withCredentials: true,
});

function getCsrfToken(){
	return document.cookie.split(";").find((row)=>row.startsWith("csrftoken="))?.split("=")[1];
}

//Attach X-CSRFToken header on all mutating requests
api.interceptors.request.use((config)=>{
    const method=config.method?.toUpperCase();
    if (["POST","PUT","PATCH","DELETE"].includes(method)) {
         const csrf=getCsrfToken();
         if (csrf) config.headers["X-CSRFToken"]=csrf;
    }
    return config;
});
export default api;