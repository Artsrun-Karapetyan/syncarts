import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import React from "react";

mock.module(
  "@/components/workspace/invite/InviteWorkspaceSelectorLabel",
  () => ({
    InviteWorkspaceSelectorLabel: ({ workspace }: any) => (
      <div>{workspace.name}</div>
    ),
  }),
);

import { InviteWorkspaceSelector } from "./InviteWorkspaceSelector";

describe("InviteWorkspaceSelector", () => {
  const dummyProps: any = {
    activeWorkspaceId: "w1",
    selectedWorkspaceIds: ["w1"],
    setSelectedWorkspaceIds: mock(),
    visibleWorkspaces: [{ id: "w1", name: "Workspace 1" }],
  };

  test("renders available workspaces list", () => {
    render(<InviteWorkspaceSelector {...dummyProps} />);
    expect(screen.getByText("Workspace 1")).toBeDefined();
  });

  test("renders empty message when no workspaces available", () => {
    render(<InviteWorkspaceSelector {...dummyProps} visibleWorkspaces={[]} />);
    expect(screen.getByText("No workspaces available.")).toBeDefined();
  });

  test("triggers setSelectedWorkspaceIds on checkbox change", () => {
    const setSelectedWorkspaceIds = mock();
    render(
      <InviteWorkspaceSelector
        {...dummyProps}
        setSelectedWorkspaceIds={setSelectedWorkspaceIds}
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(setSelectedWorkspaceIds).toHaveBeenCalled();
  });
});
