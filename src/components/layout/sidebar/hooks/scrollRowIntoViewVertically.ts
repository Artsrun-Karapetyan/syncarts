/**
 * Scroll a row into view vertically without disturbing horizontal scroll.
 *
 * Uses the browser's scrollIntoView (which reliably finds the correct scroll
 * container) but restores scrollLeft afterwards, since scrollIntoView also
 * nudges horizontally (inline: "nearest") and would yank the sidebar right when
 * a long name overflows.
 */
export function scrollRowIntoViewVertically(
  container: HTMLElement | null,
  row: HTMLElement | null,
) {
  if (!container || !row) return;

  const scrollLeft = container.scrollLeft;
  row.scrollIntoView({ block: "nearest" });
  container.scrollLeft = scrollLeft;
}
