import { type RefObject, useEffect } from "react";

export function useSidebarKeyboardNavigation(
  containerRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      if (!activeElement) return;

      const isSearchInput = activeElement.tagName === "INPUT";

      // If we're focused on the search input and press ArrowDown, jump to first sidebar item
      if (isSearchInput && e.key === "ArrowDown") {
        const firstRow = container.querySelector(".sidebar-row") as HTMLElement;
        if (firstRow) {
          e.preventDefault();
          firstRow.focus({ preventScroll: true });
        }
        return;
      }

      // If focus is not inside our container, do nothing
      if (!container.contains(activeElement)) return;
      // If we are still in an input, let the input handle up/down/enter normally
      if (isSearchInput) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const rows = Array.from(
          container.querySelectorAll(".sidebar-row"),
        ) as HTMLElement[];
        const currentIndex = rows.indexOf(activeElement);
        if (currentIndex === -1) return;

        if (e.key === "ArrowDown") {
          const nextIndex =
            currentIndex < rows.length - 1 ? currentIndex + 1 : 0;
          rows[nextIndex]?.focus({ preventScroll: true });
        } else {
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : rows.length - 1;
          rows[prevIndex]?.focus({ preventScroll: true });
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        activeElement.click();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef]);
}
