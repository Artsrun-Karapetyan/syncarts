import type { VariableSuggestion } from './variableAutocompleteTypes';

export function VariableSourceBadge({ source }: { source: VariableSuggestion['source'] }) {
  const letter = source === 'Environment' ? 'E' : source === 'Collection' ? 'C' : 'G';
  const background = source === 'Environment' ? '#064e2a' : source === 'Collection' ? '#9b7200' : '#0b4a8f';
  const color = source === 'Environment' ? '#8ff0b5' : source === 'Collection' ? '#fff0a8' : '#9dccff';

  return (
    <span style={{ width: 24, height: 24, borderRadius: 7, background, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
      {letter}
    </span>
  );
}
