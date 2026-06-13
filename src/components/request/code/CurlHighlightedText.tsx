export function CurlHighlightedText({ text }: { text: string }) {
  const parts = text.split(/('(?:\\'|[^'])*')/g);

  return parts.map((part, index) => {
    if (part.startsWith("'") && part.endsWith("'")) {
      return (
        <span key={index} style={{ color: "#f59e0b" }}>
          {part}
        </span>
      );
    }

    const urlMatch = part.match(/(https?:\/\/[^\s']+|\/[^\s']+)/);
    if (urlMatch && part === urlMatch[1]) {
      return (
        <span key={index} style={{ color: "#22c55e" }}>
          {part}
        </span>
      );
    }

    return <span key={index}>{part}</span>;
  });
}
