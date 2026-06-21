import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { EnvironmentModalHeader } from "./EnvironmentModalHeader";

describe("EnvironmentModalHeader", () => {
  test("renders Globals title when isGlobals is true", () => {
    render(<EnvironmentModalHeader isGlobals={true} onClose={() => {}} />);
    expect(screen.getByText("Globals")).toBeTruthy();
  });

  test("renders environment name when selectedEnv is provided", () => {
    const env = { id: "env1", name: "Production", variables: [] };
    render(
      <EnvironmentModalHeader
        isGlobals={false}
        selectedEnv={env}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Production")).toBeTruthy();
  });

  test("renders select environment placeholder when no selectedEnv is provided", () => {
    render(<EnvironmentModalHeader isGlobals={false} onClose={() => {}} />);
    expect(screen.getByText("Select an environment")).toBeTruthy();
  });

  test("triggers onClose callback and changes styles on close button hover", () => {
    const handleClose = mock();
    render(<EnvironmentModalHeader isGlobals={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole("button");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();

    fireEvent.mouseEnter(closeBtn);
    expect(closeBtn.style.color).toBe("var(--text-primary)");

    fireEvent.mouseLeave(closeBtn);
    expect(closeBtn.style.color).toBe("var(--text-secondary)");
  });
});
