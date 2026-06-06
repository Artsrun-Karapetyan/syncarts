export function BodyEditor() {
  return (
    <div className="flex flex-col gap-3 mt-6 flex-1">
      <div className="text-sm font-semibold text-secondary border-b border-color pb-2">Body (JSON)</div>
      <textarea 
        className="input w-full flex-1 font-mono text-sm resize-none p-4" 
        placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
      />
    </div>
  );
}
