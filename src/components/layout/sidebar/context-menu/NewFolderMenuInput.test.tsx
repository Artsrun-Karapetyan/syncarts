import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewFolderMenuInput } from "./NewFolderMenuInput";
import React from "react";

describe("NewFolderMenuInput", () => {
  const defaultProps = {
    newFolderName: "",
    setNewFolderName: mock(),
    handleFolderSubmit: mock(),
    setIsCreatingFolder: mock(),
    setCtxMenu: mock(),
  };

  test("renders input with placeholder", () => {
    render(<NewFolderMenuInput {...defaultProps} />);
    expect(screen.getByPlaceholderText("Folder name")).toBeTruthy();
  });

  test("calls setNewFolderName on change", () => {
    const setNewFolderName = mock();
    render(<NewFolderMenuInput {...defaultProps} setNewFolderName={setNewFolderName} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "New folder" } });
    expect(setNewFolderName).toHaveBeenCalledWith("New folder");
  });

  test("calls handleFolderSubmit on Enter", () => {
    const handleFolderSubmit = mock();
    render(<NewFolderMenuInput {...defaultProps} handleFolderSubmit={handleFolderSubmit} />);
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(handleFolderSubmit).toHaveBeenCalled();
  });

  test("calls cancel methods on Escape", () => {
    const setIsCreatingFolder = mock();
    const setCtxMenu = mock();
    render(
      <NewFolderMenuInput
        {...defaultProps}
        setIsCreatingFolder={setIsCreatingFolder}
        setCtxMenu={setCtxMenu}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(setIsCreatingFolder).toHaveBeenCalledWith(false);
    expect(setCtxMenu).toHaveBeenCalledWith(null);
  });

  test("does nothing on other keys", () => {
    const handleFolderSubmit = mock();
    const setCtxMenu = mock();
    render(
      <NewFolderMenuInput
        {...defaultProps}
        handleFolderSubmit={handleFolderSubmit}
        setCtxMenu={setCtxMenu}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "A" });
    expect(handleFolderSubmit).not.toHaveBeenCalled();
    expect(setCtxMenu).not.toHaveBeenCalled();
  });

  test("calls handleFolderSubmit on blur if name is trimmed", async () => {
    const handleFolderSubmit = mock();
    render(
      <NewFolderMenuInput
        {...defaultProps}
        newFolderName="  Valid name  "
        handleFolderSubmit={handleFolderSubmit}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(handleFolderSubmit).toHaveBeenCalled();
    });
  });

  test("calls cancel methods on blur if name is empty", async () => {
    const setIsCreatingFolder = mock();
    const setCtxMenu = mock();
    render(
      <NewFolderMenuInput
        {...defaultProps}
        newFolderName="   "
        setIsCreatingFolder={setIsCreatingFolder}
        setCtxMenu={setCtxMenu}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(setIsCreatingFolder).toHaveBeenCalledWith(false);
      expect(setCtxMenu).toHaveBeenCalledWith(null);
    });
  });
});
