import axios from "axios";
import logger from "@/lib/logger";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: false,
});

// Attach Bearer token from localStorage on every request
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 401 interceptor stub — full refresh mutex added in Sprint 2
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logger.warn("Received 401 — token refresh to be implemented in Sprint 2");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
