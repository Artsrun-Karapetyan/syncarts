import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import { Activity } from "lucide-react";

import { MenuSubmenu } from "./MenuSubmenu";

describe("MenuSubmenu", () => {
  test("renders closed submenu with label", () => {
    render(
      <MenuSubmenu icon={Activity} label="Submenu">
        <div>Child</div>
      </MenuSubmenu>,
    );
    expect(screen.getByText("Submenu")).toBeTruthy();
    expect(screen.queryByText("Child")).toBeNull();
  });

  test("opens submenu on mouse enter and closes on leave", () => {
    const { container } = render(
      <MenuSubmenu icon={Activity} label="Submenu">
        <div>Child Content</div>
      </MenuSubmenu>,
    );
    const div = container.firstChild as HTMLDivElement;

    fireEvent.mouseEnter(div);
    expect(screen.getByText("Child Content")).toBeTruthy();

    fireEvent.mouseLeave(div);
    expect(screen.queryByText("Child Content")).toBeNull();
  });

  test("toggles submenu on click", () => {
    render(
      <MenuSubmenu icon={Activity} label="Submenu">
        <div>Child Content</div>
      </MenuSubmenu>,
    );
    const btn = screen.getByRole("button");

    fireEvent.click(btn);
    expect(screen.getByText("Child Content")).toBeTruthy();

    fireEvent.click(btn);
    expect(screen.queryByText("Child Content")).toBeNull();
  });
});
