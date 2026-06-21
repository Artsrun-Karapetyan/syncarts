import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Select } from "./Select";
import React from "react";

describe("Select Component", () => {
  const options = [
    { value: "opt1", label: "Option 1" },
    { value: "opt2", label: "Option 2", badge: "New" },
  ];

  test("renders with selected option", () => {
    const onChange = mock();
    render(<Select value="opt1" options={options} onChange={onChange} />);
    
    expect(screen.getByText("Option 1")).toBeTruthy();
  });

  test("opens dropdown on click and displays all options", async () => {
    const onChange = mock();
    const { container } = render(<Select value="opt1" options={options} onChange={onChange} />);
    
    // Find the button (it has role="button")
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    
    // Check if dropdown items are rendered in the portal
    await waitFor(() => {
      // The options are rendered inside the portal. Both labels should be present.
      // Option 1 might appear twice (one in the button, one in the dropdown)
      const opt2 = screen.getByText("Option 2");
      expect(opt2).toBeTruthy();
    });
  });

  test("selects an option and closes dropdown", async () => {
    const onChange = mock();
    render(<Select value="opt1" options={options} onChange={onChange} />);
    
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    
    await waitFor(() => {
      expect(screen.getByText("Option 2")).toBeTruthy();
    });

    const opt2 = screen.getByText("Option 2");
    
    // In the dropdown it's inside a div, so we can just mouse down on it
    fireEvent.mouseDown(opt2);
    
    expect(onChange).toHaveBeenCalledWith("opt2");
    
    // Dropdown should be closed (Option 2 is no longer in the document if it's the dropdown one, 
    // wait, actually onChange is called and we don't re-render with new value here, but isOpen becomes false)
    expect(screen.queryByText("Option 2")).toBeNull();
  });

  test("does not open when disabled", () => {
    const onChange = mock();
    render(<Select value="opt1" options={options} onChange={onChange} disabled />);
    
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    
    expect(screen.queryByText("Option 2")).toBeNull(); // Dropdown not rendered
  });
});
