import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import React from "react";

import { InviteStatusMessage } from "./InviteStatusMessage";

describe("InviteStatusMessage", () => {
  test("renders nothing when statusMsg is empty", () => {
    const { container } = render(<InviteStatusMessage statusMsg="" />);
    expect(container.firstChild).toBeNull();
  });

  test("renders status message when provided", () => {
    render(<InviteStatusMessage statusMsg="Invite code is invalid" />);
    expect(screen.getByText("Invite code is invalid")).toBeDefined();
  });
});
