import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { EnvironmentIconButton } from "./EnvironmentIconButton";

describe("EnvironmentIconButton", () => {
  test("renders tooltip and children correctly", () => {
    render(
      <EnvironmentIconButton tooltip="Test Tooltip" onClick={() => {}}>
        <span>Icon</span>
      </EnvironmentIconButton>,
    );
    const button = screen.getByRole("button");
    expect(button.getAttribute("data-tooltip")).toBe("Test Tooltip");
    expect(screen.getByText("Icon")).toBeTruthy();
  });

  test("triggers onClick callback on click", () => {
    const handleClick = mock();
    render(
      <EnvironmentIconButton tooltip="Tooltip" onClick={handleClick}>
        <span>Icon</span>
      </EnvironmentIconButton>,
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  test("changes styles on mouse enter and leave", () => {
    render(
      <EnvironmentIconButton tooltip="Tooltip" onClick={() => {}}>
        <span>Icon</span>
      </EnvironmentIconButton>,
    );
    const button = screen.getByRole("button");

    fireEvent.mouseEnter(button);
    expect(button.style.color).toBe("var(--text-primary)");

    fireEvent.mouseLeave(button);
    expect(button.style.color).toBe("var(--text-tertiary)");
  });
});
