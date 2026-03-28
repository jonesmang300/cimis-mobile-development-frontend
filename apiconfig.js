// Legacy config shim kept in sync with Vite env-based API configuration.
const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "https://comsip.cloud/api").replace(/\/+$/, "");

export default API_BASE_URL;
