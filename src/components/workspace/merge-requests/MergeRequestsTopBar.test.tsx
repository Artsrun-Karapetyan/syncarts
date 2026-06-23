import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockNavigate = mock();

mock.module("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

import { MergeRequestsTopBar } from "./MergeRequestsTopBar";

describe("MergeRequestsTopBar", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("renders topbar components correctly", () => {
    render(<MergeRequestsTopBar />);
    expect(screen.getByText("Merge Requests")).toBeTruthy();
    expect(screen.getByText("Back to Workspace")).toBeTruthy();
  });

  test("navigates to home when back button is clicked", () => {
    render(<MergeRequestsTopBar />);
    const backBtn = screen.getByRole("button", { name: /Back to Workspace/i });
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });
});
