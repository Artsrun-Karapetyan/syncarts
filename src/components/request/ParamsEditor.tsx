import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PathVariable, QueryParamItem, useWorkspace } from '../../contexts/WorkspaceContext';
import { syncPathVariablesWithUrl } from '../../utils/pathVariables';
import { VariableTextInput } from './VariableTextInput';

const EMPTY_PARAM: QueryParamItem = { key: '', value: '', description: '', enabled: true };

export function ParamsEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const [params, setParams] = useState<QueryParamItem[]>([{ ...EMPTY_PARAM }]);
  const pathVariables = activeTab?.pathVariables || [];
  const queryParamDescriptions = activeTab?.queryParamDescriptions || {};

  useEffect(() => {
    if (!activeTab) return;
    const synced = syncPathVariablesWithUrl(activeTab.url || '', activeTab.pathVariables || []);
    if (JSON.stringify(synced) !== JSON.stringify(activeTab.pathVariables || [])) {
      updateActiveTab({ pathVariables: synced });
    }
  }, [activeTab?.url, activeTab?.pathVariables]);

  useEffect(() => {
    if (!activeTab) return;
    const nextParams = activeTab.queryParams?.length
      ? activeTab.queryParams
      : parseParamsFromUrl(activeTab.url || '', queryParamDescriptions);
    setParams(ensureTrailingBlank(nextParams));
  }, [activeTab?.url, activeTab?.queryParams, activeTab?.queryParamDescriptions]);

  const syncUrl = (newParams: QueryParamItem[]) => {
    setParams(ensureTrailingBlank(newParams));
    if (!activeTab) return;

    const baseUrl = activeTab.url.split('?')[0] || '';
    const enabledParams = newParams.filter(p => p.enabled !== false && p.key.trim());
    const descriptions = Object.fromEntries(
      newParams.filter(p => p.key && p.description).map(p => [p.key, p.description || ''])
    );

    if (enabledParams.length === 0) {
      updateActiveTab({ url: baseUrl, queryParamDescriptions: descriptions, queryParams: newParams });
      return;
    }

    const queryParts = enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`);
    const nextUrl = `${baseUrl}?${queryParts.join('&')}`;
    updateActiveTab({ url: nextUrl, queryParamDescriptions: descriptions, queryParams: newParams });
  };

  const updateParam = (index: number, updates: Partial<QueryParamItem>) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], ...updates };
    syncUrl(newParams);
  };

  const addParam = () => {
    setParams(prev => [...prev, { ...EMPTY_PARAM }]);
  };

  const removeParam = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    syncUrl(newParams.length > 0 ? newParams : [{ ...EMPTY_PARAM }]);
  };

  const updatePathVariable = (id: string, data: Partial<PathVariable>) => {
    updateActiveTab({
      pathVariables: pathVariables.map((variable) => (
        variable.id === id ? { ...variable, ...data } : variable
      ))
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ParamSectionTitle title="Query Params" />
        {params.map((param, idx) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr 1fr 1fr 32px',
              gap: 8,
              alignItems: 'center',
              opacity: param.enabled === false ? 0.45 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={param.enabled !== false}
              onChange={(e) => updateParam(idx, { enabled: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)', cursor: 'pointer', margin: 0 }}
              title={param.enabled === false ? 'Enable param' : 'Disable param'}
            />
            <VariableTextInput
              className="input font-mono"
              style={{ width: '100%', fontSize: 13, padding: '8px 12px' }}
              placeholder="Key"
              value={param.key}
              onChange={(value) => updateParam(idx, { key: value })}
              disabled={!activeTab}
            />
            <VariableTextInput
              className="input font-mono"
              style={{ width: '100%', fontSize: 13, padding: '8px 12px' }}
              placeholder="Value"
              value={param.value}
              onChange={(value) => updateParam(idx, { value })}
              disabled={!activeTab}
            />
            <VariableTextInput
              className="input"
              style={{ width: '100%', fontSize: 13, padding: '8px 12px' }}
              placeholder="Description"
              value={param.description || ''}
              onChange={(value) => updateParam(idx, { description: value })}
              disabled={!activeTab}
            />
            <button
              type="button"
              style={{
                padding: 6,
                color: 'var(--status-delete)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all var(--transition-fast)',
                opacity: activeTab ? 0.6 : 0.3,
                cursor: activeTab ? 'pointer' : 'not-allowed',
              }}
              onClick={() => { if (activeTab) removeParam(idx); }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--status-delete-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent'; }}
              title="Remove Param"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            background: 'transparent',
            cursor: activeTab ? 'pointer' : 'not-allowed',
            opacity: activeTab ? 1 : 0.5,
            fontSize: 13,
            fontWeight: 500,
            transition: 'all var(--transition-fast)',
          }}
          onClick={() => { if (activeTab) addParam(); }}
          onMouseEnter={(e) => {
            if (!activeTab) return;
            e.currentTarget.style.borderColor = 'var(--border-highlight)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          }}
          onMouseLeave={(e) => {
            if (!activeTab) return;
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Plus size={14} /> Add Param
        </button>
      </div>

      {pathVariables.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ParamSectionTitle title="Path Variables" />
          {pathVariables.map((variable) => (
            <div key={variable.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 32px', gap: 8, alignItems: 'center' }}>
              <input
                className="input font-mono"
                style={{ fontSize: 13, padding: '8px 12px', color: 'var(--text-secondary)' }}
                value={variable.key}
                disabled
              />
              <VariableTextInput
                className="input font-mono"
                style={{ fontSize: 13, padding: '8px 12px' }}
                placeholder="Value"
                value={variable.value}
                onChange={(value) => updatePathVariable(variable.id, { value })}
                disabled={!activeTab}
              />
              <VariableTextInput
                className="input"
                style={{ fontSize: 13, padding: '8px 12px' }}
                placeholder="Description"
                value={variable.description || ''}
                onChange={(value) => updatePathVariable(variable.id, { description: value })}
                disabled={!activeTab}
              />
              <span style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>...</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ParamSectionTitle({ title }: { title: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 32px', gap: 8, alignItems: 'center' }}>
      <div />
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-tertiary)' }}>Key</div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-tertiary)' }}>Value</div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-tertiary)' }}>Description</div>
      <div />
      <div style={{ gridColumn: '1 / -1', marginTop: 2, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>{title}</div>
    </div>
  );
}

function ensureTrailingBlank(params: QueryParamItem[]) {
  if (params.length === 0) return [{ ...EMPTY_PARAM }];
  const last = params[params.length - 1];
  return last.key || last.value || last.description ? [...params, { ...EMPTY_PARAM }] : params;
}

function parseParamsFromUrl(url: string, queryParamDescriptions: Record<string, string>) {
  const [, queryString] = url.split('?');
  if (!queryString) return [{ ...EMPTY_PARAM }];

  return queryString.split('&').map(pair => {
    const [k, v] = pair.split('=');
    const key = decodeQueryPart(k || '');
    return {
      key,
      value: decodeQueryPart(v || ''),
      description: queryParamDescriptions[key] || '',
      enabled: true,
    };
  });
}


function decodeQueryPart(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}
