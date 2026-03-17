import axios from "axios";

export const baseURL = process.env.NEXT_PUBLIC_BASEURL;
const AUTH_DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === "true";

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  if (AUTH_DEBUG) {
    console.log("[AuthDebug] axios:request", {
      baseURL,
      url: config.url,
      method: config.method,
      withCredentials: config.withCredentials ?? true,
    });
  }
  return config;
});

let isRefreshing = false;
let isAdminRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];
let adminFailedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(null);
  });
  failedQueue = [];
};

const processAdminQueue = (error: any) => {
  adminFailedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(null);
  });
  adminFailedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    if (AUTH_DEBUG) {
      console.log("[AuthDebug] axios:response", {
        url: response.config?.url,
        status: response.status,
      });
    }
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    console.log("[Axios Interceptor] Response error:", {
      status: error.response?.status,
      url: originalRequest?.url,
      hasRetried: originalRequest?._retry
    });

    if (
      error.response?.status === 403 &&
      typeof error.response?.data?.message === "string" &&
      error.response.data.message.includes("blocked")
    ) {
      if (typeof window !== "undefined") {
        const reason = error.response?.data?.reason || "";
        sessionStorage.setItem("blockedReason", reason);
        window.location.href = "/blocked";
      }
      return Promise.reject(error);
    }

    const requestUrl = originalRequest?.url || "";
    const isAuthRefresh = requestUrl.includes("/auth/refresh-token");
    const isAdminRefresh = requestUrl.includes("/admin/auth/refresh-token");
    const isAdminRequest = requestUrl.startsWith("/admin");
    const isAdminLogin = requestUrl.includes("/admin/auth/login");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRefresh && !isAdminRequest) {
      console.log("[Axios Interceptor] 401 detected - initiating refresh flow");
      
      if (isRefreshing) {
        console.log("[Axios Interceptor] Already refreshing - queueing request");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            console.log("[Axios Interceptor] Retrying queued request:", originalRequest.url);
            return axiosInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("[Axios Interceptor] Calling POST /auth/refresh-token");
        await axiosInstance.post("/auth/refresh-token");
        
        console.log("[Axios Interceptor] Refresh successful - processing queue");
        processQueue(null);
        
        console.log("[Axios Interceptor] Retrying original request:", originalRequest.url);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("[Axios Interceptor] Refresh failed - redirecting to login");
        processQueue(refreshError);
        
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry && isAdminRequest && !isAdminRefresh && !isAdminLogin) {
      console.log("[Axios Interceptor] Admin 401 detected - initiating admin refresh flow");

      if (isAdminRefreshing) {
        console.log("[Axios Interceptor] Admin refresh in progress - queueing request");
        return new Promise((resolve, reject) => {
          adminFailedQueue.push({ resolve, reject });
        })
          .then(() => {
            console.log("[Axios Interceptor] Retrying queued admin request:", originalRequest.url);
            return axiosInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isAdminRefreshing = true;

      try {
        console.log("[Axios Interceptor] Calling POST /admin/auth/refresh-token");
        await axiosInstance.post("/admin/auth/refresh-token");

        console.log("[Axios Interceptor] Admin refresh successful - processing queue");
        processAdminQueue(null);

        console.log("[Axios Interceptor] Retrying original admin request:", originalRequest.url);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("[Axios Interceptor] Admin refresh failed - redirecting to admin login");
        processAdminQueue(refreshError);

        if (typeof window !== "undefined") {
          window.location.href = "/admin/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isAdminRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
