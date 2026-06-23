import { Module } from "@nestjs/common";

import { WatchModule } from "../watch/watch.module.js";
import { WorkspaceController } from "./workspace.controller.js";
import { WorkspaceService } from "./workspace.service.js";
import { WorkspaceRealtimeService } from "./workspace-realtime.service.js";
import { WorkspaceRequestService } from "./workspace-request.service.js";

@Module({
  imports: [WatchModule],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    WorkspaceRequestService,
    WorkspaceRealtimeService,
  ],
})
export class WorkspaceModule {}
