import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

mock.module("@/contexts/workspace/git/WorkspaceGitContext", () => ({
  useWorkspaceGitContext: () => ({ isGitRepo: false, currentBranch: null }),
}));

import { EmptyCollections } from "./EmptyCollections";

describe("EmptyCollections", () => {
  test("renders empty text and calls onClick", () => {
    const onClick = mock();
    render(<EmptyCollections onClick={onClick} />);

    const container = screen.getByText(/No collections yet/);
    expect(container).toBeTruthy();

    fireEvent.click(container);
    expect(onClick).toHaveBeenCalled();
  });

  test("changes style on hover", () => {
    const onClick = mock();
    render(<EmptyCollections onClick={onClick} />);

    const container = screen.getByText(/No collections yet/).parentElement!;

    // Simulate hover
    fireEvent.mouseEnter(container);
    expect(container.style.color).toBe("var(--text-primary)");

    // Simulate leave
    fireEvent.mouseLeave(container);
    expect(container.style.color).toBe("var(--text-tertiary)");
  });
});
