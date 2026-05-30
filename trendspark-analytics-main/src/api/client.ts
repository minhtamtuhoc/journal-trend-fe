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
  return normalized === "/auth/login" || normalized === "/auth/register";
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

export class ApiClient {
  constructor(private readonly baseUrl = apiConfig.baseUrl) {}

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
        if ((res.status === 401 || res.status === 403) && !isPublicAuthPath(path)) {
          authStorage.setSession(null);
        }
        throw await ApiError.fromResponse(res);
      }
      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;
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
