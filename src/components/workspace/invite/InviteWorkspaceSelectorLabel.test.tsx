import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import React from "react";

import { InviteWorkspaceSelectorLabel } from "./InviteWorkspaceSelectorLabel";

describe("InviteWorkspaceSelectorLabel", () => {
  const mockLocalWorkspace: any = {
    id: "w1",
    name: "My Local Work",
  };

  const mockSharedWorkspace: any = {
    id: "w2",
    name: "My Shared Work",
    members: [{ userId: "other-user" }],
    ownerId: "owner-user",
  };

  test("renders label for current local workspace", () => {
    render(
      <InviteWorkspaceSelectorLabel
        activeWorkspaceId="w1"
        workspace={mockLocalWorkspace}
      />,
    );
    expect(screen.getByText("My Local Work")).toBeDefined();
    expect(screen.getByText("Current workspace")).toBeDefined();
  });

  test("renders label with Shared badge for available shared workspace", () => {
    render(
      <InviteWorkspaceSelectorLabel
        activeWorkspaceId="w1"
        workspace={mockSharedWorkspace}
      />,
    );
    expect(screen.getByText("My Shared Work")).toBeDefined();
    expect(screen.getByText("Shared")).toBeDefined();
    expect(screen.getByText("Available workspace")).toBeDefined();
  });
});
