import { describe, expect, test } from "bun:test";

import { createTab } from "./tabFactory";

describe("createTab", () => {
  test("creates a default request tab with editable request fields", () => {
    const tab = createTab();

    expect(tab.type).toBe("request");
    expect(tab.method).toBe("GET");
    expect(tab.headers).toEqual([{ key: "", value: "", enabled: true }]);
    expect(tab.formData?.[0]).toMatchObject({
      key: "",
      value: "",
      enabled: true,
      type: "text",
    });
    expect(tab.response).toBeNull();
  });

  test("creates non-request tabs without request defaults", () => {
    const tab = createTab({
      type: "collection",
      id: "collection",
      name: "Collection",
      collectionId: "collection",
    });

    expect(tab.type).toBe("collection");
    expect(tab.method).toBe("");
    expect(tab.url).toBe("");
    expect(tab.headers).toEqual([]);
    expect(tab.savedRequestId).toBeUndefined();
  });
});
