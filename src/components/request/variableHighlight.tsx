import type { Collection, Environment, EnvironmentVariable } from '../../contexts/WorkspaceContext';
import { resolveScopedVariable } from './variableResolution';

export function renderVariableHighlight(args: {
  activeCollection?: Collection;
  activeEnvironment?: Environment;
  globalVariables: EnvironmentVariable[];
  text: string;
}) {
  const { activeCollection, activeEnvironment, globalVariables, text } = args;
  const parts = text.split(/(\{\{[^}]*\}\})/g);

  return parts.map((part, index) => {
    if (!part.startsWith('{{') || !part.endsWith('}}')) {
      return <span key={index}>{part}</span>;
    }

    const varName = part.slice(2, -2);
    const resolved = resolveScopedVariable({ activeCollection, activeEnvironment, globalVariables, varName });
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
