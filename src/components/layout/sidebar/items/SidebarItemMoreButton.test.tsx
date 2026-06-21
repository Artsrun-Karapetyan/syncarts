import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { SidebarItemMoreButton } from "./SidebarItemMoreButton";
import React from "react";

describe("SidebarItemMoreButton", () => {
  test("renders the button", () => {
    const { container } = render(<SidebarItemMoreButton onClick={mock()} />);
    const iconDiv = container.firstChild as HTMLDivElement;
    expect(iconDiv).toBeTruthy();
    expect(iconDiv.className).toContain("sidebar-action-icon");
  });

  test("calls onClick and stops propagation", () => {
    const onClick = mock();
    const onParentClick = mock();
    const { container } = render(
      <div onClick={onParentClick}>
        <SidebarItemMoreButton onClick={onClick} />
      </div>
    );
    const iconDiv = container.firstChild!.firstChild as HTMLDivElement;
    fireEvent.click(iconDiv);
    
    expect(onClick).toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  test("handles mouse enter and leave", () => {
    const { container } = render(<SidebarItemMoreButton onClick={mock()} />);
    const iconDiv = container.firstChild as HTMLDivElement;
    
    fireEvent.mouseEnter(iconDiv);
    expect(iconDiv.style.background).toBe("var(--bg-secondary)");
    
    fireEvent.mouseLeave(iconDiv);
  });
});
