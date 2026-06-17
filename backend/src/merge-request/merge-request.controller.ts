import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { AuthGuard } from "../auth/auth.guard.js";
import type { AuthenticatedRequest } from "../auth/authTypes.js";
import { parsePaginationQuery } from "../common/parsePaginationQuery.js";
import { parseZodSchema } from "../common/parseZodSchema.js";
import { MergeRequestService } from "./merge-request.service.js";

const CreateMRSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sourceWorkspaceId: z.string().min(1),
  targetWorkspaceId: z.string().min(1),
  sourceCollectionId: z.string().min(1),
  targetCollectionId: z.string().min(1),
  data: z.any().optional(),
  targetData: z.any().optional(),
});

const UpdateMRStatusSchema = z.object({
  status: z.enum(["OPEN", "MERGED", "CLOSED", "REJECTED"]),
});

@Controller("merge-requests")
@UseGuards(AuthGuard)
export class MergeRequestController {
  constructor(
    @Inject(MergeRequestService)
    private readonly mrService: MergeRequestService,
  ) {}

  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() body: unknown) {
    const data = parseZodSchema(CreateMRSchema, body);
    return this.mrService.createMergeRequest({
      ...data,
      authorId: req.authUser.id,
    });
  }

  @Get("workspace/:workspaceId")
  async findByWorkspace(
    @Param("workspaceId") workspaceId: string,
    @Query() query: unknown,
  ) {
    return this.mrService.getMergeRequestsForWorkspace(
      workspaceId,
      parsePaginationQuery(query),
    );
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.mrService.getMergeRequestById(id);
  }

  @Patch(":id/status")
  async updateStatus(
    @Request() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const { status } = parseZodSchema(UpdateMRStatusSchema, body);
    return this.mrService.updateMergeRequestStatus(id, status, req.authUser.id);
  }

  @Delete(":id")
  async remove(@Request() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.mrService.deleteMergeRequest(id, req.authUser.id);
  }

  @Get(":id/source-collection")
  async getSourceCollection(@Param("id") id: string) {
    return this.mrService.getSourceCollection(id);
  }

  @Get(":id/target-collection")
  async getTargetCollection(@Param("id") id: string) {
    return this.mrService.getTargetCollection(id);
  }
}
