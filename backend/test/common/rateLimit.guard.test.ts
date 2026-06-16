import { HttpException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import type { RateLimitOptions } from "../../src/common/rateLimit.decorator.js";
import { RateLimitGuard } from "../../src/common/rateLimit.guard.js";

function createReflector(options?: RateLimitOptions) {
  return {
    getAllAndOverride: () => options,
  } as any;
}

function createContext(request: unknown = {}) {
  return {
    getClass: () => class TestController {},
    getHandler: () => function handler() {},
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;
}

describe("RateLimitGuard", () => {
  test("allows requests without rate limit metadata", () => {
    const guard = new RateLimitGuard(createReflector());

    expect(guard.canActivate(createContext({ headers: {} }))).toBe(true);
  });

  test("blocks requests after the configured limit", () => {
    const guard = new RateLimitGuard(
      createReflector({
        keyPrefix: "test:limit",
        windowMs: 60_000,
        max: 1,
        bodyField: "email",
      }),
    );
    const request = {
      body: { email: "User@Test.com" },
      headers: { "x-forwarded-for": "127.0.0.1" },
    };

    expect(guard.canActivate(createContext(request))).toBe(true);
    expect(() => guard.canActivate(createContext(request))).toThrow(
      HttpException,
    );
  });

  test("uses body field value as part of the bucket key", () => {
    const guard = new RateLimitGuard(
      createReflector({
        keyPrefix: "test:body",
        windowMs: 60_000,
        max: 1,
        bodyField: "email",
      }),
    );

    expect(
      guard.canActivate(
        createContext({
          body: { email: "one@test.com" },
          headers: { "x-forwarded-for": "127.0.0.2" },
        }),
      ),
    ).toBe(true);
    expect(
      guard.canActivate(
        createContext({
          body: { email: "two@test.com" },
          headers: { "x-forwarded-for": "127.0.0.2" },
        }),
      ),
    ).toBe(true);
  });
});
