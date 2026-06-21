import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import React from "react";

import { MergeRequestError } from "./MergeRequestError";

describe("MergeRequestError", () => {
  test("renders the error message text", () => {
    render(<MergeRequestError text="Custom API error occured" />);
    expect(screen.getByText("Custom API error occured")).toBeDefined();
  });
});
