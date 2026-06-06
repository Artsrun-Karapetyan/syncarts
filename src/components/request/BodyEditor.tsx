import { useRequest } from '../../contexts/RequestContext';

export function BodyEditor() {
  const { body, setBody } = useRequest();

  return (
    <div className="flex flex-col gap-3 mt-8 flex-1">
      <div className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-1">Body (JSON)</div>
      <textarea 
        className="input w-full flex-1 font-mono text-sm resize-none p-4 leading-relaxed bg-primary rounded-md shadow-inner"
        placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
