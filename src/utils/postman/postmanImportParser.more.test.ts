import { describe, expect, test } from "bun:test";

import { parsePostmanCollection } from "./postmanImportParser";

describe("parsePostmanCollection folder cases", () => {
  test("parses nested folder auth, scripts, and variables", () => {
    const collection = parsePostmanCollection(
      JSON.stringify({
        info: { name: "API" },
        item: [
          {
            name: "Folder",
            auth: {
              type: "bearer",
              bearer: [{ key: "token", value: "abc" }],
            },
            event: [
              { listen: "test", script: { exec: ["pm.test('folder', fn);"] } },
            ],
            variable: [{ key: "folderVar", value: "1" }],
            item: [{ name: "Ping", request: "https://api.test/ping" }],
          },
        ],
      }),
    );

    const folder = collection.items[0];

    expect(folder.type).toBe("folder");
    if (folder.type !== "folder") throw new Error("Expected folder");
    expect(folder.authType).toBe("bearer");
    expect(folder.bearerToken).toBe("abc");
    expect(folder.testScript).toBe("pm.test('folder', fn);");
    expect(folder.variables?.[0]).toMatchObject({
      key: "folderVar",
      value: "1",
    });
    expect(folder.items[0]).toMatchObject({
      type: "request",
      url: "https://api.test/ping",
    });
  });
});
