import { Module } from "@nestjs/common";

import { WorkspaceController } from "./workspace.controller.js";
import { WorkspaceService } from "./workspace.service.js";
import { WorkspaceRealtimeService } from "./workspace-realtime.service.js";
import { WorkspaceRequestService } from "./workspace-request.service.js";

@Module({
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    WorkspaceRequestService,
    WorkspaceRealtimeService,
  ],
})
export class WorkspaceModule {}
