import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WatchMenuButton } from "./WatchMenuButton";
import React from "react";

describe("WatchMenuButton", () => {
  const defaultProps = {
    entityType: "collection" as const,
    entityId: "1",
    isWatched: false,
    onDone: mock(),
    onToggle: mock().mockResolvedValue(true),
  };

  test("renders Watch text when not watched", () => {
    render(<WatchMenuButton {...defaultProps} />);
    expect(screen.getByText("Watch collection")).toBeTruthy();
  });

  test("renders Unwatch text when watched", () => {
    render(<WatchMenuButton {...defaultProps} isWatched={true} />);
    expect(screen.getByText("Unwatch collection")).toBeTruthy();
  });

  test("calls onToggle and onDone on successful click", async () => {
    render(<WatchMenuButton {...defaultProps} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(defaultProps.onToggle).toHaveBeenCalledWith("collection", "1");
    
    await waitFor(() => {
      expect(defaultProps.onDone).toHaveBeenCalledWith("Watching collection");
    });
  });

  test("calls onToggle and onDone with error message on failure", async () => {
    const onToggle = mock().mockRejectedValue(new Error("Watch failed"));
    render(<WatchMenuButton {...defaultProps} onToggle={onToggle} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    
    await waitFor(() => {
      expect(defaultProps.onDone).toHaveBeenCalledWith("Watch failed");
    });
  });
});
