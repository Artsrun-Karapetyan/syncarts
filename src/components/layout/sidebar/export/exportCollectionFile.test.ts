import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { exportCollectionFile } from "./exportCollectionFile";

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

describe("exportCollectionFile", () => {
  const originalAlert = global.alert;
  const originalConsoleError = console.error;
  const alertMock = mock();
  const consoleErrorMock = mock();

  beforeEach(() => {
    invokeMock.mockClear();
    saveMock.mockClear();
    alertMock.mockClear();
    consoleErrorMock.mockClear();
    global.alert = alertMock;
    console.error = consoleErrorMock;
  });

  afterEach(() => {
    global.alert = originalAlert;
    console.error = originalConsoleError;
  });

  test("exports successfully", async () => {
    saveMock.mockResolvedValue("/path/to/file.json");
    invokeMock.mockResolvedValue(undefined);

    await exportCollectionFile("test-col", {} as any);

    expect(saveMock).toHaveBeenCalledWith({
      defaultPath: "test-col.postman_collection.json",
      filters: [{ name: "Postman Collection", extensions: ["json"] }],
    });
    expect(invokeMock).toHaveBeenCalledWith("save_response_body", {
      path: "/path/to/file.json",
      body: "mocked-json",
    });
  });

  test("does nothing if path not selected", async () => {
    saveMock.mockResolvedValue(null);

    await exportCollectionFile("test-col", {} as any);

    expect(invokeMock).not.toHaveBeenCalled();
  });

  test("handles save error", async () => {
    saveMock.mockRejectedValue(new Error("Save failed"));

    await exportCollectionFile("test-col", {} as any);

    expect(consoleErrorMock).toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith("Failed to export collection.");
  });
});
