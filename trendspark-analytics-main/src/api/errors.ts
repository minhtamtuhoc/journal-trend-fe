export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => undefined);
    }
    let message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : res.statusText || `Request failed (${res.status})`;

    if (res.status === 401) {
      message = "Incorrect password";
    } else if (res.status === 403) {
      const isAuthRoute = res.url.includes("/auth/login") || res.url.includes("/auth/register");
      if (isAuthRoute) {
        message =
          "Không thể đăng nhập (frontend chặn /api). Kiểm tra backend port 8080 đang chạy, file .env có VITE_API_BASE_URL=http://localhost:8080/api, rồi thử admin@helix.io / admin12345.";
      } else if (message === "Forbidden" || message === "Access denied") {
        message =
          "Phiên đăng nhập không hợp lệ hoặc không đủ quyền. Hãy đăng xuất và đăng nhập lại bằng admin@helix.io.";
      }
    }

    return new ApiError(message, res.status, body);
  }
}
