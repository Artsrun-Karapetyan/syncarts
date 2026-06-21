import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { CollectionSearchInput } from "./CollectionSearchInput";
import React from "react";

describe("CollectionSearchInput", () => {
  test("renders input with correct placeholder and value", () => {
    const onChange = mock();
    render(<CollectionSearchInput value="test query" onChange={onChange} />);
    
    const input = screen.getByPlaceholderText("Search collections & items...") as HTMLInputElement;
    expect(input.value).toBe("test query");
  });

  test("calls onChange when input value changes", () => {
    const onChange = mock();
    render(<CollectionSearchInput value="" onChange={onChange} />);
    
    const input = screen.getByPlaceholderText("Search collections & items...");
    fireEvent.change(input, { target: { value: "new value" } });
    
    expect(onChange).toHaveBeenCalledWith("new value");
  });
});
