interface ResponseHeadersListProps {
  headers: [string, string][];
}

export function ResponseHeadersList({ headers }: ResponseHeadersListProps) {
  return (
    <div
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 1 }}
    >
      {headers.map(([key, value]) => (
        <div key={key} className="response-header-row">
          <span className="font-mono response-header-key">{key}</span>
          <span className="font-mono response-header-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
