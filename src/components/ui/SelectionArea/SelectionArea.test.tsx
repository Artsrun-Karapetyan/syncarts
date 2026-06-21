import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectionArea } from "./SelectionArea";
import React from "react";

describe("SelectionArea", () => {
  test("renders children", () => {
    render(<SelectionArea><div data-testid="child">Child</div></SelectionArea>);
    expect(screen.getByTestId("child")).toBeTruthy();
  });

  test("ignores mousedown on inputs", () => {
    const onChange = mock();
    const { container } = render(
      <SelectionArea onSelectionChange={onChange}>
        <input type="text" data-testid="inp" />
      </SelectionArea>
    );
    const inp = screen.getByTestId("inp");
    fireEvent.mouseDown(inp, { button: 0, clientX: 10, clientY: 10 });
    
    // The selection area shouldn't start dragging
    expect(container.querySelector("div[style*='position: absolute']")).toBeNull();
  });

  test("starts dragging on mousedown", () => {
    const { container } = render(
      <SelectionArea>
        <div style={{ padding: 50 }} data-testid="area">Area</div>
      </SelectionArea>
    );
    const area = screen.getByTestId("area");
    
    // Not dragging initially
    expect(container.querySelector("div[style*='position: absolute']")).toBeNull();

    // Start drag
    fireEvent.mouseDown(area, { button: 0, clientX: 10, clientY: 10 });
    
    // Move slightly
    fireEvent.mouseMove(window, { clientX: 20, clientY: 20 });
    
    // Should render the drag box (position: absolute)
    expect(container.querySelector("div[style*='position: absolute']")).toBeTruthy();

    // Mouse up
    fireEvent.mouseUp(window, { clientX: 20, clientY: 20 });
    
    // Box disappears
    expect(container.querySelector("div[style*='position: absolute']")).toBeNull();
  });

  test("copies selected ids when Meta+C is pressed", () => {
    const onCopy = mock();
    const { container } = render(
      <SelectionArea onCopy={onCopy}>
        <div data-selection-id="item1">Item 1</div>
      </SelectionArea>
    );

    // Simulate drag to select item
    const area = container.firstChild as Element;
    fireEvent.mouseDown(area, { button: 0, clientX: 0, clientY: 0 });
    
    // Mock getBoundingClientRect
    const item = container.querySelector("[data-selection-id='item1']") as Element;
    item.getBoundingClientRect = () => ({ left: 5, top: 5, right: 15, bottom: 15, width: 10, height: 10, x: 5, y: 5, toJSON: () => {} });
    area.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => {} });

    fireEvent.mouseMove(window, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(window, { clientX: 20, clientY: 20 });

    // Press Meta+C
    fireEvent.keyDown(window, { key: "c", metaKey: true });
    
    expect(onCopy).toHaveBeenCalled();
  });
});
