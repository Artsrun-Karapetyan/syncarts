const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export function register(input: { email: string; name: string; password: string }) {
  return request<{ user: AuthUser; token: string }>('/auth/register', {
    method: 'POST',
    body: input,
  });
}

export function login(input: { email: string; password: string }) {
  return request<{ user: AuthUser; token: string }>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export function getMe(token: string) {
  return request<AuthUser>('/auth/me', {
    token,
  });
}

export function logout(token: string) {
  return request<{ success: true }>('/auth/logout', {
    method: 'POST',
    token,
  });
}

export function updateMe(token: string, input: { name?: string }) {
  return request<AuthUser>('/auth/me', {
    method: 'PATCH',
    token,
    body: input,
  });
}
