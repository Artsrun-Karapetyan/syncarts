import { describe, expect, test } from "bun:test";

import {
  addExampleToItems,
  addRequestToFolder,
  filterItemFromItems,
  hasRequestInTarget,
  sortItemsByTarget,
  updateRequestInItems,
} from "@/contexts/workspace/collections/collectionItemHelpers";
import type {
  Folder,
  SavedRequest,
  TabData,
} from "@/contexts/workspace/core/types";

const request = (id: string, name = id): SavedRequest => ({
  type: "request",
  id,
  name,
  method: "GET",
  url: `/${id}`,
  headers: [],
  body: "",
});

const folder = (id: string, items: (Folder | SavedRequest)[] = []): Folder => ({
  type: "folder",
  id,
  name: id,
  items,
});

describe("collectionItemHelpers", () => {
  test("finds, updates, and moves requests inside nested folders", () => {
    const items = [folder("folder", [request("old")]), request("root")];
    const updated = updateRequestInItems(items, {
      ...request("old"),
      name: "Updated",
    });
    const moved = addRequestToFolder(
      filterItemFromItems(updated, "root"),
      "folder",
      request("root"),
    );

    expect(hasRequestInTarget(moved, "folder", "old")).toBe(true);
    expect(hasRequestInTarget(moved, null, "root")).toBe(false);
    expect(hasRequestInTarget(moved, "folder", "root")).toBe(true);
  });

  test("adds examples from active tab response and sorts folders first", () => {
    const activeTab = {
      response: {
        status: 201,
        status_text: "Created",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        time_ms: 10,
      },
    } as TabData;
    const withExample = addExampleToItems(
      [request("request")],
      "request",
      "Created example",
      activeTab,
    );
    const savedRequest = withExample[0] as SavedRequest;

    expect(savedRequest.examples?.[0]).toMatchObject({
      name: "Created example",
      code: 201,
      status: "Created",
    });
    expect(
      sortItemsByTarget([request("b"), folder("a")], null, "default")[0],
    ).toMatchObject({ type: "folder", id: "a" });
  });

  test("saves originalRequest details when creating example from active tab", () => {
    const activeTab = {
      method: "POST",
      url: "https://api.example.com/users",
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Authorization", value: "Bearer token123" },
      ],
      bodyType: "raw" as const,
      description: "Creates a user",
      body: '{"name": "John"}',
      formData: undefined,
      queryParams: [{ key: "page", value: "1", enabled: true }],
      queryParamDescriptions: { page: "Page number" },
      pathVariables: [
        { id: "v1", key: "version", value: "v2", description: "API version" },
      ],
      authType: "bearer" as const,
      bearerToken: "token123",
      preRequestScript: "console.log('before')",
      testScript: "pm.test('created', () => {})",
      response: {
        status: 201,
        status_text: "Created",
        headers: { "Content-Type": "application/json" },
        body: '{"id": 1}',
        time_ms: 45,
      },
    } as TabData;

    const withExample = addExampleToItems(
      [request("req1")],
      "req1",
      "POST user",
      activeTab,
    );
    const savedRequest = withExample[0] as SavedRequest;
    const example = savedRequest.examples?.[0];

    expect(example).toBeDefined();
    expect(example!.originalRequest).toEqual({
      method: "POST",
      url: "https://api.example.com/users",
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Authorization", value: "Bearer token123" },
      ],
      bodyType: "raw",
      description: "Creates a user",
      body: '{"name": "John"}',
      formData: undefined,
      queryParams: [{ key: "page", value: "1", enabled: true }],
      queryParamDescriptions: { page: "Page number" },
      pathVariables: [
        { id: "v1", key: "version", value: "v2", description: "API version" },
      ],
      authType: "bearer",
      bearerToken: "token123",
      preRequestScript: "console.log('before')",
      testScript: "pm.test('created', () => {})",
    });
    expect(example!.code).toBe(201);
    expect(example!.body).toBe('{"id": 1}');
  });

  test("creates example with undefined originalRequest when no active tab", () => {
    const withExample = addExampleToItems(
      [request("req1")],
      "req1",
      "Empty example",
      undefined,
    );
    const savedRequest = withExample[0] as SavedRequest;
    const example = savedRequest.examples?.[0];

    expect(example).toBeDefined();
    expect(example!.originalRequest).toBeUndefined();
    expect(example!.code).toBe(200);
  });

  test("saves form-data and body type in originalRequest", () => {
    const activeTab = {
      method: "POST",
      url: "https://api.example.com/upload",
      headers: [],
      bodyType: "form-data" as const,
      body: "",
      formData: [
        {
          id: "f1",
          key: "file",
          value: "",
          enabled: true,
          type: "file",
          files: ["/path/to/file.png"],
        },
        {
          id: "f2",
          key: "name",
          value: "test",
          enabled: true,
          type: "text",
        },
      ],
      response: {
        status: 200,
        status_text: "OK",
        headers: {},
        body: "",
        time_ms: 10,
      },
    } as TabData;

    const withExample = addExampleToItems(
      [request("req1")],
      "req1",
      "Upload",
      activeTab,
    );
    const savedRequest = withExample[0] as SavedRequest;
    const example = savedRequest.examples?.[0];

    expect(example!.originalRequest).toEqual({
      method: "POST",
      url: "https://api.example.com/upload",
      headers: [],
      bodyType: "form-data",
      body: "",
      formData: [
        {
          id: "f1",
          key: "file",
          value: "",
          enabled: true,
          type: "file",
          files: ["/path/to/file.png"],
        },
        {
          id: "f2",
          key: "name",
          value: "test",
          enabled: true,
          type: "text",
        },
      ],
      queryParams: undefined,
      queryParamDescriptions: undefined,
      pathVariables: undefined,
      authType: undefined,
      bearerToken: undefined,
      description: undefined,
      preRequestScript: undefined,
      testScript: undefined,
    });
  });
});
