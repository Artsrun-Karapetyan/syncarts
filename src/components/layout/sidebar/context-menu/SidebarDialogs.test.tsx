import { describe, expect, test, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { SidebarDialogs } from "./SidebarDialogs";
import React from "react";

// Mock subcomponents
mock.module("@/components/workspace/ImportModal", () => ({
  ImportModal: (props: any) => props.isOpen ? <div data-testid="import-modal">Import</div> : null,
}));

mock.module("@/components/ui/ConfirmModal/ConfirmModal", () => ({
  ConfirmModal: (props: any) => props.isOpen ? <div data-testid="confirm-modal">{props.title}</div> : null,
}));

mock.module("@/components/workspace/CreateMergeRequestModal", () => ({
  CreateMergeRequestModal: (props: any) => props.isOpen ? <div data-testid="merge-modal">Merge</div> : null,
}));

mock.module("@/components/layout/sidebar/SidebarToast", () => ({
  SidebarToast: (props: any) => <div data-testid="toast">{props.message}</div>,
}));

describe("SidebarDialogs", () => {
  const defaultProps = {
    isImportModalOpen: false,
    deleteTarget: null as any,
    mergeRequestTarget: null as any,
    toastMessage: null,
    onCloseImport: mock(),
    onCancelDelete: mock(),
    onConfirmDelete: mock(),
    onCloseMergeRequest: mock(),
    onMergeRequestSuccess: mock(),
  };

  test("renders nothing when all closed", () => {
    const { container } = render(<SidebarDialogs {...defaultProps} />);
    expect(container.innerHTML).toBe("");
  });

  test("renders ImportModal when open", () => {
    render(<SidebarDialogs {...defaultProps} isImportModalOpen={true} />);
    expect(screen.getByTestId("import-modal")).toBeTruthy();
  });

  test("renders ConfirmModal with correct title for collection", () => {
    render(<SidebarDialogs {...defaultProps} deleteTarget={{ type: "collection", id: "1" }} />);
    expect(screen.getByTestId("confirm-modal")).toBeTruthy();
    expect(screen.getByText("Delete Collection")).toBeTruthy();
  });

  test("renders ConfirmModal with correct title for example", () => {
    render(<SidebarDialogs {...defaultProps} deleteTarget={{ type: "example", id: "1", collectionId: "1", requestId: "1" }} />);
    expect(screen.getByTestId("confirm-modal")).toBeTruthy();
    expect(screen.getByText("Delete Example")).toBeTruthy();
  });

  test("renders ConfirmModal with correct title for item", () => {
    render(<SidebarDialogs {...defaultProps} deleteTarget={{ type: "item", id: "1", collectionId: "1" }} />);
    expect(screen.getByTestId("confirm-modal")).toBeTruthy();
    expect(screen.getByText("Delete Item")).toBeTruthy();
  });

  test("renders CreateMergeRequestModal when open", () => {
    render(
      <SidebarDialogs
        {...defaultProps}
        mergeRequestTarget={{ sourceCollectionId: "1", targetWorkspaceId: "2", targetCollectionId: "3" }}
      />
    );
    expect(screen.getByTestId("merge-modal")).toBeTruthy();
  });

  test("renders Toast when message exists", () => {
    render(<SidebarDialogs {...defaultProps} toastMessage="Success!" />);
    expect(screen.getByTestId("toast")).toBeTruthy();
    expect(screen.getByText("Success!")).toBeTruthy();
  });
});
