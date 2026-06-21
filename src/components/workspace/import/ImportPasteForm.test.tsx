import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import React from "react";

import { ImportPasteForm } from "./ImportPasteForm";

describe("ImportPasteForm", () => {
  const dummyProps = {
    inputText: "",
    isProcessing: false,
    onChange: mock(),
    onSubmit: mock(),
  };

  test("renders label and placeholder", () => {
    render(<ImportPasteForm {...dummyProps} />);
    expect(screen.getByText("Paste cURL or Raw JSON")).toBeDefined();
    expect(screen.getByPlaceholderText(/Paste cURL command/)).toBeDefined();
  });

  test("triggers onSubmit when click submit button", () => {
    const onSubmit = mock();
    render(
      <ImportPasteForm
        {...dummyProps}
        inputText="curl val"
        onSubmit={onSubmit}
      />,
    );
    const button = screen.getByRole("button", { name: "Import Json" });
    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalled();
  });

  test("disables button during processing", () => {
    render(
      <ImportPasteForm
        {...dummyProps}
        isProcessing={true}
        inputText="curl val"
      />,
    );
    const button = screen.getByRole("button", { name: "Importing..." });
    expect(button.disabled).toBe(true);
  });
});
