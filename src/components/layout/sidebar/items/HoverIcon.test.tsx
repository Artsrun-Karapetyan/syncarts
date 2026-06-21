import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { HoverIcon } from "./HoverIcon";
import React from "react";

describe("HoverIcon", () => {
  test("renders children and applies default color", () => {
    render(<HoverIcon onClick={mock()}><span data-testid="child">Test</span></HoverIcon>);
    expect(screen.getByTestId("child")).toBeTruthy();
    const container = screen.getByTestId("child").parentElement!;
    expect(container.style.color).toBe("var(--text-tertiary)");
  });

  test("applies custom color", () => {
    render(<HoverIcon onClick={mock()} color="red"><span data-testid="child">Test</span></HoverIcon>);
    const container = screen.getByTestId("child").parentElement!;
    expect(container.style.color).toBe("red");
  });

  test("calls onClick and stops propagation", () => {
    const onClick = mock();
    const onParentClick = mock();
    render(
      <div onClick={onParentClick}>
        <HoverIcon onClick={onClick}><span data-testid="child">Test</span></HoverIcon>
      </div>
    );
    const container = screen.getByTestId("child").parentElement!;
    fireEvent.click(container);
    
    expect(onClick).toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  test("handles mouse enter and leave for normal color", () => {
    const { container } = render(<HoverIcon onClick={mock()}><span data-testid="child">Test</span></HoverIcon>);
    const iconDiv = container.firstChild as HTMLDivElement;
    
    fireEvent.mouseEnter(iconDiv);
    expect(iconDiv.style.background).toBe("var(--bg-secondary)");
    
    fireEvent.mouseLeave(iconDiv);
  });

  test("handles mouse enter and leave for delete color", () => {
    const { container } = render(<HoverIcon onClick={mock()} color="var(--status-delete)"><span data-testid="child">Test</span></HoverIcon>);
    const iconDiv = container.firstChild as HTMLDivElement;
    
    fireEvent.mouseEnter(iconDiv);
    expect(iconDiv.style.background).toBe("var(--status-delete-bg)");
    
    fireEvent.mouseLeave(iconDiv);
  });

  test("renders title", () => {
    render(<HoverIcon onClick={mock()} title="Tooltip"><span data-testid="child">Test</span></HoverIcon>);
    const container = screen.getByTestId("child").parentElement!;
    expect(container.getAttribute("title")).toBe("Tooltip");
  });
});
