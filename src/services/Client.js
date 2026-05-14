import axios from "axios";

const api= axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "https://ivf-backend-ki9p.onrender.com/api",
    headers: { "Content-Type": "application/json"},
    withCredentials: true,
});

let csrfToken = null;

export async function initCsrf() {
    const res = await api.get("/csrf/");
    csrfToken = res.data.csrfToken; // Django returns it in body
}

//Attach X-CSRFToken header on all mutating requests
api.interceptors.request.use((config)=>{
    const method=config.method?.toUpperCase();
    if (["POST","PUT","PATCH","DELETE"].includes(method)) {
        if (csrfToken) config.headers["X-CSRFToken"]=csrfToken;
    }
    return config;
});

export default api;