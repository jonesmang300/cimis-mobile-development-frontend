// src/services/api.ts

const BASE_URL = "https://comsip.cloud/api";
// const BASE_URL = "https://api-development-j6pl.onrender.com/api";
//const BASE_URL = "http://localhost:3000/api";

/* ===============================
   GENERAL REQUEST (SAFE)
================================ */
export const apiRequest = async <T = any>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> => {
  const token = localStorage.getItem("token");
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  let data: any = null;

  try {
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }
  } catch {
    data = null;
  }

  if (!res.ok) {
    // if server returns JSON message
    if (typeof data === "object" && data?.message) {
      throw new Error(data.message);
    }

    // if server returns plain text
    if (typeof data === "string" && data.trim() !== "") {
      throw new Error(data);
    }

    throw new Error(`Request failed: ${res.status}`);
  }

  return data as T;
};

/* ===============================
   SHORTCUT METHODS
================================ */
export const apiGet = <T = any>(endpoint: string) =>
  apiRequest<T>(endpoint, { method: "GET" });

export const apiPost = <T = any>(endpoint: string, body: any) =>
  apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiPatch = <T = any>(endpoint: string, body: any) =>
  apiRequest<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
