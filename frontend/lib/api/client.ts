import axios from "axios";

const baseURL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api$/, "") + "/api";

const apiClient = axios.create({
  baseURL,
  withCredentials: true, // ✅ CRITICAL: Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});


// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
