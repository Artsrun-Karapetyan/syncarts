import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { DynamicGlobalRow } from "./DynamicGlobalRow";

describe("DynamicGlobalRow", () => {
  test("renders key and description inside inputs", () => {
    const item = { key: "my-key", desc: "my-description" };
    render(<DynamicGlobalRow item={item} />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0].getAttribute("value")).toBe("my-key");
    expect(inputs[1].getAttribute("value")).toBe("my-description");

    expect((inputs[0] as HTMLInputElement).disabled).toBe(true);
    expect((inputs[1] as HTMLInputElement).disabled).toBe(true);
  });
});
