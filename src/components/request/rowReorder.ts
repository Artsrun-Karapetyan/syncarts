export type RowDropPosition = "before" | "after";

export function reorderRows<T>(
  rows: T[],
  sourceIndex: number,
  targetIndex: number,
  position: RowDropPosition,
) {
  if (sourceIndex === targetIndex) return rows;
  if (sourceIndex < 0 || targetIndex < 0) return rows;
  if (sourceIndex >= rows.length || targetIndex >= rows.length) return rows;

  const nextRows = [...rows];
  const [sourceRow] = nextRows.splice(sourceIndex, 1);
  const nextTargetIndex =
    targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
  nextRows.splice(
    position === "after" ? nextTargetIndex + 1 : nextTargetIndex,
    0,
    sourceRow,
  );
  return nextRows;
}
