import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { CollectionName } from "./CollectionName";

describe("CollectionName", () => {
  const defaultCollection = {
    id: "col1",
    name: "Test Collection",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  };

  const defaultProps = {
    collection: defaultCollection,
    renamingId: null,
    renameValue: "",
    setRenameValue: mock(),
    handleRenameSubmit: mock(),
    setRenamingId: mock(),
  };

  beforeEach(() => {
    defaultProps.setRenameValue.mockClear();
    defaultProps.handleRenameSubmit.mockClear();
    defaultProps.setRenamingId.mockClear();
  });

  test("renders collection name correctly", () => {
    render(<CollectionName {...defaultProps} />);
    expect(screen.getByText("Test Collection")).toBeTruthy();
    expect(screen.queryByLabelText("Forked collection")).toBeNull();
  });

  test("renders fork icon if collection is a fork", () => {
    const forkedCollection = {
      ...defaultCollection,
      fork: {
        originalWorkspaceId: "ws1",
        originalCollectionId: "sc1",
        forkedAt: Date.now(),
      },
    };
    render(<CollectionName {...defaultProps} collection={forkedCollection} />);
    expect(screen.getByText("Test Collection")).toBeTruthy();
    expect(screen.getByLabelText("Forked collection")).toBeTruthy();
  });

  describe("when renaming", () => {
    const renamingProps = {
      ...defaultProps,
      renamingId: "col1",
      renameValue: "New Name",
    };

    test("renders input with rename value", () => {
      render(<CollectionName {...renamingProps} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("New Name");
    });

    test("calls setRenameValue on change", () => {
      render(<CollectionName {...renamingProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Changed" } });
      expect(renamingProps.setRenameValue).toHaveBeenCalledWith("Changed");
    });

    test("calls handleRenameSubmit on Enter", () => {
      render(<CollectionName {...renamingProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });
      expect(renamingProps.handleRenameSubmit).toHaveBeenCalled();
    });

    test("calls setRenamingId(null) on Escape", () => {
      render(<CollectionName {...renamingProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Escape" });
      expect(renamingProps.setRenamingId).toHaveBeenCalledWith(null);
    });

    test("does nothing on other keys", () => {
      render(<CollectionName {...renamingProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "A" });
      expect(renamingProps.handleRenameSubmit).not.toHaveBeenCalled();
      expect(renamingProps.setRenamingId).not.toHaveBeenCalled();
    });

    test("calls handleRenameSubmit on blur", () => {
      render(<CollectionName {...renamingProps} />);
      const input = screen.getByRole("textbox");
      fireEvent.blur(input);
      expect(renamingProps.handleRenameSubmit).toHaveBeenCalled();
    });

    test("stops propagation on click", () => {
      const onClickParent = mock();
      render(
        <div onClick={onClickParent}>
          <CollectionName {...renamingProps} />
        </div>,
      );
      const input = screen.getByRole("textbox");
      fireEvent.click(input);
      expect(onClickParent).not.toHaveBeenCalled();
    });
  });
});
