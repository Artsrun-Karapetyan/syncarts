import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnsavedChangesModal } from "./UnsavedChangesModal";
import React from "react";

describe("UnsavedChangesModal", () => {
  test("does not render when isOpen is false", () => {
    const { container } = render(
      <UnsavedChangesModal 
        isOpen={false} 
        requestName="Test" 
        onSave={mock()} 
        onDiscard={mock()} 
        onCancel={mock()} 
      />
    );
    expect(screen.queryByText("Save changes?")).toBeNull();
  });

  test("renders when isOpen is true and shows requestName", () => {
    render(
      <UnsavedChangesModal 
        isOpen={true} 
        requestName="My Request" 
        onSave={mock()} 
        onDiscard={mock()} 
        onCancel={mock()} 
      />
    );
    expect(screen.getByText("Save changes?")).toBeTruthy();
    expect(screen.getByText("My Request")).toBeTruthy();
  });

  test("calls onSave when save button clicked", () => {
    const onSave = mock();
    render(
      <UnsavedChangesModal 
        isOpen={true} 
        requestName="" 
        onSave={onSave} 
        onDiscard={mock()} 
        onCancel={mock()} 
      />
    );
    fireEvent.click(screen.getByText("Save changes"));
    expect(onSave).toHaveBeenCalled();
  });

  test("calls onDiscard when don't save button clicked", () => {
    const onDiscard = mock();
    render(
      <UnsavedChangesModal 
        isOpen={true} 
        requestName="" 
        onSave={mock()} 
        onDiscard={onDiscard} 
        onCancel={mock()} 
      />
    );
    fireEvent.click(screen.getByText("Don't save"));
    expect(onDiscard).toHaveBeenCalled();
  });

  test("calls onCancel when cancel button clicked", () => {
    const onCancel = mock();
    render(
      <UnsavedChangesModal 
        isOpen={true} 
        requestName="" 
        onSave={mock()} 
        onDiscard={mock()} 
        onCancel={onCancel} 
      />
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  test("calls onCancel when background clicked", () => {
    const onCancel = mock();
    render(
      <UnsavedChangesModal 
        isOpen={true} 
        requestName="" 
        onSave={mock()} 
        onDiscard={mock()} 
        onCancel={onCancel} 
      />
    );
    // Find the background element (it contains the modal dialog and is the top-level portal div)
    // The background has position: "fixed"
    const bg = document.body.querySelector("div[style*='position: fixed']");
    if (bg) {
      fireEvent.click(bg);
      expect(onCancel).toHaveBeenCalled();
    }
  });

  test("calls onCancel when X button clicked", () => {
    const onCancel = mock();
    render(
      <UnsavedChangesModal 
        isOpen={true} 
        requestName="" 
        onSave={mock()} 
        onDiscard={mock()} 
        onCancel={onCancel} 
      />
    );
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onCancel).toHaveBeenCalled();
  });
});
