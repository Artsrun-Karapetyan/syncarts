import { createHash } from "node:crypto";

import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import { AuthGuard } from "../../src/auth/auth.guard.js";
import { createPrismaMock } from "../helpers/prismaMock";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

function createContext(request: {
  headers: { authorization?: string };
  query?: { access_token?: string };
}) {
  return {
    getClass: () => class TestController {},
    getHandler: () => function handler() {},
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;
}

function createReflector(isPublic = false) {
  return {
    getAllAndOverride: () => isPublic,
  } as any;
}

describe("AuthGuard", () => {
  test("allows public routes", async () => {
    const guard = new AuthGuard(createReflector(true), createPrismaMock());

    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).resolves.toBe(true);
  });

  test("rejects requests without bearer token", async () => {
    const guard = new AuthGuard(createReflector(), createPrismaMock());

    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  test("loads active session and writes auth data to request", async () => {
    const token = "token";
    const expectedTokenHash = createHash("sha256").update(token).digest("hex");
    let tokenHash = "";
    const request = { headers: { authorization: `Bearer ${token}` } };
    const guard = new AuthGuard(
      createReflector(),
      createPrismaMock({
        session: {
          findUnique: async ({ where }: any) => {
            tokenHash = where.tokenHash;
            return {
              id: "session",
              expiresAt: new Date(Date.now() + 60_000),
              user: {
                id: "user",
                email: "user@test.com",
                name: "User",
                createdAt,
              },
            };
          },
        },
      }),
    );

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(tokenHash).toBe(expectedTokenHash);
    expect((request as any).authToken).toBe(token);
    expect((request as any).authSessionId).toBe("session");
    expect((request as any).authUser).toEqual({
      id: "user",
      email: "user@test.com",
      name: "User",
      createdAt,
    });
  });

  test("loads active session from query token for event streams", async () => {
    const token = "stream-token";
    let tokenHash = "";
    const request = { headers: {}, query: { access_token: token } };
    const guard = new AuthGuard(
      createReflector(),
      createPrismaMock({
        session: {
          findUnique: async ({ where }: any) => {
            tokenHash = where.tokenHash;
            return {
              id: "session",
              expiresAt: new Date(Date.now() + 60_000),
              user: {
                id: "user",
                email: "user@test.com",
                name: "User",
                createdAt,
              },
            };
          },
        },
      }),
    );

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(tokenHash).toBe(createHash("sha256").update(token).digest("hex"));
  });

  test("deletes expired sessions and rejects request", async () => {
    let deletedTokenHash = "";
    const guard = new AuthGuard(
      createReflector(),
      createPrismaMock({
        session: {
          findUnique: async () => ({
            id: "session",
            expiresAt: new Date(Date.now() - 60_000),
            user: {
              id: "user",
              email: "user@test.com",
              name: "User",
              createdAt,
            },
          }),
          delete: async ({ where }: any) => {
            deletedTokenHash = where.tokenHash;
          },
        },
      }),
    );

    await expect(
      guard.canActivate(
        createContext({ headers: { authorization: "Bearer old" } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(deletedTokenHash).toBe(
      createHash("sha256").update("old").digest("hex"),
    );
  });
});
