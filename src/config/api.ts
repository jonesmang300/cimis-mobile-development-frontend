const rawBaseUrl = String(import.meta.env.VITE_BASE_URL || "").trim();

const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");

export const API_BASE_URL = normalizedBaseUrl || "https://comsip.cloud/api";

export const buildApiUrl = (endpoint: string) =>
  endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
