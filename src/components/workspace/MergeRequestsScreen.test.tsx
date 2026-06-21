import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { MergeRequestsScreen } from "./MergeRequestsScreen";

const mockGet = mock();
const mockPatch = mock();
const mockDelete = mock();

mock.module("@/lib/api", () => ({
  api: {
    get: mockGet,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

const mockUpdateCollection = mock();

mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    activeWorkspaceId: "ws1",
    collections: [{ id: "col1", name: "Target Col" }],
    workspaces: [{ id: "ws1", name: "Workspace 1", ownerId: "u1" }],
    updateCollection: mockUpdateCollection,
  }),
}));

mock.module("@/lib/session", () => ({
  useStoredUser: () => ({ id: "u1" }),
}));

// Real sub-components are used

describe("MergeRequestsScreen", () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPatch.mockClear();
    mockDelete.mockClear();
    mockUpdateCollection.mockClear();
    // Default mock implementation
    mockGet.mockImplementation(async (url: string) => {
      if (url.includes("/workspace/ws1")) {
        return {
          data: [
            {
              id: "mr1",
              title: "MR 1",
              status: "OPEN",
              targetWorkspaceId: "ws1",
              targetCollectionId: "col1",
              authorId: "u2",
            },
          ],
        };
      }
      if (url.includes("source-collection")) {
        return {
          data: {
            id: "source1",
            name: "Source Col API",
            items: [],
            variables: [],
          },
        };
      }
      if (url.includes("target-collection")) {
        return {
          data: {
            id: "col1",
            name: "Target Col API",
            items: [],
            variables: [],
          },
        };
      }
      throw new Error("Not found");
    });
  });

  test("fetches MRs on mount", async () => {
    render(<MergeRequestsScreen />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/merge-requests/workspace/ws1");
      expect(screen.getByText("MR 1")).toBeTruthy();
    });
  });

  test("selects MR and fetches collections", async () => {
    render(<MergeRequestsScreen />);

    await waitFor(() => expect(screen.getByText("MR 1")).toBeTruthy());

    fireEvent.click(screen.getByText("MR 1"));

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        "/merge-requests/mr1/source-collection",
      );
      expect(mockGet).toHaveBeenCalledWith(
        "/merge-requests/mr1/target-collection",
      );
      expect(screen.getByText("Changes to be merged")).toBeTruthy();
    });
  });

  test("handles fetch collection error", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url.includes("/workspace/ws1")) {
        return {
          data: [
            {
              id: "mr1",
              title: "MR 1",
              status: "OPEN",
              targetWorkspaceId: "ws1",
              targetCollectionId: "col1",
              authorId: "u2",
            },
          ],
        };
      }
      throw new Error("API failed");
    });

    render(<MergeRequestsScreen />);

    await waitFor(() => expect(screen.getByText("MR 1")).toBeTruthy());
    fireEvent.click(screen.getByText("MR 1"));

    await waitFor(() => {
      expect(screen.getByText(/Could not load changes/)).toBeTruthy();
    });
  });

  test("merges MR successfully", async () => {
    mockPatch.mockResolvedValueOnce({});

    render(<MergeRequestsScreen />);

    await waitFor(() => expect(screen.getByText("MR 1")).toBeTruthy());
    fireEvent.click(screen.getByText("MR 1"));

    await waitFor(() =>
      expect(screen.getByText("Approve & Merge")).toBeTruthy(),
    );

    fireEvent.click(screen.getByText("Approve & Merge"));

    await waitFor(() => {
      expect(mockUpdateCollection).toHaveBeenCalledWith(
        "col1",
        expect.any(Object),
      );
      expect(mockPatch).toHaveBeenCalledWith("/merge-requests/mr1/status", {
        status: "MERGED",
      });
    });
  });

  test("handles merge error", async () => {
    mockPatch.mockRejectedValueOnce(new Error("Merge error"));

    render(<MergeRequestsScreen />);

    await waitFor(() => expect(screen.getByText("MR 1")).toBeTruthy());
    fireEvent.click(screen.getByText("MR 1"));

    await waitFor(() =>
      expect(screen.getByText("Approve & Merge")).toBeTruthy(),
    );

    fireEvent.click(screen.getByText("Approve & Merge"));

    await waitFor(() => {
      expect(
        screen.getByText("Merge failed! Check console for details."),
      ).toBeTruthy();
    });
  });

  test("rejects MR successfully", async () => {
    mockPatch.mockResolvedValueOnce({});

    render(<MergeRequestsScreen />);

    await waitFor(() => expect(screen.getByText("MR 1")).toBeTruthy());
    fireEvent.click(screen.getByText("MR 1"));

    await waitFor(() => expect(screen.getByText("Reject")).toBeTruthy());

    fireEvent.click(screen.getByText("Reject"));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith("/merge-requests/mr1/status", {
        status: "REJECTED",
      });
    });
  });

  test("handles reject error", async () => {
    mockPatch.mockRejectedValueOnce(new Error("Reject error"));

    render(<MergeRequestsScreen />);

    await waitFor(() => expect(screen.getByText("MR 1")).toBeTruthy());
    fireEvent.click(screen.getByText("MR 1"));

    await waitFor(() => expect(screen.getByText("Reject")).toBeTruthy());

    fireEvent.click(screen.getByText("Reject"));

    await waitFor(() => {
      expect(screen.getByText("Failed to reject merge request.")).toBeTruthy();
    });
  });

  test("deletes MR successfully", async () => {
    mockDelete.mockResolvedValueOnce({});

    // override confirm
    const originalConfirm = global.confirm;
    global.confirm = () => true;

    render(<MergeRequestsScreen />);

    await waitFor(() => expect(screen.getByText("MR 1")).toBeTruthy());
    fireEvent.click(screen.getByText("MR 1"));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("/merge-requests/mr1");
    });

    global.confirm = originalConfirm;
  });

  test("does not delete if confirm is false", async () => {
    const originalConfirm = global.confirm;
    global.confirm = () => false;

    render(<MergeRequestsScreen />);

    await waitFor(() => expect(screen.getByText("MR 1")).toBeTruthy());
    fireEvent.click(screen.getByText("MR 1"));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockDelete).not.toHaveBeenCalled();
    });

    global.confirm = originalConfirm;
  });

  test("handles delete error", async () => {
    mockDelete.mockRejectedValueOnce(new Error("Delete error"));
    const originalConfirm = global.confirm;
    global.confirm = () => true;

    render(<MergeRequestsScreen />);

    await waitFor(() => expect(screen.getByText("MR 1")).toBeTruthy());
    fireEvent.click(screen.getByText("MR 1"));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.getByText("Delete error")).toBeTruthy();
    });

    global.confirm = originalConfirm;
  });

  test("handles fetchMrs error", async () => {
    // Override default mock to throw error on fetchMrs
    mockGet.mockImplementationOnce(() => {
      throw new Error("Failed to fetch MRs");
    });

    render(<MergeRequestsScreen />);

    await waitFor(() => {
      // It catches error in fetchMrs and logs it, should not break rendering
      expect(mockGet).toHaveBeenCalledWith("/merge-requests/workspace/ws1");
    });
  });
});
