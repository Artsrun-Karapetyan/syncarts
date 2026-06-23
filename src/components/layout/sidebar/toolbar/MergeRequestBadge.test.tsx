import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { MergeRequestBadge } from "./MergeRequestBadge";

describe("MergeRequestBadge", () => {
  test("renders count normally if <= 9", () => {
    render(<MergeRequestBadge count={5} />);
    expect(screen.getByText("5")).toBeTruthy();
  });

  test("renders 9+ if > 9", () => {
    render(<MergeRequestBadge count={10} />);
    expect(screen.getByText("9+")).toBeTruthy();
  });
});
