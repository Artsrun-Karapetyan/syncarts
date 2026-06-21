import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { EnvironmentNavItem } from "./EnvironmentNavItem";

describe("EnvironmentNavItem", () => {
  test("renders active state styles and children", () => {
    const { container } = render(
      <EnvironmentNavItem active={true} onClick={() => {}}>
        <span>Item 1</span>
      </EnvironmentNavItem>,
    );
    expect(screen.getByText("Item 1")).toBeTruthy();
    const item = container.firstChild as HTMLElement;
    expect(item.style.background).toBe("var(--bg-tertiary)");
    expect(item.style.color).toBe("var(--text-primary)");
  });

  test("renders inactive state styles", () => {
    const { container } = render(
      <EnvironmentNavItem active={false} onClick={() => {}}>
        <span>Item 2</span>
      </EnvironmentNavItem>,
    );
    const item = container.firstChild as HTMLElement;
    expect(item.style.background).toBe("transparent");
    expect(item.style.color).toBe("var(--text-secondary)");
  });

  test("triggers onClick callback", () => {
    const handleClick = mock();
    render(
      <EnvironmentNavItem active={false} onClick={handleClick}>
        <span>Item</span>
      </EnvironmentNavItem>,
    );
    const item = screen.getByText("Item");
    fireEvent.click(item);
    expect(handleClick).toHaveBeenCalled();
  });
});
