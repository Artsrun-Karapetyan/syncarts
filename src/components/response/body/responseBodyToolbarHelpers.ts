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
