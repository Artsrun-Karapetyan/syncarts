export interface VariableSuggestion {
  key: string;
  value: string;
  source: 'Environment' | 'Collection' | 'Globals';
}

export interface VariableAutocompleteState {
  x: number;
  y: number;
  query: string;
  startIndex: number;
  caretIndex: number;
}
