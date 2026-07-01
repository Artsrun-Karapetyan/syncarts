import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockFetch = mock();
global.fetch = mockFetch as any;

function makeOkResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(""),
  };
}

function makeErrorResponse(status: number, body: string) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(body),
  };
}

import {
  api,
  formatApiError,
  getMe,
  login,
  logout,
  register,
  shouldClearAuthSession,
  updateMe,
} from "./api";

beforeEach(() => {
  mockFetch.mockReset();
  // Clear auth token
  window.localStorage.removeItem("syncarts_auth_token");
});

describe("shouldClearAuthSession", () => {
  test("returns true for 401 with token", () => {
    expect(shouldClearAuthSession(401, "some-token")).toBe(true);
  });

  test("returns false for 401 without token", () => {
    expect(shouldClearAuthSession(401, undefined)).toBe(false);
  });

  test("returns false for non-401 with token", () => {
    expect(shouldClearAuthSession(403, "token")).toBe(false);
    expect(shouldClearAuthSession(500, "token")).toBe(false);
  });
});

describe("formatApiError", () => {
  test("returns raw text for non-JSON response", () => {
    expect(formatApiError("Service unavailable", 503)).toBe(
      "Service unavailable",
    );
  });

  test("returns fallback when raw text is empty", () => {
    expect(formatApiError("", 500)).toBe("Request failed (500)");
  });

  test("returns JSON message string", () => {
    const rawText = JSON.stringify({ message: "Invalid credentials" });
    expect(formatApiError(rawText, 400)).toBe("Invalid credentials");
  });

  test("returns joined message array", () => {
    const rawText = JSON.stringify({ message: ["Error A", "Error B"] });
    expect(formatApiError(rawText, 400)).toBe("Error A, Error B");
  });

  test("returns error + status when message missing", () => {
    const rawText = JSON.stringify({ error: "Not Found" });
    expect(formatApiError(rawText, 404)).toBe("Not Found (404)");
  });

  test("returns field errors when present", () => {
    const rawText = JSON.stringify({
      message: { fieldErrors: { email: ["is required"] } },
    });
    expect(formatApiError(rawText, 422)).toContain("required");
  });

  test("returns fieldErrors at root level", () => {
    const rawText = JSON.stringify({
      fieldErrors: { name: ["too short"] },
    });
    expect(formatApiError(rawText, 422)).toContain("too short");
  });
});

describe("register", () => {
  test("posts to /auth/register", async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse({ user: { id: "u1" }, token: "tok" }),
    );
    const result = await register({
      email: "a@b.com",
      name: "Alice",
      password: "pass",
    });
    expect(result.token).toBe("tok");
    expect(mockFetch.mock.calls[0][0]).toContain("/auth/register");
  });

  test("throws on error response", async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(400, "Email taken"));
    await expect(
      register({ email: "a@b.com", name: "A", password: "p" }),
    ).rejects.toThrow("Email taken");
  });
});

describe("login", () => {
  test("posts to /auth/login", async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse({ user: { id: "u1" }, token: "tok" }),
    );
    const result = await login({ email: "a@b.com", password: "pass" });
    expect(result.token).toBe("tok");
    expect(mockFetch.mock.calls[0][0]).toContain("/auth/login");
  });
});

describe("logout", () => {
  test("posts to /auth/logout", async () => {
    mockFetch.mockResolvedValue(makeOkResponse({ success: true }));
    const result = await logout("my-token");
    expect(result).toEqual({ success: true });
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/auth/logout");
    expect(options.headers.authorization).toBe("Bearer my-token");
  });
});

describe("getMe", () => {
  test("fetches /auth/me with token", async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse({
        id: "u1",
        email: "a@b.com",
        name: "Alice",
        createdAt: "",
      }),
    );
    const result = await getMe("my-token");
    expect(result.id).toBe("u1");
    expect(mockFetch.mock.calls[0][0]).toContain("/auth/me");
  });
});

describe("updateMe", () => {
  test("patches /auth/me", async () => {
    mockFetch.mockResolvedValue(
      makeOkResponse({
        id: "u1",
        email: "a@b.com",
        name: "Bob",
        createdAt: "",
      }),
    );
    const result = await updateMe("token", { name: "Bob" });
    expect(result.name).toBe("Bob");
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PATCH");
  });
});

describe("api", () => {
  beforeEach(() => {
    window.localStorage.setItem("syncarts_auth_token", "test-token");
  });

  test("api.get makes GET request", async () => {
    mockFetch.mockResolvedValue(makeOkResponse({ items: [] }));
    const result = await api.get("/workspaces");
    expect(result.data).toEqual({ items: [] });
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
  });

  test("api.post makes POST request", async () => {
    mockFetch.mockResolvedValue(makeOkResponse({ id: "new" }));
    const result = await api.post("/workspaces", { name: "WS" });
    expect(result.data).toEqual({ id: "new" });
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
  });

  test("api.put makes PUT request", async () => {
    mockFetch.mockResolvedValue(makeOkResponse({ updated: true }));
    await api.put("/workspaces/1/sync", { collections: [] });
    expect(mockFetch.mock.calls[0][1].method).toBe("PUT");
  });

  test("api.patch makes PATCH request", async () => {
    mockFetch.mockResolvedValue(makeOkResponse({ patched: true }));
    await api.patch("/workspaces/1", { name: "New" });
    expect(mockFetch.mock.calls[0][1].method).toBe("PATCH");
  });

  test("api.delete makes DELETE request", async () => {
    mockFetch.mockResolvedValue(makeOkResponse({ deleted: true }));
    await api.delete("/workspaces/1");
    expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
  });

  test("api.get throws on error response", async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(404, "Not found"));
    await expect(api.get("/not-found")).rejects.toThrow("Not found");
  });
});
