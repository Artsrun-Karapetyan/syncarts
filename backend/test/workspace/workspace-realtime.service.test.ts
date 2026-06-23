import { describe, expect, test } from "bun:test";
import { firstValueFrom } from "rxjs";

import { WorkspaceRealtimeService } from "../../src/workspace/workspace-realtime.service.js";

describe("WorkspaceRealtimeService", () => {
  test("streams events only for the specified workspace", async () => {
    const service = new WorkspaceRealtimeService();
    const stream$ = service.stream("ws-1");

    setTimeout(() => {
      service.emit({ workspaceId: "ws-2", type: "TEST_EVENT" } as any);
      service.emit({ workspaceId: "ws-1", type: "WORKSPACE_SYNCED" } as any);
    }, 10);

    const event = await firstValueFrom(stream$);

    expect(event.type).toBe("WORKSPACE_SYNCED");
    expect(event.data.workspaceId).toBe("ws-1");
    expect(event.id).toContain("ws-1:WORKSPACE_SYNCED");
  });
});
