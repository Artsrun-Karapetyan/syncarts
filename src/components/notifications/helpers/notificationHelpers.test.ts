import { describe, expect, test } from "bun:test";

import {
  formatNotificationTime,
  getActorInitial,
  getNotificationCount,
  hasUnreadNotifications,
} from "./notificationHelpers";

describe("notificationHelpers", () => {
  test("reads tab counts", () => {
    const counts = { direct: 2, watching: 1, all: 3 };

    expect(getNotificationCount(counts, "direct")).toBe(2);
    expect(hasUnreadNotifications(counts)).toBe(true);
    expect(hasUnreadNotifications({ direct: 0, watching: 0, all: 0 })).toBe(
      false,
    );
  });

  test("gets actor initial fallback", () => {
    expect(
      getActorInitial({
        actorName: "Ani",
        title: "Merge request",
      } as any),
    ).toBe("A");
    expect(getActorInitial({ title: "Invite" } as any)).toBe("I");
  });

  test("formats relative notification time", () => {
    const now = new Date("2026-06-19T12:18:00.000Z").getTime();

    expect(formatNotificationTime("2026-06-19T12:17:30.000Z", now)).toBe("now");
    expect(formatNotificationTime("2026-06-19T12:08:00.000Z", now)).toBe("10m");
    expect(formatNotificationTime("2026-06-19T10:18:00.000Z", now)).toBe("2h");
  });
});
