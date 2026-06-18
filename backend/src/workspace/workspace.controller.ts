import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Request,
  Sse,
  UseGuards,
} from "@nestjs/common";
import { from, switchMap } from "rxjs";
import { z } from "zod";

import { AuthGuard } from "../auth/auth.guard.js";
import type { AuthenticatedRequest } from "../auth/authTypes.js";
import { parseZodSchema } from "../common/parseZodSchema.js";
import { RateLimit } from "../common/rateLimit.decorator.js";
import { WorkspaceService } from "./workspace.service.js";
import { WorkspaceRealtimeService } from "./workspace-realtime.service.js";
import { WorkspaceRequestService } from "./workspace-request.service.js";
import { assignableWorkspaceRoles } from "./workspaceRoles.js";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1),
});

const UpdateMemberRoleSchema = z.object({
  role: z.enum(assignableWorkspaceRoles),
});

const UpdateRequestSchema = z
  .object({
    collectionId: z.string().min(1),
    folderId: z.string().min(1).nullable().optional(),
    version: z.number().int().optional(),
  })
  .passthrough();

@Controller("workspaces")
@UseGuards(AuthGuard)
export class WorkspaceController {
  constructor(
    @Inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService,
    @Inject(WorkspaceRequestService)
    private readonly workspaceRequestService: WorkspaceRequestService,
    @Inject(WorkspaceRealtimeService)
    private readonly realtime: WorkspaceRealtimeService,
  ) {}

  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() body: unknown) {
    const { name } = parseZodSchema(CreateWorkspaceSchema, body);
    return this.workspaceService.createWorkspace(name, req.authUser.id);
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.workspaceService.getWorkspacesForUser(req.authUser.id);
  }

  @Get(":id")
  async findOne(@Request() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.workspaceService.getWorkspaceForUser(id, req.authUser.id);
  }

  @Sse(":id/events")
  events(@Request() req: AuthenticatedRequest, @Param("id") id: string) {
    return from(
      this.workspaceService.ensureWorkspaceAccess(id, req.authUser.id),
    ).pipe(switchMap(() => this.realtime.stream(id)));
  }

  @Delete(":id")
  async delete(@Request() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.workspaceService.deleteWorkspace(id, req.authUser.id);
  }

  @Get(":id/requests/:requestId")
  async getRequest(
    @Request() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("requestId") requestId: string,
  ) {
    return this.workspaceRequestService.getRequestForUser(
      id,
      requestId,
      req.authUser.id,
    );
  }

  @Patch(":id/requests/:requestId")
  async updateRequest(
    @Request() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("requestId") requestId: string,
    @Body() body: unknown,
  ) {
    const parsed = parseZodSchema(UpdateRequestSchema, body);
    return this.workspaceRequestService.updateRequestForUser({
      workspaceId: id,
      requestId,
      userId: req.authUser.id,
      data: parsed,
    });
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
