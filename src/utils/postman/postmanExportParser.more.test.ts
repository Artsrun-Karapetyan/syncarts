import { describe, expect, test } from "bun:test";

import type {
  Collection,
  Folder,
  SavedRequest,
} from "@/contexts/WorkspaceContext";
import { stringifyPostmanCollection } from "@/utils/postman/postmanExportParser";

function makeCollection(overrides: Partial<Collection>): Collection {
  return {
    id: "col-1",
    name: "Col 1",
    collections: [],
    items: [],
    variables: [],
    environments: [],
    ...overrides,
  };
}

describe("postmanExportParser extra cases", () => {
  test("exports collection variables, events, and auth", () => {
    const col = makeCollection({
      variables: [
        {
          id: "v1",
          key: "url",
          value: "https://api.test",
          enabled: true,
          type: "string",
        },
      ],
      preRequestScript: "console.log('pre')",
      testScript: "console.log('test')",
      authType: "bearer",
      bearerToken: "token123",
    });

    const parsed = JSON.parse(stringifyPostmanCollection(col));
    expect(parsed.variable[0]).toEqual({
      key: "url",
      value: "https://api.test",
      type: "string",
      disabled: false,
    });
    expect(parsed.event).toHaveLength(2);
    expect(parsed.auth).toEqual({
      type: "bearer",
      bearer: [{ key: "token", value: "token123", type: "string" }],
    });
  });

  test("exports folder variables, events, and auth", () => {
    const folder: Folder = {
      type: "folder",
      id: "f-1",
      name: "Folder 1",
      items: [],
      variables: [
        {
          id: "v1",
          key: "f-var",
          value: "f-val",
          enabled: false,
          type: "string",
        },
      ],
      preRequestScript: "console.log('f-pre')",
      testScript: "console.log('f-test')",
      authType: "none",
    };

    const parsed = JSON.parse(
      stringifyPostmanCollection(makeCollection({ items: [folder] })),
    );
    const exportedFolder = parsed.item[0];
    expect(exportedFolder.variable[0].key).toBe("f-var");
    expect(exportedFolder.variable[0].disabled).toBe(true);
    expect(exportedFolder.event).toHaveLength(2);
    expect(exportedFolder.auth).toEqual({ type: "noauth" });
  });

  test("exports request query params and body types", () => {
    const req: SavedRequest = {
      type: "request",
      id: "r-1",
      name: "Req 1",
      method: "POST",
      url: "invalid-url-no-protocol.com/api/test?q=1", // Hits fallback URL parser
      headers: [],
      bodyType: "form-data",
      formData: [
        {
          id: "fd1",
          key: "f",
          value: "v",
          type: "text",
          enabled: true,
          description: "desc",
        },
      ],
      queryParams: [
        {
          id: "q1",
          key: "query1",
          value: "val1",
          enabled: true,
          description: "qdesc",
        },
      ],
    };

    const parsed = JSON.parse(
      stringifyPostmanCollection(makeCollection({ items: [req] })),
    );
    const exportedReq = parsed.item[0].request;

    // Check fallback URL parsing
    expect(exportedReq.url.host).toEqual(["invalid-url-no-protocol", "com"]);
    expect(exportedReq.url.path).toEqual(["api", "test"]);

    // Check query params
    expect(exportedReq.url.query[0]).toEqual({
      key: "query1",
      value: "val1",
      description: "qdesc",
      disabled: false,
    });

    // Check body
    expect(exportedReq.body.mode).toBe("form-data");
    expect(exportedReq.body.formdata[0]).toEqual({
      key: "f",
      value: "v",
      type: "text",
      description: "desc",
      disabled: false,
    });
  });

  test("exports x-www-form-urlencoded body", () => {
    const req: SavedRequest = {
      type: "request",
      id: "r-1",
      name: "Req 1",
      method: "POST",
      url: "https://api.com",
      headers: [],
      bodyType: "x-www-form-urlencoded",
      formData: [
        { id: "fd1", key: "f", value: "v", type: "text", enabled: false },
      ],
    };

    const parsed = JSON.parse(
      stringifyPostmanCollection(makeCollection({ items: [req] })),
    );
    const exportedReq = parsed.item[0].request;

    expect(exportedReq.body.mode).toBe("x-www-form-urlencoded");
    expect(exportedReq.body.urlencoded[0]).toEqual({
      key: "f",
      value: "v",
      type: "text",
      disabled: true,
    });
  });
});
