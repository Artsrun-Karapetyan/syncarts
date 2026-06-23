import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import { Activity } from "lucide-react";

import { MenuButton } from "./MenuButton";

describe("MenuButton", () => {
  test("renders button with label and icon", () => {
    render(<MenuButton icon={Activity} label="Test Label" onClick={mock()} />);
    expect(screen.getByText("Test Label")).toBeTruthy();
    const btn = screen.getByRole("button");
    expect(btn.style.color).toBe("var(--text-primary)");
  });

  test("renders destructive button", () => {
    render(
      <MenuButton
        icon={Activity}
        label="Delete"
        destructive
        onClick={mock()}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn.style.color).toBe("var(--status-delete)");
  });

  test("calls onClick when clicked", () => {
    const onClick = mock();
    render(<MenuButton icon={Activity} label="Test" onClick={onClick} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  test("handles mouse enter and leave for normal button", () => {
    render(<MenuButton icon={Activity} label="Test" onClick={mock()} />);
    const btn = screen.getByRole("button");

    fireEvent.mouseEnter(btn);
    expect(btn.style.background).toBe("var(--bg-tertiary)");

    fireEvent.mouseLeave(btn);
  });

  test("handles mouse enter and leave for destructive button", () => {
    render(
      <MenuButton icon={Activity} label="Test" destructive onClick={mock()} />,
    );
    const btn = screen.getByRole("button");

    fireEvent.mouseEnter(btn);
    expect(btn.style.background).toBe("var(--status-delete-bg)");

    fireEvent.mouseLeave(btn);
  });
});
