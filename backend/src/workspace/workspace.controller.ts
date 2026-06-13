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
import * as fs from "fs";
import { z } from "zod";

import { AuthGuard } from "../auth/auth.guard.js";
import { WorkspaceService } from "./workspace.service.js";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1),
});

@Controller("workspaces")
@UseGuards(AuthGuard)
export class WorkspaceController {
  constructor(
    @Inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const { name } = CreateWorkspaceSchema.parse(body);
    return this.workspaceService.createWorkspace(name, req.authUser.id);
  }

  @Get()
  async findAll(@Request() req: any) {
    const workspaces = await this.workspaceService.getWorkspacesForUser(
      req.authUser.id,
    );
    fs.appendFileSync(
      "/tmp/syncarts_backend.log",
      `\n[GET] Workspaces for User ${req.authUser.id}: ${workspaces.map((w: any) => w.id).join(", ")}\n`,
    );
    return workspaces;
  }

  @Get(":id")
  async findOne(@Request() req: any, @Param("id") id: string) {
    // Basic auth check already happens in service for sync, but for GET let's filter the findAll array
    const workspaces = await this.workspaceService.getWorkspacesForUser(
      req.authUser.id,
    );
    const workspace = workspaces.find((w: any) => w.id === id);
    if (!workspace) throw new Error("Workspace not found or unauthorized");
    return workspace;
  }

  @Delete(":id")
  async delete(@Request() req: any, @Param("id") id: string) {
    fs.appendFileSync(
      "/tmp/syncarts_backend.log",
      `\n[DELETE] Workspace ${id} by User ${req.authUser.id}\n`,
    );
    try {
      const result = await this.workspaceService.deleteWorkspace(
        id,
        req.authUser.id,
      );
      fs.appendFileSync(
        "/tmp/syncarts_backend.log",
        `[DELETE] Success: ${JSON.stringify(result)}\n`,
      );
      return result;
    } catch (err: any) {
      fs.appendFileSync(
        "/tmp/syncarts_backend.log",
        `[DELETE] Error: ${err.message}\n`,
      );
      throw err;
    }
  }

  @Delete(":id/members/:memberUserId")
  async removeMember(
    @Request() req: any,
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
    @Request() req: any,
    @Param() params: { id: string; memberUserId: string },
    @Body() body: any,
  ) {
    return this.workspaceService.updateMemberRole({
      workspaceId: params.id,
      memberUserId: params.memberUserId,
      role: body.role,
      userId: req.authUser.id,
    });
  }

  @Put(":id/sync")
  async syncData(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    try {
      return await this.workspaceService.syncWorkspace(
        id,
        body,
        req.authUser.id,
      );
    } catch (err: any) {
      fs.writeFileSync("/tmp/sync_error.log", err.stack || err.message);
      console.error("SYNC ERROR:", err);
      throw err;
    }
  }
}
