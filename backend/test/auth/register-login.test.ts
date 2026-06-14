import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import { AuthService } from "../../src/auth/auth.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

describe("AuthService register/login", () => {
  test("register validates input", async () => {
    const service = new AuthService(createPrismaMock());

    await expect(service.register({ email: "bad" })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  test("register rejects duplicate emails", async () => {
    const service = new AuthService(
      createPrismaMock({
        user: { findUnique: async () => ({ id: "user" }) },
      }),
    );

    await expect(
      service.register({
        email: "a@test.com",
        name: "Artsrunk",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  test("register creates user and session", async () => {
    let createdUser: any;
    let sessionData: any;
    const prisma = createPrismaMock({
      user: {
        findUnique: async () => null,
        create: async ({ data }: any) => {
          createdUser = data;
          return { id: "user", createdAt, ...data };
        },
      },
      session: {
        create: async ({ data }: any) => {
          sessionData = data;
          return { id: "session", ...data };
        },
      },
    });
    prisma.$transaction = async (callback: (transaction: any) => unknown) =>
      callback(prisma);
    const service = new AuthService(prisma);

    const result = await service.register({
      email: "USER@Test.COM",
      name: "Artsrunk",
      password: "password123",
    });

    expect(result.user).toEqual({
      id: "user",
      email: "user@test.com",
      name: "Artsrunk",
      createdAt,
    });
    expect(result.token.length).toBeGreaterThan(20);
    expect(createdUser.passwordHash).not.toBe("password123");
    expect(sessionData.userId).toBe("user");
  });

  test("register trims user name before creating user", async () => {
    let createdUser: any;
    const prisma = createPrismaMock({
      user: {
        findUnique: async () => null,
        create: async ({ data }: any) => {
          createdUser = data;
          return { id: "user", createdAt, ...data };
        },
      },
      session: { create: async () => ({ id: "session" }) },
    });
    prisma.$transaction = async (callback: (transaction: any) => unknown) =>
      callback(prisma);
    const service = new AuthService(prisma);

    await service.register({
      email: "trim@test.com",
      name: "  Trimmed User  ",
      password: "password123",
    });

    expect(createdUser.name).toBe("Trimmed User");
  });

  test("login validates malformed input", async () => {
    const service = new AuthService(createPrismaMock());

    await expect(
      service.login({ email: "bad", password: "short" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  test("login rejects missing users and bad passwords", async () => {
    const missingUserService = new AuthService(
      createPrismaMock({
        user: { findUnique: async () => null },
      }),
    );

    await expect(
      missingUserService.login({
        email: "a@test.com",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    let storedUser: any;
    const registerPrisma = createPrismaMock({
      user: {
        findUnique: async () => null,
        create: async ({ data }: any) => {
          storedUser = { id: "user", createdAt, ...data };
          return storedUser;
        },
      },
      session: { create: async () => ({ id: "session" }) },
    });
    registerPrisma.$transaction = async (
      callback: (transaction: any) => unknown,
    ) => callback(registerPrisma);
    await new AuthService(registerPrisma).register({
      email: "a@test.com",
      name: "Artsrunk",
      password: "password123",
    });

    const loginService = new AuthService(
      createPrismaMock({
        user: { findUnique: async () => storedUser },
      }),
    );

    await expect(
      loginService.login({ email: "a@test.com", password: "wrongpass" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  test("login creates a session for valid credentials", async () => {
    let storedUser: any;
    const registerPrisma = createPrismaMock({
      user: {
        findUnique: async () => null,
        create: async ({ data }: any) => {
          storedUser = { id: "user", createdAt, ...data };
          return storedUser;
        },
      },
      session: { create: async () => ({ id: "session" }) },
    });
    registerPrisma.$transaction = async (
      callback: (transaction: any) => unknown,
    ) => callback(registerPrisma);
    await new AuthService(registerPrisma).register({
      email: "a@test.com",
      name: "Artsrunk",
      password: "password123",
    });

    let sessionData: any;
    const service = new AuthService(
      createPrismaMock({
        user: { findUnique: async () => storedUser },
        session: {
          create: async ({ data }: any) => {
            sessionData = data;
            return { id: "session", ...data };
          },
        },
      }),
    );

    const result = await service.login({
      email: "A@Test.COM",
      password: "password123",
    });

    expect(result.user.id).toBe("user");
    expect(result.token.length).toBeGreaterThan(20);
    expect(sessionData.userId).toBe("user");
  });
});
