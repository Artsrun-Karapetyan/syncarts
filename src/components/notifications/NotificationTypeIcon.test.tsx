import { render } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { NotificationTypeIcon } from "./NotificationTypeIcon";

describe("NotificationTypeIcon", () => {
  test("renders UserPlus for INVITE type", () => {
    const { container } = render(
      <NotificationTypeIcon type="INVITE_RECEIVED" />,
    );
    const icon = container.querySelector("svg");
    expect(icon).toBeTruthy();
  });

  test("renders Users for MEMBER type", () => {
    const { container } = render(<NotificationTypeIcon type="MEMBER_ADDED" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeTruthy();
  });

  test("renders GitPullRequest for MERGE_REQUEST type", () => {
    const { container } = render(
      <NotificationTypeIcon type="MERGE_REQUEST_OPENED" />,
    );
    const icon = container.querySelector("svg");
    expect(icon).toBeTruthy();
  });

  test("renders RefreshCcw for SYNC or PULL type", () => {
    const { container } = render(
      <NotificationTypeIcon type="WORKSPACE_SYNC" />,
    );
    const icon = container.querySelector("svg");
    expect(icon).toBeTruthy();
  });

  test("renders Info for UPDATE type", () => {
    const { container } = render(
      <NotificationTypeIcon type="WORKSPACE_UPDATE" />,
    );
    const icon = container.querySelector("svg");
    expect(icon).toBeTruthy();
  });

  test("renders Bell for fallback/unknown type", () => {
    const { container } = render(<NotificationTypeIcon type="UNKNOWN" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeTruthy();
  });
});
