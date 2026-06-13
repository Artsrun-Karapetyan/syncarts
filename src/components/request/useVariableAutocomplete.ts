import { useMemo, useState } from "react";

import { getRequestAncestors } from "../../contexts/workspace/requestHelpers";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import type {
  VariableAutocompleteState,
  VariableSuggestion,
} from "./variableAutocompleteTypes";
import { getVariableSuggestions } from "./variableSuggestions";

type TextControl = HTMLInputElement | HTMLTextAreaElement;

interface UseVariableAutocompleteArgs {
  value: string;
  onChange: (value: string) => void;
}

export function useVariableAutocomplete(args: UseVariableAutocompleteArgs) {
  const { value, onChange } = args;
  const { activeEnvironment, activeTab, collections, globalVariables } =
    useWorkspace();
  const [state, setState] = useState<VariableAutocompleteState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const ancestors = useMemo(
    () => getRequestAncestors(activeTab, collections),
    [activeTab, collections],
  );
  const suggestions = useMemo(
    () =>
      getVariableSuggestions({
        ancestors,
        activeEnvironment,
        globalVariables,
        query: state?.query || "",
      }),
    [ancestors, activeEnvironment, globalVariables, state?.query],
  );

  const updateFromElement = (
    element: TextControl,
    nextValue = element.value,
  ) => {
    const caretIndex = element.selectionStart ?? nextValue.length;
    const trigger = findVariableTrigger(nextValue, caretIndex);
    if (!trigger) {
      setState(null);
      return;
    }

    const point = getCaretCoordinates(element, caretIndex);
    setState({
      x: Math.min(point.x, window.innerWidth - 300),
      y: point.y + 24,
      query: trigger.query,
      startIndex: trigger.startIndex,
      caretIndex,
    });
    setActiveIndex(0);
  };

  const handleChange = (event: React.ChangeEvent<TextControl>) => {
    onChange(event.currentTarget.value);
    updateFromElement(event.currentTarget, event.currentTarget.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<TextControl>) => {
    if (!state || suggestions.length === 0) return false;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      setActiveIndex((index) => (index + 1) % suggestions.length);
      return true;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      setActiveIndex(
        (index) => (index - 1 + suggestions.length) % suggestions.length,
      );
      return true;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      insertSuggestion(suggestions[activeIndex], event.currentTarget);
      return true;
    }
    if (event.key === "Escape") {
      setState(null);
      return true;
    }
    return false;
  };

  const insertSuggestion = (
    suggestion: VariableSuggestion,
    element?: TextControl | null,
  ) => {
    if (!state || !element) return;
    const insertion = `{{${suggestion.key}}}`;
    const replaceEndIndex = findVariableReplacementEnd(value, state.caretIndex);
    const nextValue = `${value.slice(0, state.startIndex)}${insertion}${value.slice(replaceEndIndex)}`;
    const caretPosition = state.startIndex + insertion.length;

    element.focus();
    element.setSelectionRange(state.startIndex, replaceEndIndex);

    const success = document.execCommand("insertText", false, insertion);

    // Always call onChange to sync React state, because execCommand alone might not reliably trigger React's synthetic events
    onChange(nextValue);

    if (!success) {
      window.requestAnimationFrame(() => {
        element.focus();
        element.setSelectionRange(caretPosition, caretPosition);
      });
    }

    setState(null);
  };

  return {
    activeIndex,
    autocompleteState: state,
    handleBlur: () => window.setTimeout(() => setState(null), 120),
    handleChange,
    handleClick: (event: React.MouseEvent<TextControl>) =>
      updateFromElement(event.currentTarget),
    handleFocus: (event: React.FocusEvent<TextControl>) =>
      updateFromElement(event.currentTarget),
    handleKeyDown,
    handleKeyUp: (event: React.KeyboardEvent<TextControl>) => {
      if (
        ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(event.key)
      )
        return;
      updateFromElement(event.currentTarget);
    },
    insertSuggestion,
    suggestions,
  };
}

function findVariableTrigger(value: string, caretIndex: number) {
  const beforeCaret = value.slice(0, caretIndex);
  const startIndex = beforeCaret.lastIndexOf("{{");
  const closedIndex = beforeCaret.lastIndexOf("}}");
  if (startIndex <= closedIndex) return null;
  if (startIndex < 0 || beforeCaret[startIndex + 1] !== "{") return null;

  const query = beforeCaret.slice(startIndex + 2);
  if (/[{}\s]/.test(query)) return null;
  return { query, startIndex };
}

function findVariableReplacementEnd(value: string, caretIndex: number) {
  let endIndex = caretIndex;

  while (/[A-Za-z0-9_$.-]/.test(value[endIndex] || "")) {
    endIndex += 1;
  }

  while (value[endIndex] === "}") {
    endIndex += 1;
  }

  return endIndex;
}

function getCaretCoordinates(
  element: HTMLInputElement | HTMLTextAreaElement,
  caretIndex: number,
) {
  const style = window.getComputedStyle(element);
  const mirror = document.createElement("div");
  const span = document.createElement("span");
  const rect = element.getBoundingClientRect();

  mirror.textContent = element.value.slice(0, caretIndex);
  span.textContent = element.value.slice(caretIndex, caretIndex + 1) || ".";
  mirror.appendChild(span);

  Object.assign(mirror.style, {
    border: style.border,
    boxSizing: style.boxSizing,
    font: style.font,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    padding: style.padding,
    position: "fixed",
    whiteSpace: element.tagName === "INPUT" ? "pre" : "pre-wrap",
    wordBreak: element.tagName === "INPUT" ? "normal" : "break-word",
    width: `${element.clientWidth}px`,
    visibility: "hidden",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
  });

  document.body.appendChild(mirror);
  const spanRect = span.getBoundingClientRect();
  document.body.removeChild(mirror);

  return {
    x: spanRect.left - element.scrollLeft,
    y: spanRect.top - element.scrollTop,
  };
}
