import "reflect-metadata";

import { describe, expect, mock, test } from "bun:test";

import { AuthController } from "../../../src/auth/auth.controller.js";
import type { AuthService } from "../../../src/auth/auth.service.js";

describe("AuthController profile/session", () => {
  const authUser = {
    id: "1",
    email: "test@test.com",
    name: "Test User",
    createdAt: new Date(),
  };

  const req = { authUser } as any;

  test("me delegates to authService.me", async () => {
    const mockAuthService = {
      me: mock(async (user: any) => user),
    } as unknown as AuthService;

    const controller = new AuthController(mockAuthService);
    const result = await controller.me(req);

    expect(mockAuthService.me).toHaveBeenCalledWith(authUser);
    expect(result).toBe(authUser);
  });

  test("updateMe delegates to authService.updateMe", async () => {
    const mockAuthService = {
      updateMe: mock(async (user: any, body: any) => ({ ...user, ...body })),
    } as unknown as AuthService;

    const controller = new AuthController(mockAuthService);
    const body = { name: "Updated Name" };

    const result = await controller.updateMe(req, body);

    expect(mockAuthService.updateMe).toHaveBeenCalledWith(authUser, body);
    expect(result.name).toBe("Updated Name");
  });

  test("logout extracts token and delegates to authService.logout", async () => {
    const mockAuthService = {
      logout: mock(async (_token: string | undefined) => ({ success: true })),
    } as unknown as AuthService;

    const controller = new AuthController(mockAuthService);
    const result = await controller.logout("Bearer my-token-123");

    // extractBearerToken should pull "my-token-123"
    expect(mockAuthService.logout).toHaveBeenCalledWith("my-token-123");
    expect(result).toEqual({ success: true } as any);
  });

  test("logout handles missing token", async () => {
    const mockAuthService = {
      logout: mock(async (_token: string | undefined) => ({ success: true })),
    } as unknown as AuthService;

    const controller = new AuthController(mockAuthService);
    await controller.logout(undefined);

    expect(mockAuthService.logout).toHaveBeenCalledWith("");
  });
});
