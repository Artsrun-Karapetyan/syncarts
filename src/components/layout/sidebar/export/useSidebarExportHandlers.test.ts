import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { useSidebarExportHandlers } from "./useSidebarExportHandlers";

const invokeMock = mock();
mock.module("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

const saveMock = mock();
mock.module("@tauri-apps/plugin-dialog", () => ({
  save: saveMock,
}));

mock.module("@/utils/postmanParser", () => ({
  exportToPostmanCollection: mock().mockReturnValue("mocked-json"),
}));

mock.module("@/components/layout/sidebar/utils/utils", () => ({
  findFolder: mock().mockImplementation((items: any[], id: string) =>
    items.find((i) => i.id === id),
  ),
  findRequest: mock().mockImplementation((items: any[], id: string) =>
    items.find((i) => i.id === id),
  ),
}));

describe("useSidebarExportHandlers", () => {
  const collections: any[] = [
    {
      id: "c1",
      name: "C1",
      items: [
        { id: "f1", name: "F1", type: "folder", items: [] },
        { id: "r1", name: "R1", type: "request", description: "req" },
      ],
    },
  ];

  beforeEach(() => {
    invokeMock.mockClear();
    saveMock.mockClear();
  });

  test("exports collection", async () => {
    const { result } = renderHook(() => useSidebarExportHandlers(collections));
    await result.current.handleExportCollection("c1");
    // Wait for the async macro-task of handleExportCollection
    await Promise.resolve();
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: "C1.postman_collection.json",
      }),
    );
  });

  test("exports collection with default name if nameless", async () => {
    const cols = [{ id: "c1", items: [] }] as any;
    const { result } = renderHook(() => useSidebarExportHandlers(cols));
    await result.current.handleExportCollection("c1");
    await Promise.resolve();
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: "collection.postman_collection.json",
      }),
    );
  });

  test("handles export collection missing", async () => {
    const { result } = renderHook(() => useSidebarExportHandlers(collections));
    await result.current.handleExportCollection("missing");
    expect(saveMock).not.toHaveBeenCalled();
  });

  test("exports folder", async () => {
    const { result } = renderHook(() => useSidebarExportHandlers(collections));
    await result.current.handleExportFolder("c1", "f1");
    await Promise.resolve();
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: "F1.postman_collection.json",
      }),
    );
  });

  test("exports folder with default name", async () => {
    const cols = [
      { id: "c1", items: [{ id: "f1", type: "folder", items: [] }] },
    ] as any;
    const { result } = renderHook(() => useSidebarExportHandlers(cols));
    await result.current.handleExportFolder("c1", "f1");
    await Promise.resolve();
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: "folder.postman_collection.json",
      }),
    );
  });

  test("handles export folder missing collection", async () => {
    const { result } = renderHook(() => useSidebarExportHandlers(collections));
    await result.current.handleExportFolder("missing", "f1");
    expect(saveMock).not.toHaveBeenCalled();
  });

  test("handles export folder missing folder", async () => {
    const { result } = renderHook(() => useSidebarExportHandlers(collections));
    await result.current.handleExportFolder("c1", "missing");
    expect(saveMock).not.toHaveBeenCalled();
  });

  test("exports request", async () => {
    const { result } = renderHook(() => useSidebarExportHandlers(collections));
    await result.current.handleExportRequest("c1", "r1");
    await Promise.resolve();
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: "R1.postman_collection.json",
      }),
    );
  });

  test("exports request with default name", async () => {
    const cols = [{ id: "c1", items: [{ id: "r1", type: "request" }] }] as any;
    const { result } = renderHook(() => useSidebarExportHandlers(cols));
    await result.current.handleExportRequest("c1", "r1");
    await Promise.resolve();
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: "request.postman_collection.json",
      }),
    );
  });

  test("handles export request missing collection", async () => {
    const { result } = renderHook(() => useSidebarExportHandlers(collections));
    await result.current.handleExportRequest("missing", "r1");
    expect(saveMock).not.toHaveBeenCalled();
  });

  test("handles export request missing request", async () => {
    const { result } = renderHook(() => useSidebarExportHandlers(collections));
    await result.current.handleExportRequest("c1", "missing");
    expect(saveMock).not.toHaveBeenCalled();
  });
});
