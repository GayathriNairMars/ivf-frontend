import axios from "axios";


// // ← Add this interceptor
// api.interceptors.request.use(config => {
    //     const csrfToken = getCookie("csrftoken");
//   if (csrfToken) {
//     config.headers["X-CSRFToken"] = csrfToken;
//   }
//   return config;
// });

// export default api;


// const api= axios.create({
    //     baseURL: import.meta.env.VITE_API_BASE_URL || "https://ivf-backend-ki9p.onrender.com/api",
    //     headers: { "Content-Type": "application/json"},
    //     withCredentials: true,
    // });
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  withCredentials: true,
});

let csrfToken = null;

export async function initCsrf() {
    const res = await api.get("/csrf/");
    csrfToken = res.data.csrfToken; // Django returns it in body
}

//Attach X-CSRFToken header on all mutating requests
api.interceptors.request.use((config)=>{
    const csrfToken = getCookie("csrftoken");
    const method=config.method?.toUpperCase();
    if (["POST","PUT","PATCH","DELETE"].includes(method)) {
        if (csrfToken) config.headers["X-CSRFToken"]=csrfToken;
    }
    return config;
});

export default api;