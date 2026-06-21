import { describe, expect, test, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewCollectionInput } from "./NewCollectionInput";
import React from "react";

describe("NewCollectionInput", () => {
  const defaultProps = {
    newColName: "",
    setNewColName: mock(),
    handleAddCollection: mock(),
    setIsAdding: mock(),
  };

  beforeEach(() => {
    defaultProps.setNewColName.mockClear();
    defaultProps.handleAddCollection.mockClear();
    defaultProps.setIsAdding.mockClear();
  });

  test("renders input with value and calls setNewColName on change", () => {
    render(<NewCollectionInput {...defaultProps} newColName="test" />);
    
    const input = screen.getByPlaceholderText("Collection name") as HTMLInputElement;
    expect(input.value).toBe("test");
    
    fireEvent.change(input, { target: { value: "updated" } });
    expect(defaultProps.setNewColName).toHaveBeenCalledWith("updated");
  });

  test("calls handleAddCollection on Enter key", () => {
    render(<NewCollectionInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText("Collection name");
    fireEvent.keyDown(input, { key: "Enter" });
    
    expect(defaultProps.handleAddCollection).toHaveBeenCalled();
  });

  test("does not call handleAddCollection on other keys", () => {
    render(<NewCollectionInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText("Collection name");
    fireEvent.keyDown(input, { key: "A" });
    
    expect(defaultProps.handleAddCollection).not.toHaveBeenCalled();
  });

  test("calls handleAddCollection on blur if name is provided", async () => {
    render(<NewCollectionInput {...defaultProps} newColName="New Folder" />);
    
    const input = screen.getByPlaceholderText("Collection name");
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(defaultProps.handleAddCollection).toHaveBeenCalled();
      expect(defaultProps.setIsAdding).not.toHaveBeenCalled();
    });
  });

  test("calls setIsAdding(false) on blur if name is empty", async () => {
    render(<NewCollectionInput {...defaultProps} newColName="   " />);
    
    const input = screen.getByPlaceholderText("Collection name");
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(defaultProps.setIsAdding).toHaveBeenCalledWith(false);
      expect(defaultProps.handleAddCollection).not.toHaveBeenCalled();
    });
  });
});
