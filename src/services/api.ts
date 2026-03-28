import { getCachedResponse, mutateCachedResponse, saveCachedResponse } from "../data/db";
import { queueOfflineOp } from "../data/sync";
import { isOnline } from "../plugins/network";
import { buildApiUrl } from "../config/api";
import { IS_WEB_TARGET } from "../config/runtime";

// src/services/api.ts

/* ===============================
   GENERAL REQUEST (SAFE)
================================ */
export const apiRequest = async <T = any>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const url = buildApiUrl(endpoint);

  const method = (options?.method || "GET").toUpperCase();

  if (IS_WEB_TARGET) {
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
      data = contentType.includes("application/json")
        ? await res.json()
        : await res.text();
    } catch {
      data = null;
    }

    if (!res.ok) {
      if (typeof data === "object" && data?.message) {
        throw new Error(data.message);
      }

      if (typeof data === "string" && data.trim() !== "") {
        throw new Error(data);
      }

      throw new Error(`Request failed: ${res.status}`);
    }

    return data as T;
  }

  const online = await isOnline().catch(() => false);

  if (!online && method === "GET") {
    try {
      const cached = await getCachedResponse<T>(url);
      if (cached !== null) {
        return cached;
      }
    } catch (cacheError) {
      console.warn("Unable to read cached GET response", cacheError);
    }
  }

  try {
    if (!online && method !== "GET") {
      await queueOfflineOp(method, url, options?.body, options?.headers as
        | Record<string, string>
        | undefined);

      // Return optimistic payload if we can parse it, else a marker object.
      if (options?.body && typeof options.body === "string") {
        try {
          return {
            ...JSON.parse(options.body),
            _queued: true,
          } as T;
        } catch {
          /* fall through */
        }
      }

      return { _queued: true } as T;
    }
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
      if (typeof data === "object" && data?.message) {
        throw new Error(data.message);
      }

      if (typeof data === "string" && data.trim() !== "") {
        throw new Error(data);
      }

      throw new Error(`Request failed: ${res.status}`);
    }

    if (method === "GET" && online) {
      saveCachedResponse(url, data).catch((error) =>
        console.warn("Unable to cache response", error),
      );
    }

    return data as T;
  } catch (error) {
    console.error("API request failed:", error);

    if (method === "GET") {
      try {
        const cached = await getCachedResponse<T>(url);
        if (cached !== null) {
          return cached;
        }
      } catch (cacheError) {
        console.warn("Unable to read cached fallback response", cacheError);
      }
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Network error. Please check your connection.");
  }
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

export const apiDelete = <T = any>(endpoint: string) =>
  apiRequest<T>(endpoint, { method: "DELETE" });

export const updateCachedCollection = async <T>(
  endpoint: string,
  mutate: (items: T[]) => T[],
) => {
  if (IS_WEB_TARGET) {
    return mutate([]);
  }
  const url = buildApiUrl(endpoint);
  try {
    return await mutateCachedResponse<T[]>(url, (current) =>
      mutate(Array.isArray(current) ? current : []),
    );
  } catch (error) {
    console.warn("Unable to update cached collection", error);
    return mutate([]);
  }
};
