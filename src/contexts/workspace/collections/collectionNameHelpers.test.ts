import { describe, expect, test } from "bun:test";

import type { Collection } from "../core/types";
import { getUniqueCollectionName } from "./collectionNameHelpers";

const collection = (name: string): Collection => ({
  id: name,
  name,
  items: [],
});

describe("collection name helpers", () => {
  test("keeps original name when it is available", () => {
    expect(getUniqueCollectionName([], "Users API")).toBe("Users API");
  });

  test("adds numeric suffix when name already exists", () => {
    expect(
      getUniqueCollectionName(
        [collection("Users API"), collection("Users API 2")],
        "Users API",
      ),
    ).toBe("Users API 3");
  });

  test("uses default name for blank source names", () => {
    expect(getUniqueCollectionName([], " ")).toBe("Collection");
  });
});
