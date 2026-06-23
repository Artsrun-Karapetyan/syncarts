import { act, renderHook } from "@testing-library/react";
import { afterAll, beforeEach, describe, expect, test } from "bun:test";

import { useLocalStorage } from "./useLocalStorage";

// Setup a simple localStorage mock with in-memory storage
const store: Record<string, string> = {};
const originalLocalStorage = window.localStorage;
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

afterAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: originalLocalStorage,
    writable: true,
    configurable: true,
  });
});

beforeEach(() => {
  // Clear store before each test
  for (const key of Object.keys(store)) {
    delete store[key];
  }
});

describe("useLocalStorage", () => {
  test("returns initial value when nothing stored", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  test("reads existing value from localStorage", () => {
    store["test-key"] = JSON.stringify("existing");
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("existing");
  });

  test("setValue updates the stored value", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
  });

  test("setValue accepts updater function", () => {
    const { result } = renderHook(() => useLocalStorage<number>("test-key", 5));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(6);
  });

  test("persists value to localStorage on setValue", async () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    act(() => {
      result.current[1]("persisted");
    });

    // Wait for async persistValue
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(store["test-key"]).toBe(JSON.stringify("persisted"));
  });

  test("isHydrated is true when no IndexedDB marker", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "val"));
    // No IndexedDB marker in store, so hydrated immediately
    expect(result.current[2]).toBe(true);
  });

  test("returns initial value when localStorage throws", () => {
    const original = localStorageMock.getItem;
    localStorageMock.getItem = () => {
      throw new Error("localStorage error");
    };

    const { result } = renderHook(() =>
      useLocalStorage("test-key", "fallback"),
    );
    expect(result.current[0]).toBe("fallback");

    localStorageMock.getItem = original;
  });

  test("handles objects as stored values", () => {
    const obj = { name: "Alice", age: 30 };
    store["test-key"] = JSON.stringify(obj);
    const { result } = renderHook(() =>
      useLocalStorage<{ name: string; age: number }>("test-key", {
        name: "",
        age: 0,
      }),
    );
    expect(result.current[0]).toEqual(obj);
  });

  test("setValue with same key is stable across renders", () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage("stable-key", 0),
    );
    const setterRef1 = result.current[1];
    rerender();
    const setterRef2 = result.current[1];
    expect(setterRef1).toBe(setterRef2);
  });

  test("uses custom serializer when provided", async () => {
    const serializer = (val: string) => `custom:${val}`;
    const { result } = renderHook(() =>
      useLocalStorage<string>("test-key", "init", serializer),
    );

    act(() => {
      result.current[1]("hello");
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(store["test-key"]).toBe("custom:hello");
  });
});
