/* eslint-disable react/no-multi-comp */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { InviteModal } from "./InviteModal";

const mockReloadWorkspaces = mock();
const mockCreateWorkspace = mock();
const mockSwitchWorkspace = mock();
const mockPost = mock();
const mockDelete = mock();
const mockPut = mock();

mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    workspaces: [
      {
        id: "ws1",
        name: "Workspace 1",
        ownerId: "u1",
        collections: [],
        environments: [],
      },
      {
        id: "ws2",
        name: "Workspace 2",
        ownerId: "u2",
        collections: [],
        environments: [],
      },
      {
        id: "local-default",
        name: "Local Default",
        ownerId: "local",
        collections: [],
        environments: [],
      },
    ],
    activeWorkspaceId: "ws1",
    localDefaultWorkspaceId: "local-default",
    reloadWorkspaces: mockReloadWorkspaces,
    createWorkspace: mockCreateWorkspace,
    switchWorkspace: mockSwitchWorkspace,
  }),
}));

mock.module("@/lib/session", () => ({
  useStoredUser: () => ({ id: "u1" }),
}));

mock.module("@/lib/api", () => ({
  api: {
    post: mockPost,
    delete: mockDelete,
    put: mockPut,
  },
}));

// Mock sub-components
mock.module("@/components/workspace/invite/InviteWorkspaceSelector", () => ({
  InviteWorkspaceSelector: ({
    selectedWorkspaceIds,
    setSelectedWorkspaceIds,
  }: any) => (
    <div data-testid="workspace-selector">
      <button onClick={() => setSelectedWorkspaceIds(["ws2"])}>
        Select WS2
      </button>
      <button onClick={() => setSelectedWorkspaceIds(["local-default"])}>
        Select Local
      </button>
      <button onClick={() => setSelectedWorkspaceIds([])}>
        Clear Selection
      </button>
      <span data-testid="selected-ids">{selectedWorkspaceIds.join(",")}</span>
    </div>
  ),
}));

mock.module("@/components/workspace/invite/InviteEmailForm", () => ({
  InviteEmailForm: ({ email, setEmail, onSubmit }: any) => (
    <form data-testid="email-form" onSubmit={onSubmit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
      />
      <button type="submit">Invite</button>
    </form>
  ),
}));

mock.module("@/components/workspace/invite/InviteMembersList", () => ({
  InviteMembersList: ({ onRemoveMember, onChangeRole }: any) => (
    <div data-testid="members-list">
      <button onClick={() => onRemoveMember("ws1", "user1")}>Remove</button>
      <button onClick={() => onChangeRole("ws1", "user1", "admin")}>
        Change Role
      </button>
    </div>
  ),
}));

mock.module("@/components/workspace/invite/InviteLinkSection", () => ({
  InviteLinkSection: ({ onGenerateLink, onCopy, generatedLink }: any) => (
    <div data-testid="link-section">
      <button onClick={onGenerateLink}>Generate Link</button>
      <button onClick={onCopy}>Copy</button>
      <span>{generatedLink}</span>
    </div>
  ),
}));

mock.module("@/components/workspace/invite/InviteStatusMessage", () => ({
  InviteStatusMessage: ({ statusMsg }: any) => (
    <div data-testid="status-msg">{statusMsg}</div>
  ),
}));

describe("InviteModal", () => {
  beforeEach(() => {
    mockReloadWorkspaces.mockClear();
    mockCreateWorkspace.mockClear();
    mockSwitchWorkspace.mockClear();
    mockPost.mockClear();
    mockDelete.mockClear();
    mockPut.mockClear();
  });

  test("does not render when closed", () => {
    render(<InviteModal isOpen={false} onClose={mock()} workspaceId="ws1" />);
    expect(screen.queryByText("Invite to Workspace")).toBeNull();
  });

  test("renders when open", () => {
    render(<InviteModal isOpen={true} onClose={mock()} workspaceId="ws1" />);
    expect(screen.getByText("Invite to Workspace")).toBeTruthy();
  });

  test("handleGenerateLink fails without selection", async () => {
    render(<InviteModal isOpen={true} onClose={mock()} workspaceId="ws1" />);

    // Clear selection
    fireEvent.click(screen.getByText("Clear Selection"));
    fireEvent.click(screen.getByText("Generate Link"));

    expect(screen.getByTestId("status-msg").textContent).toBe(
      "Select at least one workspace",
    );
  });

  test("handleGenerateLink success", async () => {
    mockPost.mockResolvedValueOnce({ data: { token: "token123" } });

    render(<InviteModal isOpen={true} onClose={mock()} workspaceId="ws1" />);

    fireEvent.click(screen.getByText("Select WS2"));
    fireEvent.click(screen.getByText("Generate Link"));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/invites/generate",
        expect.any(Object),
      );
      expect(mockReloadWorkspaces).toHaveBeenCalled();
      expect(screen.getByTestId("link-section").textContent).toContain(
        "syncarts://invite/token123",
      );
    });
  });

  test("handleGenerateLink with local default creates a new shared workspace", async () => {
    mockPost.mockResolvedValueOnce({ data: { token: "token123" } });
    mockCreateWorkspace.mockReturnValue("new-shared-ws");

    render(<InviteModal isOpen={true} onClose={mock()} workspaceId="ws1" />);

    fireEvent.click(screen.getByText("Select Local"));
    fireEvent.click(screen.getByText("Generate Link"));

    await waitFor(() => {
      expect(mockCreateWorkspace).toHaveBeenCalled();
      expect(mockSwitchWorkspace).toHaveBeenCalledWith("new-shared-ws");
      expect(mockPost).toHaveBeenCalled();
    });
  });

  test("handleInviteEmail success", async () => {
    mockPost.mockResolvedValueOnce({});

    render(<InviteModal isOpen={true} onClose={mock()} workspaceId="ws1" />);

    fireEvent.click(screen.getByText("Select WS2"));
    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "test@example.com" },
    });
    fireEvent.submit(screen.getByTestId("email-form"));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/invites/add-member",
        expect.any(Object),
      );
      expect(mockReloadWorkspaces).toHaveBeenCalled();
      expect(screen.getByTestId("status-msg").textContent).toBe(
        "Member added successfully",
      );
    });
  });

  test("handleRemoveMember success", async () => {
    mockDelete.mockResolvedValueOnce({});

    render(<InviteModal isOpen={true} onClose={mock()} workspaceId="ws1" />);

    fireEvent.click(screen.getByText("Remove"));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("/workspaces/ws1/members/user1");
      expect(screen.getByTestId("status-msg").textContent).toBe(
        "Member removed",
      );
    });
  });

  test("handleChangeRole success", async () => {
    mockPut.mockResolvedValueOnce({});

    render(<InviteModal isOpen={true} onClose={mock()} workspaceId="ws1" />);

    fireEvent.click(screen.getByText("Change Role"));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        "/workspaces/ws1/members/user1/role",
        { role: "admin" },
      );
      expect(screen.getByTestId("status-msg").textContent).toBe("Role updated");
    });
  });

  test("copies link to clipboard", () => {
    // If clipboard doesn't exist, create it so we can spy on it
    if (!navigator.clipboard) {
      Object.assign(navigator, {
        clipboard: { writeText: () => Promise.resolve() },
      });
    }
    const writeTextMock = mock(() => Promise.resolve());
    navigator.clipboard.writeText = writeTextMock as any;

    render(<InviteModal isOpen={true} onClose={mock()} workspaceId="ws1" />);
    fireEvent.click(screen.getByText("Copy"));

    expect(writeTextMock).toHaveBeenCalled();
  });
});
