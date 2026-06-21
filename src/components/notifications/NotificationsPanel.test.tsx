import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { NotificationsPanel } from "./NotificationsPanel";
import type { NotificationItem } from "./types/notificationTypes";

describe("NotificationsPanel", () => {
  const counts = { all: 2, direct: 1, watching: 1 };
  const items: NotificationItem[] = [
    {
      id: "n1",
      userId: "u1",
      title: "Direct notification",
      message: "Hello user",
      type: "WORKSPACE_INVITE",
      isRead: false,
      createdAt: new Date().toISOString(),
      audience: "DIRECT",
      entityType: "invite",
      isArchived: false,
    },
  ];

  const defaultProps = {
    counts,
    error: null,
    isLoading: false,
    items,
    tab: "direct" as const,
    onAction: mock(),
    onClose: mock(),
    onMarkAllRead: mock(),
    onMarkRead: mock(),
    onTabChange: mock(),
  };

  test("renders tabs and header", () => {
    render(<NotificationsPanel {...defaultProps} />);
    expect(screen.getByText("Notifications")).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Direct/i })).toBeTruthy();
  });

  test("renders list items when loading is false and no error", () => {
    render(<NotificationsPanel {...defaultProps} />);
    expect(screen.getByText("Direct notification")).toBeTruthy();
  });

  test("renders error message", () => {
    render(<NotificationsPanel {...defaultProps} error="Error loading" />);
    expect(screen.getByText("Error loading")).toBeTruthy();
  });

  test("renders loading state", () => {
    render(
      <NotificationsPanel {...defaultProps} isLoading={true} items={[]} />,
    );
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  test("renders empty state", () => {
    render(<NotificationsPanel {...defaultProps} items={[]} />);
    expect(screen.getByText("You're all caught up.")).toBeTruthy();
  });

  test("calls onClose on close button click", () => {
    const { container } = render(<NotificationsPanel {...defaultProps} />);
    const closeBtn = container.querySelector(
      '[data-tooltip="Close"]',
    ) as HTMLElement;
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test("calls onMarkAllRead on mark all read click", () => {
    const { container } = render(<NotificationsPanel {...defaultProps} />);
    const markAllReadBtn = container.querySelector(
      '[data-tooltip="Mark all read"]',
    ) as HTMLElement;
    fireEvent.click(markAllReadBtn);
    expect(defaultProps.onMarkAllRead).toHaveBeenCalled();
  });

  test("calls onTabChange on tab click", () => {
    render(<NotificationsPanel {...defaultProps} />);
    const allTab = screen.getByRole("tab", { name: /All/i });
    fireEvent.click(allTab);
    expect(defaultProps.onTabChange).toHaveBeenCalledWith("all");
  });
});
