import { describe, expect, test } from "bun:test";

import { createScriptResponseBody } from "@/contexts/workspace/requests/scriptRuntimeResponse";

describe("createScriptResponseBody", () => {
  test("exposes response readers and header assertions", () => {
    const response = createScriptResponseBody({
      body: '{"ok":true}',
      headers: { "Content-Type": "application/json" },
      responseTime: 123,
      status: 200,
      statusText: "OK",
    });

    expect(response.json()).toEqual({ ok: true });
    expect(response.text()).toBe('{"ok":true}');
    expect(response.responseTime).toBe(123);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(() => response.to.have.status(200)).not.toThrow();
    expect(() => response.to.have.header("CONTENT-TYPE")).not.toThrow();
  });

  test("keeps Postman-style string status compatibility mode", () => {
    const response = createScriptResponseBody({
      body: "",
      headers: {},
      responseTime: 0,
      status: 201,
      stringStatusMode: "okCreated",
      statusText: "Created",
    });

    expect(() => response.to.have.status("Created")).not.toThrow();
  });
});
