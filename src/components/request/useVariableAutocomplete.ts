import { useMemo, useState } from 'react';

import { useWorkspace } from '../../contexts/WorkspaceContext';
import { getVariableSuggestions } from './variableSuggestions';
import type { VariableAutocompleteState, VariableSuggestion } from './variableAutocompleteTypes';

type TextControl = HTMLInputElement | HTMLTextAreaElement;

interface UseVariableAutocompleteArgs {
  value: string;
  onChange: (value: string) => void;
}

export function useVariableAutocomplete(args: UseVariableAutocompleteArgs) {
  const { value, onChange } = args;
  const { activeEnvironment, activeTab, collections, globalVariables } = useWorkspace();
  const activeCollection = activeTab?.collectionId ? collections.find(collection => collection.id === activeTab.collectionId) : undefined;
  const [state, setState] = useState<VariableAutocompleteState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const suggestions = useMemo(() => getVariableSuggestions({
    activeCollection,
    activeEnvironment,
    globalVariables,
    query: state?.query || ''
  }), [activeCollection, activeEnvironment, globalVariables, state?.query]);

  const updateFromElement = (element: TextControl, nextValue = element.value) => {
    const caretIndex = element.selectionStart ?? nextValue.length;
    const trigger = findVariableTrigger(nextValue, caretIndex);
    if (!trigger) {
      setState(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setState({
      x: Math.min(rect.left, window.innerWidth - 380),
      y: rect.bottom + 6,
      query: trigger.query,
      startIndex: trigger.startIndex,
      caretIndex
    });
    setActiveIndex(0);
  };

  const handleChange = (event: React.ChangeEvent<TextControl>) => {
    onChange(event.currentTarget.value);
    updateFromElement(event.currentTarget, event.currentTarget.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<TextControl>) => {
    if (!state || suggestions.length === 0) return false;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(index => (index + 1) % suggestions.length);
      return true;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => (index - 1 + suggestions.length) % suggestions.length);
      return true;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      insertSuggestion(suggestions[activeIndex], event.currentTarget);
      return true;
    }
    if (event.key === 'Escape') {
      setState(null);
      return true;
    }
    return false;
  };

  const insertSuggestion = (suggestion: VariableSuggestion, element?: TextControl | null) => {
    if (!state) return;
    const insertion = `{{${suggestion.key}}}`;
    const replaceEndIndex = findVariableReplacementEnd(value, state.caretIndex);
    const nextValue = `${value.slice(0, state.startIndex)}${insertion}${value.slice(replaceEndIndex)}`;
    const caretPosition = state.startIndex + insertion.length;
    onChange(nextValue);
    setState(null);
    window.requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(caretPosition, caretPosition);
    });
  };

  return {
    activeIndex,
    autocompleteState: state,
    handleBlur: () => window.setTimeout(() => setState(null), 120),
    handleChange,
    handleClick: (event: React.MouseEvent<TextControl>) => updateFromElement(event.currentTarget),
    handleFocus: (event: React.FocusEvent<TextControl>) => updateFromElement(event.currentTarget),
    handleKeyDown,
    handleKeyUp: (event: React.KeyboardEvent<TextControl>) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(event.key)) return;
      updateFromElement(event.currentTarget);
    },
    insertSuggestion,
    suggestions,
  };
}

function findVariableTrigger(value: string, caretIndex: number) {
  const beforeCaret = value.slice(0, caretIndex);
  const startIndex = beforeCaret.lastIndexOf('{{');
  const closedIndex = beforeCaret.lastIndexOf('}}');
  if (startIndex <= closedIndex) return null;
  if (startIndex < 0 || beforeCaret[startIndex + 1] !== '{') return null;

  const query = beforeCaret.slice(startIndex + 2);
  if (/[{}\s]/.test(query)) return null;
  return { query, startIndex };
}

function findVariableReplacementEnd(value: string, caretIndex: number) {
  let endIndex = caretIndex;

  while (/[A-Za-z0-9_$.-]/.test(value[endIndex] || '')) {
    endIndex += 1;
  }

  while (value[endIndex] === '}') {
    endIndex += 1;
  }

  return endIndex;
}
