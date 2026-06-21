import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { TableDiffView } from "./TableDiffView";

describe("TableDiffView", () => {
  test("renders 'No changes' when both lists are empty", () => {
    render(<TableDiffView oldItems={[]} newItems={[]} />);
    expect(screen.getByText("No changes in this table.")).toBeTruthy();
  });

  test("renders 'No changes' when items are unchanged", () => {
    const oldItems = [{ id: "1", key: "foo", value: "bar", enabled: true }];
    const newItems = [{ id: "1", key: "foo", value: "bar", enabled: true }];
    render(<TableDiffView oldItems={oldItems} newItems={newItems} />);
    expect(screen.getByText("No changes in this table.")).toBeTruthy();
  });

  test("renders added items", () => {
    const newItems = [{ id: "1", key: "foo", value: "bar", enabled: true }];
    render(<TableDiffView oldItems={[]} newItems={newItems} />);
    expect(screen.getByText("+")).toBeTruthy();
    expect(screen.getByText("foo")).toBeTruthy();
    expect(screen.getByText("bar")).toBeTruthy();
  });

  test("renders removed items", () => {
    const oldItems = [{ id: "1", key: "foo", value: "bar", enabled: true }];
    render(<TableDiffView oldItems={oldItems} newItems={[]} />);
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
    expect(screen.getByText("foo")).toBeTruthy();
    expect(screen.getByText("bar")).toBeTruthy();
  });

  test("renders modified value items", () => {
    const oldItems = [{ id: "1", key: "foo", value: "old", enabled: true }];
    const newItems = [{ id: "1", key: "foo", value: "new", enabled: true }];
    render(<TableDiffView oldItems={oldItems} newItems={newItems} />);
    expect(screen.getByText("~")).toBeTruthy();
    expect(screen.getByText("foo")).toBeTruthy();
    expect(screen.getByText("old")).toBeTruthy();
    expect(screen.getByText("new")).toBeTruthy();
  });

  test("renders modified key items", () => {
    const oldItems = [{ id: "1", key: "old-key", value: "val", enabled: true }];
    const newItems = [{ id: "1", key: "new-key", value: "val", enabled: true }];
    render(<TableDiffView oldItems={oldItems} newItems={newItems} />);
    expect(screen.getByText("~")).toBeTruthy();
    expect(screen.getByText("new-key")).toBeTruthy();
  });

  test("renders modified enabled items and handles disabled state", () => {
    const oldItems = [{ id: "1", key: "foo", value: "val", enabled: true }];
    const newItems = [{ id: "1", key: "foo", value: "val", enabled: false }];
    render(<TableDiffView oldItems={oldItems} newItems={newItems} />);
    expect(screen.getByText("~")).toBeTruthy();
    expect(screen.getByText("DISABLED")).toBeTruthy();
  });

  test("handles missing key by falling back to empty display", () => {
    const oldItems = [{ id: "1", value: "val", enabled: true }];
    const newItems = [{ id: "1", value: "val2", enabled: true }];
    render(<TableDiffView oldItems={oldItems} newItems={newItems} />);
    expect(screen.getByText("Empty")).toBeTruthy();
  });

  test("matches by item key if id is absent", () => {
    const oldItems = [{ key: "foo", value: "old", enabled: true }];
    const newItems = [{ key: "foo", value: "new", enabled: true }];
    render(<TableDiffView oldItems={oldItems} newItems={newItems} />);
    expect(screen.getByText("~")).toBeTruthy();
    expect(screen.getByText("old")).toBeTruthy();
    expect(screen.getByText("new")).toBeTruthy();
  });
});
