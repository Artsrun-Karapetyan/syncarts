import type { VariableSuggestion } from "./variableAutocompleteTypes";

export function VariableSourceBadge({
  source,
}: {
  source: VariableSuggestion["source"];
}) {
  const getBadgeStyle = () => {
    switch (source) {
      case "Environment":
        return { letter: "E", bg: "#064e2a", color: "#8ff0b5" };
      case "Collection":
        return { letter: "C", bg: "#9b7200", color: "#fff0a8" };
      case "Folder":
        return { letter: "F", bg: "#4d0082", color: "#e2b3ff" };
      case "Globals":
        return { letter: "G", bg: "#0b4a8f", color: "#9dccff" };
      case "Dynamic":
        return { letter: "D", bg: "#800040", color: "#ffb3d9" };
      default:
        return { letter: "?", bg: "#0b4a8f", color: "#9dccff" };
    }
  };

  const { letter, bg, color } = getBadgeStyle();

  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: 7,
        background: bg,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {letter}
    </span>
  );
}
