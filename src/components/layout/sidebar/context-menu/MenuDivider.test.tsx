import { render } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { MenuDivider } from "./MenuDivider";

describe("MenuDivider", () => {
  test("renders a divider", () => {
    const { container } = render(<MenuDivider />);
    const div = container.firstChild as HTMLDivElement;
    expect(div).toBeTruthy();
    expect(div.style.height).toBe("1px");
    expect(div.style.background).toBe("var(--border-color)");
  });
});
