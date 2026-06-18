import { clearAuthToken } from "./auth";
import { clearStoredUser } from "./session";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    if (shouldClearAuthSession(response.status, options.token)) {
      clearAuthSession();
    }
    throw new Error(formatApiError(await response.text(), response.status));
  }

  return response.json() as Promise<T>;
}

export function shouldClearAuthSession(status: number, token?: string) {
  return status === 401 && !!token;
}

function clearAuthSession() {
  clearAuthToken();
  clearStoredUser();

  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

export function formatApiError(rawText: string, status: number) {
  try {
    const payload = JSON.parse(rawText);
    const fieldError = formatFieldErrors(
      payload.message?.fieldErrors ?? payload.fieldErrors,
    );
    if (fieldError) return fieldError;

    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message;

    if (typeof message === "string" && message.trim()) return message;
    if (payload.error && status) return `${payload.error} (${status})`;
  } catch {
    // Fall through to the raw response text below.
  }

  return rawText || `Request failed (${status})`;
}

function formatFieldErrors(fieldErrors: unknown) {
  if (!fieldErrors || typeof fieldErrors !== "object") return "";

  const messages = Object.entries(fieldErrors)
    .flatMap(([field, errors]) => {
      if (!Array.isArray(errors)) return [];
      return errors.map((error) => formatFieldError(field, String(error)));
    })
    .filter(Boolean);

  return messages.join(" ");
}

function formatFieldError(field: string, message: string) {
  const label = field.charAt(0).toUpperCase() + field.slice(1);
  return message.toLowerCase().startsWith(label.toLowerCase())
    ? message
    : `${label}: ${message}`;
}

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export function register(input: {
  email: string;
  name: string;
  password: string;
}) {
  return request<{ user: AuthUser; token: string }>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export function login(input: { email: string; password: string }) {
  return request<{ user: AuthUser; token: string }>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export function getMe(token: string) {
  return request<AuthUser>("/auth/me", { token });
}

export function logout(token: string) {
  return request<{ success: true }>("/auth/logout", {
    method: "POST",
    token,
  });
}

export function updateMe(token: string, input: { name?: string }) {
  return request<AuthUser>("/auth/me", {
    method: "PATCH",
    token,
    body: input,
  });
}

export const getToken = () =>
  window.localStorage.getItem("syncarts_auth_token") || undefined;

export const api = {
  get: async <T = any>(path: string) => ({
    data: await request<T>(path, { method: "GET", token: getToken() }),
  }),
  post: async <T = any>(path: string, body?: unknown) => ({
    data: await request<T>(path, { method: "POST", body, token: getToken() }),
  }),
  put: async <T = any>(path: string, body?: unknown) => ({
    data: await request<T>(path, { method: "PUT", body, token: getToken() }),
  }),
  patch: async <T = any>(path: string, body?: unknown) => ({
    data: await request<T>(path, { method: "PATCH", body, token: getToken() }),
  }),
  delete: async <T = any>(path: string) => ({
    data: await request<T>(path, { method: "DELETE", token: getToken() }),
  }),
};
