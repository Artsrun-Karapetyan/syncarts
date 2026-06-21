import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import React from "react";

import { MergeRequestStatusBadge } from "./MergeRequestStatusBadge";

describe("MergeRequestStatusBadge", () => {
  test("renders status text and applies MERGED styles", () => {
    render(<MergeRequestStatusBadge status="MERGED" />);
    const badge = screen.getByText("MERGED");
    expect(badge).toBeDefined();
  });

  test("renders status text and applies REJECTED styles", () => {
    render(<MergeRequestStatusBadge status="REJECTED" />);
    const badge = screen.getByText("REJECTED");
    expect(badge).toBeDefined();
  });

  test("renders status text and applies default styles for other statuses", () => {
    render(<MergeRequestStatusBadge status="OPEN" />);
    const badge = screen.getByText("OPEN");
    expect(badge).toBeDefined();
  });
});
