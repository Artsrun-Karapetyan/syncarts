import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import React from "react";

import { MergeRequestsSidebarEmptyText } from "./MergeRequestsSidebarEmptyText";

describe("MergeRequestsSidebarEmptyText", () => {
  test("renders the custom text inside the element", () => {
    render(<MergeRequestsSidebarEmptyText text="No requests available" />);
    expect(screen.getByText("No requests available")).toBeDefined();
  });
});
