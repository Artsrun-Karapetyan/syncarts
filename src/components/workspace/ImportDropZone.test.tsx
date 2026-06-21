import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import { createRef } from "react";

import { ImportDropZone } from "./ImportDropZone";

describe("ImportDropZone", () => {
  const getProps = () => ({
    fileInputRef: createRef<HTMLInputElement>(),
    isDragging: false,
    isProcessing: false,
    onDragEnter: mock(),
    onDragLeave: mock(),
    onDragOver: mock(),
    onDrop: mock(),
    onFileSelect: mock(),
  });

  test("renders correctly when not processing", () => {
    render(<ImportDropZone {...getProps()} />);
    expect(screen.getByText("Drop files here or click to browse")).toBeTruthy();
    expect(
      screen.getByText("Supports Postman, OpenAPI, and Environment JSON"),
    ).toBeTruthy();
  });

  test("renders correctly when processing", () => {
    const props = getProps();
    props.isProcessing = true;
    render(<ImportDropZone {...props} />);
    expect(screen.getByText("Importing File...")).toBeTruthy();
    expect(
      screen.queryByText("Supports Postman, OpenAPI, and Environment JSON"),
    ).toBeNull();
  });

  test("calls openFilePicker on click", () => {
    const props = getProps();
    render(<ImportDropZone {...props} />);

    const clickSpy = mock();
    if (props.fileInputRef.current) {
      props.fileInputRef.current.click = clickSpy;
    }

    fireEvent.click(screen.getByRole("button"));
    expect(clickSpy).toHaveBeenCalled();
  });

  test("calls openFilePicker on Enter key", () => {
    const props = getProps();
    render(<ImportDropZone {...props} />);

    const clickSpy = mock();
    if (props.fileInputRef.current) {
      props.fileInputRef.current.click = clickSpy;
    }

    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(clickSpy).toHaveBeenCalled();
  });

  test("calls openFilePicker on Space key", () => {
    const props = getProps();
    render(<ImportDropZone {...props} />);

    const clickSpy = mock();
    if (props.fileInputRef.current) {
      props.fileInputRef.current.click = clickSpy;
    }

    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(clickSpy).toHaveBeenCalled();
  });

  test("ignores other keys", () => {
    const props = getProps();
    render(<ImportDropZone {...props} />);

    const clickSpy = mock();
    if (props.fileInputRef.current) {
      props.fileInputRef.current.click = clickSpy;
    }

    fireEvent.keyDown(screen.getByRole("button"), { key: "A" });
    expect(clickSpy).not.toHaveBeenCalled();
  });

  test("does not call openFilePicker when processing", () => {
    const props = getProps();
    props.isProcessing = true;
    render(<ImportDropZone {...props} />);

    const clickSpy = mock();
    if (props.fileInputRef.current) {
      props.fileInputRef.current.click = clickSpy;
    }

    fireEvent.click(screen.getByRole("button"));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  test("calls drag and drop events", () => {
    const props = getProps();
    render(<ImportDropZone {...props} />);

    const dropzone = screen.getByRole("button");
    fireEvent.dragEnter(dropzone);
    expect(props.onDragEnter).toHaveBeenCalled();

    fireEvent.dragOver(dropzone);
    expect(props.onDragOver).toHaveBeenCalled();

    fireEvent.dragLeave(dropzone);
    expect(props.onDragLeave).toHaveBeenCalled();

    fireEvent.drop(dropzone);
    expect(props.onDrop).toHaveBeenCalled();
  });

  test("calls onFileSelect when file input changes", () => {
    const props = getProps();
    render(<ImportDropZone {...props} />);

    const input = props.fileInputRef.current!;
    fireEvent.change(input);
    expect(props.onFileSelect).toHaveBeenCalled();
  });
});
