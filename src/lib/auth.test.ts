import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { clearAuthToken, getAuthToken, setAuthToken } from "./auth";

describe("auth token helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("getAuthToken returns null if token is not set", () => {
    expect(getAuthToken()).toBeNull();
  });

  test("setAuthToken stores the token in localStorage", () => {
    setAuthToken("my-test-token");
    expect(getAuthToken()).toBe("my-test-token");
  });

  test("clearAuthToken removes the token from localStorage", () => {
    setAuthToken("temp-token");
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });
});
