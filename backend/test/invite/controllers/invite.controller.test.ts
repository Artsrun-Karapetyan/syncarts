import "reflect-metadata";

import { BadRequestException } from "@nestjs/common";
import { describe, expect, mock, test } from "bun:test";

import { InviteController } from "../../../src/invite/invite.controller.js";
import type { InviteService } from "../../../src/invite/invite.service.js";

describe("InviteController", () => {
  const req = { authUser: { id: "user-1" } };

  test("generateLink delegates to inviteService.generateInviteLink", async () => {
    const mockService = {
      generateInviteLink: mock(
        async (_input: any, _userId: string, _expires: any) => ({
          token: "invite-1",
        }),
      ),
    } as unknown as InviteService;

    const controller = new InviteController(mockService);
    const body = { workspaceIds: ["ws-1"] };

    const result = await controller.generateLink(body, req);

    expect(mockService.generateInviteLink).toHaveBeenCalledWith(
      { workspaceIds: ["ws-1"], workspaces: undefined },
      "user-1",
      undefined,
    );
    expect(result).toEqual({ token: "invite-1" } as any);
  });

  test("generateLink throws BadRequestException for invalid body", async () => {
    const mockService = {} as unknown as InviteService;
    const controller = new InviteController(mockService);

    expect(controller.generateLink({}, req)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  test("addMember delegates to inviteService.addMemberByEmail", async () => {
    const mockService = {
      addMemberByEmail: mock(
        async (_input: any, _email: string, _userId: string) => ({
          added: true,
        }),
      ),
    } as unknown as InviteService;

    const controller = new InviteController(mockService);
    const body = { workspaceIds: ["ws-1"], email: "test@test.com" };

    const result = await controller.addMember(body, req);

    expect(mockService.addMemberByEmail).toHaveBeenCalledWith(
      { workspaceIds: ["ws-1"], workspaces: undefined },
      "test@test.com",
      "user-1",
    );
    expect(result).toEqual({ added: true } as any);
  });

  test("getInfo delegates to inviteService.getInviteInfo", async () => {
    const mockService = {
      getInviteInfo: mock(async (_token: string) => ({ valid: true })),
    } as unknown as InviteService;

    const controller = new InviteController(mockService);
    const result = await controller.getInfo("token-123");

    expect(mockService.getInviteInfo).toHaveBeenCalledWith("token-123");
    expect(result).toEqual({ valid: true } as any);
  });

  test("acceptInvite delegates to inviteService.acceptInvite", async () => {
    const mockService = {
      acceptInvite: mock(async (_token: string, _userId: string) => ({
        accepted: true,
      })),
    } as unknown as InviteService;

    const controller = new InviteController(mockService);
    const result = await controller.acceptInvite("token-123", req);

    expect(mockService.acceptInvite).toHaveBeenCalledWith(
      "token-123",
      "user-1",
    );
    expect(result).toEqual({ accepted: true } as any);
  });
});
