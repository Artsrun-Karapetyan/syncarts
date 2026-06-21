import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { MergeRequestMethodBadge } from "./MergeRequestMethodBadge";

describe("MergeRequestMethodBadge", () => {
  test("renders custom method text", () => {
    render(<MergeRequestMethodBadge method="POST" />);
    expect(screen.getByText("POST")).toBeTruthy();
  });

  test("renders default text when method is absent", () => {
    render(<MergeRequestMethodBadge />);
    expect(screen.getByText("REQ")).toBeTruthy();
  });

  test("applies GET styles", () => {
    const { container } = render(<MergeRequestMethodBadge method="GET" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.color).toBe("var(--method-get)");
    expect(badge.style.background).toBe("var(--method-get-bg)");
  });

  test("applies POST styles", () => {
    const { container } = render(<MergeRequestMethodBadge method="POST" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.color).toBe("var(--method-post)");
    expect(badge.style.background).toBe("var(--method-post-bg)");
  });

  test("applies PUT styles", () => {
    const { container } = render(<MergeRequestMethodBadge method="PUT" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.color).toBe("var(--method-put)");
    expect(badge.style.background).toBe("var(--method-put-bg)");
  });

  test("applies DELETE styles", () => {
    const { container } = render(<MergeRequestMethodBadge method="DELETE" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.color).toBe("var(--method-delete)");
    expect(badge.style.background).toBe("var(--method-delete-bg)");
  });

  test("applies fallback styles for unknown method", () => {
    const { container } = render(<MergeRequestMethodBadge method="PATCH" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.color).toBe("var(--text-tertiary)");
    expect(badge.style.background).toBe("var(--bg-tertiary)");
  });
});
