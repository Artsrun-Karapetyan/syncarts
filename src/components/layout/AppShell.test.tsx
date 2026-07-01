/* eslint-disable react/no-multi-comp */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { AppShell } from "./AppShell";

mock.module("react-resizable-panels", () => ({
  Panel: ({ children, ...props }: any) => (
    <div data-testid="panel" {...props}>
      {children}
    </div>
  ),
  PanelGroup: ({ children, ...props }: any) => (
    <div data-testid="panel-group" {...props}>
      {children}
    </div>
  ),
  PanelResizeHandle: () => <div data-testid="panel-resize-handle" />,
}));

mock.module("@/components/layout/GlobalContextMenu", () => ({
  GlobalContextMenu: () => <div data-testid="global-ctx" />,
}));

mock.module("@/components/layout/GlobalDropZone", () => ({
  GlobalDropZone: ({ children }: any) => (
    <div data-testid="global-dropzone">{children}</div>
  ),
}));

mock.module("@/components/layout/Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

mock.module("@/components/layout/topbar/TopBar", () => ({
  TopBar: () => <div data-testid="topbar" />,
}));

mock.module("@/components/update/AppUpdateBanner", () => ({
  AppUpdateBanner: () => <div data-testid="update-banner" />,
}));

mock.module("@/contexts/WorkspaceContext", () => ({
  WorkspaceProvider: ({ children, userId }: any) => (
    <div data-testid="workspace-provider" data-userid={userId}>
      {children}
    </div>
  ),
}));

mock.module("@/contexts/workspace/git/WorkspaceGitContext", () => ({
  WorkspaceGitProvider: ({ children }: any) => <>{children}</>,
}));

const mockUseStoredUser = mock();
mock.module("@/lib/session", () => ({
  useStoredUser: mockUseStoredUser,
}));

describe("AppShell", () => {
  beforeEach(() => {
    mockUseStoredUser.mockClear();
  });

  test("renders offline workspace provider if no user", () => {
    mockUseStoredUser.mockReturnValue(null);

    render(
      <AppShell>
        <div data-testid="children">Child Content</div>
      </AppShell>,
    );

    const provider = screen.getByTestId("workspace-provider");
    expect(provider.getAttribute("data-userid")).toBe("offline");
    expect(screen.getByTestId("children")).toBeTruthy();
    expect(screen.getByTestId("topbar")).toBeTruthy();
    expect(screen.getByTestId("sidebar")).toBeTruthy();
    expect(screen.getByTestId("global-dropzone")).toBeTruthy();
    expect(screen.getByTestId("update-banner")).toBeTruthy();
    expect(screen.getByTestId("global-ctx")).toBeTruthy();

    const group = screen.getByTestId("panel-group");
    expect(group).toBeTruthy();

    const panels = screen.getAllByTestId("panel");
    expect(panels.length).toBe(2);

    expect(screen.getByTestId("panel-resize-handle")).toBeTruthy();
  });

  test("renders with user id if logged in", () => {
    mockUseStoredUser.mockReturnValue({ id: "user-123" });

    render(
      <AppShell>
        <div data-testid="children">Child Content</div>
      </AppShell>,
    );

    const provider = screen.getByTestId("workspace-provider");
    expect(provider.getAttribute("data-userid")).toBe("user-123");
  });
});
