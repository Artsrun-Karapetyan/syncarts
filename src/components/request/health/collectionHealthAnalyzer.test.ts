import { describe, expect, test } from "bun:test";

import type {
  Collection,
  SavedRequest,
} from "../../../contexts/WorkspaceContext";
import { analyzeCollectionHealth } from "./collectionHealthAnalyzer";

describe("analyzeCollectionHealth", () => {
  test("reports request quality warnings", () => {
    const report = analyzeCollectionHealth(
      collection([
        request("a", {
          url: "",
        }),
      ]),
    );

    expect(report.requestCount).toBe(1);
    expect(report.score).toBeLessThan(100);
    expect(report.issues.map((issue) => issue.code)).toEqual([
      "empty-url",
      "no-examples",
      "no-tests",
      "no-docs",
    ]);
  });

  test("uses inherited test scripts and variables", () => {
    const report = analyzeCollectionHealth({
      ...collection([
        request("a", {
          description: "Docs",
          examples: [
            {
              id: "ex",
              name: "OK",
              code: 200,
              status: "OK",
              body: "",
              headers: [],
            },
          ],
          url: "{{base_url}}/users",
        }),
      ]),
      testScript: "pm.test('ok', () => {})",
      variables: [
        {
          id: "var",
          key: "base_url",
          value: "https://api.test",
          enabled: true,
        },
      ],
    });

    expect(report.issues).toEqual([]);
    expect(report.score).toBe(100);
  });

  test("reports missing variables and duplicates", () => {
    const report = analyzeCollectionHealth(
      collection([
        request("a", { url: "{{missing}}/users?page=1&limit=10" }),
        request("b", { url: "https://api.test/users?limit=10&page=1" }),
      ]),
    );

    expect(report.duplicateGroups).toBe(1);
    expect(report.issues.map((issue) => issue.code)).toContain(
      "missing-variable",
    );
    expect(report.issues.map((issue) => issue.code)).toContain(
      "duplicate-request",
    );
  });
});

function collection(items: Collection["items"]): Collection {
  return {
    id: "collection",
    name: "API",
    items,
  };
}

function request(id: string, overrides: Partial<SavedRequest>): SavedRequest {
  return {
    type: "request",
    id,
    name: id,
    method: "GET",
    url: "/users",
    headers: [],
    body: "",
    ...overrides,
  };
}
