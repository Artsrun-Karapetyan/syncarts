import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { SidebarToast } from "./SidebarToast";

describe("SidebarToast", () => {
  test("renders message correctly", () => {
    render(<SidebarToast message="Workspace synchronized" />);
    expect(screen.getByText("Workspace synchronized")).toBeTruthy();
  });
});
