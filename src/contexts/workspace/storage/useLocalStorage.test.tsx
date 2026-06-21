import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  const mockDbStore = new Map<string, any>();

  beforeEach(() => {
    localStorage.clear();
    mockDbStore.clear();

    const mockIndexedDB = {
      open: () => {
        const result = {
          createObjectStore: () => {},
          transaction: () => {
            const tx: any = {
              objectStore: () => ({
                get: (key: string) => {
                  const req: any = { onsuccess: null };
                  Promise.resolve().then(() => {
                    req.result = mockDbStore.get(key);
                    req.onsuccess?.();
                  });
                  return req;
                },
                put: (val: any, key: string) => {
                  mockDbStore.set(key, val);
                },
              }),
              oncomplete: null,
              onerror: null,
            };
            Promise.resolve().then(() => {
              tx.oncomplete?.();
            });
            return tx;
          },
          close: () => {},
        };
        const request: any = { onsuccess: null, result };
        Promise.resolve().then(() => {
          request.onsuccess?.();
        });
        return request;
      },
    };

    Object.defineProperty(window, "indexedDB", {
      value: mockIndexedDB,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("uses initial value if key does not exist", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default-value"),
    );
    expect(result.current[0]).toBe("default-value");
  });

  test("reads and updates value from/to localStorage", () => {
    localStorage.setItem("test-key", JSON.stringify("local-value"));
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));

    expect(result.current[0]).toBe("local-value");

    act(() => {
      result.current[1]("new-value");
    });

    expect(result.current[0]).toBe("new-value");
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"));
  });

  test("falls back to IndexedDB for large values", async () => {
    const largeValue = "a".repeat(1_000_050);
    const { result } = renderHook(() => useLocalStorage("large-key", ""));

    await act(async () => {
      result.current[1](largeValue);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(localStorage.getItem("large-key")).toBe("__syncarts_indexeddb__");
    expect(mockDbStore.get("large-key")).toBe(JSON.stringify(largeValue));
  });
});
