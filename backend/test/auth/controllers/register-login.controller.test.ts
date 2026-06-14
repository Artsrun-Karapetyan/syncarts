import "reflect-metadata";

import { describe, expect, mock, test } from "bun:test";

import { AuthController } from "../../../src/auth/auth.controller.js";
import type { AuthService } from "../../../src/auth/auth.service.js";

describe("AuthController register/login", () => {
  test("register delegates to authService.register", async () => {
    const mockAuthService = {
      register: mock(async (_body: unknown) => ({
        user: { id: "1" },
        token: "token",
      })),
    } as unknown as AuthService;

    const controller = new AuthController(mockAuthService);
    const body = { email: "test@test.com", password: "password", name: "Test" };

    const result = await controller.register(body);

    expect(mockAuthService.register).toHaveBeenCalledWith(body);
    expect(result).toEqual({ user: { id: "1" }, token: "token" } as any);
  });

  test("login delegates to authService.login", async () => {
    const mockAuthService = {
      login: mock(async (_body: unknown) => ({
        user: { id: "1" },
        token: "token",
      })),
    } as unknown as AuthService;

    const controller = new AuthController(mockAuthService);
    const body = { email: "test@test.com", password: "password" };

    const result = await controller.login(body);

    expect(mockAuthService.login).toHaveBeenCalledWith(body);
    expect(result).toEqual({ user: { id: "1" }, token: "token" } as any);
  });
});
