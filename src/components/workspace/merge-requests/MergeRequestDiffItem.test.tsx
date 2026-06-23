import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { MergeRequestDiffItem } from "./MergeRequestDiffItem";

describe("MergeRequestDiffItem", () => {
  const baseItem = {
    id: "item1",
    diffType: "added" as const,
    diffSymbol: "+",
    diffColor: "#00ffaa",
    name: "Test Request",
    type: "request" as const,
    method: "GET",
    url: "https://api.example.com",
  };

  test("renders request name and method badge", () => {
    render(<MergeRequestDiffItem item={baseItem} />);
    expect(screen.getByText("Test Request")).toBeTruthy();
    expect(screen.getByText("GET")).toBeTruthy();
    expect(screen.queryByText("FOLDER")).toBeNull();
  });

  test("renders folder badge for folder item", () => {
    const folderItem = {
      ...baseItem,
      type: "folder" as const,
      name: "Test Folder",
    };
    render(<MergeRequestDiffItem item={folderItem} />);
    expect(screen.getByText("Test Folder")).toBeTruthy();
    expect(screen.getByText("FOLDER")).toBeTruthy();
    expect(screen.queryByText("GET")).toBeNull();
  });

  test("renders untitled fallback name", () => {
    const untitledItem = { ...baseItem, name: "" };
    render(<MergeRequestDiffItem item={untitledItem} />);
    expect(screen.getByText("https://api.example.com")).toBeTruthy();
  });

  test("does not expand on click when not modified", () => {
    const { container } = render(<MergeRequestDiffItem item={baseItem} />);
    const header = container.firstChild?.firstChild as HTMLElement;
    fireEvent.click(header);
    expect(screen.queryByText("OLD VALUE")).toBeNull();
  });

  test("toggles expanded state and renders changed keys on click when modified", () => {
    const modifiedItem = {
      ...baseItem,
      diffType: "modified" as const,
      diffSymbol: "~",
      diffColor: "#ffaa00",
      changedKeys: ["url"],
      originalItem: {
        url: "https://old.example.com",
      },
      url: "https://new.example.com",
    };

    const { container } = render(<MergeRequestDiffItem item={modifiedItem} />);
    expect(screen.getByText("url")).toBeTruthy();

    const header = container.firstChild?.firstChild as HTMLElement;

    // Expand
    fireEvent.click(header);
    expect(screen.getByText("OLD VALUE")).toBeTruthy();
    expect(screen.getByText("NEW VALUE")).toBeTruthy();
    expect(screen.getByText("https://old.example.com")).toBeTruthy();
    expect(screen.getByText("https://new.example.com")).toBeTruthy();

    // Collapse
    fireEvent.click(header);
    expect(screen.queryByText("OLD VALUE")).toBeNull();
  });

  test("renders TableDiffView for array changes when expanded", () => {
    const modifiedItem = {
      ...baseItem,
      diffType: "modified" as const,
      diffSymbol: "~",
      diffColor: "#ffaa00",
      changedKeys: ["headers"],
      originalItem: {
        headers: [
          {
            id: "h1",
            key: "Content-Type",
            value: "application/json",
            enabled: true,
          },
        ],
      },
      headers: [
        {
          id: "h1",
          key: "Content-Type",
          value: "application/xml",
          enabled: true,
        },
      ],
    };

    const { container } = render(<MergeRequestDiffItem item={modifiedItem} />);
    const header = container.firstChild?.firstChild as HTMLElement;

    fireEvent.click(header);
    expect(screen.getByText("Content-Type")).toBeTruthy();
    expect(screen.getByText("application/json")).toBeTruthy();
    expect(screen.getByText("application/xml")).toBeTruthy();
  });
});
