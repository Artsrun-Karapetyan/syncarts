import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";
import React from "react";

import { TopBar } from "./TopBar";

// -- Mocks --

const mockUseWorkspace = {
  activeWorkspaceId: "w1",
  environments: [{ id: "env1", name: "Dev", variables: [{ id: "v1", key: "URL", value: "localhost", enabled: true }] }],
  globalVariables: [{ id: "g1", key: "GLOBAL_VAR", value: "123", enabled: true }],
  activeEnvironmentId: null as string | null,
  setActiveEnvironmentId: mock(),
  activeEnvironment: null as any,
  workspaces: [{ id: "w1", type: "cloud" }],
};

mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => mockUseWorkspace,
}));

const mockUseStoredUser = mock().mockReturnValue({ id: "user1" });
mock.module("@/lib/session", () => ({
  useStoredUser: mockUseStoredUser,
}));

let mockIsTauri = false;
mock.module("@/lib/tauriRuntime", () => ({
  isTauriRuntime: () => mockIsTauri,
}));

const mockStartDragging = mock().mockResolvedValue(undefined);
const mockIsFullscreen = mock().mockResolvedValue(false);
const mockOnResized = mock().mockResolvedValue(mock()); // returns unlisten function

mock.module("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    startDragging: mockStartDragging,
    isFullscreen: mockIsFullscreen,
    onResized: mockOnResized,
  }),
}));

mock.module("@/components/environment/EnvironmentManager", () => ({
  EnvironmentManager: (props: any) => (
    <div data-testid="env-manager" data-open={props.isOpen}>
      <button onClick={props.onClose}>Close Env Manager</button>
    </div>
  ),
}));

mock.module("@/components/layout/topbar/TopBarProfileButton", () => ({ TopBarProfileButton: () => <div data-testid="profile-btn" /> }));
mock.module("@/components/layout/workspace-switcher/WorkspaceSwitcher", () => ({ WorkspaceSwitcher: () => <div data-testid="workspace-switcher" /> }));
mock.module("@/components/notifications/NotificationCenter", () => ({ NotificationCenter: () => <div data-testid="notification-center" /> }));

