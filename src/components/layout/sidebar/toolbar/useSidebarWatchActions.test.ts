import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { useSidebarWatchActions } from "./useSidebarWatchActions";

const toggleWatch = mock();
const isWatched = mock();

mock.module("@/components/watch/useWorkspaceWatches", () => ({
  useWorkspaceWatches: () => ({
    toggleWatch,
    isWatched,
  }),
}));

describe("useSidebarWatchActions", () => {
  beforeEach(() => {
    toggleWatch.mockClear();
    isWatched.mockClear();
  });

  test("returns watch state and actions", () => {
    isWatched.mockReturnValue(true);
    const { result } = renderHook(() => useSidebarWatchActions("ws1", mock()));

    expect(result.current.isWorkspaceWatched).toBe(true);
    expect(isWatched).toHaveBeenCalledWith("workspace", "ws1");
  });

  test("returns false if no active workspace", () => {
    const { result } = renderHook(() => useSidebarWatchActions(null, mock()));
    expect(result.current.isWorkspaceWatched).toBe(false);
  });

  test("handleToggleWorkspaceWatch success", async () => {
    toggleWatch.mockResolvedValue(true);
    const showToast = mock();
    const { result } = renderHook(() =>
      useSidebarWatchActions("ws1", showToast),
    );

    result.current.handleToggleWorkspaceWatch();

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("Watching workspace");
    });
  });

  test("handleToggleWorkspaceWatch failure", async () => {
    toggleWatch.mockRejectedValue(new Error("Network Error"));
    const showToast = mock();
    const { result } = renderHook(() =>
      useSidebarWatchActions("ws1", showToast),
    );

    result.current.handleToggleWorkspaceWatch();

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("Network Error");
    });
  });

  test("handleToggleWorkspaceWatch no workspace", () => {
    const showToast = mock();
    const { result } = renderHook(() =>
      useSidebarWatchActions(null, showToast),
    );

    result.current.handleToggleWorkspaceWatch();
    expect(toggleWatch).not.toHaveBeenCalled();
  });
});
