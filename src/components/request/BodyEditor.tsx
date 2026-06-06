import { useWorkspace } from '../../contexts/WorkspaceContext';

export function BodyEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();

  return (
    <div className="flex flex-col gap-3 mt-8 flex-1">
      <div className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-1">Body (JSON)</div>
      <textarea 
        className="input w-full flex-1 font-mono text-sm resize-none p-4 leading-relaxed bg-primary rounded-md shadow-inner"
        placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
        value={activeTab?.body || ''}
        onChange={(e) => updateActiveTab({ body: e.target.value })}
        disabled={!activeTab}
        spellCheck={false}
      />
    </div>
  );
}
