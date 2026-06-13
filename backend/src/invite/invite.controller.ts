import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { AuthGuard } from "../auth/auth.guard.js";
import { InviteService } from "./invite.service.js";

const GenerateLinkSchema = z.object({
  workspaceId: z.string().optional(),
  workspaceIds: z.array(z.string()).min(1).optional(),
  workspaces: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        collections: z.any().optional(),
        environments: z.any().optional(),
      }),
    )
    .optional(),
  expiresInDays: z.number().optional(),
});

const InviteEmailSchema = z.object({
  workspaceId: z.string().optional(),
  workspaceIds: z.array(z.string()).min(1).optional(),
  workspaces: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        collections: z.any().optional(),
        environments: z.any().optional(),
      }),
    )
    .optional(),
  email: z.string().email(),
});

function normalizeWorkspaceIds(body: {
  workspaceId?: string;
  workspaceIds?: string[];
}) {
  return body.workspaceIds?.filter(Boolean).length
    ? body.workspaceIds.filter(Boolean)
    : body.workspaceId
      ? [body.workspaceId]
      : [];
}

@Controller("invites")
export class InviteController {
  constructor(
    @Inject(InviteService) private readonly inviteService: InviteService,
  ) {}

  @UseGuards(AuthGuard)
  @Post("generate")
  async generateLink(@Body() body: any, @Request() req: any) {
    try {
      const parsed = GenerateLinkSchema.parse(body);
      return await this.inviteService.generateInviteLink(
        {
          workspaceIds: normalizeWorkspaceIds(parsed),
          workspaces: parsed.workspaces,
        },
        req.authUser.id,
        parsed.expiresInDays,
      );
    } catch (e: any) {
      throw new BadRequestException(e.message || String(e));
    }
  }

  @UseGuards(AuthGuard)
  @Post("add-member")
  async addMember(@Body() body: any, @Request() req: any) {
    const parsed = InviteEmailSchema.parse(body);
    return this.inviteService.addMemberByEmail(
      {
        workspaceIds: normalizeWorkspaceIds(parsed),
        workspaces: parsed.workspaces,
      },
      parsed.email,
      req.authUser.id,
    );
  }

  // Public endpoint so the frontend can preview the invite before logging in
  @Get(":token")
  async getInfo(@Param("token") token: string) {
    return this.inviteService.getInviteInfo(token);
  }

  @UseGuards(AuthGuard)
  @Post(":token/accept")
  async acceptInvite(@Param("token") token: string, @Request() req: any) {
    return this.inviteService.acceptInvite(token, req.authUser.id);
  }
}