mock.module("@/components/ui/Select/Select", () => ({
  Select: (props: any) => (
    <select data-testid="select" value={props.value} onChange={(e) => props.onChange(e.target.value)}>
      {props.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}));

mock.module("@/components/workspace/InviteModal", () => ({
  InviteModal: (props: any) => (
    <div data-testid="invite-modal" data-open={props.isOpen}>
      <button onClick={props.onClose}>Close Invite</button>
    </div>
  ),
}));

mock.module("@/components/workspace/JoinWorkspaceModal", () => ({
  JoinWorkspaceModal: (props: any) => (
    <div data-testid="join-modal" data-open={props.isOpen}>
      <button onClick={props.onClose}>Close Join</button>
    </div>
  ),
}));

describe("TopBar", () => {
  beforeEach(() => {
    mockUseWorkspace.setActiveEnvironmentId.mockClear();
    mockUseStoredUser.mockClear();
    mockUseWorkspace.activeWorkspaceId = "w1";
    mockUseWorkspace.workspaces = [{ id: "w1", type: "cloud" }] as any;
    mockUseWorkspace.activeEnvironmentId = null;
    mockUseWorkspace.activeEnvironment = null;
    mockIsTauri = false;
    mockStartDragging.mockClear();
    mockIsFullscreen.mockClear();
    mockOnResized.mockClear();
  });

  test("renders components", () => {
    render(<TopBar />);
    expect(screen.getByTestId("workspace-switcher")).toBeTruthy();
    expect(screen.getByTestId("profile-btn")).toBeTruthy();
    expect(screen.getByTestId("notification-center")).toBeTruthy();
  });

  test("shows join and invite when user exists and cloud workspace", () => {
    mockUseStoredUser.mockReturnValue({ id: "user" });
    render(<TopBar />);
    expect(screen.getByText("Join")).toBeTruthy();
    expect(screen.getByText("Invite")).toBeTruthy();
  });

  test("hides invite when workspace is local", () => {
    mockUseStoredUser.mockReturnValue({ id: "user" });
    mockUseWorkspace.workspaces = [{ id: "w1", type: "local" }] as any;
    render(<TopBar />);
    expect(screen.queryByText("Invite")).toBeNull();
  });

  test("hides join and invite when no user", () => {
    mockUseStoredUser.mockReturnValue(null);
    render(<TopBar />);
    expect(screen.queryByText("Join")).toBeNull();
    expect(screen.queryByText("Invite")).toBeNull();
  });

  test("opens modals", () => {
    mockUseStoredUser.mockReturnValue({ id: "user" });
    render(<TopBar />);
    
    fireEvent.click(screen.getByText("Join"));
    expect(screen.getByTestId("join-modal").getAttribute("data-open")).toBe("true");
    fireEvent.click(screen.getByText("Close Join"));
    expect(screen.getByTestId("join-modal").getAttribute("data-open")).toBe("false");

    fireEvent.click(screen.getByText("Invite"));
    expect(screen.getByTestId("invite-modal").getAttribute("data-open")).toBe("true");
    fireEvent.click(screen.getByText("Close Invite"));
    expect(screen.getByTestId("invite-modal").getAttribute("data-open")).toBe("false");
  });

  test("handles Environment Manager", () => {
    const { container } = render(<TopBar />);
    // Environment manager button is the grid icon next to select
    const envManagerBtn = container.querySelector('[data-tooltip="Manage Environments"]') as HTMLElement;
    
    fireEvent.mouseEnter(envManagerBtn);
    expect(envManagerBtn.style.color).toBe("var(--text-primary)");
    fireEvent.mouseLeave(envManagerBtn);
    expect(envManagerBtn.style.color).toBe("var(--text-tertiary)");

    fireEvent.click(envManagerBtn);
    expect(screen.getByTestId("env-manager").getAttribute("data-open")).toBe("true");
    fireEvent.click(screen.getByText("Close Env Manager"));
    expect(screen.getByTestId("env-manager").getAttribute("data-open")).toBe("false");
  });

  test("handles select change", () => {
    render(<TopBar />);
    const select = screen.getByTestId("select");
    
    fireEvent.change(select, { target: { value: "none" } });
    expect(mockUseWorkspace.setActiveEnvironmentId).toHaveBeenCalledWith(null);

    fireEvent.change(select, { target: { value: "globals" } });
    expect(mockUseWorkspace.setActiveEnvironmentId).toHaveBeenCalledWith("globals");

    fireEvent.change(select, { target: { value: "env1" } });
    expect(mockUseWorkspace.setActiveEnvironmentId).toHaveBeenCalledWith("env1");
  });

  test("toggles quick look for no environment", () => {
    const { container } = render(<TopBar />);
    const quickLookBtn = container.querySelector('[data-tooltip="Environment Quick Look"]') as HTMLElement;
    
    fireEvent.mouseEnter(quickLookBtn);
    expect(quickLookBtn.style.color).toBe("var(--text-primary)");
    fireEvent.mouseLeave(quickLookBtn);
    expect(quickLookBtn.style.color).toBe("var(--text-tertiary)");

    // Open quick look
    fireEvent.click(quickLookBtn);
    expect(screen.getAllByText("No Environment").length).toBeGreaterThan(0);
    expect(screen.getByText("No active variables")).toBeTruthy();

    // Close quick look by clicking outside
    fireEvent.mouseDown(document.body);
    // Should only be 1 now (in the select)
    expect(screen.getAllByText("No Environment").length).toBe(1);
  });

  test("toggles quick look for globals", () => {
    mockUseWorkspace.activeEnvironmentId = "globals";
    const { container } = render(<TopBar />);
    const quickLookBtn = container.querySelector('[data-tooltip="Environment Quick Look"]') as HTMLElement;
    
    fireEvent.click(quickLookBtn);
    expect(screen.getAllByText("Globals").length).toBeGreaterThan(0);
    expect(screen.getByText("GLOBAL_VAR")).toBeTruthy();
    expect(screen.getByText("123")).toBeTruthy();
  });

  test("toggles quick look for specific environment", () => {
    mockUseWorkspace.activeEnvironmentId = "env1";
    mockUseWorkspace.activeEnvironment = mockUseWorkspace.environments[0] as any;
    const { container } = render(<TopBar />);
    const quickLookBtn = container.querySelector('[data-tooltip="Environment Quick Look"]') as HTMLElement;
    
    fireEvent.click(quickLookBtn);
    expect(screen.getAllByText("Dev").length).toBeGreaterThan(0);
    expect(screen.getByText("URL")).toBeTruthy();
    expect(screen.getByText("localhost")).toBeTruthy();
  });

  test("handles tauri window events", async () => {
    mockIsTauri = true;
    const { container, unmount } = render(<TopBar />);
    expect(mockIsFullscreen).toHaveBeenCalled();
    expect(mockOnResized).toHaveBeenCalled();
    
    const dragRegion = container.querySelector('[data-tauri-drag-region]') as HTMLElement;
    
    // Left click on drag region initiates dragging
    fireEvent.mouseDown(dragRegion, { button: 0 });
    expect(mockStartDragging).toHaveBeenCalled();
    
    mockStartDragging.mockClear();

    // Right click on drag region ignores
    fireEvent.mouseDown(dragRegion, { button: 1 });
    expect(mockStartDragging).not.toHaveBeenCalled();

    // Click on interactive element ignores
    const interactive = screen.getByText("Join");
    fireEvent.mouseDown(interactive, { button: 0 });
    expect(mockStartDragging).not.toHaveBeenCalled();

    // Handles startDragging rejection gracefully
    mockStartDragging.mockRejectedValueOnce(new Error("err"));
    fireEvent.mouseDown(dragRegion, { button: 0 });

    unmount();
    // Component unmounts successfully and removes listeners
  });
});
