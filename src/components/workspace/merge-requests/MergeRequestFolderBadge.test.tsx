import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { MergeRequestFolderBadge } from "./MergeRequestFolderBadge";

describe("MergeRequestFolderBadge", () => {
  test("renders FOLDER badge text", () => {
    render(<MergeRequestFolderBadge />);
    expect(screen.getByText("FOLDER")).toBeTruthy();
  });
});
