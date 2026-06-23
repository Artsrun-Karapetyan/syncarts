import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import React from "react";

import { ImportDivider } from "./ImportDivider";

describe("ImportDivider", () => {
  test("renders the OR divider", () => {
    render(<ImportDivider />);
    expect(screen.getByText("OR")).toBeDefined();
  });
});
