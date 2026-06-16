import { describe, expect, test } from "bun:test";

import { getAppConfig } from "../../src/config/getAppConfig.js";

describe("getAppConfig", () => {
  test("parses valid config with defaults", () => {
    expect(getAppConfig({ DATABASE_URL: "postgres://db" } as any)).toEqual({
      databaseUrl: "postgres://db",
      port: 4000,
      requestBodyLimit: "50mb",
      corsOrigins: true,
    });
  });

  test("parses comma-separated CORS origins", () => {
    expect(
      getAppConfig({
        DATABASE_URL: "postgres://db",
        PORT: "4100",
        REQUEST_BODY_LIMIT: "10mb",
        CORS_ORIGINS: "http://localhost:3000, https://app.test",
      } as any),
    ).toEqual({
      databaseUrl: "postgres://db",
      port: 4100,
      requestBodyLimit: "10mb",
      corsOrigins: ["http://localhost:3000", "https://app.test"],
    });
  });

  test("rejects invalid config", () => {
    expect(() => getAppConfig({ PORT: "bad" } as any)).toThrow(
      "Invalid backend env",
    );
  });
});
