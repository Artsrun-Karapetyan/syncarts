import { render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import React from "react";

mock.module(
  "@/components/workspace/invite/InviteWorkspaceMembersBlock",
  () => ({
    InviteWorkspaceMembersBlock: ({ memberWorkspace }: any) => (
      <div data-testid="member-block">{memberWorkspace.name}</div>
    ),
  }),
);

import { InviteMembersList } from "./InviteMembersList";

describe("InviteMembersList", () => {
  const dummyProps: any = {
    activeWorkspaceId: "w1",
    loading: false,
    memberWorkspaces: [{ id: "w2", name: "Workspace 2" }],
    onChangeRole: mock(),
    onRemoveMember: mock(),
  };

  test("renders nothing when memberWorkspaces is empty", () => {
    const { container } = render(
      <InviteMembersList {...dummyProps} memberWorkspaces={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders workspace list header and member blocks when workspaces present", () => {
    render(<InviteMembersList {...dummyProps} />);
    expect(screen.getByText("Workspace Members")).toBeDefined();
    expect(screen.getByTestId("member-block").textContent).toBe("Workspace 2");
  });
});
