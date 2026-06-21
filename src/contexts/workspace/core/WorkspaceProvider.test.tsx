import { render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import React, { useContext } from "react";

const mockControllerValue = {
  activeWorkspaceId: "mock-ws-123",
  workspaces: [{ id: "mock-ws-123", name: "Mock" }],
};

mock.module("@/contexts/workspace/core/useWorkspaceController", () => ({
  useWorkspaceController: () => mockControllerValue,
}));

import { WorkspaceContext } from "./context";
import { WorkspaceProvider } from "./WorkspaceProvider";

function Consumer() {
  const ws = useContext(WorkspaceContext);
  return <div data-testid="ws-id">{ws?.activeWorkspaceId || "none"}</div>;
}

describe("WorkspaceProvider", () => {
  test("provides useWorkspaceController value to children", () => {
    render(
      <WorkspaceProvider userId="u1">
        <Consumer />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId("ws-id").textContent).toBe("mock-ws-123");
  });
});
