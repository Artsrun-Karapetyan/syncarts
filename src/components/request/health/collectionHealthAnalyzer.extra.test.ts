import { describe, expect, test } from "bun:test";
import { analyzeCollectionHealth } from "./collectionHealthAnalyzer";

describe("collectionHealthAnalyzer extra cases", () => {
  test("analyzes nested folders with inherited variables and test scripts", () => {
    const report = analyzeCollectionHealth({
      id: "c1",
      name: "Collection",
      items: [
        {
          type: "folder",
          id: "f1",
          name: "Folder",
          testScript: "test()",
          variables: [{ id: "v1", key: "myVar", value: "1", enabled: true }],
          items: [
            {
              type: "request",
              id: "r1",
              name: "Req",
              method: "GET",
              url: "https://api.com/{{myVar}}",
              headers: [],
              body: "",
              description: "test"
            } as any
          ]
        }
      ]
    } as any);

    expect(report.issues.find(i => i.code === "no-tests")).toBeUndefined();
    expect(report.issues.find(i => i.code === "missing-variable")).toBeUndefined();
  });
});
