import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { InviteEmailForm } from "./InviteEmailForm";

describe("InviteEmailForm", () => {
  const dummyProps = {
    email: "",
    loading: false,
    onSubmit: mock(),
    selectedWorkspaceIds: [],
    setEmail: mock(),
  };

  test("renders form inputs and labels", () => {
    render(<InviteEmailForm {...dummyProps} />);
    expect(screen.getByPlaceholderText("name@example.com")).toBeDefined();
  });

  test("disables button when fields are incomplete", () => {
    render(
      <InviteEmailForm {...dummyProps} email="" selectedWorkspaceIds={[]} />,
    );
    const btn = screen.getByRole("button", {
      name: "Add Member",
    }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test("triggers onSubmit when click submit button and fields are complete", () => {
    const onSubmit = mock();
    render(
      <InviteEmailForm
        {...dummyProps}
        email="test@test.com"
        selectedWorkspaceIds={["w1"]}
        onSubmit={onSubmit}
      />,
    );
    const btn = screen.getByRole("button", { name: "Add Member" });
    fireEvent.submit(btn);
    expect(onSubmit).toHaveBeenCalled();
  });
});
