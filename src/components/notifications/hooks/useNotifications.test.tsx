import { act, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import React from "react";

let mockAuthToken: string | null = "valid-token";
let fetchCountsCalled = false;
let fetchNotificationsCalled = false;
let markReadCalledId: any = null;

mock.module("@/lib/auth", () => ({
  getAuthToken: () => mockAuthToken,
}));

mock.module("@/components/notifications/api/notificationApi", () => ({
  fetchNotificationCounts: async () => {
    fetchCountsCalled = true;
    return { direct: 1, watching: 1, all: 2 };
  },
  fetchNotifications: async (_tab: string) => {
    fetchNotificationsCalled = true;
    return [{ id: "n1", title: "N1", isRead: false }];
  },
  getNotificationEventsUrl: () => "http://events",
  markNotificationRead: async (id: string) => {
    markReadCalledId = id;
  },
  markNotificationsRead: async (_tab: string) => {},
}));

// Mock EventSource globally
class MockEventSource {
  url: string;
  onmessage: any = null;
  onerror: any = null;
  listeners: Record<string, Function[]> = {};

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(type: string, cb: Function) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(cb);
  }

  close() {}
}
(global as any).EventSource = MockEventSource;

import { useNotifications } from "./useNotifications";

function Consumer({ isOpen, tab }: { isOpen: boolean; tab: any }) {
  const { counts, items, markRead } = useNotifications(isOpen, tab);

  return (
    <div>
      <span data-testid="counts-all">{counts.all}</span>
      <span data-testid="items-len">{items.length}</span>
      <button data-testid="mark-btn" onClick={() => markRead("n1")}>
        Mark
      </button>
    </div>
  );
}

describe("useNotifications", () => {
  test("loads notifications when open and authenticated", async () => {
    fetchCountsCalled = false;
    fetchNotificationsCalled = false;

    await act(async () => {
      render(<Consumer isOpen={true} tab="all" />);
    });

    expect(fetchCountsCalled).toBe(true);
    expect(fetchNotificationsCalled).toBe(true);

    expect(screen.getByTestId("counts-all").textContent).toBe("2");
    expect(screen.getByTestId("items-len").textContent).toBe("1");

    // Click mark btn and assert
    markReadCalledId = null;
    await act(async () => {
      screen.getByTestId("mark-btn").click();
    });
    expect(markReadCalledId).toBe("n1");
  });

  test("does not fetch if no auth token is present", async () => {
    mockAuthToken = null;
    fetchCountsCalled = false;
    fetchNotificationsCalled = false;

    await act(async () => {
      render(<Consumer isOpen={true} tab="all" />);
    });

    expect(fetchCountsCalled).toBe(false);
    expect(fetchNotificationsCalled).toBe(false);
  });
});
