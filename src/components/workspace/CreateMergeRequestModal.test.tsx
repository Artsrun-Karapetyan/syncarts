import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { CreateMergeRequestModal } from "./CreateMergeRequestModal";

const mockGet = mock();
const mockPost = mock();

mock.module("@/lib/api", () => ({
  api: {
    get: mockGet,
    post: mockPost,
  },
}));

mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    collections: [{ id: "col1", name: "Source Col" }],
    activeWorkspaceId: "ws1",
  }),
}));

describe("CreateMergeRequestModal", () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPost.mockClear();
  });

  const getProps = () => ({
    isOpen: true,
    onClose: mock(),
    sourceCollectionId: "col1",
    targetWorkspaceId: "ws2",
    targetCollectionId: "tcol2",
    onSuccess: mock(),
  });

  test("does not render when closed", () => {
    render(<CreateMergeRequestModal {...getProps()} isOpen={false} />);
    expect(screen.queryByText("Create Merge Request")).toBeNull();
  });

  test("renders correctly when open", () => {
    render(<CreateMergeRequestModal {...getProps()} />);
    expect(screen.getAllByText("Create Merge Request")).toBeTruthy();
  });

  test("disables submit button initially", () => {
    render(<CreateMergeRequestModal {...getProps()} />);
    const btn = screen.getByRole("button", {
      name: "Create Merge Request",
    }) as HTMLButtonElement;
    expect(btn.disabled).toBeTrue();
  });

  test("enables submit when title is provided", () => {
    render(<CreateMergeRequestModal {...getProps()} />);
    fireEvent.change(
      screen.getByPlaceholderText("e.g. Added new user endpoints"),
      { target: { value: "My MR" } },
    );
    const btn = screen.getByRole("button", {
      name: "Create Merge Request",
    }) as HTMLButtonElement;
    expect(btn.disabled).toBeFalse();
  });

  test("calls onClose when X is clicked", () => {
    const props = getProps();
    render(<CreateMergeRequestModal {...props} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onClose).toHaveBeenCalled();
  });

  test("submits successfully", async () => {
    const props = getProps();
    mockGet.mockResolvedValueOnce({
      data: { data: { collections: [{ id: "tcol2", name: "Target Col" }] } },
    });
    mockPost.mockResolvedValueOnce({});

    render(<CreateMergeRequestModal {...props} />);

    fireEvent.change(
      screen.getByPlaceholderText("e.g. Added new user endpoints"),
      { target: { value: "My MR" } },
    );
    fireEvent.change(screen.getByPlaceholderText("Describe what changed..."), {
      target: { value: "Desc" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create Merge Request" }),
    );

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/workspaces/ws2");
      expect(mockPost).toHaveBeenCalledWith("/merge-requests", {
        title: "My MR",
        description: "Desc",
        sourceCollectionId: "col1",
        targetWorkspaceId: "ws2",
        targetCollectionId: "tcol2",
        sourceWorkspaceId: "ws1",
        data: { id: "col1", name: "Source Col" },
        targetData: { id: "tcol2", name: "Target Col" },
      });
      expect(props.onSuccess).toHaveBeenCalled();
      expect(props.onClose).toHaveBeenCalled();
    });
  });

  test("handles submission when target collection not found locally via API fallback", async () => {
    const props = getProps();
    mockGet.mockRejectedValueOnce(new Error("API Error"));
    mockPost.mockResolvedValueOnce({});

    render(<CreateMergeRequestModal {...props} />);

    fireEvent.change(
      screen.getByPlaceholderText("e.g. Added new user endpoints"),
      { target: { value: "My MR" } },
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Create Merge Request" }),
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/merge-requests",
        expect.objectContaining({
          targetData: undefined,
        }),
      );
      expect(props.onSuccess).toHaveBeenCalled();
    });
  });

  test("handles submission error", async () => {
    const props = getProps();
    mockGet.mockResolvedValueOnce({ data: { data: { collections: [] } } });
    mockPost.mockRejectedValueOnce({
      response: { data: { message: "MR failed" } },
    });

    render(<CreateMergeRequestModal {...props} />);

    fireEvent.change(
      screen.getByPlaceholderText("e.g. Added new user endpoints"),
      { target: { value: "My MR" } },
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Create Merge Request" }),
    );

    await waitFor(() => {
      expect(screen.getByText("MR failed")).toBeTruthy();
      expect(props.onSuccess).not.toHaveBeenCalled();
    });
  });

  test("shows generic error if no response message", async () => {
    const props = getProps();
    mockGet.mockResolvedValueOnce({ data: { data: { collections: [] } } });
    mockPost.mockRejectedValueOnce(new Error("Generic Network Error"));

    render(<CreateMergeRequestModal {...props} />);

    fireEvent.change(
      screen.getByPlaceholderText("e.g. Added new user endpoints"),
      { target: { value: "My MR" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Create Merge Request" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Generic Network Error")).toBeTruthy();
    });
  });

  test("shows error if source collection not found", async () => {
    const props = getProps();
    props.sourceCollectionId = "not-found";

    render(<CreateMergeRequestModal {...props} />);

    fireEvent.change(
      screen.getByPlaceholderText("e.g. Added new user endpoints"),
      { target: { value: "My MR" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Create Merge Request" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Source collection not found locally"),
      ).toBeTruthy();
    });
  });
});
