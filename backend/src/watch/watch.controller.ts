import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { AuthGuard } from "../auth/auth.guard.js";
import type { AuthenticatedRequest } from "../auth/authTypes.js";
import { parseZodSchema } from "../common/parseZodSchema.js";
import { WatchService } from "./watch.service.js";

const WatchQuerySchema = z.object({
  workspaceId: z.string().min(1),
});

const WatchBodySchema = z.object({
  workspaceId: z.string().min(1),
  entityType: z.enum(["workspace", "collection", "request"]),
  entityId: z.string().min(1),
  enabled: z.boolean(),
});

@Controller("watches")
@UseGuards(AuthGuard)
export class WatchController {
  constructor(
    @Inject(WatchService)
    private readonly watchService: WatchService,
  ) {}

  @Get()
  list(@Request() req: AuthenticatedRequest, @Query() query: unknown) {
    const input = parseZodSchema(WatchQuerySchema, query);
    return this.watchService.listWatches(req.authUser.id, input.workspaceId);
  }

  @Patch()
  set(@Request() req: AuthenticatedRequest, @Body() body: unknown) {
    const input = parseZodSchema(WatchBodySchema, body);
    const { enabled, ...watchInput } = input;
    return this.watchService.setWatch(req.authUser.id, watchInput, enabled);
  }
}
