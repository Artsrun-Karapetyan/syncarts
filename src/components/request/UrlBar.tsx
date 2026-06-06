import { useWorkspace } from '../../contexts/WorkspaceContext';

export function UrlBar() {
  const { activeTab, updateActiveTab } = useWorkspace();

  return (
    <input 
      className="input w-full font-mono bg-transparent border-transparent text-sm h-10 focus:border-transparent focus:shadow-none px-4" 
      placeholder="https://api.example.com/v1/users" 
      value={activeTab?.url || ''}
      onChange={(e) => updateActiveTab({ url: e.target.value })}
      disabled={!activeTab}
    />
  );
}
