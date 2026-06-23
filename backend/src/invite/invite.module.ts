import { Module } from "@nestjs/common";

import { NotificationModule } from "../notification/notification.module.js";
import { InviteController } from "./invite.controller.js";
import { InviteService } from "./invite.service.js";

@Module({
  imports: [NotificationModule],
  controllers: [InviteController],
  providers: [InviteService],
})
export class InviteModule {}
