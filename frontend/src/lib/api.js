import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Rinnovo automatico della sessione quando l'access token scade
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !String(original.url || "").includes("/auth/")
    ) {
      original._retried = true;
      try {
        await api.post("/auth/refresh");
        return api(original);
      } catch (e) {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Si è verificato un errore. Riprova.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}