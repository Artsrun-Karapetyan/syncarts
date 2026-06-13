import type { Environment, EnvironmentVariable } from '../../contexts/WorkspaceContext';
import { resolveScopedVariable } from './variableResolution';
import { getRequestAncestors } from '../../contexts/workspace/requestHelpers';

export function getVariableColors(sourceType: string | undefined, isDynamic: boolean) {
  if (isDynamic || sourceType === 'Dynamic') {
    return { color: '#ffb3d9', bg: 'rgba(255, 179, 217, 0.12)', border: 'rgba(255, 179, 217, 0.5)' };
  }
  switch (sourceType) {
    case 'Environment':
      return { color: '#8ff0b5', bg: 'rgba(143, 240, 181, 0.12)', border: 'rgba(143, 240, 181, 0.5)' };
    case 'Collection':
      return { color: '#fff0a8', bg: 'rgba(255, 240, 168, 0.12)', border: 'rgba(255, 240, 168, 0.5)' };
    case 'Folder':
      return { color: '#e2b3ff', bg: 'rgba(226, 179, 255, 0.12)', border: 'rgba(226, 179, 255, 0.5)' };
    case 'Globals':
      return { color: '#9dccff', bg: 'rgba(157, 204, 255, 0.12)', border: 'rgba(157, 204, 255, 0.5)' };
    default:
      return { color: 'var(--accent-primary)', bg: 'rgba(88, 166, 255, 0.12)', border: 'rgba(88, 166, 255, 0.5)' };
  }
}

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

    let styles = {
      color: 'var(--status-delete)',
      background: 'rgba(239, 68, 68, 0.12)',
      boxShadow: 'inset 0 0 0 1px rgba(239, 68, 68, 0.55)',
      borderRadius: 6,
    };

    if (resolved.hasValue || isDynamic) {
      const colors = getVariableColors(resolved.sourceType, isDynamic);
      styles = {
        color: colors.color,
        background: colors.bg,
        boxShadow: `inset 0 0 0 1px ${colors.border}`,
        borderRadius: 6,
      };
    }

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
        data-source-type={resolved.sourceType}
        style={styles}
      >
        {part}
      </span>
    );
  });
}
