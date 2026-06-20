import { describe, expect, test } from "bun:test";

import { getCollectionRunStatus } from "@/components/request/runs/getCollectionRunStatus";

describe("getCollectionRunStatus", () => {
  test("passes successful responses without failed tests", () => {
    expect(getCollectionRunStatus(200, [])).toBe("passed");
    expect(getCollectionRunStatus(201, [{ name: "ok", passed: true }])).toBe(
      "passed",
    );
  });

  test("fails error responses or failed tests", () => {
    expect(getCollectionRunStatus(500, [])).toBe("failed");
    expect(
      getCollectionRunStatus(200, [
        { name: "ok", passed: true },
        { name: "bad", passed: false },
      ]),
    ).toBe("failed");
  });
});
