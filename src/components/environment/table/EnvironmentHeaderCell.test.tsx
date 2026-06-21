import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { EnvironmentHeaderCell } from "./EnvironmentHeaderCell";

describe("EnvironmentHeaderCell", () => {
  test("renders children correctly", () => {
    render(<EnvironmentHeaderCell>Header Content</EnvironmentHeaderCell>);
    expect(screen.getByText("Header Content")).toBeTruthy();
  });

  test("applies border left style when border prop is true", () => {
    const { container } = render(
      <EnvironmentHeaderCell border={true}>Content</EnvironmentHeaderCell>,
    );
    const element = container.firstChild as HTMLElement;
    expect(element.style.borderLeft).toContain("var(--border-color)");
  });

  test("does not apply border left style when border prop is false", () => {
    const { container } = render(
      <EnvironmentHeaderCell border={false}>Content</EnvironmentHeaderCell>,
    );
    const element = container.firstChild as HTMLElement;
    expect(element.style.borderLeft).toBe("");
  });
});
