import { BadRequestException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import { AuthService } from "../../src/auth/auth.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

describe("AuthService session/profile", () => {
  test("logout deletes session by token hash", async () => {
    let deleteWhere: any;
    const service = new AuthService(
      createPrismaMock({
        session: {
          deleteMany: async ({ where }: any) => {
            deleteWhere = where;
            return { count: 1 };
          },
        },
      }),
    );

    await expect(service.logout("")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.logout("token")).resolves.toEqual({ success: true });
    expect(deleteWhere.tokenHash).not.toBe("token");
  });

  test("me returns the authenticated user unchanged", async () => {
    const service = new AuthService(createPrismaMock());
    const user = {
      id: "user",
      email: "user@test.com",
      name: "User",
      createdAt,
    };

    await expect(service.me(user)).resolves.toBe(user);
  });

  test("updateMe rejects invalid name", async () => {
    const service = new AuthService(createPrismaMock());

    await expect(
      service.updateMe(
        { id: "user", email: "a@test.com", name: "Old", createdAt },
        { name: "A" },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  test("updateMe trims name", async () => {
    let updateData: any;
    const service = new AuthService(
      createPrismaMock({
        user: {
          update: async ({ data }: any) => {
            updateData = data;
            return {
              id: "user",
              email: "a@test.com",
              name: data.name,
              createdAt,
            };
          },
        },
      }),
    );

    const result = await service.updateMe(
      { id: "user", email: "a@test.com", name: "Old", createdAt },
      { name: " New " },
    );

    expect(updateData.name).toBe("New");
    expect(result.name).toBe("New");
  });

  test("updateMe allows empty body without changing name", async () => {
    let updateData: any;
    const service = new AuthService(
      createPrismaMock({
        user: {
          update: async ({ data }: any) => {
            updateData = data;
            return {
              id: "user",
              email: "a@test.com",
              name: "Old",
              createdAt,
            };
          },
        },
      }),
    );

    await expect(
      service.updateMe(
        { id: "user", email: "a@test.com", name: "Old", createdAt },
        undefined,
      ),
    ).resolves.toMatchObject({ name: "Old" });
    expect(updateData).toEqual({ name: undefined });
  });
});
