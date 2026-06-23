export function getCollectionHealthLabel(score: number) {
  if (score >= 85) return "Looks good";
  if (score >= 60) return "Needs cleanup";
  return "Needs attention";
}
