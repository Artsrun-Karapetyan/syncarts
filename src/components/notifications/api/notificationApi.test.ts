import { describe, expect, mock, test } from "bun:test";

const apiGetMock = mock();
const apiPatchMock = mock();
const getTokenMock = mock();

mock.module("@/lib/api", () => ({
  api: {
    get: apiGetMock,
    patch: apiPatchMock,
  },
  getToken: getTokenMock,
  API_URL: "https://api.test",
}));

import {
  fetchNotificationCounts,
  fetchNotifications,
  getNotificationEventsUrl,
  markNotificationRead,
  markNotificationsRead,
} from "./notificationApi";

describe("notificationApi", () => {
  test("fetchNotifications requests with correct tab query", async () => {
    apiGetMock.mockResolvedValueOnce({ data: [{ id: "n1" }] });
    const data = await fetchNotifications("direct");
    expect(apiGetMock).toHaveBeenCalledWith(
      "/notifications?tab=direct&take=50",
    );
    expect(data).toEqual([{ id: "n1" } as any]);
  });

  test("fetchNotificationCounts requests correct endpoint", async () => {
    apiGetMock.mockResolvedValueOnce({ data: { all: 2 } });
    const data = await fetchNotificationCounts();
    expect(apiGetMock).toHaveBeenCalledWith("/notifications/counts");
    expect(data).toEqual({ all: 2 } as any);
  });

  test("markNotificationRead patches correct resource", async () => {
    apiPatchMock.mockResolvedValueOnce({});
    await markNotificationRead("n1", true);
    expect(apiPatchMock).toHaveBeenCalledWith("/notifications/n1/read", {
      isRead: true,
    });
  });

  test("markNotificationsRead patches read-all with tab", async () => {
    apiPatchMock.mockResolvedValueOnce({});
    await markNotificationsRead("all");
    expect(apiPatchMock).toHaveBeenCalledWith("/notifications/read-all", {
      tab: "all",
    });
  });

  test("getNotificationEventsUrl appends access token", () => {
    getTokenMock.mockReturnValue("token123");
    const url = getNotificationEventsUrl();
    expect(url).toBe(
      "https://api.test/notifications/events?access_token=token123",
    );
  });

  test("getNotificationEventsUrl returns null if no token is stored", () => {
    getTokenMock.mockReturnValue(undefined);
    const url = getNotificationEventsUrl();
    expect(url).toBeNull();
  });
});
