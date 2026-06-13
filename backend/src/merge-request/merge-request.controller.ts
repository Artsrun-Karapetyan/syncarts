import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { AuthGuard } from "../auth/auth.guard.js";
import { MergeRequestService } from "./merge-request.service.js";

const CreateMRSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sourceWorkspaceId: z.string().min(1),
  targetWorkspaceId: z.string().min(1),
  sourceCollectionId: z.string().min(1),
  targetCollectionId: z.string().min(1),
  data: z.any().optional(),
});

@Controller("merge-requests")
@UseGuards(AuthGuard)
export class MergeRequestController {
  constructor(
    @Inject(MergeRequestService)
    private readonly mrService: MergeRequestService,
  ) {}

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const data = CreateMRSchema.parse(body);
    return this.mrService.createMergeRequest({
      ...data,
      authorId: req.authUser.id,
    });
  }

  @Get("workspace/:workspaceId")
  async findByWorkspace(@Param("workspaceId") workspaceId: string) {
    return this.mrService.getMergeRequestsForWorkspace(workspaceId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.mrService.getMergeRequestById(id);
  }

  @Patch(":id/status")
  async updateStatus(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.mrService.updateMergeRequestStatus(
      id,
      body.status,
      req.authUser.id,
    );
  }

  @Get(":id/source-collection")
  async getSourceCollection(@Param("id") id: string) {
    return this.mrService.getSourceCollection(id);
  }
}
