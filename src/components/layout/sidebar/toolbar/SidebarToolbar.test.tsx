import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { SidebarToolbar } from "./SidebarToolbar";
import React from "react";

describe("SidebarToolbar", () => {
  const defaultProps = {
    openMrCount: 0,
    onMergeRequests: mock(),
    onImport: mock(),
    onNewRequest: mock(),
    onNewCollection: mock(),
    onToggleWorkspaceWatch: mock(),
    isWorkspaceWatched: false,
  };

  test("renders title", () => {
    render(<SidebarToolbar {...defaultProps} />);
    expect(screen.getByText("Collections")).toBeTruthy();
  });

  test("renders buttons based on props", () => {
    render(<SidebarToolbar {...defaultProps} />);
    // MR button, Import, New Request, New Collection, Watch Workspace
    const triggers = screen.getAllByRole("generic").filter(node => node.className === "tooltip-trigger");
    expect(triggers.length).toBe(5);
  });

  test("does not render missing optional props buttons", () => {
    render(<SidebarToolbar openMrCount={0} onMergeRequests={mock()} />);
    const triggers = screen.getAllByRole("generic").filter(node => node.className === "tooltip-trigger");
    // Only MR button should exist
    expect(triggers.length).toBe(1);
  });

  test("renders MergeRequestBadge when openMrCount > 0", () => {
    render(<SidebarToolbar {...defaultProps} openMrCount={5} />);
    expect(screen.getByText("5")).toBeTruthy();
  });

  test("calls callbacks on click", () => {
    const { container } = render(<SidebarToolbar {...defaultProps} />);
    // Because we just have raw generic divs, let's query them by tooltip content if happy-dom exposes data attributes
    // Actually simpler to just click the trigger div elements
    const triggers = container.querySelectorAll(".tooltip-trigger") as NodeListOf<HTMLDivElement>;
    
    // In order of rendered: 1. Watch, 2. MR, 3. Import, 4. New Req, 5. New Col
    fireEvent.click(triggers[0]);
    expect(defaultProps.onToggleWorkspaceWatch).toHaveBeenCalled();

    fireEvent.click(triggers[1]);
    expect(defaultProps.onMergeRequests).toHaveBeenCalled();

    fireEvent.click(triggers[2]);
    expect(defaultProps.onImport).toHaveBeenCalled();

    fireEvent.click(triggers[3]);
    expect(defaultProps.onNewRequest).toHaveBeenCalled();

    fireEvent.click(triggers[4]);
    expect(defaultProps.onNewCollection).toHaveBeenCalled();
  });
});
