import type { Collection, Environment, EnvironmentVariable } from '../../contexts/WorkspaceContext';
import type { VariableSuggestion } from './variableAutocompleteTypes';
import { resolveDynamicVariable } from './variableResolution';

export function getDynamicVariables(): VariableSuggestion[] {
  return [
    { key: '$guid', value: resolveDynamicVariable('$guid') || 'Generated UUID', source: 'Dynamic' },
    { key: '$timestamp', value: resolveDynamicVariable('$timestamp') || 'Unix timestamp', source: 'Dynamic' },
    { key: '$isoTimestamp', value: resolveDynamicVariable('$isoTimestamp') || 'ISO timestamp', source: 'Dynamic' },
  ];
}

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
    ...getDynamicVariables()
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
