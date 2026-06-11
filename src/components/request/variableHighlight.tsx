import type { Environment, EnvironmentVariable } from '../../contexts/WorkspaceContext';
import { resolveScopedVariable } from './variableResolution';
import { getRequestAncestors } from '../../contexts/workspace/requestHelpers';

export function renderVariableHighlight(args: {
  text: string;
  activeTab: any;
  collections: any[];
  activeEnvironment?: Environment;
  globalVariables: EnvironmentVariable[];
}) {
  const { text, activeTab, collections, activeEnvironment, globalVariables } = args;
  const parts = text.split(/(\{\{[^}]*\}\})/g);

  return parts.map((part, index) => {
    if (!part.startsWith('{{') || !part.endsWith('}}')) {
      return <span key={index}>{part}</span>;
    }

    const varName = part.slice(2, -2);
    const ancestors = getRequestAncestors(activeTab, collections);
    const resolved = resolveScopedVariable({ ancestors, activeEnvironment, globalVariables, varName });
    const isDynamic = ['$guid', '$timestamp', '$isoTimestamp'].includes(varName);

    return (
      <span
        key={index}
        className="env-var-span"
        data-kind="environment"
        data-varname={varName}
        data-exists={resolved.exists}
        data-has-value={resolved.hasValue}
        data-value={resolved.value || ''}
        data-source={resolved.source}
        style={{
          color: resolved.hasValue || isDynamic ? 'var(--accent-primary)' : 'var(--status-delete)',
          background: resolved.hasValue || isDynamic ? 'rgba(88, 166, 255, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          boxShadow: `inset 0 0 0 1px ${resolved.hasValue || isDynamic ? 'rgba(88, 166, 255, 0.5)' : 'rgba(239, 68, 68, 0.55)'}`,
          borderRadius: 6,
        }}
      >
        {part}
      </span>
    );
  });
}
