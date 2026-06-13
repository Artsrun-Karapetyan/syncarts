const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

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
    throw new Error(formatApiError(await response.text(), response.status));
  }

  return response.json() as Promise<T>;
}

function formatApiError(rawText: string, status: number) {
  try {
    const payload = JSON.parse(rawText);
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
  return request<AuthUser>("/auth/me", {
    token,
  });
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

const getToken = () =>
  window.localStorage.getItem("syncarts_auth_token") || undefined;

export const api = {
  get: async (path: string) => ({
    data: await request<any>(path, { method: "GET", token: getToken() }),
  }),
  post: async (path: string, body?: any) => ({
    data: await request<any>(path, { method: "POST", body, token: getToken() }),
  }),
  put: async (path: string, body?: any) => ({
    data: await request<any>(path, { method: "PUT", body, token: getToken() }),
  }),
  patch: async (path: string, body?: any) => ({
    data: await request<any>(path, {
      method: "PATCH",
      body,
      token: getToken(),
    }),
  }),
  delete: async (path: string) => ({
    data: await request<any>(path, { method: "DELETE", token: getToken() }),
  }),
};
