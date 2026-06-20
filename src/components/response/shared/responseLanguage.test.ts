import { describe, expect, test } from "bun:test";

import { detectResponseLanguage } from "@/components/response/shared/responseLanguage";

describe("detectResponseLanguage", () => {
  test("uses content-type before body sniffing", () => {
    expect(detectResponseLanguage("application/json", "<html>", true)).toBe(
      "json",
    );
    expect(detectResponseLanguage("text/html", "plain text", false)).toBe(
      "html",
    );
    expect(detectResponseLanguage("application/xml", "plain text", false)).toBe(
      "xml",
    );
  });

  test("detects html-like bodies without content-type", () => {
    expect(
      detectResponseLanguage("", "<!doctype html><html></html>", false),
    ).toBe("html");
  });

  test("falls back to text", () => {
    expect(detectResponseLanguage("text/plain", "hello", false)).toBe("text");
  });
});
