import { describe, expect, test } from "bun:test";

describe("tauri rust tests", () => {
  test("cargo test passes", () => {
    const result = Bun.spawnSync(["cargo", "test"], {
      cwd: import.meta.dir,
      stderr: "pipe",
      stdout: "pipe",
    });

    expect(
      new TextDecoder().decode(result.stdout) +
        new TextDecoder().decode(result.stderr),
    ).toContain("test result: ok");
    expect(result.exitCode).toBe(0);
  });
});
