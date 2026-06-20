import { describe, expect, test } from "bun:test";
import { firstValueFrom } from "rxjs";

import { NotificationRealtimeService } from "../../src/notification/notification-realtime.service.js";

describe("NotificationRealtimeService", () => {
  test("streams events only for the specified user", async () => {
    const service = new NotificationRealtimeService();
    const stream$ = service.stream("user-1");

    setTimeout(() => {
      service.emit("user-2");
      service.emit("user-1");
    }, 10);

    const event = await firstValueFrom(stream$);

    expect(event.type).toBe("notifications_changed");
    expect(event.data.userId).toBe("user-1");
    expect(event.id).toContain("user-1:notifications_changed");
  });
});
