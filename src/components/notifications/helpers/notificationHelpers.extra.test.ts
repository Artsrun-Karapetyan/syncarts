import { describe, expect, test } from "bun:test";
import { formatNotificationTime } from "./notificationHelpers";

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
});
