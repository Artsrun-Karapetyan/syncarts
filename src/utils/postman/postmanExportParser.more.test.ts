import { describe, expect, test } from "bun:test";

import type { Collection } from "../../contexts/WorkspaceContext";
import { stringifyPostmanCollection } from "./postmanExportParser";

describe("stringifyPostmanCollection extra cases", () => {
  test("exports folders with variables, events, and noauth", () => {
    const collection: Collection = {
      id: "collection",
      name: "API",
      items: [
        {
          type: "folder",
          id: "folder",
          name: "Folder",
          items: [],
          authType: "none",
          preRequestScript: "before();",
          variables: [{ id: "var", key: "token", value: "abc", enabled: true }],
        },
      ],
    };

    const exported = JSON.parse(stringifyPostmanCollection(collection));

    expect(exported.item[0]).toMatchObject({
      name: "Folder",
      auth: { type: "noauth" },
      event: [
        {
          listen: "prerequest",
          script: { type: "text/javascript", exec: ["before();"] },
        },
      ],
      variable: [
        { key: "token", value: "abc", type: "string", disabled: false },
      ],
    });
  });
});
