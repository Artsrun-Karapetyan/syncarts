import { describe, expect, test } from "bun:test";

import type { SavedRequest } from "@/contexts/workspace/core/types";

import { createSavedRequestTabUpdate } from "./savedRequestTabUpdate";

describe("createSavedRequestTabUpdate", () => {
  const dummyRequest: SavedRequest = {
    id: "req-123",
    type: "request",
    name: "Get Users",
    method: "GET",
    url: "https://api.example.com/users",
    headers: [{ key: "Authorization", value: "Bearer token", enabled: true }],
    authType: "bearer",
    bearerToken: "token",
    bodyType: "raw",
    body: "{}",
    description: "Get user list",
    pathVariables: [],
    queryParams: [],
    queryParamDescriptions: {},
    formData: [],
    preRequestScript: "",
    testScript: "",
    examples: [],
  };

  test("creates a tab update object with all request properties mapped correctly", () => {
    const update = createSavedRequestTabUpdate(
      dummyRequest,
      "col-1",
      "folder-1",
    );

    expect(update).toEqual({
      name: "Get Users",
      method: "GET",
      url: "https://api.example.com/users",
      headers: dummyRequest.headers,
      authType: "bearer",
      bearerToken: "token",
      bodyType: "raw",
      pathVariables: [],
      queryParamDescriptions: {},
      queryParams: [],
      formData: [],
      description: "Get user list",
      preRequestScript: "",
      testScript: "",
      body: "{}",
      collectionId: "col-1",
      folderId: "folder-1",
      savedRequestId: "req-123",
    });
  });

  test("handles null folderId and converts to undefined", () => {
    const update = createSavedRequestTabUpdate(dummyRequest, "col-1", null);
    expect(update.folderId).toBeUndefined();
  });

  test("uses custom savedRequestId if passed explicitly", () => {
    const update = createSavedRequestTabUpdate(
      dummyRequest,
      "col-1",
      "folder-1",
      "custom-id",
    );
    expect(update.savedRequestId).toBe("custom-id");
  });
});
