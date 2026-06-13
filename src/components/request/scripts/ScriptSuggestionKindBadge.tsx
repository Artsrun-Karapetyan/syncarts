import type { ScriptSuggestion } from "./scriptAutocompleteData";

export function ScriptSuggestionKindBadge({
  kind,
}: {
  kind: ScriptSuggestion["kind"];
}) {
  const color =
    kind === "method" || kind === "function"
      ? "#7dd3fc"
      : kind === "class"
        ? "#c084fc"
        : "#93c5fd";
  const label =
    kind === "function"
      ? "F"
      : kind === "method"
        ? "M"
        : kind === "class"
          ? "C"
          : "P";

  return (
    <span
      className="font-mono"
      style={{
        width: 15,
        height: 15,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${color}`,
        color,
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}
