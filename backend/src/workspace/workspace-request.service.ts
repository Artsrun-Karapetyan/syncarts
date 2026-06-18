import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";
import { WorkspaceRealtimeService } from "./workspace-realtime.service.js";
import { getWorkspaceAccess } from "./workspaceAccess.js";
import { mapWorkspaceRequest } from "./workspaceDataReader.js";
import { WorkspaceEventTypes } from "./workspaceEvents.js";
import { replaceWorkspaceRequest } from "./workspaceRequestData.js";

@Injectable()
export class WorkspaceRequestService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional()
    @Inject(WorkspaceRealtimeService)
    private readonly realtime?: WorkspaceRealtimeService,
  ) {}

  async getRequestForUser(
    workspaceId: string,
    requestId: string,
    userId: string,
  ) {
    await getWorkspaceAccess(this.prisma, workspaceId, userId);

    const request = await this.prisma.workspaceRequest.findFirst({
      where: { id: requestId, workspaceId },
      include: { examples: { orderBy: { sortOrder: "asc" } } },
    });

    if (!request) {
      throw new NotFoundException("Request not found");
    }

    return mapWorkspaceRequest(request);
  }

  async updateRequestForUser({
    workspaceId,
    requestId,
    userId,
    data,
  }: {
    workspaceId: string;
    requestId: string;
    userId: string;
    data: unknown;
  }) {
    await getWorkspaceAccess(this.prisma, workspaceId, userId, {
      canWrite: true,
    });
    const input = toRequestUpdateInput(data);

    const { request, workspace } = await this.prisma.$transaction(
      async (transaction) => {
        const updated = await replaceWorkspaceRequest(
          transaction,
          workspaceId,
          requestId,
          input,
        );

        if (!updated) {
          throw new ConflictException("Request has changed. Please reload.");
        }

        const workspace = await transaction.workspace.update({
          where: { id: workspaceId },
          data: { version: { increment: 1 } },
          select: { version: true, updatedAt: true },
        });

        return { request: updated, workspace };
      },
    );

    const payload = mapWorkspaceRequest(request);
    this.realtime?.emit({
      type: WorkspaceEventTypes.RequestUpdated,
      workspaceId,
      entityType: "request",
      entityId: requestId,
      parentId:
        typeof input.collectionId === "string" ? input.collectionId : undefined,
      version: payload.version,
      workspaceVersion: workspace.version,
      updatedAt:
        workspace.updatedAt instanceof Date
          ? workspace.updatedAt.toISOString()
          : undefined,
    });
    return payload;
  }
}

type RequestUpdateInput = {
  version?: number;
} & Record<string, unknown>;

function toRequestUpdateInput(value: unknown): RequestUpdateInput {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const input = value as RequestUpdateInput;
  return {
    ...input,
    version: typeof input.version === "number" ? input.version : undefined,
  };
}
