import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import React from "react";

import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
  useStoredUser,
} from "./session";

const mockUser = {
  id: "u1",
  email: "test@test.com",
  name: "John",
  createdAt: "2026-06-20",
};

function Consumer() {
  const user = useStoredUser();
  return <div data-testid="user-email">{user ? user.email : "none"}</div>;
}

describe("session helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("getStoredUser returns null when empty, and parses user when set", () => {
    expect(getStoredUser()).toBeNull();
    setStoredUser(mockUser);
    expect(getStoredUser()).toEqual(mockUser);
  });

  test("clearStoredUser removes the user from localStorage", () => {
    setStoredUser(mockUser);
    clearStoredUser();
    expect(getStoredUser()).toBeNull();
  });

  test("useStoredUser hook syncs with session changes", () => {
    render(<Consumer />);
    expect(screen.getByTestId("user-email").textContent).toBe("none");

    act(() => {
      setStoredUser(mockUser);
    });
    expect(screen.getByTestId("user-email").textContent).toBe("test@test.com");

    act(() => {
      clearStoredUser();
    });
    expect(screen.getByTestId("user-email").textContent).toBe("none");
  });
});
