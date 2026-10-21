import axios from "axios";

const baseURL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api$/, "") + "/api";

const apiClient = axios.create({
  baseURL,
  withCredentials: true, // ✅ CRITICAL: Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});


let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor with silent refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        processQueue();
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);

        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          const isProtectedRoute =
            path.startsWith('/admin') ||
            path.startsWith('/company') ||
            path.startsWith('/profile') ||
            path.startsWith('/staff') ||
            path.startsWith('/bookings');

          if (isProtectedRoute && !path.startsWith('/auth')) {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
