import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import React from "react";

import { InviteDivider } from "./InviteDivider";

describe("InviteDivider", () => {
  test("renders the OR text", () => {
    render(<InviteDivider />);
    expect(screen.getByText("OR")).toBeDefined();
  });
});
