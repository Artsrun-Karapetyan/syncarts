import { describe, expect, test, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyCollections } from "./EmptyCollections";
import React from "react";

describe("EmptyCollections", () => {
  test("renders empty text and calls onClick", () => {
    const onClick = mock();
    render(<EmptyCollections onClick={onClick} />);
    
    const container = screen.getByText(/No collections yet/);
    expect(container).toBeTruthy();
    
    fireEvent.click(container);
    expect(onClick).toHaveBeenCalled();
  });

  test("changes style on hover", () => {
    const onClick = mock();
    render(<EmptyCollections onClick={onClick} />);
    
    const container = screen.getByText(/No collections yet/).parentElement!;
    
    // Simulate hover
    fireEvent.mouseEnter(container);
    expect(container.style.color).toBe("var(--text-primary)");
    
    // Simulate leave
    fireEvent.mouseLeave(container);
    expect(container.style.color).toBe("var(--text-tertiary)");
  });
});
