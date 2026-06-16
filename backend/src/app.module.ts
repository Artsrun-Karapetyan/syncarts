import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { AuthModule } from "./auth/auth.module.js";
import { RateLimitGuard } from "./common/rateLimit.guard.js";
import { InviteModule } from "./invite/invite.module.js";
import { MergeRequestModule } from "./merge-request/merge-request.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { WorkspaceModule } from "./workspace/workspace.module.js";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkspaceModule,
    InviteModule,
    MergeRequestModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
