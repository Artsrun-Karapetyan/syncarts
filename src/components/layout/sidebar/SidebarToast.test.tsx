import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { SidebarToast } from "./SidebarToast";
import React from "react";

describe("SidebarToast", () => {
  test("renders message correctly", () => {
    render(<SidebarToast message="Workspace synchronized" />);
    expect(screen.getByText("Workspace synchronized")).toBeTruthy();
  });
});
