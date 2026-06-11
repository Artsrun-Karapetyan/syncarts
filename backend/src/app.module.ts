import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { WorkspaceModule } from './workspace/workspace.module.js';
import { InviteModule } from './invite/invite.module.js';
import { MergeRequestModule } from './merge-request/merge-request.module.js';

@Module({
  imports: [PrismaModule, AuthModule, WorkspaceModule, InviteModule, MergeRequestModule],
})
export class AppModule {}
