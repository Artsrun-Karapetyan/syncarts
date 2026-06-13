import { CurlHighlightedText } from "./CurlHighlightedText";

interface CurlLineProps {
  isFirstLine: boolean;
  line: string;
}

export function CurlLine({ isFirstLine, line }: CurlLineProps) {
  const trimmed = line.trimStart();
  const indent = line.slice(0, line.length - trimmed.length);

  if (isFirstLine) {
    const match = trimmed.match(/^(curl)(\s+--location)(\s+)(.+)$/);
    if (match) {
      return (
        <>
          <span style={{ color: "var(--accent-success)", fontWeight: 700 }}>
            {indent}
            {match[1]}
          </span>
          <span style={{ color: "var(--text-secondary)" }}>{match[2]}</span>
          <span style={{ color: "var(--text-secondary)" }}>{match[3]}</span>
          <span style={{ color: "var(--text-primary)" }}>
            <CurlHighlightedText text={match[4]} />
          </span>
        </>
      );
    }
  }

  const flagMatch = trimmed.match(/^(--[a-z-]+)(\s+)(.+)$/);
  if (flagMatch) {
    return (
      <>
        <span style={{ color: "var(--status-patch)", fontWeight: 700 }}>
          {indent}
          {flagMatch[1]}
        </span>
        <span style={{ color: "var(--text-secondary)" }}>{flagMatch[2]}</span>
        <span style={{ color: "var(--text-primary)" }}>
          <CurlHighlightedText text={flagMatch[3]} />
        </span>
      </>
    );
  }

  return <span style={{ color: "var(--text-primary)" }}>{line}</span>;
}
