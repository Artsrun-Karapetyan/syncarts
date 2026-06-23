export function getCollectionHealthScoreColor(score: number) {
  if (score >= 85) return "var(--status-success)";
  if (score >= 60) return "#eab308";
  return "#ef4444";
}
