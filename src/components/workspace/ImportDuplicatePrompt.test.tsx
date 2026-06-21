import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImportDuplicatePrompt, DuplicateImportItem } from "./ImportDuplicatePrompt";
import React from "react";

describe("ImportDuplicatePrompt", () => {
  const getItem = (type: "collection" | "environment"): DuplicateImportItem => ({
    type,
    data: {},
    originalName: "My Item",
    proposedName: "My Item (Copy)",
  });

  const getProps = (type: "collection" | "environment" = "collection") => ({
    duplicateItem: getItem(type),
    onCancel: mock(),
    onChange: mock(),
    onImportCopy: mock(),
    onReplace: mock(),
  });

  test("renders correctly for collection", () => {
    const props = getProps("collection");
    render(<ImportDuplicatePrompt {...props} />);
    
    expect(screen.getByText(/A collection named/)).toBeTruthy();
    expect(screen.getByText(/"My Item"/)).toBeTruthy();
    expect(screen.getByDisplayValue("My Item (Copy)")).toBeTruthy();
    expect(screen.getByText("Replace Existing")).toBeTruthy();
    expect(screen.getByText("Import Copy")).toBeTruthy();
  });

  test("renders correctly for environment", () => {
    const props = getProps("environment");
    render(<ImportDuplicatePrompt {...props} />);
    
    expect(screen.getByText(/A environment named/)).toBeTruthy();
    expect(screen.getByText(/"My Item"/)).toBeTruthy();
    expect(screen.queryByText("Replace Existing")).toBeNull();
  });

  test("calls onChange when input changes", () => {
    const props = getProps();
    render(<ImportDuplicatePrompt {...props} />);
    
    const input = screen.getByDisplayValue("My Item (Copy)");
    fireEvent.change(input, { target: { value: "New Name" } });
    
    expect(props.onChange).toHaveBeenCalledWith({
      ...props.duplicateItem,
      proposedName: "New Name"
    });
  });

  test("calls onImportCopy on Enter in input", () => {
    const props = getProps();
    render(<ImportDuplicatePrompt {...props} />);
    
    const input = screen.getByDisplayValue("My Item (Copy)");
    fireEvent.keyDown(input, { key: "Enter" });
    
    expect(props.onImportCopy).toHaveBeenCalled();
  });

  test("calls onCancel when Cancel clicked", () => {
    const props = getProps();
    render(<ImportDuplicatePrompt {...props} />);
    
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onCancel).toHaveBeenCalled();
  });

  test("calls onReplace when Replace Existing clicked", () => {
    const props = getProps();
    render(<ImportDuplicatePrompt {...props} />);
    
    fireEvent.click(screen.getByText("Replace Existing"));
    expect(props.onReplace).toHaveBeenCalled();
  });

  test("calls onImportCopy when Import Copy clicked", () => {
    const props = getProps();
    render(<ImportDuplicatePrompt {...props} />);
    
    fireEvent.click(screen.getByText("Import Copy"));
    expect(props.onImportCopy).toHaveBeenCalled();
  });
});
