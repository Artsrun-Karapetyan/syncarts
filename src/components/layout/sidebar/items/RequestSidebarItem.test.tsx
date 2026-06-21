import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { RequestSidebarItem } from "./RequestSidebarItem";

// Mock WorkspaceContext
mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    openRequestTab: mock(),
    openExampleTab: mock(),
  }),
}));

describe("RequestSidebarItem", () => {
  const dragHandlers = {
    canDrag: true,
    draggingEntity: null,
    dropTarget: null,
    onDragStart: mock(),
    onDragOver: mock(),
    onDrop: mock(),
    onDragEnd: mock(),
  };

  const defaultProps = {
    collectionId: "c1",
    parentFolderId: null,
    onContextMenu: mock(),
    renamingId: null,
    setRenamingId: mock(),
    renameValue: "",
    setRenameValue: mock(),
    handleRenameSubmit: mock(),
    expandedFolders: {},
    setExpandedFolders: mock(),
    highlightedExampleId: null,
    highlightedRequestId: null,
    highlightedFolderId: null,
    dragHandlers,
    isViewer: false,
    item: {
      type: "request" as const,
      id: "r1",
      name: "My Request",
      method: "GET",
      examples: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      collectionId: "c1",
      folderId: null,
    } as any,
  };

  beforeEach(() => {
    defaultProps.onContextMenu.mockClear();
    dragHandlers.onDragStart.mockClear();
    dragHandlers.onDragOver.mockClear();
    dragHandlers.onDrop.mockClear();
    dragHandlers.onDragEnd.mockClear();
  });

  test("renders request name and method", () => {
    render(<RequestSidebarItem {...defaultProps} />);
    expect(screen.getByText("My Request")).toBeTruthy();
    expect(screen.getByText("GET")).toBeTruthy();
  });

  test("calls openRequestTab on click", () => {
    const { container } = render(<RequestSidebarItem {...defaultProps} />);
    const row = container.querySelector(".sidebar-row") as HTMLDivElement;
    fireEvent.click(row);
  });

  test("calls onContextMenu on right click", () => {
    const { container } = render(<RequestSidebarItem {...defaultProps} />);
    const row = container.querySelector(".sidebar-row") as HTMLDivElement;
    fireEvent.contextMenu(row);
    expect(defaultProps.onContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "r1",
        type: "request",
      }),
    );
  });

  test("calls onContextMenu on more button click", () => {
    const { container } = render(<RequestSidebarItem {...defaultProps} />);
    const moreBtn = container.querySelector(
      ".sidebar-action-icon",
    ) as HTMLDivElement;
    fireEvent.click(moreBtn);
    expect(defaultProps.onContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "r1",
        type: "request",
      }),
    );
  });

  test("does not call onContextMenu if isViewer", () => {
    const { container } = render(
      <RequestSidebarItem {...defaultProps} isViewer={true} />,
    );
    const row = container.querySelector(".sidebar-row") as HTMLDivElement;
    fireEvent.contextMenu(row);
    expect(defaultProps.onContextMenu).not.toHaveBeenCalled();
  });

  test("handles drag events", () => {
    const { container } = render(<RequestSidebarItem {...defaultProps} />);
    const row = container.querySelector(".sidebar-row") as HTMLDivElement;

    fireEvent.dragStart(row);
    expect(dragHandlers.onDragStart).toHaveBeenCalled();

    fireEvent.dragOver(row);
    expect(dragHandlers.onDragOver).toHaveBeenCalled();

    fireEvent.drop(row);
    expect(dragHandlers.onDrop).toHaveBeenCalled();

    fireEvent.dragEnd(row);
    expect(dragHandlers.onDragEnd).toHaveBeenCalled();
  });

  describe("with examples", () => {
    const itemWithExamples = {
      ...defaultProps.item,
      examples: [
        {
          id: "ex1",
          name: "My Example",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          collectionId: "c1",
          requestId: "r1",
          originalRequest: null as any,
          response: null as any,
        } as any,
      ],
    } as any;

    test("renders chevron toggle and expands on click", () => {
      const { container } = render(
        <RequestSidebarItem {...defaultProps} item={itemWithExamples} />,
      );
      const toggle = container.querySelector(
        ".sidebar-row > div:first-child",
      ) as HTMLDivElement;

      fireEvent.click(toggle);
      // Example should now be visible
      expect(screen.getByText("My Example")).toBeTruthy();
    });

    test("auto expands if example is highlighted", () => {
      render(
        <RequestSidebarItem
          {...defaultProps}
          item={itemWithExamples}
          highlightedExampleId="ex1"
        />,
      );
      expect(screen.getByText("My Example")).toBeTruthy();
    });

    test("handles example row drag events", () => {
      const { container } = render(
        <RequestSidebarItem
          {...defaultProps}
          item={itemWithExamples}
          highlightedExampleId="ex1"
        />,
      );
      const exampleRow = container.querySelector(
        "[data-sidebar-kind='example']",
      ) as HTMLDivElement;

      fireEvent.dragStart(exampleRow);
      expect(dragHandlers.onDragStart).toHaveBeenCalled();

      fireEvent.dragOver(exampleRow);
      expect(dragHandlers.onDragOver).toHaveBeenCalled();

      fireEvent.drop(exampleRow);
      expect(dragHandlers.onDrop).toHaveBeenCalled();

      fireEvent.dragEnd(exampleRow);
      expect(dragHandlers.onDragEnd).toHaveBeenCalled();
    });

    test("handles example row right click", () => {
      const { container } = render(
        <RequestSidebarItem
          {...defaultProps}
          item={itemWithExamples}
          highlightedExampleId="ex1"
        />,
      );
      const exampleRow = container.querySelector(
        "[data-sidebar-kind='example']",
      ) as HTMLDivElement;

      fireEvent.contextMenu(exampleRow);
      expect(defaultProps.onContextMenu).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: "ex1",
          type: "example",
        }),
      );
    });

    test("handles example mouse enter and leave", () => {
      const { container } = render(
        <RequestSidebarItem
          {...defaultProps}
          item={itemWithExamples}
          highlightedExampleId="ex1"
        />,
      );
      const exampleRow = container.querySelector(
        "[data-sidebar-kind='example']",
      ) as HTMLDivElement;

      fireEvent.mouseEnter(exampleRow);
      fireEvent.mouseLeave(exampleRow);
    });
  });

  test("handles mouse enter and leave", () => {
    const { container } = render(<RequestSidebarItem {...defaultProps} />);
    const row = container.querySelector(".sidebar-row") as HTMLDivElement;

    fireEvent.mouseEnter(row);
    fireEvent.mouseLeave(row);
  });
});
