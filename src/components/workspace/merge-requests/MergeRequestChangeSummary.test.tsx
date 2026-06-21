import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import React from "react";

import { MergeRequestChangeSummary } from "./MergeRequestChangeSummary";

describe("MergeRequestChangeSummary", () => {
  test("renders correct count of added, modified and deleted elements", () => {
    render(<MergeRequestChangeSummary added={3} modified={4} deleted={5} />);
    expect(screen.getByText("3 Added")).toBeDefined();
    expect(screen.getByText("4 Modified")).toBeDefined();
    expect(screen.getByText("5 Deleted")).toBeDefined();
  });
});
