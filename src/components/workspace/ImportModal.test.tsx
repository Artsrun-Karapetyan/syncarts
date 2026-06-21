import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { ImportModal } from "./ImportModal";

const mockAddTab = mock();
const mockImportCollection = mock();
const mockUpdateCollection = mock();
const mockCreateEnvironment = mock();

mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    addTab: mockAddTab,
    importCollection: mockImportCollection,
    updateCollection: mockUpdateCollection,
    createEnvironment: mockCreateEnvironment,
    collections: [{ id: "col1", name: "Existing Collection" }],
    environments: [{ id: "env1", name: "Existing Environment" }],
  }),
}));

mock.module("@/utils/curlParser", () => ({
  parseCurlCommand: (curl: string) => {
    if (curl.includes("invalid")) return null;
    return { url: "http://example.com", method: "GET" };
  },
}));

mock.module("@/utils/postmanParser", () => ({
  importPostmanCollection: (json: string) => {
    return JSON.parse(json);
  },
  importOpenApiCollection: (json: string) => {
    return JSON.parse(json);
  },
  importPostmanEnvironment: (json: string) => {
    return JSON.parse(json);
  },
}));

// Real sub-components are used to avoid breaking their own tests in parallel runs.

describe("ImportModal", () => {
  beforeEach(() => {
    mockAddTab.mockClear();
    mockImportCollection.mockClear();
    mockUpdateCollection.mockClear();
    mockCreateEnvironment.mockClear();
  });

  const getProps = () => ({
    isOpen: true,
    onClose: mock(),
  });

  test("does not render when closed", () => {
    render(<ImportModal {...getProps()} isOpen={false} />);
    expect(screen.queryByText("Import")).toBeNull();
  });

  test("renders when open", () => {
    render(<ImportModal {...getProps()} />);
    expect(screen.getByText("Import")).toBeTruthy();
  });

  test("calls onClose when close clicked", () => {
    const props = getProps();
    render(<ImportModal {...props} />);
    // Click the X close button
    // It's the only button with lucide-react X, but we can query tooltip-trigger
    const closeBtn = screen.getByRole("button", { name: "" }); // tooltip "Close" not mapped to name implicitly if no aria-label, but we can just click the overlay
    fireEvent.click(closeBtn);
    expect(props.onClose).toHaveBeenCalled();
  });

  test("handles empty paste submit", () => {
    render(<ImportModal {...getProps()} />);
    expect(screen.getByText("Import Json").closest("button")?.disabled).toBe(
      true,
    );
  });

  test("processes valid cURL", async () => {
    const props = getProps();
    render(<ImportModal {...props} />);

    fireEvent.change(screen.getByPlaceholderText(/Paste cURL command/i), {
      target: { value: "curl http://example.com" },
    });
    fireEvent.click(screen.getByText("Import Json"));

    await waitFor(() => {
      expect(mockAddTab).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Imported cURL",
          url: "http://example.com",
        }),
      );
      expect(props.onClose).toHaveBeenCalled();
    });
  });

  test("processes invalid cURL", async () => {
    render(<ImportModal {...getProps()} />);

    fireEvent.change(screen.getByPlaceholderText(/Paste cURL command/i), {
      target: { value: "curl invalid" },
    });
    fireEvent.click(screen.getByText("Import Json"));

    await waitFor(() => {
      expect(screen.getByText(/Unrecognized format/)).toBeTruthy();
    });
  });

  test("processes valid environment", async () => {
    const props = getProps();
    render(<ImportModal {...props} />);

    const envJson = JSON.stringify({
      _postman_variable_scope: "environment",
      name: "New Env",
      variables: [],
    });
    fireEvent.change(screen.getByPlaceholderText(/Paste cURL command/i), {
      target: { value: envJson },
    });
    fireEvent.click(screen.getByText("Import Json"));

    await waitFor(() => {
      expect(mockCreateEnvironment).toHaveBeenCalledWith(
        "New Env",
        expect.any(Array),
      );
      expect(props.onClose).toHaveBeenCalled();
    });
  });

  test("prompts for duplicate environment", async () => {
    render(<ImportModal {...getProps()} />);

    const envJson = JSON.stringify({
      _postman_variable_scope: "environment",
      name: "Existing Environment",
      variables: [],
    });
    fireEvent.change(screen.getByPlaceholderText(/Paste cURL command/i), {
      target: { value: envJson },
    });
    fireEvent.click(screen.getByText("Import Json"));

    await waitFor(() => {
      expect(screen.getByText(/A environment named/)).toBeTruthy();
      expect(screen.getByText(/"Existing Environment"/)).toBeTruthy();
    });

    // Confirm copy
    fireEvent.click(screen.getByText("Import Copy"));
    expect(mockCreateEnvironment).toHaveBeenCalledWith(
      "Existing Environment (Copy)",
      expect.any(Array),
    );
  });

  test("processes valid collection (OpenAPI)", async () => {
    const props = getProps();
    render(<ImportModal {...props} />);

    const apiJson = JSON.stringify({
      openapi: "3.0.0",
      paths: {},
      name: "New Collection",
    });
    fireEvent.change(screen.getByPlaceholderText(/Paste cURL command/i), {
      target: { value: apiJson },
    });
    fireEvent.click(screen.getByText("Import Json"));

    await waitFor(() => {
      expect(mockImportCollection).toHaveBeenCalledWith(
        expect.objectContaining({ name: "New Collection" }),
      );
      expect(props.onClose).toHaveBeenCalled();
    });
  });

  test("prompts for duplicate collection and can replace", async () => {
    const props = getProps();
    render(<ImportModal {...props} />);

    const apiJson = JSON.stringify({
      openapi: "3.0.0",
      paths: {},
      name: "Existing Collection",
    });
    fireEvent.change(screen.getByPlaceholderText(/Paste cURL command/i), {
      target: { value: apiJson },
    });
    fireEvent.click(screen.getByText("Import Json"));

    await waitFor(() => {
      expect(screen.getByText(/A collection named/)).toBeTruthy();
    });

    // Replace
    fireEvent.click(screen.getByText("Replace Existing"));
    expect(mockUpdateCollection).toHaveBeenCalledWith(
      "col1",
      expect.objectContaining({ name: "Existing Collection" }),
    );
    expect(props.onClose).toHaveBeenCalled();
  });

  test("processes valid collection (Postman)", async () => {
    const props = getProps();
    render(<ImportModal {...props} />);

    const pmJson = JSON.stringify({
      info: { name: "New PM Col" },
      name: "New PM Col",
    });
    fireEvent.change(screen.getByPlaceholderText(/Paste cURL command/i), {
      target: { value: pmJson },
    });
    fireEvent.click(screen.getByText("Import Json"));

    await waitFor(() => {
      expect(mockImportCollection).toHaveBeenCalledWith(
        expect.objectContaining({ name: "New PM Col" }),
      );
      expect(props.onClose).toHaveBeenCalled();
    });
  });

  test("prompts duplicate collection and copies", async () => {
    const props = getProps();
    render(<ImportModal {...props} />);

    const pmJson = JSON.stringify({
      info: { name: "Existing Collection" },
      name: "Existing Collection",
    });
    fireEvent.change(screen.getByPlaceholderText(/Paste cURL command/i), {
      target: { value: pmJson },
    });
    fireEvent.click(screen.getByText("Import Json"));

    await waitFor(() => {
      expect(screen.getByText(/A collection named/)).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Import Copy"));
    expect(mockImportCollection).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Existing Collection (Copy)" }),
    );
    expect(props.onClose).toHaveBeenCalled();
  });

  test("shows error on unparseable json", async () => {
    render(<ImportModal {...getProps()} />);

    fireEvent.change(screen.getByPlaceholderText(/Paste cURL command/i), {
      target: { value: "{ invalid json" },
    });
    fireEvent.click(screen.getByText("Import Json"));

    await waitFor(() => {
      expect(screen.getByTestId("status-msg")).toBeTruthy();
    });
  });

  test("shows error on unrecognized json", async () => {
    render(<ImportModal {...getProps()} />);

    fireEvent.change(screen.getByPlaceholderText(/Paste cURL command/i), {
      target: { value: '{"random": "data"}' },
    });
    fireEvent.click(screen.getByText("Import Json"));

    await waitFor(() => {
      expect(screen.getByText(/Unrecognized format/)).toBeTruthy();
    });
  });
});
