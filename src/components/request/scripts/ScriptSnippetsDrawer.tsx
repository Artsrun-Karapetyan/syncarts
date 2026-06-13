import { Search, X } from "lucide-react";
import type { RefObject } from "react";

import { SNIPPET_GROUPS } from "./scriptSnippets";

interface ScriptSnippetsDrawerProps {
  drawerRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onSnippetClick: (code: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

export function ScriptSnippetsDrawer({
  drawerRef,
  onClose,
  onSnippetClick,
  searchQuery,
  setSearchQuery,
}: ScriptSnippetsDrawerProps) {
  const normalizedQuery = searchQuery.toLowerCase();
  const filteredGroups = SNIPPET_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((s) =>
      s.name.toLowerCase().includes(normalizedQuery),
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div
      ref={drawerRef}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 300,
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-4px 0 15px rgba(0,0,0,0.1)",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Snippets
        </div>
        <button
          className="btn"
          style={{
            padding: 4,
            width: 24,
            height: 24,
            justifyContent: "center",
          }}
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>
      <div
        style={{ padding: 12, borderBottom: "1px solid var(--border-color)" }}
      >
        <div style={{ position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-tertiary)",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search snippets..."
            style={{
              width: "100%",
              padding: "6px 10px 6px 30px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "0 8px 8px 8px" }}>
        {filteredGroups.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: 12,
            }}
          >
            No snippets found
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.category} style={{ marginBottom: 12 }}>
              <div
                style={{
                  padding: "8px 12px 4px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                }}
              >
                {group.category}
              </div>
              {group.items.map((snippet) => (
                <button
                  key={snippet.name}
                  className="btn snippet-btn"
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    textAlign: "left",
                    padding: "6px 12px",
                    fontSize: 13,
                    color: "var(--text-primary)",
                    background: "transparent",
                    border: "none",
                    borderRadius: 6,
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-tertiary)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onClick={() => onSnippetClick(snippet.code)}
                >
                  {snippet.name}
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
