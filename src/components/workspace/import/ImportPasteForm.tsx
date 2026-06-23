interface ImportPasteFormProps {
  inputText: string;
  isProcessing: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function ImportPasteForm({
  inputText,
  isProcessing,
  onChange,
  onSubmit,
}: ImportPasteFormProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-secondary)",
        }}
      >
        Paste cURL or Raw JSON
      </label>
      <textarea
        className="input"
        style={{
          width: "100%",
          height: 120,
          padding: 12,
          fontSize: 13,
          fontFamily: "monospace",
          resize: "none",
          borderRadius: "var(--radius-md)",
        }}
        placeholder="Paste cURL command, Postman Collection, OpenAPI, or Environment JSON..."
        value={inputText}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            onSubmit();
          }
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={!inputText.trim() || isProcessing}
        >
          {isProcessing ? "Importing..." : "Import Json"}
        </button>
      </div>
    </div>
  );
}
