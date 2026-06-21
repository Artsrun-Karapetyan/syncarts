import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { RenameableName } from "./RenameableName";

describe("RenameableName", () => {
  const defaultProps = {
    isRenaming: false,
    value: "",
    setValue: mock(),
    onSubmit: mock(),
    onCancel: mock(),
    name: "Original Name",
  };

  test("renders name when not renaming", () => {
    render(<RenameableName {...defaultProps} />);
    expect(screen.getByText("Original Name")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  test("renders input when renaming", () => {
    render(
      <RenameableName {...defaultProps} isRenaming={true} value="New Name" />,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("New Name");
  });

  test("calls setValue on input change", () => {
    const setValue = mock();
    render(
      <RenameableName
        {...defaultProps}
        isRenaming={true}
        value="New Name"
        setValue={setValue}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Updated" } });
    expect(setValue).toHaveBeenCalledWith("Updated");
  });

  test("calls onSubmit on Enter", () => {
    const onSubmit = mock();
    render(
      <RenameableName
        {...defaultProps}
        isRenaming={true}
        onSubmit={onSubmit}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalled();
  });

  test("calls onCancel on Escape", () => {
    const onCancel = mock();
    render(
      <RenameableName
        {...defaultProps}
        isRenaming={true}
        onCancel={onCancel}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  test("ignores other keys", () => {
    const onSubmit = mock();
    const onCancel = mock();
    render(
      <RenameableName
        {...defaultProps}
        isRenaming={true}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "A" });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("calls onSubmit on blur", () => {
    const onSubmit = mock();
    render(
      <RenameableName
        {...defaultProps}
        isRenaming={true}
        onSubmit={onSubmit}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.blur(input);
    expect(onSubmit).toHaveBeenCalled();
  });

  test("stops propagation on click", () => {
    const onParentClick = mock();
    render(
      <div onClick={onParentClick}>
        <RenameableName {...defaultProps} isRenaming={true} />
      </div>,
    );
    const input = screen.getByRole("textbox");
    fireEvent.click(input);
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
