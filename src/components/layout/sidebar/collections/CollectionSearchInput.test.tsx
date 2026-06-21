import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { CollectionSearchInput } from "./CollectionSearchInput";

describe("CollectionSearchInput", () => {
  test("renders input with correct placeholder and value", () => {
    const onChange = mock();
    render(<CollectionSearchInput value="test query" onChange={onChange} />);

    const input = screen.getByPlaceholderText(
      "Search collections & items...",
    ) as HTMLInputElement;
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
