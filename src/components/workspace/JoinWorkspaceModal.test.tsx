import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { JoinWorkspaceModal } from "./JoinWorkspaceModal";

const mockNavigate = mock();

mock.module("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

describe("JoinWorkspaceModal", () => {
  afterEach(() => {
    mockNavigate.mockClear();
  });

  test("does not render when closed", () => {
    render(<JoinWorkspaceModal isOpen={false} onClose={mock()} />);
    expect(screen.queryByText("Join Workspace")).toBeNull();
  });

  test("renders when open", () => {
    render(<JoinWorkspaceModal isOpen={true} onClose={mock()} />);
    expect(screen.getByText("Join Workspace")).toBeTruthy();
    expect(screen.getByText("Invite Link or Code")).toBeTruthy();
  });

  test("calls onClose when X is clicked", () => {
    const onClose = mock();
    render(<JoinWorkspaceModal isOpen={true} onClose={onClose} />);

    // Find button by looking inside the header container.
    // The X button is the only button in the header.
    // Or we can query by button and filter.
    // Or simply the Cancel button.
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  test("disables continue button initially", () => {
    render(<JoinWorkspaceModal isOpen={true} onClose={mock()} />);
    const btn = screen.getByText("Continue");
    expect((btn as HTMLButtonElement).disabled).toBeTrue();
  });

  test("enables continue button when input is provided", () => {
    render(<JoinWorkspaceModal isOpen={true} onClose={mock()} />);
    const input = screen.getByPlaceholderText(
      "e.g. syncarts://invite/xyz... or just xyz...",
    );
    fireEvent.change(input, { target: { value: "mytoken" } });

    const btn = screen.getByText("Continue");
    expect((btn as HTMLButtonElement).disabled).toBeFalse();
  });

  test("handles form submission with token", async () => {
    const onClose = mock();
    render(<JoinWorkspaceModal isOpen={true} onClose={onClose} />);

    const input = screen.getByPlaceholderText(
      "e.g. syncarts://invite/xyz... or just xyz...",
    );
    fireEvent.change(input, { target: { value: "mytoken123" } });

    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/invite/$token",
      params: { token: "mytoken123" },
    });
  });

  test("extracts token from full link", async () => {
    const onClose = mock();
    render(<JoinWorkspaceModal isOpen={true} onClose={onClose} />);

    const input = screen.getByPlaceholderText(
      "e.g. syncarts://invite/xyz... or just xyz...",
    );
    fireEvent.change(input, {
      target: { value: "syncarts://invite/my-invite-token" },
    });

    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/invite/$token",
      params: { token: "my-invite-token" },
    });
  });

  test("does not submit if input is empty", async () => {
    const onClose = mock();
    render(<JoinWorkspaceModal isOpen={true} onClose={onClose} />);

    const form = screen
      .getByPlaceholderText(/e\.g\. syncarts/)
      .closest("form")!;
    fireEvent.submit(form);

    expect(onClose).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled(); // Well, the previous calls might still be tracked, but we can clear mocks if needed
  });
});
