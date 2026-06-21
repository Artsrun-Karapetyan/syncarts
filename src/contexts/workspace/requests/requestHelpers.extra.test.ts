import { describe, expect, test } from "bun:test";
import { getRequestAncestors, resolveRequestAuth, resolveChainVariable, interpolateVariables } from "./requestHelpers";

describe("requestHelpers extra cases", () => {
  test("getRequestAncestors finds ancestor by savedRequestId when folderId is missing", () => {
    const collections = [
      {
        id: "c1",
        items: [
          {
            type: "folder",
            id: "f1",
            items: [{ type: "request", id: "r1" }]
          }
        ]
      }
    ] as any[];

    const result = getRequestAncestors({ collectionId: "c1", savedRequestId: "r1" } as any, collections);
    expect(result.length).toBe(2);
    expect(result[1].id).toBe("f1");
  });

  test("resolveRequestAuth inherits from ancestors", () => {
    const collections = [
      {
        id: "c1",
        items: [
          {
            type: "folder",
            id: "f1",
            authType: "bearer",
            bearerToken: "abc",
            items: [{ type: "request", id: "r1" }]
          }
        ]
      }
    ] as any[];

    const result = resolveRequestAuth({ authType: "inherit", collectionId: "c1", folderId: "f1" } as any, collections);
    expect(result.authType).toBe("bearer");
    expect(result.bearerToken).toBe("abc");
    expect(result.inheritedFrom?.id).toBe("f1");
  });

  test("resolveChainVariable handles invalid json body cache gracefully", () => {
    const cache = {
      "r1": { body: "invalid json" }
    };
    const originalError = console.error;
    console.error = () => {}; // Silence the expected error
    const result = resolveChainVariable("$chain:r1:body.id", cache);
    console.error = originalError;
    expect(result).toBeNull();
  });

  test("interpolateVariables handles max iterations safely", () => {
    const text = "{{var1}}";
    const vars = [{ id: "1", key: "var1", value: "{{var2}}", enabled: true }, { id: "2", key: "var2", value: "{{var1}}", enabled: true }];
    const result = interpolateVariables({
      activeEnvironment: undefined,
      activeTab: { collectionId: "c1" } as any,
      collections: [{ id: "c1", items: [], variables: vars } as any],
      globalVariables: [],
      text
    });
    // Should not infinite loop, might return partially interpolated string
    expect(typeof result).toBe("string");
  });
});
