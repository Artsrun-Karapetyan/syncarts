import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  Request,
  Sse,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { AuthGuard } from "../auth/auth.guard.js";
import type { AuthenticatedRequest } from "../auth/authTypes.js";
import { parseZodSchema } from "../common/parseZodSchema.js";
import {
  NotificationService,
  type NotificationTab,
} from "./notification.service.js";
import { NotificationRealtimeService } from "./notification-realtime.service.js";

const NotificationQuerySchema = z.object({
  tab: z.enum(["direct", "watching", "all"]).optional().default("all"),
  take: z.coerce.number().int().min(1).max(100).optional().default(50),
});

const ReadBodySchema = z.object({
  isRead: z.boolean().optional().default(true),
});

const ReadAllBodySchema = z.object({
  tab: z.enum(["direct", "watching", "all"]).optional().default("all"),
});

const PreferenceBodySchema = z.object({
  type: z.string().min(1),
  channel: z.string().min(1).optional(),
  enabled: z.boolean(),
});

@Controller("notifications")
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @Inject(NotificationRealtimeService)
    private readonly realtime: NotificationRealtimeService,
  ) {}

  @Get()
  list(@Request() req: AuthenticatedRequest, @Query() query: unknown) {
    const input = parseZodSchema(NotificationQuerySchema, query);
    return this.notificationService.listNotifications(
      req.authUser.id,
      input.tab as NotificationTab,
      input.take,
    );
  }

  @Get("counts")
  counts(@Request() req: AuthenticatedRequest) {
    return this.notificationService.getCounts(req.authUser.id);
  }

  @Sse("events")
  events(@Request() req: AuthenticatedRequest) {
    return this.realtime.stream(req.authUser.id);
  }

  @Patch("read-all")
  markAllRead(@Request() req: AuthenticatedRequest, @Body() body: unknown) {
    const input = parseZodSchema(ReadAllBodySchema, body);
    return this.notificationService.markAllRead(
      req.authUser.id,
      input.tab as NotificationTab,
    );
  }

  @Get("preferences")
  preferences(@Request() req: AuthenticatedRequest) {
    return this.notificationService.getPreferences(req.authUser.id);
  }

  @Patch("preferences")
  updatePreference(
    @Request() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.notificationService.updatePreference(
      req.authUser.id,
      parseZodSchema(PreferenceBodySchema, body),
    );
  }

  @Patch(":id/read")
  markRead(
    @Request() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = parseZodSchema(ReadBodySchema, body);
    return this.notificationService.markRead(req.authUser.id, id, input.isRead);
  }
}
