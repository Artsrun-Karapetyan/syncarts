import { describe, expect, test } from "bun:test";

import {
  formatNotificationTime,
  getActorInitial,
  getNotificationCount,
  hasUnreadNotifications,
} from "./notificationHelpers";

describe("notificationHelpers extra cases", () => {
  test("formatNotificationTime formats days and exact dates", () => {
    const now = new Date("2025-01-10T12:00:00Z").getTime();

    // 3 days ago
    const daysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatNotificationTime(daysAgo, now)).toBe("3d");

    // 10 days ago (returns formatted date)
    const weeksAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatNotificationTime(weeksAgo, now)).toMatch(/[A-Z][a-z]{2} \d+/);
  });

  test("formatNotificationTime handles recent times and invalid dates", () => {
    const now = new Date("2025-01-10T12:00:00Z").getTime();

    // Invalid date
    expect(formatNotificationTime("invalid-date", now)).toBe("");

    // under 60s
    const justNow = new Date(now - 10 * 1000).toISOString();
    expect(formatNotificationTime(justNow, now)).toBe("now");

    // minutes
    const minsAgo = new Date(now - 5 * 60 * 1000).toISOString();
    expect(formatNotificationTime(minsAgo, now)).toBe("5m");

    // hours
    const hoursAgo = new Date(now - 4 * 60 * 60 * 1000).toISOString();
    expect(formatNotificationTime(hoursAgo, now)).toBe("4h");
  });

  test("getNotificationCount returns correct value from tab counts", () => {
    const counts = { direct: 3, watching: 2, all: 5 };
    expect(getNotificationCount(counts, "direct")).toBe(3);
    expect(getNotificationCount(counts, "watching")).toBe(2);
    expect(getNotificationCount(counts, "all")).toBe(5);
  });

  test("hasUnreadNotifications checks if all counts > 0", () => {
    expect(hasUnreadNotifications({ direct: 0, watching: 0, all: 0 })).toBe(
      false,
    );
    expect(hasUnreadNotifications({ direct: 0, watching: 0, all: 2 })).toBe(
      true,
    );
  });

  test("getActorInitial returns correct character or fallback", () => {
    expect(
      getActorInitial({ actorName: "John Doe", title: "New MR" } as any),
    ).toBe("J");
    expect(getActorInitial({ actorName: "", title: "hello" } as any)).toBe("H");
    expect(getActorInitial({ actorName: "", title: "" } as any)).toBe("N");
  });
});
