import { Module } from "@nestjs/common";

import { NotificationModule } from "../notification/notification.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { MergeRequestController } from "./merge-request.controller.js";
import { MergeRequestService } from "./merge-request.service.js";

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [MergeRequestController],
  providers: [MergeRequestService],
})
export class MergeRequestModule {}
