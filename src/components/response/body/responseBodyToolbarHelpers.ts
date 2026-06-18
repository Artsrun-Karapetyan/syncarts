export function countMatches(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return 0;

  const normalizedText = text.toLowerCase();
  let count = 0;
  let index = 0;

  while (index < normalizedText.length) {
    const foundIndex = normalizedText.indexOf(normalizedQuery, index);
    if (foundIndex === -1) break;
    count += 1;
    index = foundIndex + normalizedQuery.length;
  }

  return count;
}

export function formatButtonClass(isActive: boolean) {
  return `response-format-button ${isActive ? "active" : ""}`;
}

export function getNextMatchIndex(
  current: number,
  total: number,
  forward: boolean,
) {
  if (total === 0) return 0;
  if (current === 0) return forward ? 1 : total;
  return forward ? (current % total) + 1 : ((current + total - 2) % total) + 1;
}

export function toolButtonClass(isActive: boolean) {
  return `response-tool-button ${isActive ? "active" : ""}`;
}

interface TextRange {
  node: Text;
  start: number;
  end: number;
}

function getTextRanges(container: HTMLElement, query: string): TextRange[] {
  const normalizedQuery = query.toLowerCase();
  const ranges: TextRange[] = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
  );

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const text = node.textContent || "";
    const lowerText = text.toLowerCase();
    let startIdx = 0;

    while (startIdx < lowerText.length) {
      const found = lowerText.indexOf(normalizedQuery, startIdx);
      if (found === -1) break;
      ranges.push({ node, start: found, end: found + normalizedQuery.length });
      startIdx = found + normalizedQuery.length;
    }
  }

  return ranges;
}

export function findNextInContainer(
  container: HTMLElement,
  query: string,
  currentMatch: number,
  forward: boolean,
): { matchIndex: number; totalMatches: number } {
  const ranges = getTextRanges(container, query);
  const total = ranges.length;
  if (total === 0) {
    if (typeof CSS !== "undefined" && CSS.highlights) {
      CSS.highlights.delete("search-results");
    }
    return { matchIndex: 0, totalMatches: 0 };
  }

  let nextIndex: number;
  if (currentMatch === 0) {
    nextIndex = 0;
  } else if (forward) {
    nextIndex = currentMatch % total;
  } else {
    nextIndex = (currentMatch - 1 + total) % total;
  }

  const range = ranges[nextIndex];
  const domRange = document.createRange();
  domRange.setStart(range.node, range.start);
  domRange.setEnd(range.node, range.end);

  if (typeof CSS !== "undefined" && CSS.highlights) {
    const highlight = new Highlight(domRange);
    CSS.highlights.set("search-results", highlight);
  } else {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(domRange);
    }
  }

  const span = document.createElement("span");
  span.style.position = "absolute";
  span.style.opacity = "0";
  span.textContent = "\u200b";
  domRange.insertNode(span);

  // Find the scrolling parent inside the container (ResponseBodyContent's div)
  const scrollContainer = container.firstElementChild as HTMLElement;
  if (scrollContainer && scrollContainer.style.overflow === "auto") {
    // Scroll the inner container
    const offsetTop = span.offsetTop;
    scrollContainer.scrollTo({
      top: offsetTop - scrollContainer.clientHeight / 2,
      behavior: "smooth",
    });
  } else {
    // Fallback if structure changes
    span.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  span.remove();

  // Need to normalize because insertNode splits text nodes,
  // which breaks subsequent createTreeWalker calls if query crosses the split
  container.normalize();

  return {
    matchIndex: nextIndex + 1,
    totalMatches: total,
  };
}
