import type { Collection, Environment, EnvironmentVariable } from '../../contexts/WorkspaceContext';
import type { VariableSuggestion } from './variableAutocompleteTypes';

export const DYNAMIC_VARIABLES: VariableSuggestion[] = [
  { key: '$guid', value: 'Generated UUID', source: 'Globals' },
  { key: '$timestamp', value: 'Unix timestamp', source: 'Globals' },
  { key: '$isoTimestamp', value: 'ISO timestamp', source: 'Globals' },
];

export function getVariableSuggestions(args: {
  activeCollection?: Collection;
  activeEnvironment?: Environment;
  globalVariables: EnvironmentVariable[];
  query: string;
}) {
  const { activeCollection, activeEnvironment, globalVariables, query } = args;
  const normalizedQuery = query.toLowerCase();
  const suggestions: VariableSuggestion[] = [
    ...toSuggestions(activeEnvironment?.variables || [], 'Environment'),
    ...toSuggestions(activeCollection?.variables || [], 'Collection'),
    ...toSuggestions(globalVariables, 'Globals'),
    ...DYNAMIC_VARIABLES
  ];

  return suggestions
    .filter(item => item.key.toLowerCase().includes(normalizedQuery))
    .slice(0, 12);
}

function toSuggestions(
  variables: EnvironmentVariable[],
  source: VariableSuggestion['source']
): VariableSuggestion[] {
  return variables
    .filter(variable => variable.enabled && variable.key)
    .map(variable => ({ key: variable.key, value: variable.value, source }));
}
