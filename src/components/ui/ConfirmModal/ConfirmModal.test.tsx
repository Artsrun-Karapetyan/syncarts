import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmModal } from "./ConfirmModal";
import React from "react";

describe("ConfirmModal", () => {
  test("does not render when isOpen is false", () => {
    render(<ConfirmModal isOpen={false} title="Test" message="msg" onConfirm={mock()} onCancel={mock()} />);
    expect(screen.queryByText("Test")).toBeNull();
  });

  test("renders when isOpen is true", () => {
    render(<ConfirmModal isOpen={true} title="My Title" message="My Message" onConfirm={mock()} onCancel={mock()} />);
    expect(screen.getByText("My Title")).toBeTruthy();
    expect(screen.getByText("My Message")).toBeTruthy();
  });

  test("calls onConfirm when confirm button clicked", () => {
    const onConfirm = mock();
    render(<ConfirmModal isOpen={true} title="T" message="M" onConfirm={onConfirm} onCancel={mock()} confirmText="Yes" />);
    fireEvent.click(screen.getByText("Yes"));
    expect(onConfirm).toHaveBeenCalled();
  });

  test("calls onCancel when cancel button clicked", () => {
    const onCancel = mock();
    render(<ConfirmModal isOpen={true} title="T" message="M" onConfirm={mock()} onCancel={onCancel} cancelText="No" />);
    fireEvent.click(screen.getByText("No"));
    expect(onCancel).toHaveBeenCalled();
  });



  test("handles Escape and Enter keys", () => {
    const onCancel = mock();
    const onConfirm = mock();
    render(<ConfirmModal isOpen={true} title="T" message="M" onConfirm={onConfirm} onCancel={onCancel} />);
    
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onConfirm).toHaveBeenCalled();
  });

  test("does not handle keys when closed", () => {
    const onCancel = mock();
    const onConfirm = mock();
    render(<ConfirmModal isOpen={false} title="T" message="M" onConfirm={onConfirm} onCancel={onCancel} />);
    
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
