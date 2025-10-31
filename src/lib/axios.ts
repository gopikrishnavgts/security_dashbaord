import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const api = axios.create({
  baseURL: baseURL || "/",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_API_KEY as string | undefined;
  if (apiKey) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>)["Authorization"] =
      `Bearer ${apiKey}`;
  }
  return config;
});

export default api;
