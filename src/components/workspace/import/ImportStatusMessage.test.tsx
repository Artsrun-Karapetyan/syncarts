import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import React from "react";

import { ImportStatusMessage } from "./ImportStatusMessage";

describe("ImportStatusMessage", () => {
  test("renders success message correctly", () => {
    render(<ImportStatusMessage message="Success import" status="success" />);
    expect(screen.getByText("Success import")).toBeDefined();
  });

  test("renders error message correctly", () => {
    render(<ImportStatusMessage message="Failed import" status="error" />);
    expect(screen.getByText("Failed import")).toBeDefined();
  });
});
