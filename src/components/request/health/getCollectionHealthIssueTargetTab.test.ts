import { describe, expect, test } from "bun:test";

import { getCollectionHealthIssueTargetTab } from "./getCollectionHealthIssueTargetTab";

describe("getCollectionHealthIssueTargetTab", () => {
  test("returns correct tab for each health issue code", () => {
    expect(getCollectionHealthIssueTargetTab("no-docs")).toBe("docs");
    expect(getCollectionHealthIssueTargetTab("no-tests")).toBe("scripts");
    expect(getCollectionHealthIssueTargetTab("missing-variable")).toBe(
      "params",
    );
  });

  test("returns null for unknown issue codes", () => {
    expect(getCollectionHealthIssueTargetTab("other-code" as any)).toBeNull();
  });
});
