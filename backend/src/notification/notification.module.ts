import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module.js";
import { NotificationController } from "./notification.controller.js";
import { NotificationService } from "./notification.service.js";
import { NotificationRealtimeService } from "./notification-realtime.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRealtimeService],
  exports: [NotificationService, NotificationRealtimeService],
})
export class NotificationModule {}
