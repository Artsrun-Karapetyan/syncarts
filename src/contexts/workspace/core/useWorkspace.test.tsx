/* eslint-disable react/no-multi-comp */
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import React from "react";

import { WorkspaceContext } from "@/contexts/workspace/core/context";

import { useWorkspace } from "./useWorkspace";

// Dummy component that consumes useWorkspace
function Consumer() {
  const ws = useWorkspace();
  return <div data-testid="ws-name">{ws.activeWorkspace?.name || "none"}</div>;
}

describe("useWorkspace hook", () => {
  test("throws error when used outside WorkspaceProvider", () => {
    const consoleError = console.error;
    console.error = () => {}; // Silence React console error boundary warning
    expect(() => render(<Consumer />)).toThrow(
      "useWorkspace must be used within WorkspaceProvider",
    );
    console.error = consoleError;
  });

  test("returns context value when rendered inside WorkspaceContext.Provider", () => {
    const mockContextValue: any = {
      activeWorkspace: { id: "w-1", name: "Mock Work" },
    };

    render(
      <WorkspaceContext.Provider value={mockContextValue}>
        <Consumer />
      </WorkspaceContext.Provider>,
    );

    expect(screen.getByTestId("ws-name").textContent).toBe("Mock Work");
  });

  test("returns correct context values for workspaces array and actions", () => {
    const mockContextValue: any = {
      workspaces: [{ id: "w-1", name: "Mock Work" }],
      createWorkspace: () => {},
    };

    function DetailedConsumer() {
      const ws = useWorkspace();
      return (
        <div>
          <span data-testid="ws-len">{ws.workspaces.length}</span>
          <span data-testid="ws-act">{typeof ws.createWorkspace}</span>
        </div>
      );
    }

    render(
      <WorkspaceContext.Provider value={mockContextValue}>
        <DetailedConsumer />
      </WorkspaceContext.Provider>,
    );

    expect(screen.getByTestId("ws-len").textContent).toBe("1");
    expect(screen.getByTestId("ws-act").textContent).toBe("function");
  });

  test("reacts dynamically to context updates", () => {
    let mockContextValue: any = {
      activeWorkspace: { id: "w-1", name: "Initial" },
    };

    const { rerender } = render(
      <WorkspaceContext.Provider value={mockContextValue}>
        <Consumer />
      </WorkspaceContext.Provider>,
    );

    expect(screen.getByTestId("ws-name").textContent).toBe("Initial");

    mockContextValue = {
      activeWorkspace: { id: "w-1", name: "Updated" },
    };

    rerender(
      <WorkspaceContext.Provider value={mockContextValue}>
        <Consumer />
      </WorkspaceContext.Provider>,
    );

    expect(screen.getByTestId("ws-name").textContent).toBe("Updated");
  });
});
