import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { AuthGuard } from "../auth/auth.guard.js";
import type { AuthenticatedRequest } from "../auth/authTypes.js";
import { parseZodSchema } from "../common/parseZodSchema.js";
import { RateLimit } from "../common/rateLimit.decorator.js";
import { WorkspaceService } from "./workspace.service.js";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1),
});

const UpdateMemberRoleSchema = z.object({
  role: z.enum(["MEMBER", "EDITOR", "VIEWER"]),
});

@Controller("workspaces")
@UseGuards(AuthGuard)
export class WorkspaceController {
  constructor(
    @Inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() body: unknown) {
    const { name } = parseZodSchema(CreateWorkspaceSchema, body);
    return this.workspaceService.createWorkspace(name, req.authUser.id);
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.workspaceService.getWorkspacesForUser(
      req.authUser.id,
    );
  }

  @Get(":id")
  async findOne(@Request() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.workspaceService.getWorkspaceForUser(id, req.authUser.id);
  }

  @Delete(":id")
  async delete(@Request() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.workspaceService.deleteWorkspace(id, req.authUser.id);
  }

  @Delete(":id/members/:memberUserId")
  async removeMember(
    @Request() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("memberUserId") memberUserId: string,
  ) {
    return this.workspaceService.removeMember(
      id,
      memberUserId,
      req.authUser.id,
    );
  }

  @Put(":id/members/:memberUserId/role")
  async updateMemberRole(
    @Request() req: AuthenticatedRequest,
    @Param() params: { id: string; memberUserId: string },
    @Body() body: unknown,
  ) {
    const { role } = parseZodSchema(UpdateMemberRoleSchema, body);
    return this.workspaceService.updateMemberRole({
      workspaceId: params.id,
      memberUserId: params.memberUserId,
      role,
      userId: req.authUser.id,
    });
  }

  @Put(":id/sync")
  @RateLimit({
    keyPrefix: "workspace:sync",
    windowMs: 60 * 1000,
    max: 120,
  })
  async syncData(
    @Request() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.workspaceService.syncWorkspace(id, body, req.authUser.id);
  }
}
