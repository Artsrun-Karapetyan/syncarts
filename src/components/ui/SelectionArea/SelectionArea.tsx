import React, { useEffect, useRef, useState } from "react";

interface SelectionAreaProps {
  children: React.ReactNode;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onCopy?: (selectedIds: Set<string>) => void;
}

export function SelectionArea({
  children,
  onSelectionChange,
  onCopy,
}: SelectionAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        if (selectedIds.size > 0 && !isDragging) {
          // Check if user is actively selecting text inside an input
          const activeEl = document.activeElement;
          if (
            activeEl &&
            (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")
          ) {
            const input = activeEl as HTMLInputElement;
            if (input.selectionStart !== input.selectionEnd) {
              return; // Let native copy handle it
            }
          }

          e.preventDefault();
          onCopy?.(selectedIds);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, onCopy, isDragging]);

  useEffect(() => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + container.scrollLeft;
      const y = e.clientY - rect.top + container.scrollTop;

      setCurrentPos({ x, y });

      // Calculate absolute box relative to viewport to check intersections
      const box = {
        left: Math.min(
          startPos.x - container.scrollLeft + rect.left,
          e.clientX,
        ),
        top: Math.min(startPos.y - container.scrollTop + rect.top, e.clientY),
        right: Math.max(
          startPos.x - container.scrollLeft + rect.left,
          e.clientX,
        ),
        bottom: Math.max(
          startPos.y - container.scrollTop + rect.top,
          e.clientY,
        ),
      };

      const elements = container.querySelectorAll("[data-selection-id]");
      const newSelected = new Set<string>();

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const intersects =
          rect.left < box.right &&
          rect.right > box.left &&
          rect.top < box.bottom &&
          rect.bottom > box.top;

        if (intersects) {
          const id = el.getAttribute("data-selection-id");
          if (id) newSelected.add(id);
        }
      });

      setSelectedIds(newSelected);
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      document.body.classList.remove("is-range-selecting");

      // If we just clicked without dragging, clear selection
      if (
        Math.abs(e.clientX - startPos.x) < 5 &&
        Math.abs(e.clientY - startPos.y) < 5
      ) {
        setSelectedIds(new Set());
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.body.classList.remove("is-range-selecting");
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startPos]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    // Allow clicking inputs/buttons without starting drag
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLButtonElement
    ) {
      return;
    }


    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.scrollLeft;
    const y = e.clientY - rect.top + container.scrollTop;

    document.body.classList.add("is-range-selecting");
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsDragging(true);
  };

  const boxStyle: React.CSSProperties = {
    position: "absolute",
    left: Math.min(startPos.x, currentPos.x),
    top: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y),
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    border: "1px solid rgba(99, 102, 241, 0.8)",
    pointerEvents: "none",
    zIndex: 9999,
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
      {isDragging &&
        Math.abs(currentPos.x - startPos.x) > 5 &&
        Math.abs(currentPos.y - startPos.y) > 5 && <div style={boxStyle} />}
    </div>
  );
}
