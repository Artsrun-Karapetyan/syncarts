import { fireEvent, render } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import { Activity } from "lucide-react";

import { ToolbarButton } from "./ToolbarButton";

describe("ToolbarButton", () => {
  test("renders tooltip and icon", () => {
    const { container } = render(
      <ToolbarButton tooltip="Test Tooltip" icon={Activity} onClick={mock()} />,
    );
    const div = container.firstChild as HTMLDivElement;
    expect(div.getAttribute("data-tooltip")).toBe("Test Tooltip");
  });

  test("calls onClick", () => {
    const onClick = mock();
    const { container } = render(
      <ToolbarButton tooltip="Test" icon={Activity} onClick={onClick} />,
    );
    const div = container.firstChild as HTMLDivElement;
    fireEvent.click(div);
    expect(onClick).toHaveBeenCalled();
  });

  test("handles mouse enter and leave for hover styles", () => {
    const { container } = render(
      <ToolbarButton
        tooltip="Test"
        icon={Activity}
        onClick={mock()}
        background="rgb(0, 0, 0)"
        color="rgb(255, 255, 255)"
        hoverBackground="rgb(10, 10, 10)"
        hoverColor="rgb(200, 200, 200)"
      />,
    );
    const div = container.firstChild as HTMLDivElement;

    fireEvent.mouseEnter(div);
    expect(div.style.background).toBe("rgb(10, 10, 10)");
    expect(div.style.color).toBe("rgb(200, 200, 200)");

    fireEvent.mouseLeave(div);
  });
});
