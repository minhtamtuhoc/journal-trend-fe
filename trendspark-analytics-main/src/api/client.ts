import { apiConfig } from "@/api/config";
import { ApiError } from "@/api/errors";
import { authStorage } from "@/auth/storage";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

function isPublicAuthPath(path: string): boolean {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return (
    normalized === "/auth/login" ||
    normalized === "/auth/register" ||
    normalized === "/v1/auth/register" ||
    normalized === "/v1/auth/refresh"
  );
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const base = apiConfig.baseUrl.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const isAbsoluteBase = /^https?:\/\//i.test(base);
  const url = isAbsoluteBase
    ? new URL(`${base}${normalized}`)
    : new URL(
        `${base}${normalized}`,
        typeof window !== "undefined" ? window.location.origin : "http://localhost",
      );

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  // TanStack Start dev server intercepts /api before Vite proxy — use absolute base in .env.
  return isAbsoluteBase ? url.toString() : url.pathname + url.search;
}

let refreshPromise: Promise<string | null> | null = null;

export class ApiClient {
  constructor(private readonly baseUrl = apiConfig.baseUrl) {}

  private async request<T>(path: string, options: RequestOptions = {}, retryCount = 0): Promise<T> {
    const { body, params, headers, timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;
    const token = authStorage.getAccessToken();
    const sendAuth = Boolean(token) && !isPublicAuthPath(path);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(buildUrl(path, params), {
        ...init,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(sendAuth ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        // Backend returns 400 (Bad Request) instead of 401 when the access token expires 
        // specifically on manual validation endpoints like /auth/me and /auth/profile.
        const isAuthVerificationRoute = path === "/auth/me" || path === "/auth/profile";
        const shouldTriggerRefresh = res.status === 401 || (res.status === 400 && isAuthVerificationRoute);

        if (shouldTriggerRefresh && !isPublicAuthPath(path) && retryCount < 1) {
          const refreshToken = authStorage.getRefreshToken();
          if (refreshToken) {
            if (!refreshPromise) {
              refreshPromise = (async () => {
                try {
                  const refreshRes = await fetch(buildUrl("/v1/auth/refresh"), {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ refreshToken }),
                  });
                  if (!refreshRes.ok) {
                    throw new Error("Token refresh request failed");
                  }
                  const refreshJson = await refreshRes.json();
                  const tokenData = refreshJson?.data as { accessToken: string; refreshToken: string } | undefined;
                  if (!tokenData || !tokenData.accessToken || !tokenData.refreshToken) {
                    throw new Error("Invalid token response format");
                  }

                  const existingSession = authStorage.getSession();
                  if (existingSession) {
                    authStorage.setSession({
                      ...existingSession,
                      accessToken: tokenData.accessToken,
                      refreshToken: tokenData.refreshToken,
                    });
                  }
                  return tokenData.accessToken;
                } catch (err) {
                  authStorage.clearSession();
                  if (typeof window !== "undefined") {
                    window.location.href = "/login";
                  }
                  return null;
                } finally {
                  refreshPromise = null;
                }
              })();
            }

            const newAccessToken = await refreshPromise;
            if (newAccessToken) {
              return this.request<T>(path, options, retryCount + 1);
            }
          } else {
            authStorage.clearSession();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
        }

        if ((res.status === 401 || res.status === 403) && !isPublicAuthPath(path)) {
          authStorage.clearSession();
        }
        throw await ApiError.fromResponse(res);
      }
      if (res.status === 204) return undefined as T;
      const text = await res.text();
      if (!text || text.trim() === "") {
        return undefined as T;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError("Request timed out. Backend có đang chạy trên port 8080 không?", 0);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T>(path: string, options?: Omit<RequestOptions, "body" | "method">) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body" | "method">) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body" | "method">) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body" | "method">) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T>(path: string, options?: Omit<RequestOptions, "body" | "method">) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
