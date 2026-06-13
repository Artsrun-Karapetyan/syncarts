import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module.js";
import { MergeRequestController } from "./merge-request.controller.js";
import { MergeRequestService } from "./merge-request.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [MergeRequestController],
  providers: [MergeRequestService],
})
export class MergeRequestModule {}
