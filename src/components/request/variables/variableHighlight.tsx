import { getRequestAncestors } from "../../../contexts/workspace/requestHelpers";
import type {
  Environment,
  EnvironmentVariable,
} from "../../../contexts/WorkspaceContext";
import { resolveScopedVariable } from "./variableResolution";

export function getVariableColors(
  sourceType: string | undefined,
  isDynamic: boolean,
) {
  if (isDynamic || sourceType === "Dynamic") {
    return { color: "#ffb3d9" };
  }
  switch (sourceType) {
    case "Environment":
      return { color: "#8ff0b5" };
    case "Collection":
      return { color: "#fff0a8" };
    case "Folder":
      return { color: "#e2b3ff" };
    case "Globals":
      return { color: "#9dccff" };
    default:
      return { color: "var(--accent-primary)" };
  }
}

export function renderVariableHighlight(args: {
  text: string;
  activeTab: any;
  collections: any[];
  activeEnvironment?: Environment;
  globalVariables: EnvironmentVariable[];
}) {
  const { text, activeTab, collections, activeEnvironment, globalVariables } =
    args;
  const parts = text.split(/(\{\{[^}]*\}\})/g);

  return parts.map((part, index) => {
    if (!part.startsWith("{{") || !part.endsWith("}}")) {
      return <span key={index}>{part}</span>;
    }

    const varName = part.slice(2, -2);
    const ancestors = getRequestAncestors(activeTab, collections);
    const resolved = resolveScopedVariable({
      ancestors,
      activeEnvironment,
      globalVariables,
      varName,
    });
    const isDynamic = ["$guid", "$timestamp", "$isoTimestamp"].includes(
      varName,
    );

    if (resolved.hasValue || isDynamic) {
      const colors = getVariableColors(resolved.sourceType, isDynamic);
      return (
        <span
          key={index}
          className="env-var-span"
          data-kind="environment"
          data-varname={varName}
          data-exists={resolved.exists}
          data-has-value={resolved.hasValue}
          data-value={resolved.value || ""}
          data-source={resolved.source}
          data-source-type={resolved.sourceType}
          style={{ color: colors.color }}
        >
          <span>{"{{"}</span>
          <span>{varName}</span>
          <span>{"}}"}</span>
        </span>
      );
    }

    return (
      <span
        key={index}
        className="env-var-span"
        data-kind="environment"
        data-varname={varName}
        data-exists={resolved.exists}
        data-has-value={resolved.hasValue}
        data-value={resolved.value || ""}
        data-source={resolved.source}
        data-source-type={resolved.sourceType}
        style={{
          color: "var(--status-delete)",
        }}
      >
        {part}
      </span>
    );
  });
}
