import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { useOpenMergeRequestCount } from "./useOpenMergeRequestCount";

const apiMock = {
  get: mock(),
};

mock.module("@/lib/api", () => ({
  api: apiMock,
}));

let mockToken = "token";
mock.module("@/lib/auth", () => ({
  getAuthToken: () => mockToken,
}));

describe("useOpenMergeRequestCount", () => {
  beforeEach(() => {
    apiMock.get.mockClear();
    mockToken = "token";
    // Mock timer to fast forward if needed, or just let initial fetch happen
  });

  afterEach(() => {
    mock.restore();
  });

  test("fetches MRs and sets count", async () => {
    apiMock.get.mockResolvedValue({
      data: [{ status: "OPEN" }, { status: "CLOSED" }, { status: "OPEN" }],
    });

    const { result } = renderHook(() => useOpenMergeRequestCount("ws1"));

    await waitFor(() => {
      expect(result.current).toBe(2);
    });
    expect(apiMock.get).toHaveBeenCalledWith("/merge-requests/workspace/ws1");
  });

  test("does not fetch if no auth token", async () => {
    mockToken = "";
    renderHook(() => useOpenMergeRequestCount("ws1"));

    // give it a moment
    await new Promise((r) => setTimeout(r, 10));
    expect(apiMock.get).not.toHaveBeenCalled();
  });

  test("handles fetch error gracefully", async () => {
    apiMock.get.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useOpenMergeRequestCount("ws1"));

    // wait to ensure it doesn't crash
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current).toBe(0);
  });
});
