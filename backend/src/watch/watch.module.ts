import { Module } from "@nestjs/common";

import { NotificationModule } from "../notification/notification.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { WatchController } from "./watch.controller.js";
import { WatchService } from "./watch.service.js";

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [WatchController],
  providers: [WatchService],
  exports: [WatchService],
})
export class WatchModule {}
