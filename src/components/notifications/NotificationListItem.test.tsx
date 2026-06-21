import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { NotificationListItem } from "./NotificationListItem";
import type { NotificationItem } from "./types/notificationTypes";

describe("NotificationListItem", () => {
  const item: NotificationItem = {
    id: "n1",
    userId: "u1",
    title: "New Invite",
    message: "You have been invited",
    type: "WORKSPACE_INVITE",
    isRead: false,
    createdAt: new Date().toISOString(),
    actorInitial: "U",
    actorName: "User 1",
    audience: "ALL",
    entityType: "invite",
    isArchived: false,
  } as any;

  test("renders notification title, message and initials avatar", () => {
    render(
      <NotificationListItem
        item={item}
        onAction={() => {}}
        onMarkRead={() => {}}
      />,
    );
    expect(screen.getByText("New Invite")).toBeTruthy();
    expect(screen.getByText("You have been invited")).toBeTruthy();
    expect(screen.getByText("U")).toBeTruthy();
  });

  test("renders avatar img when actorAvatarUrl is provided", () => {
    const itemWithAvatar = { ...item, actorAvatarUrl: "https://avatar.com/u1" };
    const { container } = render(
      <NotificationListItem
        item={itemWithAvatar}
        onAction={() => {}}
        onMarkRead={() => {}}
      />,
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("https://avatar.com/u1");
  });

  test("triggers onAction when action button is clicked", () => {
    const handleAction = mock();
    const itemWithAction = {
      ...item,
      actionUrl: "/invite",
      actionLabel: "Accept",
    };
    render(
      <NotificationListItem
        item={itemWithAction}
        onAction={handleAction}
        onMarkRead={() => {}}
      />,
    );

    const actionBtn = screen.getByRole("button", { name: /Accept/i });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledWith(itemWithAction);
  });

  test("triggers onMarkRead when Read button is clicked", () => {
    const handleMarkRead = mock();
    render(
      <NotificationListItem
        item={item}
        onAction={() => {}}
        onMarkRead={handleMarkRead}
      />,
    );

    const readBtn = screen.getByRole("button", { name: /Read/i });
    fireEvent.click(readBtn);
    expect(handleMarkRead).toHaveBeenCalledWith("n1");
  });

  test("does not render Read button when isRead is true", () => {
    const readItem = { ...item, isRead: true };
    render(
      <NotificationListItem
        item={readItem}
        onAction={() => {}}
        onMarkRead={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /Read/i })).toBeNull();
  });
});
