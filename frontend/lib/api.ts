// Sambhav API client: bearer-token storage plus GET / POST / PATCH helpers.
// The base URL comes from NEXT_PUBLIC_API_URL (e.g. http://localhost:5000/api).

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "");

const TOKEN_KEY = "sambhav_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** An error response from the API, with its HTTP status. Status 0 = no response. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  /** Set to false to skip the bearer token (public endpoints). */
  authenticated = true
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (authenticated) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only throws when no response came back at all: server down,
    // wrong URL, or blocked by CORS.
    throw new ApiError(
      0,
      "Can't reach the server. Check that the backend is running."
    );
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const json = (await res.json()) as { message?: string };
      message = json.message ?? message;
    } catch {
      // body wasn't JSON — keep the status text
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string, authenticated = true) =>
  request<T>("GET", path, undefined, authenticated);

export const apiPost = <T>(path: string, body?: unknown, authenticated = true) =>
  request<T>("POST", path, body, authenticated);

export const apiPatch = <T>(path: string, body: unknown, authenticated = true) =>
  request<T>("PATCH", path, body, authenticated);
