import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockNavigate = mock();
const mockOpenNotificationTarget = mock();
const mockMarkRead = mock();
const mockMarkAllRead = mock();

mock.module("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

mock.module("@/components/notifications/hooks/useNotificationAction", () => ({
  useNotificationAction: () => ({
    openNotificationTarget: mockOpenNotificationTarget,
  }),
}));

const mockNotifications = {
  counts: { all: 5, direct: 3, system: 2 },
  error: null,
  isLoading: false,
  items: [
    {
      id: "n1",
      userId: "u1",
      title: "Invite received",
      message: "Accept workspace invite",
      type: "WORKSPACE_INVITE",
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: "/invite-url",
    },
  ],
  markRead: mockMarkRead,
  markAllRead: mockMarkAllRead,
};

mock.module("@/components/notifications/hooks/useNotifications", () => ({
  useNotifications: () => mockNotifications,
}));

import { NotificationCenter } from "./NotificationCenter";

describe("NotificationCenter", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockOpenNotificationTarget.mockClear();
    mockMarkRead.mockClear();
    mockMarkAllRead.mockClear();
  });

  test("renders bell button and shows unread badge counts", () => {
    const { container } = render(<NotificationCenter />);
    const bellBtn = container.querySelector(".notification-bell");
    expect(bellBtn).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
  });

  test("toggles notifications panel on click", () => {
    const { container } = render(<NotificationCenter />);
    const bellBtn = container.querySelector(
      ".notification-bell",
    ) as HTMLElement;

    // Open panel
    fireEvent.click(bellBtn);
    expect(screen.getByText("Notifications")).toBeTruthy();
    expect(screen.getByText("Invite received")).toBeTruthy();

    // Close panel by clicking bell again
    fireEvent.click(bellBtn);
    expect(screen.queryByText("Notifications")).toBeNull();
  });

  test("handles action click, marks read and navigates", async () => {
    mockOpenNotificationTarget.mockReturnValue(false); // fallback to navigate
    const { container } = render(<NotificationCenter />);
    const bellBtn = container.querySelector(
      ".notification-bell",
    ) as HTMLElement;

    fireEvent.click(bellBtn);
    const actionBtn = screen.getByRole("button", { name: /Open/i });

    await act(async () => {
      fireEvent.click(actionBtn);
      await Promise.resolve();
    });

    expect(mockMarkRead).toHaveBeenCalledWith("n1");
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/invite-url" });
  });

  test("handles action click, marks read and runs custom target handler without navigate", async () => {
    mockOpenNotificationTarget.mockReturnValue(true); // handled
    const { container } = render(<NotificationCenter />);
    const bellBtn = container.querySelector(
      ".notification-bell",
    ) as HTMLElement;

    fireEvent.click(bellBtn);
    const actionBtn = screen.getByRole("button", { name: /Open/i });

    await act(async () => {
      fireEvent.click(actionBtn);
      await Promise.resolve();
    });

    expect(mockMarkRead).toHaveBeenCalledWith("n1");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("closes panel on escape keypress", () => {
    const { container } = render(<NotificationCenter />);
    const bellBtn = container.querySelector(
      ".notification-bell",
    ) as HTMLElement;
    fireEvent.click(bellBtn);
    expect(screen.getByText("Notifications")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Notifications")).toBeNull();
  });
});
