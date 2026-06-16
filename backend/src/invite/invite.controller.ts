import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";

import { AuthGuard } from "../auth/auth.guard.js";
import type { AuthenticatedRequest } from "../auth/authTypes.js";
import { parseZodSchema } from "../common/parseZodSchema.js";
import { InviteService } from "./invite.service.js";
import { GenerateLinkSchema, InviteEmailSchema } from "./inviteSchemas.js";
import { normalizeWorkspaceIds } from "./normalizeWorkspaceIds.js";

@Controller("invites")
export class InviteController {
  constructor(
    @Inject(InviteService) private readonly inviteService: InviteService,
  ) {}

  @UseGuards(AuthGuard)
  @Post("generate")
  async generateLink(
    @Body() body: unknown,
    @Request() req: AuthenticatedRequest,
  ) {
    const parsed = parseZodSchema(GenerateLinkSchema, body);
    return this.inviteService.generateInviteLink(
      {
        workspaceIds: normalizeWorkspaceIds(parsed),
        workspaces: parsed.workspaces,
      },
      req.authUser.id,
      parsed.expiresInDays,
    );
  }

  @UseGuards(AuthGuard)
  @Post("add-member")
  async addMember(
    @Body() body: unknown,
    @Request() req: AuthenticatedRequest,
  ) {
    const parsed = parseZodSchema(InviteEmailSchema, body);
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
  async acceptInvite(
    @Param("token") token: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.inviteService.acceptInvite(token, req.authUser.id);
  }
}
