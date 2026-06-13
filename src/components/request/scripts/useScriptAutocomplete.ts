import { useEffect, useMemo, useState } from "react";

import {
  getScriptSuggestions,
  type ScriptSuggestion,
} from "./scriptAutocompleteData";

interface ScriptAutocompleteState {
  caretIndex: number;
  path: string;
  query: string;
  replaceStart: number;
  x: number;
  y: number;
}

export function useScriptAutocomplete(
  value: string,
  onChange: (value: string) => void,
) {
  const [state, setState] = useState<ScriptAutocompleteState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const suggestions = useMemo(
    () => (state ? getScriptSuggestions(state.path, state.query) : []),
    [state],
  );

  useEffect(() => {
    setActiveIndex((index) =>
      Math.min(index, Math.max(suggestions.length - 1, 0)),
    );
  }, [suggestions.length]);

  const updateFromElement = (
    element: HTMLTextAreaElement,
    nextValue = element.value,
  ) => {
    const caretIndex = element.selectionStart ?? nextValue.length;
    const trigger = getTrigger(nextValue, caretIndex);
    if (!trigger) {
      setState(null);
      return;
    }

    const point = getTextareaCaretPoint(element, caretIndex);
    setState({
      ...trigger,
      caretIndex,
      x: Math.max(8, Math.min(point.x, window.innerWidth - 480)),
      y: Math.max(8, Math.min(point.y + 30, window.innerHeight - 320)),
    });
    setActiveIndex(0);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.currentTarget.value);
    updateFromElement(event.currentTarget, event.currentTarget.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      const target =
        (event.target as HTMLTextAreaElement) || event.currentTarget;
      insertSuggestion(
        suggestions[Math.min(activeIndex, suggestions.length - 1)],
        target,
      );
      return true;
    }
    if (event.key === "Escape") {
      event.stopPropagation();
      setState(null);
      return true;
    }
    return false;
  };

  function insertSuggestion(
    suggestion: ScriptSuggestion,
    element?: HTMLTextAreaElement | null,
  ) {
    if (!state) return;
    const nextValue = `${value.slice(0, state.replaceStart)}${suggestion.insertText}${value.slice(state.caretIndex)}`;
    const caretPosition = state.replaceStart + suggestion.insertText.length;
    onChange(nextValue);
    setState(null);
    window.requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(caretPosition, caretPosition);
    });
  }

  return {
    activeIndex,
    handleBlur: () => window.setTimeout(() => setState(null), 120),
    handleChange,
    handleClick: (event: React.MouseEvent<HTMLTextAreaElement>) =>
      updateFromElement(event.currentTarget),
    handleFocus: (event: React.FocusEvent<HTMLTextAreaElement>) =>
      updateFromElement(event.currentTarget),
    handleKeyDown,
    handleKeyUp: (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(event.key)
      )
        return;
      updateFromElement(event.currentTarget);
    },
    insertSuggestion,
    state,
    suggestions,
  };
}

function getTrigger(value: string, caretIndex: number) {
  const beforeCaret = value.slice(0, caretIndex);
  const match = beforeCaret.match(
    /(?:^|[^\w$])([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\.?)$/,
  );
  const token = match?.[1];
  if (!token) return null;

  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) {
    return token.length > 0
      ? { path: "", query: token, replaceStart: caretIndex - token.length }
      : null;
  }

  const path = token.endsWith(".")
    ? token.slice(0, -1)
    : token.slice(0, dotIndex);
  const query = token.endsWith(".") ? "" : token.slice(dotIndex + 1);
  const replaceStart = caretIndex - query.length;

  return { path, query, replaceStart };
}

function getTextareaCaretPoint(
  textarea: HTMLTextAreaElement,
  caretIndex: number,
) {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  const span = document.createElement("span");
  const rect = textarea.getBoundingClientRect();

  mirror.textContent = textarea.value.slice(0, caretIndex);
  span.textContent = textarea.value.slice(caretIndex, caretIndex + 1) || ".";
  mirror.appendChild(span);

  Object.assign(mirror.style, {
    border: style.border,
    boxSizing: style.boxSizing,
    font: style.font,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    padding: style.padding,
    position: "fixed",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    width: `${textarea.clientWidth}px`,
    visibility: "hidden",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
  });

  document.body.appendChild(mirror);
  const spanRect = span.getBoundingClientRect();
  document.body.removeChild(mirror);

  return {
    x: spanRect.left - textarea.scrollLeft,
    y: spanRect.top - textarea.scrollTop,
  };
}
